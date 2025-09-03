import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
} from '@angular/common/http';
import { filter, Subscription, interval } from 'rxjs';
import { CartService } from '../../services/cart/cart.service';
import { FriendService } from '../../services/community/friend.service';

// 新增介面定義
interface FriendRequest {
  id: number;
  fromUserId: number;
  fromUserName: string;
  fromUserPhoto?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  memberName: string | null = null; // 儲存會員姓名
  cartCount = 0;
  @Output() chatToggle = new EventEmitter<void>(); // 對外發送聊天視窗狀態

  // 通知相關屬性
  showNotifications = false;
  pendingRequests: FriendRequest[] = [];
  pendingRequestsCount = 0;

  private routerSub?: Subscription;
  private cartSub?: Subscription;
  private pollSubscription?: Subscription;
  private readonly POLL_INTERVAL = 30000; // 30秒檢查一次

  constructor(private router: Router, private http: HttpClient, private cartService: CartService, private friendService: FriendService) {}

  ngOnInit(): void {
    // 即時訂閱購物車數量
    this.cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    if (this.isLoggedIn()) {
      this.loadMemberName();
      // 通知初始化
      this.loadPendingRequests();
      this.startPolling();
    }
    // 初次與每次導頁時都更新購物車數量
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isLoggedIn()) this.loadMemberName();
        else this.memberName = null;
      });

    // 全域點擊監聽
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.cartSub?.unsubscribe();
    this.pollSubscription?.unsubscribe();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwtToken');
  }

  toggleChat() {
    this.chatToggle.emit();
  }

  // 通知相關方法
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const notificationContainer = target.closest('.notification-container');
    if (!notificationContainer) {
      this.showNotifications = false;
    }
  }

  private startPolling(): void {
    this.pollSubscription = interval(this.POLL_INTERVAL).subscribe(() => {
      this.loadPendingRequests();
    });
  }

  private loadPendingRequests(): void {

    this.friendService.getFriendRequests().subscribe({
      next: (requests: any[]) => {

        const currentUserId = this.getCurrentUserId();

        const pendingRequests = requests.filter(req => {
          const isPending = req.requestStatus === 'Pending' || req.requestStatus === undefined;
          const isForCurrentUser = req.receiverID === currentUserId;
          return isPending && isForCurrentUser;
        });

        this.pendingRequests = pendingRequests.map(req => ({
          id: req.requestID,
          fromUserId: req.requesterID,
          fromUserName: req.requesterName || `用戶 ${req.requesterID}`,
          fromUserPhoto: undefined,
          sentAt: req.sentAt,
          status: 'pending' as const
        }));

        this.pendingRequestsCount = this.pendingRequests.length;
      },
      error: (error: any) => {
        console.error('❌ [Navbar] 載入好友邀請失敗:', error);
      }
    });
  }

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

  private loadMemberName() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http
      .get<any>('https://localhost:7124/api/Member/me', { headers })
      .subscribe({
        next: (res) => {
          this.memberName = res.name; // 後端回傳的 FName
        },
        error: () => {
          // token 無效就清掉，導回登入
          localStorage.removeItem('jwtToken');
          this.router.navigate(['/show/login']);
        },
      });
  }

  logout() {
    const token = localStorage.getItem('jwtToken');
    localStorage.removeItem('jwtToken');
    if (token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http
        .post('https://localhost:7124/api/account/logout', {}, { headers })
        .subscribe({
          next: () => {
            window.location.replace('/show/login');
          },
          error: () => {
            window.location.replace('/show/login');
          },
        });
    } else {
      window.location.replace('/show/login');
    }
  }

  // 接受好友邀請
  acceptRequest(request: FriendRequest): void {
    const requestBody = {
      RequestID: request.id,
      Action: 'Accepted'
    };

    this.friendService.respondFriendRequest(requestBody).subscribe({
      next: (response) => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
        this.pendingRequestsCount = this.pendingRequests.length;
        alert(`已接受 ${request.fromUserName} 的好友邀請！`);
      },
      error: (error: any) => {
        console.error('❌ 接受好友邀請失敗:', error);
        alert('接受好友邀請失敗，請稍後再試');
      }
    });
  }

  // 拒絕好友邀請
  rejectRequest(request: FriendRequest): void {
    const requestBody = {
      RequestID: request.id,
      Action: 'Rejected'
    };

    this.friendService.respondFriendRequest(requestBody).subscribe({
      next: (response) => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
        this.pendingRequestsCount = this.pendingRequests.length;
        alert(`已拒絕 ${request.fromUserName} 的好友邀請`);
      },
      error: (error: any) => {
        console.error('❌ 拒絕好友邀請失敗:', error);
        alert('拒絕好友邀請失敗，請稍後再試');
      }
    });
  }

  // 計算時間差
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

  // ...existing methods...
}
