import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import {
  ChatService,
  ChatMessage,
  ChatRoom,
} from '../../../services/community/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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

  userId!: number;
  rooms: ChatRoom[] = [];
  selectedRoom?: ChatRoom;
  messages: ChatMessage[] = [];
  newMessage = '';
  isConnected = false;

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService, private ngZone: NgZone) {}

  ngOnInit(): void {
    const token = localStorage.getItem('jwtToken') || '';
    this.userId = Number(localStorage.getItem('userId'));
    // 沒有 userId 就無法使用匿名模式或一般模式
    if (!this.userId) return;

    // 若有 JWT 則使用原本的授權連線；否則以匿名模式啟動並註冊 userId
    if (token) {
      this.chatService
        .startConnection(token)
        .then(() => {
          this.isConnected = true;
          this.loadPrivateRooms();
        })
        .catch((err) => {
          console.error('Connection failed:', err);
          alert('連線失敗，請重新登入');
        });
    } else {
      this.chatService
        .startAnonymousConnection(this.userId)
        .then(() => {
          this.isConnected = true;
          this.loadPrivateRooms();
        })
        .catch((err) => {
          console.error('Anonymous connection failed:', err);
          alert('匿名連線失敗，請重試');
        });
    }

    // 訂閱即時訊息
    const msgSub = this.chatService.messages$.subscribe((msg) => {
      this.ngZone.run(() => {
        const room = this.rooms.find((r) => r.roomId === msg.roomId);
        if (!room) return;

        if (this.selectedRoom?.roomId === msg.roomId) {
          this.messages.push(msg);
          this.scrollToBottom();
        } else {
          room.unread = (room.unread || 0) + 1;
        }
      });
    });
    this.subscriptions.push(msgSub);

    // 訂閱錯誤訊息
    const errorSub = this.chatService.errors$.subscribe((error) => {
      this.ngZone.run(() => {
        alert(error);
        console.error('Chat error:', error);
      });
    });
    this.subscriptions.push(errorSub);

    // 訂閱聊天室列表更新
    const roomsSub = this.chatService.roomsUpdated$.subscribe(() => {
      this.ngZone.run(() => this.loadPrivateRooms());
    });
    this.subscriptions.push(roomsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // 開啟或切換聊天室
  openRoom(room: ChatRoom): void {
    this.selectedRoom = room;
    this.messages = [];
    if (room.unread) room.unread = 0;
    this.joinAndLoad(room);
  }

  selectRoom(room: ChatRoom): void {
    this.openRoom(room);
  }

  // 開啟好友私人聊天室
  openPrivateChat(friendId: number): void {
    this.chatService.getOrCreatePrivateRoom(this.userId, friendId).subscribe({
      next: (room) => {
        if (!this.rooms.find((r) => r.roomId === room.roomId)) {
          this.rooms.push(room);
        }
        this.selectRoom(room);
      },
      error: (err) => console.error(err),
    });
  }

  // 發送訊息
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedRoom || !this.isConnected)
      return;

    this.chatService
      .sendMessage(this.selectedRoom.roomId, this.userId, this.newMessage)
      .then(() => (this.newMessage = ''));
  }

  // 載入聊天室列表並自動 join
  loadPrivateRooms(): void {
    this.chatService.getPrivateRooms(this.userId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        // 自動加入 SignalR 所有聊天室
        this.rooms.forEach((r) =>
          this.chatService
            // 傳入 userId 可讓匿名 hub 使用者也能被後端記錄加入
            .joinRoom(r.roomId, this.userId)
            .catch((err) => console.error(err))
        );
      },
      error: (err) => console.error(err),
    });
  }

  // Helper: join 房間並載入訊息
  private joinAndLoad(room: ChatRoom) {
    // 針對匿名模式也一併傳入 userId
    this.chatService.joinRoom(room.roomId, this.userId).then(() => {
      this.chatService.getHistory(room.roomId).subscribe({
        next: (msgs) => {
          this.messages = msgs;
          this.scrollToBottom();
        },
        error: (err) => console.error(err),
      });
    });
  }

  // 自動滾動到底
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  // 關閉浮動視窗
  closeChat(): void {
    this.selectedRoom = undefined;
    this.messages = [];
  }
}
