// chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, tap, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName?: string;
  content: string;
  timestamp: Date | string;
  messageType?: string;
}

export interface ChatRoom {
  roomId: number;
  roomName?: string;
  roomType?: string;
  friendId?: number;    // 新增：好友ID
  friendName?: string;  // 新增：好友名稱
  members?: ChatRoomMember[];
  unread?: number;
}

export interface ChatRoomMember {
  memberId: number;
  memberName: string;
  joinedAt?: Date | string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'https://localhost:7124/api/chat';
  private hubConnection!: signalR.HubConnection;

  // 訊息流
  private messageSubject = new Subject<ChatMessage>();
  public messages$ = this.messageSubject.asObservable();

  // 錯誤處理
  private errorSubject = new Subject<string>();
  public errors$ = this.errorSubject.asObservable();

  // 聊天室列表更新事件
  private roomsUpdatedSubject = new Subject<void>();
  public roomsUpdated$ = this.roomsUpdatedSubject.asObservable();

  // 連線狀態
  private connectionSubject = new BehaviorSubject<boolean>(false);
  public connectionState$ = this.connectionSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 取得認證標頭
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken') || '';
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // SignalR 連線 - 修正版本
  startConnection(token: string): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7124/chathub', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 接收訊息 - 確保參數順序與後端一致
    this.hubConnection.on(
      'ReceiveMessage',
      (roomId: string, senderId: string, senderName: string, content: string, timestamp: string) => {
        // console.log('📨 [ChatService] 收到 SignalR 訊息:', {
        //   roomId,
        //   senderId,
        //   senderName,
        //   content,
        //   timestamp
        // });

        try {
          const chatMessage: ChatMessage = {
            id: Date.now(), // 使用時間戳作為臨時 ID
            roomId: parseInt(roomId),
            senderId: parseInt(senderId),
            senderName: senderName || '未知用戶',
            content: content,
            timestamp: timestamp ? new Date(timestamp) : new Date()
          };

          // console.log('✅ [ChatService] 處理後的訊息物件:', chatMessage); // 除錯用
          // console.log('🔄 [ChatService] 即將發送給組件...'); // 除錯用

          // 立即發送給訂閱者
          this.messageSubject.next(chatMessage);
          // console.log('📤 [ChatService] 訊息已發送給訂閱者'); // 除錯用

        } catch (error) {
          console.error('❌ [ChatService] 處理訊息時發生錯誤:', error);
        }
      }
    );

    // 接收錯誤訊息
    this.hubConnection.on('Error', (errorMessage: string) => {
      console.error('🚨 [ChatService] SignalR 錯誤:', errorMessage);
      this.errorSubject.next(errorMessage);
    });

    // 連線狀態處理
    this.hubConnection.onreconnecting((error) => {
      // console.log('🔄 [ChatService] 正在重新連線...', error);
      this.connectionSubject.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      // console.log('✅ [ChatService] 重新連線成功:', connectionId);
      this.connectionSubject.next(true);
    });

    this.hubConnection.onclose((error) => {
      // console.log('❌ [ChatService] 連線關閉:', error);
      this.connectionSubject.next(false);
    });

    return this.hubConnection
      .start()
      .then(() => {
        // console.log('✅ [ChatService] SignalR connection started');
        this.connectionSubject.next(true);
      })
      .catch((err) => {
        console.error('❌ [ChatService] SignalR connection error:', err);
        this.connectionSubject.next(false);
        throw err;
      });
  }

  // 針對 AnonymousChatHub 的啟動方式（以 memberId 註冊）
  startAnonymousConnection(memberId: number): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7124/anonymouschathub')
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 註冊接收訊息與錯誤的 handler
    this.hubConnection.on(
      'ReceiveMessage',
      (roomId: string, senderId: string, senderName: string, message: string, sentAt: string) => {
        this.messageSubject.next({
          id: 0, // 暫時設為 0，如果需要可以從後端傳來
          roomId: parseInt(roomId),
          senderId: parseInt(senderId),
          senderName: senderName,
          content: message, // 修正：使用 content 而不是 message
          timestamp: sentAt // 修正：使用 timestamp 而不是 sentAt
        });
      }
    );

    this.hubConnection.on('Error', (errorMessage: string) => {
      this.errorSubject.next(errorMessage);
    });

    return this.hubConnection
      .start()
      .then(() => {
        // console.log('Anonymous SignalR connection started');
        this.connectionSubject.next(true);
        // 註冊用戶 ID
        return this.hubConnection.invoke('RegisterUser', memberId);
      })
      .catch((err) => {
        console.error('Anonymous SignalR connection error:', err);
        this.connectionSubject.next(false);
        throw err;
      });
  }

  // 發送訊息 - 修正：添加此方法
  async sendMessage(roomId: number, userId: number, content: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
      throw new Error('SignalR 連線未建立');
    }

    try {
      // 確保參數類型正確
      await this.hubConnection.invoke('SendMessage', roomId, userId, content);
    } catch (error) {
      console.error('發送訊息失敗:', error);
      throw error;
    }
  }

  // 加入聊天室 - 修正版本
  async joinRoom(roomId: number, userId: number): Promise<void> {
    // console.log('🔄 [ChatService] 嘗試加入聊天室:', { roomId, userId });

    if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
      console.error('❌ [ChatService] SignalR 連線未建立');
      throw new Error('SignalR 連線未建立');
    }

    if (!roomId || roomId <= 0) {
      console.error('❌ [ChatService] 聊天室 ID 無效:', roomId);
      throw new Error('聊天室 ID 無效');
    }

    if (!userId || userId <= 0) {
      console.error('❌ [ChatService] 用戶 ID 無效:', userId);
      throw new Error('用戶 ID 無效');
    }

    try {
      // console.log('🔄 [ChatService] 呼叫 SignalR JoinRoom:', { roomId, userId });
      // 確保參數類型正確
      await this.hubConnection.invoke('JoinRoom', roomId, userId);
      // console.log('✅ [ChatService] 成功加入聊天室:', roomId);
    } catch (error) {
      console.error('❌ [ChatService] 加入聊天室失敗:', error);
      throw error;
    }
  }

  // 修正 API URL 路徑
  // 檢查聊天室是否存在
  private checkRoomExists(roomId: number): Promise<boolean> {
    const headers = this.getAuthHeaders();
    // 修正：移除重複的 api 路徑
    return this.http.get<boolean>(`https://localhost:7124/api/Chat/room/${roomId}/exists`, { headers })
      .toPromise()
      .then(exists => {
        // console.log('🔍 [ChatService] 聊天室存在檢查:', { roomId, exists });
        return exists || false;
      })
      .catch(error => {
        console.warn('⚠️ [ChatService] 檢查聊天室失敗，假設存在:', error);
        return true; // 如果檢查失敗，假設聊天室存在
      });
  }

  // 取得或建立私人聊天室 - 修正 API 路徑和參數
  getOrCreatePrivateRoom(userId1: number, userId2: number): Observable<ChatRoom> {
    const headers = this.getAuthHeaders();
    // console.log('🔄 [ChatService] 取得或建立私人聊天室:', { userId1, userId2 });

    return this.http.get<any>(
      `https://localhost:7124/api/Chat/private-room/${userId1}/${userId2}`,
      { headers }
    ).pipe(
      map(response => {
        return {
          roomId: response.roomId,
          roomName: response.roomName, // 現在是好友的名稱
          roomType: 'Private',
          friendId: response.friendId,
          friendName: response.friendName,
          members: response.members || []
        } as ChatRoom;
      }),
      tap(room => {
        // console.log('✅ [ChatService] 取得聊天室成功:', room);
      }),
      catchError(error => {
        console.error('❌ [ChatService] 取得聊天室失敗:', error);
        return throwError(error);
      })
    );
  }

  // 取得用戶的私人聊天室列表 - 修正回傳格式
  getPrivateRooms(userId: number): Observable<ChatRoom[]> {
    const headers = this.getAuthHeaders();
    // console.log('🔄 [ChatService] 取得私人聊天室列表，用戶ID:', userId);

    return this.http.get<any[]>(
      `https://localhost:7124/api/Chat/private-rooms/${userId}`,
      { headers }
    ).pipe(
      map(rooms => {
        return rooms.map(room => ({
          roomId: room.roomId,
          roomName: room.roomName, // 現在是好友的名稱
          roomType: 'Private',
          friendId: room.friendId,
          friendName: room.friendName,
          unread: 0
        } as ChatRoom));
      }),
      tap(rooms => {
        // console.log('✅ [ChatService] 取得私人聊天室成功:', rooms);
      }),
      catchError(error => {
        console.warn('⚠️ [ChatService] 無法取得聊天室，返回空陣列:', error);
        return of([]);
      })
    );
  }

  // 取得聊天室歷史訊息 - 修正回傳格式處理
  getHistory(roomId: number): Observable<ChatMessage[]> {
    const headers = this.getAuthHeaders();
    // console.log('🔄 [ChatService] 取得聊天歷史，roomId:', roomId);

    return this.http.get<any[]>(
      `https://localhost:7124/api/Chat/${roomId}/messages`,
      { headers }
    ).pipe(
      map(messages => {
        return messages.map(msg => ({
          id: Date.now() + Math.random(),
          roomId: msg.roomId,
          senderId: msg.senderId,
          senderName: msg.senderName || '未知用戶', // 使用後端提供的 senderName
          content: msg.message,
          timestamp: new Date(msg.sentAt)
        } as ChatMessage));
      }),
      tap(messages => {
        // console.log('✅ [ChatService] 聊天歷史轉換完成:', messages);
      }),
      catchError(error => {
        console.error('❌ [ChatService] 取得聊天歷史失敗:', error);
        return of([]);
      })
    );
  }

  // 移除 createPrivateRoom 方法，因為後端沒有對應的 API
  // createPrivateRoom 功能已整合在 getOrCreatePrivateRoom 中

  // 檢查連線狀態
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  // 手動重連
  reconnect(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      return this.hubConnection.start();
    }
    return Promise.resolve();
  }

  // 清理連線
  disconnect(): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.stop();
    }
    return Promise.resolve();
  }
}
