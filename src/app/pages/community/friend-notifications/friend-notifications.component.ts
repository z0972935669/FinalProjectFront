import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendService, FriendRequestDto } from '../../../services/community/friend.service';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

export interface FriendRequest {
  id: number;
  fromUserId: number;
  fromUserName: string;
  fromUserPhoto?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

@Component({
  selector: 'app-friend-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="friend-notifications">
      <!-- 簡單測試：總是顯示 -->
      <div style="background: yellow; padding: 10px; border: 1px solid red; margin: 10px 0;">
        🎯 Friend Notifications 元件已載入！如果看到這個訊息，表示元件正常運作。
      </div>

      <!-- 原始內容 -->
      <div class="friend-notifications" *ngIf="hasNotifications">
        <!-- 通知圖示 -->
        <div class="notification-icon" (click)="toggleDropdown()">
          <i class="fas fa-user-friends"></i>
          <span class="badge" *ngIf="pendingRequests.length > 0">
            {{ pendingRequests.length }}
          </span>
        </div>

        <!-- 下拉選單 -->
        <div class="dropdown-menu" *ngIf="showDropdown" (click)="$event.stopPropagation()">
          <div class="dropdown-header">
            <h6>好友邀請</h6>
            <button class="close-btn" (click)="showDropdown = false">×</button>
          </div>

          <div class="requests-list">
            <div *ngFor="let request of pendingRequests" class="request-item">
              <img
                [src]="request.fromUserPhoto || 'assets/img/component/default-avatar.png'"
                [alt]="request.fromUserName"
                (error)="onImageError($event)"
                class="user-avatar"
              />
              <div class="request-info">
                <span class="user-name">{{ request.fromUserName }}</span>
                <small class="sent-time">{{ getTimeAgo(request.sentAt) }}</small>
              </div>
              <div class="action-buttons">
                <button
                  class="accept-btn"
                  (click)="acceptRequest(request)"
                  [disabled]="processing"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button
                  class="reject-btn"
                  (click)="rejectRequest(request)"
                  [disabled]="processing"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div *ngIf="pendingRequests.length === 0" class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>沒有新的好友邀請</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./friend-notifications.component.scss']
})
export class FriendNotificationsComponent implements OnInit, OnDestroy {
  pendingRequests: FriendRequest[] = [];
  showDropdown = false;
  processing = false;
  hasNotifications = false;

  private pollSubscription?: Subscription;
  private readonly POLL_INTERVAL = 30000; // 30秒檢查一次

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    console.log('🎯 FriendNotificationsComponent 初始化成功！');
    console.log('當前用戶ID:', this.getCurrentUserId());
    this.loadPendingRequests();
    this.startPolling();
    // 添加全域點擊監聽器
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    // 移除全域點擊監聽器
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  // 處理全域點擊事件
  private onDocumentClick(event: Event): void {
    this.showDropdown = false;
  }

  private startPolling(): void {
    // 定期檢查新的好友邀請
    this.pollSubscription = interval(this.POLL_INTERVAL).subscribe(() => {
      this.loadPendingRequests();
    });
  }

  // 新增：取得當前用戶 ID 的方法
  private getCurrentUserId(): number {
    const token = localStorage.getItem('jwtToken');
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idStr = payload.MemberID || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub;
      return Number(idStr) || 0;
    } catch {
      return 0;
    }
  }

  private loadPendingRequests(): void {
    console.log('🔄 開始載入好友邀請...');

    this.friendService.getFriendRequests().subscribe({
      next: (requests: any[]) => { // 暫時使用 any[] 類型
        console.log('📥 API 回傳的原始資料:', requests);

        // 過濾出 Pending 狀態的邀請，並且是發送給當前用戶的
        const currentUserId = this.getCurrentUserId();
        console.log('👤 當前用戶ID:', currentUserId);

        const pendingRequests = requests.filter(req => {
          const isPending = req.requestStatus === 'Pending' || req.requestStatus === undefined;
          const isForCurrentUser = req.receiverID === currentUserId; // 使用 receiverID
          console.log(`🔍 檢查邀請 ${req.requestID}: 狀態=${req.requestStatus}, 接收者=${req.receiverID}, 符合=${isPending && isForCurrentUser}`);
          return isPending && isForCurrentUser;
        });

        console.log('✅ 過濾後的邀請:', pendingRequests);

        this.pendingRequests = pendingRequests.map(req => ({
          id: req.requestID,
          fromUserId: req.requesterID,
          fromUserName: req.requesterName || `用戶 ${req.requesterID}`,
          fromUserPhoto: undefined,
          sentAt: req.sentAt,
          status: 'pending' as const
        }));

        this.hasNotifications = this.pendingRequests.length > 0;
        console.log('🎉 最終結果:', {
          pendingRequests: this.pendingRequests,
          hasNotifications: this.hasNotifications
        });
      },
      error: (error: any) => {
        console.error('❌ 載入好友邀請失敗:', error);
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  acceptRequest(request: FriendRequest): void {
    this.processing = true;

    this.friendService.respondFriendRequest({
      RequestID: request.id,    // 修正：使用大寫 R
      Action: 'Accepted'        // 修正：使用大寫 A
    }).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
        this.hasNotifications = this.pendingRequests.length > 0;
        this.processing = false;
        console.log('好友邀請已接受');
      },
      error: (error: any) => {
        console.error('接受好友邀請失敗:', error);
        this.processing = false;
      }
    });
  }

  rejectRequest(request: FriendRequest): void {
    this.processing = true;

    this.friendService.respondFriendRequest({
      RequestID: request.id,    // 修正：使用大寫 R
      Action: 'Rejected'        // 修正：使用大寫 A
    }).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
        this.hasNotifications = this.pendingRequests.length > 0;
        this.processing = false;
        console.log('好友邀請已拒絕');
      },
      error: (error: any) => {
        console.error('拒絕好友邀請失敗:', error);
        this.processing = false;
      }
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/img/component/default-avatar.png';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '剛剛';
    if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} 小時前`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} 天前`;

    return date.toLocaleDateString('zh-TW');
  }
}
