// friend-list.component.ts
import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FriendService,
  Friend,
} from '../../../services/community/friend.service';
import { ChatService } from '../../../services/community/chat.service';
import { ChatFloatingComponent } from '../chat-floating/chat-floating.component';

@Component({
  selector: 'app-friend-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatFloatingComponent],
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
})
export class FriendListComponent implements OnInit {
  @Input() friends: Friend[] = [];
  @Output() openChat = new EventEmitter<number>();
  @ViewChild(ChatFloatingComponent) chatFloating!: ChatFloatingComponent;

  userId!: number;

  searchQuery: string = '';
  searchResults: any[] = [];

  constructor(
    private friendService: FriendService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('userId'));
    if (!this.friends.length) {
      // 如果沒有傳入 friends 就從後端抓
      this.loadFriends();
    }
  }

  loadFriends(): void {
    this.friendService.getFriends(this.userId).subscribe({
      next: (res: Friend[]) => {
        this.friends = res;
      },
      error: (err) => console.error(err),
    });
  }

  onFriendClick(friendId: number): void {
    // 取得或建立私人聊天室
    this.chatService.getOrCreatePrivateRoom(this.userId, friendId).subscribe({
      next: (room) => {
        // 開啟浮動聊天
        if (this.chatFloating) {
          this.chatFloating.openPrivateChat(friendId);
        }
      },
      error: (err) => console.error('建立聊天室失敗', err),
    });
  }

  searchUsers(): void {
    // 呼叫 FriendService 的搜尋方法
    this.friendService.searchUsers(this.searchQuery).subscribe({
      next: (results) => (this.searchResults = results),
      error: (err) => console.error(err),
    });
  }

  sendFriendRequest(userId: number): void {
    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => alert('邀請已發送'),
      error: (err) => console.error(err),
    });
  }
}
