import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AssetLoaderService } from '../../core/asset-loader.service';
import { HeaderComponent } from '../../components/backend/header/header.component';
import { EmployeeAuthService } from '../../services/employee/employee-auth.service';

@Component({
  selector: 'app-backend',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './backend.component.html',
})
export class BackendComponent implements OnInit, OnDestroy {
  private styleEls: HTMLElement[] = [];
  private scriptEls: HTMLElement[] = [];
  private navSub?: Subscription;

  /** 已登入且非公開頁才顯示殼 */
  showShell = false;

  /** 側欄狀態：xl(>=1200px) 預設展開，小螢幕預設收合 */
  showSidepanel = typeof window !== 'undefined' ? window.innerWidth >= 1200 : true;

  constructor(
    private assets: AssetLoaderService,
    private router: Router,
    private auth: EmployeeAuthService
  ) { }

  async ngOnInit() {
    // 後台樣式/腳本
    const styles = ['assets/backend/css/portal.css'];
    for (const href of styles) this.styleEls.push(await this.assets.loadStyle(href));

    const scripts = [
      'assets/backend/plugins/fontawesome/js/all.min.js',
      'assets/backend/plugins/popper.min.js',
      'assets/backend/plugins/bootstrap/js/bootstrap.min.js',
      'assets/backend/js/app.js',
    ];
    this.scriptEls.push(...(await this.assets.loadScriptsInOrder(scripts)));

    document.body.classList.add('theme-backend');
    document.body.classList.remove('theme-frontend');

    // 首次 & 後續導航都更新殼與側欄狀態
    this.updateShell(this.router.url);
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.updateShell(e.urlAfterRedirects || e.url));
  }

  /** /erp/login | /erp/employeeregister | /erp/employeepasswordreset 視為公開頁 */
  private isPublicUrl(url: string): boolean {
    const path = (url || '').split('?')[0];
    return (
      path.startsWith('/erp/login') ||
      path.startsWith('/erp/employeeregister') ||
      path.startsWith('/erp/employeepasswordreset')
    );
  }

  private updateShell(url: string) {
    // 是否能進頁面由守衛把關；殼只看有沒有 token + 是否公開頁
    const hasToken = !!this.auth.getToken();
    this.showShell = hasToken && !this.isPublicUrl(url);

    // ✅ 每次導頁都依視窗寬度重設：桌面開、手機關
    if (typeof window !== 'undefined') {
      this.showSidepanel = window.innerWidth >= 1200;
    }
  }

  // （可選）跨過斷點時自動同步
  @HostListener('window:resize')
  onResize() {
    if (typeof window === 'undefined') return;
    const shouldOpen = window.innerWidth >= 1200;
    // 只有跨過斷點才更新，避免覆蓋使用者手動切換
    if (shouldOpen !== this.showSidepanel) {
      this.showSidepanel = shouldOpen;
    }
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    this.assets.removeAll([...this.styleEls, ...this.scriptEls]);
    document.body.classList.remove('theme-backend');
  }
}
