// chat-page.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FriendService } from '../../../services/community/friend.service';
import { ChatService, ChatRoom } from '../../../services/community/chat.service';
import { ChatFloatingComponent } from '../chat-floating/chat-floating.component';
import { FriendListComponent } from '../friend-list/friend-list.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FriendListComponent, ChatFloatingComponent],
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit, AfterViewInit {
  @ViewChild(ChatFloatingComponent) chatFloating!: ChatFloatingComponent;

  friends: { id: number; name: string }[] = [];

  constructor(
    private chatService: ChatService,
    private friendService: FriendService
  ) {}

  ngOnInit(): void {
    this.loadFriends();
  }

  ngAfterViewInit(): void {
    // 確保 ChatFloatingComponent 已經初始化
    // 可以在這裡做任何額外設定
  }

  loadFriends(): void {
    const userId = Number(localStorage.getItem('userId'));
    this.friendService.getFriends(userId).subscribe({
      next: (res) => {
        this.friends = res;
      },
      error: (err) => console.error(err)
    });
  }

  openPrivateChat(friendId: number): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !friendId || !this.chatFloating) return;

    // 直接透過 ChatFloatingComponent 開啟聊天室
    this.chatFloating.openPrivateChat(friendId);
  }
}
