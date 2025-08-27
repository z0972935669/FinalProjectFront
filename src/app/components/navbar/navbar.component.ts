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
import { filter, Subscription } from 'rxjs';
import { CartService } from '../../services/cart/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  memberName: string | null = null; // 儲存會員姓名
  cartCount = 0;
  @Output() chatToggle = new EventEmitter<void>(); // 對外發送聊天視窗狀態

  private routerSub?: Subscription;
  private cartSub?: Subscription;

  constructor(private router: Router, private http: HttpClient, private cartService: CartService) {}

  ngOnInit(): void {
    // 即時訂閱購物車數量
    this.cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    if (this.isLoggedIn()) {
      this.loadMemberName();
    }
    // 初次與每次導頁時都更新購物車數量
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isLoggedIn()) this.loadMemberName();
        else this.memberName = null;
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.cartSub?.unsubscribe();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwtToken');
  }

  toggleChat() {
    this.chatToggle.emit();
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
}
