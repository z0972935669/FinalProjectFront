// friend-list.component.ts
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FriendService,
  Friend,
} from '../../../services/community/friend.service';

@Component({
  selector: 'app-friend-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
})
export class FriendListComponent implements OnInit {
  @Input() friends: Friend[] = [];
  @Output() openChat = new EventEmitter<number>();

  userId!: number;

  constructor(private friendService: FriendService) {}

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
    this.openChat.emit(friendId);
  }
}
