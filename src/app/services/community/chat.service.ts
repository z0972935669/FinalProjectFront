// chat.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, tap } from 'rxjs';

export interface ChatMessage {
  roomId: number;
  senderId: number;
  senderName?: string;
  message: string;
  sentAt: string;
  read?: boolean;
}

export interface ChatRoom {
  roomId: number;
  roomName?: string;
  members: { memberId: number; memberName?: string }[];
  unread?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
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

  // 是否為匿名（非 JWT）連線
  private isAnonymous = false;

  constructor(private http: HttpClient) {}

  // SignalR 連線
  startConnection(token: string): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7124/chathub', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 接收訊息
    this.hubConnection.on(
      'ReceiveMessage',
      (roomId: string, senderId: string, message: string, sentAt: string) => {
        console.log('Received message:', { roomId, senderId, message, sentAt });

        this.messageSubject.next({
          roomId: Number(roomId),
          senderId: Number(senderId),
          message,
          sentAt,
        });
      }
    );

    // 接收錯誤訊息
    this.hubConnection.on('Error', (errorMessage: string) => {
      console.error('SignalR Error:', errorMessage);
      this.errorSubject.next(errorMessage);
    });

    // 連線狀態處理
    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      this.connectionSubject.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionSubject.next(true);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionSubject.next(false);
    });

    return this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started');
        this.connectionSubject.next(true);
      })
      .catch((err) => {
        console.error('SignalR connection error:', err);
        throw err;
      });
  }

  // 針對 AnonymousChatHub 的啟動方式（以 memberId 註冊）
  startAnonymousConnection(memberId: number): Promise<void> {
    this.isAnonymous = true;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7124/anonymouschathub')
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 註冊接收訊息與錯誤的 handler（與原本相同）
    this.hubConnection.on(
      'ReceiveMessage',
      (roomId: string, senderId: string, message: string, sentAt: string) => {
        console.log('Received message:', { roomId, senderId, message, sentAt });

        this.messageSubject.next({
          roomId: Number(roomId),
          senderId: Number(senderId),
          message,
          sentAt,
        });
      }
    );

    this.hubConnection.on('Error', (errorMessage: string) => {
      console.error('SignalR Error:', errorMessage);
      this.errorSubject.next(errorMessage);
    });

    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      this.connectionSubject.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionSubject.next(true);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionSubject.next(false);
    });

    return this.hubConnection
      .start()
      .then(async () => {
        console.log('Anonymous SignalR connection started');
        this.connectionSubject.next(true);
        // 呼叫後端 RegisterUser 註冊 memberId
        try {
          await this.hubConnection.invoke('RegisterUser', memberId.toString());
          console.log(`Registered anonymous member ${memberId}`);
        } catch (err) {
          console.error('Failed to register anonymous user:', err);
          throw err;
        }
      })
      .catch((err) => {
        console.error('SignalR anonymous connection error:', err);
        throw err;
      });
  }

  // 加入聊天室（現在會被後端驗證）
  joinRoom(roomId: number, memberId?: number): Promise<void> {
    console.log(`Attempting to join room: ${roomId}`, this.isAnonymous ? `(anonymous, memberId=${memberId})` : '');
    // 若為匿名 hub，後端需要 memberId 作為參數
    if (this.isAnonymous && memberId !== undefined) {
      return this.hubConnection
        .invoke('JoinRoom', roomId.toString(), memberId.toString())
        .then(() => {
          console.log(`Successfully joined room (anonymous): ${roomId}`);
        })
        .catch((err) => {
          console.error(`Failed to join room ${roomId}:`, err);
          throw err;
        });
    }

    // 預設（JWT 驗證的 hub）
    return this.hubConnection
      .invoke('JoinRoom', roomId.toString())
      .then(() => {
        console.log(`Successfully joined room: ${roomId}`);
      })
      .catch((err) => {
        console.error(`Failed to join room ${roomId}:`, err);
        throw err;
      });
  }

  // 發送訊息（現在會被後端驗證）
  sendMessage(
    roomId: number,
    senderId: number,
    message: string
  ): Promise<void> {
    console.log(`Sending message to room ${roomId}:`, message);
    return this.hubConnection
      .invoke('SendMessage', roomId.toString(), senderId.toString(), message)
      .then(() => {
        console.log('Message sent successfully');
      })
      .catch((err) => {
        console.error('Failed to send message:', err);
        throw err;
      });
  }

  // 離開聊天室
  leaveRoom(roomId: number): Promise<void> {
    return this.hubConnection.invoke('LeaveRoom', roomId.toString());
  }

  // 取得聊天室歷史訊息
  getHistory(roomId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `https://localhost:7124/api/chat/${roomId}/messages`
    );
  }

  // 取得或建立好友私人聊天室
  getOrCreatePrivateRoom(myId: number, friendId: number): Observable<ChatRoom> {
    return this.http
      .get<ChatRoom>(
        `https://localhost:7124/api/chat/private-room/${myId}/${friendId}`
      )
      .pipe(tap(() => this.roomsUpdatedSubject.next()));
  }

  // 取得使用者所有私人聊天室
  getPrivateRooms(userId: number): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(
      `https://localhost:7124/api/chat/private-rooms/${userId}`
    );
  }

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
