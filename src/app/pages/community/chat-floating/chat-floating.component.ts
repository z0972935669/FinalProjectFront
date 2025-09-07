import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  NgZone,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import {
  ChatService,
  ChatMessage,
  ChatRoom,
} from '../../../services/community/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat-floating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-floating.component.html',
  styleUrls: ['./chat-floating.component.scss'],
})
export class ChatFloatingComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { static: false })
  messagesContainer!: ElementRef<HTMLDivElement>;

  @Output() chatClosed = new EventEmitter<void>();

  @Input() isVisible = false;

  userId!: number;
  rooms: ChatRoom[] = [];
  selectedRoom?: ChatRoom;
  messages: ChatMessage[] = [];
  newMessage = '';
  isConnected = false;
  isLoadingMessages = false;
  selectedFriend: any = null;

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService, private ngZone: NgZone) {}

  ngOnInit(): void {
    const token = localStorage.getItem('jwtToken') || '';
    this.userId = this.getCurrentUserId();

    if (!this.userId) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '需要登入才能使用聊天功能',
        confirmButtonText: '確定'
      });
      return;
    }

    // 啟動聊天連線
    this.startChatConnection(token);

    // 訂閱即時訊息
    this.subscribeToMessages();

    // 訂閱錯誤訊息
    this.subscribeToErrors();

    // 訂閱聊天室列表更新
    this.subscribeToRoomsUpdate();

    // 訂閱連線狀態
    this.subscribeToConnectionState();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // 取得當前用戶 ID
  private getCurrentUserId(): number {
    const token = localStorage.getItem('jwtToken');
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idStr = payload.MemberID ||
                   payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                   payload.sub;
      return Number(idStr) || 0;
    } catch {
      return 0;
    }
  }

  // 啟動聊天連線
  private startChatConnection(token: string): void {
    const connectionPromise = token
      ? this.chatService.startConnection(token)
      : this.chatService.startAnonymousConnection(this.userId);

    connectionPromise
      .then(() => {
        this.isConnected = true;
        this.loadPrivateRooms();
      })
      .catch((err) => {
        console.error('聊天連線失敗:', err);
        this.isConnected = false;
        Swal.fire({
          icon: 'error',
          title: '連線失敗',
          text: token ? '聊天連線失敗，請重新登入' : '匿名連線失敗，請重試',
          confirmButtonText: '確定'
        });
      });
  }

  // 訂閱訊息
  private subscribeToMessages(): void {
    // console.log('📡 [ChatFloating] 開始訂閱訊息');

    const messageSub = this.chatService.messages$.subscribe({
      next: (message) => {
        // console.log('📥 [ChatFloating] 訂閱收到訊息:', message);
        this.handleIncomingMessage(message);
      },
      error: (error) => {
        console.error('❌ [ChatFloating] 訊息訂閱錯誤:', error);
      }
    });

    this.subscriptions.push(messageSub);
  }

  // 格式化訊息時間 - 修正版本
  formatMessageTime(timestamp: Date | string | undefined | null): string {
    // 檢查 timestamp 是否存在
    if (!timestamp) {
      return '';
    }

    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

      // 檢查日期是否有效
      if (!date || isNaN(date.getTime())) {
        return '';
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (messageDate.getTime() === today.getTime()) {
        // 今天的訊息只顯示時間
        return date.toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        // 其他日期顯示日期和時間
        return date.toLocaleString('zh-TW', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.warn('格式化時間錯誤:', error, 'timestamp:', timestamp);
      return '';
    }
  }

  // 發送訊息 - 簡化版本，完全依賴 SignalR 回傳
  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }

    if (!this.selectedRoom) {
      Swal.fire({
        icon: 'warning',
        title: '請選擇聊天室',
        text: '請先選擇一個聊天室再發送訊息',
        confirmButtonText: '確定'
      });
      return;
    }

    if (!this.isConnected) {
      Swal.fire({
        icon: 'warning',
        title: '連線中斷',
        text: '無法發送訊息，請檢查網路連線',
        confirmButtonText: '確定'
      });
      return;
    }

    const messageToSend = this.newMessage.trim();
    const roomId = this.selectedRoom.roomId;

    // console.log('🔄 [ChatFloating] 準備發送訊息:', {
    //   roomId,
    //   userId: this.userId,
    //   content: messageToSend
    // });

    // 清空輸入框
    this.newMessage = '';

    this.chatService
      .sendMessage(roomId, this.userId, messageToSend)
      .then(() => {
        // console.log('✅ [ChatFloating] 訊息發送成功，等待 SignalR 回傳');
      })
      .catch((err: any) => {
        console.error('❌ [ChatFloating] 發送訊息失敗:', err);

        // 恢復輸入框內容
        this.newMessage = messageToSend;

        Swal.fire({
          icon: 'error',
          title: '發送失敗',
          text: '訊息發送失敗，請稍後再試',
          confirmButtonText: '確定'
        });
      });
  }

  // 處理接收到的訊息 - 強化版本
  private handleIncomingMessage(msg: ChatMessage): void {
    // console.log('🔔 [ChatFloating] 收到訊息:', msg);
    // console.log('🔍 [ChatFloating] 當前選中聊天室:', this.selectedRoom?.roomId);
    // console.log('📊 [ChatFloating] 當前訊息數量:', this.messages.length);

    // 基本資料驗證
    if (!msg.content || !msg.roomId || !msg.senderId) {
      console.warn('⚠️ [ChatFloating] 訊息資料不完整:', msg);
      return;
    }

    // 確保訊息有完整的資料
    const messageWithData: ChatMessage = {
      ...msg,
      timestamp: msg.timestamp || new Date(),
      senderName: msg.senderName || '未知用戶'
    };

    // 檢查聊天室是否存在
    const room = this.rooms.find((r) => r.roomId === msg.roomId);
    if (!room) {
      console.warn('⚠️ [ChatFloating] 找不到對應的聊天室:', msg.roomId);
      // console.log('📋 [ChatFloating] 當前可用聊天室:', this.rooms.map(r => r.roomId));
      return;
    }

    // 如果是當前聊天室，添加訊息
    if (this.selectedRoom?.roomId === msg.roomId) {
      // console.log('✅ [ChatFloating] 訊息屬於當前聊天室，準備添加');

      // 檢查重複訊息（使用更嚴格的條件）
      const isDuplicate = this.messages.some(existingMsg =>
        existingMsg.senderId === messageWithData.senderId &&
        existingMsg.content === messageWithData.content &&
        existingMsg.timestamp && messageWithData.timestamp &&
        Math.abs(
          new Date(existingMsg.timestamp).getTime() -
          new Date(messageWithData.timestamp).getTime()
        ) < 3000 // 3秒內的相同內容視為重複
      );

      if (!isDuplicate) {
        // console.log('🆕 [ChatFloating] 新訊息，添加到列表');

        // 強制在 Angular Zone 內執行
        this.ngZone.run(() => {
          this.messages = [...this.messages, messageWithData]; // 使用展開運算符確保引用改變
          // console.log('📈 [ChatFloating] 訊息已添加，新的訊息數量:', this.messages.length);

          // 延遲滾動確保 DOM 已更新
          setTimeout(() => {
            this.scrollToBottom();
          }, 50);
        });
      } else {
        // console.log('🔄 [ChatFloating] 重複訊息，已忽略');
      }
    } else {
      // 更新未讀訊息數
      // console.log('📬 [ChatFloating] 訊息來自其他聊天室，更新未讀數');
      this.ngZone.run(() => {
        room.unread = (room.unread || 0) + 1;
        // console.log('📈 [ChatFloating] 未讀訊息數更新為:', room.unread);
      });
    }
  }

  // 訂閱錯誤
  private subscribeToErrors(): void {
    const errorSub = this.chatService.errors$.subscribe((error) => {
      this.ngZone.run(() => {
        console.error('聊天錯誤:', error);
        Swal.fire({
          icon: 'error',
          title: '聊天錯誤',
          text: error,
          confirmButtonText: '確定'
        });
      });
    });
    this.subscriptions.push(errorSub);
  }

  // 訂閱聊天室更新
  private subscribeToRoomsUpdate(): void {
    const roomsSub = this.chatService.roomsUpdated$.subscribe(() => {
      this.ngZone.run(() => this.loadPrivateRooms());
    });
    this.subscriptions.push(roomsSub);
  }

  // 訂閱連線狀態 - 新增
  private subscribeToConnectionState(): void {
    const connectionSub = this.chatService.connectionState$.subscribe((connected) => {
      this.ngZone.run(() => {
        this.isConnected = connected;
        // console.log('🔗 [ChatFloating] 連線狀態更新:', connected);
      });
    });
    this.subscriptions.push(connectionSub);
  }

  // 載入私人聊天室列表
  private loadPrivateRooms(): void {
    // console.log('🔄 [ChatFloating] 載入私人聊天室列表，用戶ID:', this.userId);

    if (!this.userId) {
      console.warn('⚠️ [ChatFloating] 用戶ID無效，無法載入聊天室');
      return;
    }

    this.chatService.getPrivateRooms(this.userId).subscribe({
      next: (rooms) => {
        // console.log('✅ [ChatFloating] 載入聊天室成功，數量:', rooms.length);
        // console.log('📋 [ChatFloating] 聊天室列表:', rooms);

        this.ngZone.run(() => {
          this.rooms = rooms;

          // 自動加入所有聊天室（用於接收訊息）
          this.joinAllRooms();
        });
      },
      error: (err: any) => {
        console.error('❌ [ChatFloating] 載入聊天室失敗:', err);
        this.ngZone.run(() => {
          this.rooms = [];
        });

        Swal.fire({
          icon: 'error',
          title: '載入失敗',
          text: '無法載入聊天室列表',
          confirmButtonText: '確定'
        });
      },
    });
  }

  // 自動加入所有聊天室（用於接收訊息）
  private joinAllRooms(): void {
    // console.log('🔄 [ChatFloating] 自動加入所有聊天室');

    this.rooms.forEach((room) => {
      if (room.roomId) {
        this.chatService
          .joinRoom(room.roomId, this.userId)
          .then(() => {
            // console.log('✅ [ChatFloating] 成功加入聊天室:', room.roomId);
          })
          .catch((err: any) => {
            console.error('❌ [ChatFloating] 加入聊天室失敗:', room.roomId, err);
          });
      }
    });
  }

  // 加入聊天室並載入訊息
  private joinAndLoad(room: ChatRoom): void {
    // console.log('🔄 [ChatFloating] 加入聊天室並載入訊息:', room.roomId);

    if (!room.roomId) {
      console.error('❌ [ChatFloating] 聊天室ID無效');
      return;
    }

    this.isLoadingMessages = true;

    this.chatService.joinRoom(room.roomId, this.userId)
      .then(() => {
        // console.log('✅ [ChatFloating] 成功加入聊天室:', room.roomId);

        // 載入聊天歷史
        this.loadChatHistory(room.roomId);
      })
      .catch((err: any) => {
        console.error('❌ [ChatFloating] 加入聊天室失敗:', err);
        this.isLoadingMessages = false;

        Swal.fire({
          icon: 'error',
          title: '加入失敗',
          text: '無法加入聊天室',
          confirmButtonText: '確定'
        });
      });
  }

  // 選擇聊天室 - 修正版本
  selectRoom(room: ChatRoom): void {
    // console.log('🔄 [ChatFloating] 選擇聊天室:', room.roomId);

    // 清除未讀訊息數
    if (room.unread && room.unread > 0) {
      room.unread = 0;
    }

    this.selectedRoom = room;
    this.messages = [];
    this.joinAndLoad(room);
  }

  // 開啟好友私人聊天室 - 修正版本，移除 createPrivateRoom 呼叫
  openPrivateChat(friendId: number): void {
    // console.log('🔄 [ChatFloating] 開啟私人聊天室，好友ID:', friendId, '當前用戶ID:', this.userId);

    if (!this.userId || !friendId) {
      console.error('❌ [ChatFloating] 參數無效:', { userId: this.userId, friendId });
      return;
    }

    // 顯示載入狀態
    this.isLoadingMessages = true;

    // 取得或建立私人聊天室
    this.chatService.getOrCreatePrivateRoom(this.userId, friendId).subscribe({
      next: (room) => {
        // console.log('✅ [ChatFloating] 成功取得聊天室:', room);

        if (!room || !room.roomId || room.roomId <= 0) {
          console.error('❌ [ChatFloating] 聊天室資料無效:', room);
          this.isLoadingMessages = false;
          this.showError('聊天室資料無效');
          return;
        }

        this.selectedRoom = room;
        this.messages = [];

        // console.log('🔄 [ChatFloating] 嘗試加入聊天室，roomId:', room.roomId);

        // 加入聊天室
        this.chatService.joinRoom(room.roomId, this.userId)
          .then(() => {
            // console.log('✅ [ChatFloating] 成功加入聊天室');
            this.isLoadingMessages = false;

            // 載入歷史訊息
            this.loadChatHistory(room.roomId);
          })
          .catch((err) => {
            console.error('❌ [ChatFloating] 加入聊天室失敗:', err);
            this.isLoadingMessages = false;
            this.showError('無法加入聊天室，請稍後再試');
          });
      },
      error: (err) => {
        console.error('❌ [ChatFloating] 取得聊天室失敗:', err);
        this.isLoadingMessages = false;
        this.showError('無法開啟私人聊天，請稍後再試');
      }
    });
  }

  // 移除重複的處理錯誤方法，因為我們簡化了流程
  // handleJoinRoomError 不再需要，因為後端會自動建立聊天室

  // 顯示錯誤訊息
  private showError(message: string): void {
    console.error('🚨 [ChatFloating] 錯誤:', message);

    // 如果有 SweetAlert2，使用它
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: '聊天室錯誤',
        text: message,
        confirmButtonText: '確定'
      });
    } else {
      // 否則使用 alert
      alert(message);
    }
  }

  // 載入聊天歷史記錄 - 強化版本
  private loadChatHistory(roomId: number): void {
    // console.log('🔄 [ChatFloating] 載入聊天歷史，roomId:', roomId);

    this.chatService.getHistory(roomId).subscribe({
      next: (msgs) => {
        // console.log('✅ [ChatFloating] 載入聊天歷史成功，訊息數量:', msgs.length);
        // console.log('📋 [ChatFloating] 歷史訊息詳情:', msgs);

        this.ngZone.run(() => {
          this.messages = msgs.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || new Date(),
            senderName: msg.senderName || '未知用戶'
          }));

          // console.log('📋 [ChatFloating] 歷史訊息已設置，總數:', this.messages.length);

          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
      },
      error: (err: any) => {
        console.error('❌ [ChatFloating] 載入訊息歷史失敗:', err);
        this.ngZone.run(() => {
          this.messages = [];
        });
      }
    });
  }

  // 自動滾動到底 - 修正版本
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
        // console.log('📜 [ChatFloating] 已滾動到底部');
      }
    } catch (err) {
      console.warn('⚠️ [ChatFloating] 滾動失敗:', err);
    }
  }

  // 開啟或關閉聊天室視窗
  toggleChat(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      // 當聊天室打開時，自動載入私人聊天室
      this.loadPrivateRooms();
    } else {
      // 關閉時清空選擇的聊天室和訊息
      this.selectedRoom = undefined;
      this.messages = [];
    }
  }

  // 關閉浮動視窗
  closeChat(): void {
    this.selectedRoom = undefined;
    this.messages = [];
    this.chatClosed.emit();
  }

  // 重新連線
  reconnect(): void {
    const token = localStorage.getItem('jwtToken') || '';
    this.startChatConnection(token);
  }

  // 取得聊天室成員文字顯示
  getRoomMembersText(room: ChatRoom): string {
    if (room.friendName) {
      return `與 ${room.friendName} 的私人聊天`;
    }
    return '私人聊天';
  }

  // 檢查是否有未讀訊息
  hasUnread(room: ChatRoom): boolean {
    return room.unread !== undefined && room.unread > 0;
  }

  // 取得未讀訊息數
  getUnreadCount(room: ChatRoom): number {
    return room.unread || 0;
  }

  // 顯示聊天視窗
  showChat(friend: any): void {
    this.selectedFriend = friend;
    this.isVisible = true;
    // 這裡可以添加載入聊天記錄的邏輯
    // console.log('開始與好友聊天:', friend);
  }

  // 隱藏聊天視窗
  hideChat(): void {
    this.isVisible = false;
    this.selectedFriend = null;
  }

  // 追蹤訊息 ID - 改善版本
  trackByMessageId(index: number, message: ChatMessage): string {
    // 使用內容和發送者作為唯一識別，避免因為時間戳造成的重複渲染
    return `${message.senderId}-${message.content.substring(0, 20)}-${index}`;
  }
}
