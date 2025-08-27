// src/app/components/backend/header/header.component.ts
import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  /** xl(>=1200px) 預設展開；可由父層 [(opened)] 覆寫 */
  @Input() opened = typeof window !== 'undefined' ? window.innerWidth >= 1200 : true;
  /** 回推給父層做雙向綁定 */
  @Output() openedChange = new EventEmitter<boolean>();

  /** 右上角「歡迎，xxx」 */
  displayName = '';

  private sub = new Subscription();

  constructor(
    private auth: EmployeeAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1) 啟動/重整後，先用 localStorage 的值立即顯示，避免空白
    this.displayName = this.auth.getDisplayName();
    this.cdr.markForCheck();

    // 2) 再訂閱使用者狀態；登入/登出或 fetchMe() 後會更新
    this.sub.add(
      this.auth.currentUser$.subscribe(u => {
        this.displayName = u?.displayName ?? this.auth.getDisplayName() ?? '';
        this.cdr.markForCheck();
      })
    );

    // 3) 小螢幕導頁後自動把側欄收起來
    this.sub.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1200) {
            this.setOpened(false);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /** 封裝 setter，確保有 emit 給父層並觸發變更檢測 */
  private setOpened(val: boolean) {
    this.opened = val;
    this.openedChange.emit(this.opened);
    this.cdr.markForCheck();
  }

  /** 開/關側欄（行動裝置按漢堡/遮罩/關閉叉叉用） */
  toggleSidepanel(open: boolean): void {
    this.setOpened(open);
  }

  /** 在小螢幕導頁後自動把側欄收起來（選單點擊也可直接呼叫） */
  autoCloseOnMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      this.setOpened(false);
    }
  }

  /** 登出 */
  onLogout(ev: Event): void {
    ev.preventDefault();
    this.auth.logout();
    this.setOpened(false);
    this.router.navigateByUrl('/erp/login'); // 依你的路由維持 /erp/login
  }
}
