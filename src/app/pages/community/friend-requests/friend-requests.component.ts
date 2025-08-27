import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendService, FriendRequestDto, FriendRequestRespondDto } from '../../../services/community/friend.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-friend-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent implements OnInit {
  requests: FriendRequestDto[] = [];
  loading = false;

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.friendService.getFriendRequests().subscribe({
      next: (res) => { this.requests = res; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  respond(requestId: number, action: 'Accepted' | 'Rejected'): void {
    const dto: FriendRequestRespondDto = { requestID: requestId, action };
    this.friendService.respondFriendRequest(dto).subscribe({
      next: () => {
        alert(`好友邀請已${action}`);
        this.requests = this.requests.filter(r => r.requestID !== requestId);
      },
      error: (err) => console.error(err)
    });
  }
}
