import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, HttpClientModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  account = '';
  password = '';
  loading = false;
  errMsg = '';

  lockCountdown = 0;
  private lockTimer?: any;

  // 停權對話框狀態
  showBanDialog = false;
  banMessage = '您的帳號已被停權，請聯繫安養院或客服。';

  // ===== 常數（只改這裡即可統一導頁與 Token key）=====
  private readonly apiBase = 'https://localhost:7124/api/account';
  private readonly TOKEN_KEYS = ['jwt', 'jwtToken'];
  private readonly LOGIN_REDIRECT = '/member-info';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // 進登入頁先清掉壞掉或過期 token，避免路由守門員自動把你帶離登入頁
    this.clearIfInvalidToken();

    // 初始化 Google 登入
    google.accounts.id.initialize({
      client_id: '539203552503-0gjiv0sopc3hcfe1eit0ng5bk9uvgqqb.apps.googleusercontent.com',
      callback: this.handleCredentialResponse.bind(this)
    });

    // 渲染 Google 按鈕
    setTimeout(() => {
      const btn = document.getElementById('googleLoginBtn');
      if (btn) {
        google.accounts.id.renderButton(btn, {
          type: 'icon',
          size: 'large',
          theme: 'filled_black',
          shape: 'circle',
          logo_alignment: 'center'
        });
      }
    }, 100);

    // LINE 授權回傳處理
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem('line_state');

    if (code && state && storedState && state === storedState) {
      this.loading = true;
      this.http.post<any>(`${this.apiBase}/line-exchange-code`, { code })
        .subscribe({
          next: (res) => {
            this.setToken(res.token);
            localStorage.removeItem('line_state');
            this.loading = false;
            this.router.navigateByUrl(this.LOGIN_REDIRECT);
          },
          error: (err: HttpErrorResponse) => {
            this.handleAuthError(err);
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.lockTimer) clearInterval(this.lockTimer);
  }

  onFieldInput(): void {
    if (this.errMsg && this.lockCountdown === 0) this.errMsg = '';
  }

  // ===== 帳密登入 =====
  login() {
    if (this.lockCountdown > 0) return;
    this.loading = true;
    this.errMsg = '';

    const loginData = { account: this.account, password: this.password };

    // 送出前清掉舊 token，避免守門員誤帶走
    this.clearToken();

    this.http.post<any>(`${this.apiBase}/login`, loginData).subscribe({
      next: (res) => {
        this.setToken(res.token);
        localStorage.setItem('memberName', res.name ?? '');
        this.loading = false;
        this.router.navigateByUrl(this.LOGIN_REDIRECT);
      },
      error: (err: HttpErrorResponse) => {
        this.handleAuthError(err);
      }
    });
  }

  // ===== Google 登入 =====
  loginWithGoogle() {
    google.accounts.id.prompt();
  }

  handleCredentialResponse = (response: any) => {
    const idToken = response.credential;
    const headers = { 'Content-Type': 'application/json' };

    if (this.lockCountdown > 0) return;
    this.loading = true;
    this.errMsg = '';

    this.clearToken();

    this.http.post<any>(`${this.apiBase}/google-login`, JSON.stringify(idToken), { headers })
      .subscribe({
        next: (res) => {
          this.setToken(res.token);
          this.loading = false;
          this.router.navigateByUrl(this.LOGIN_REDIRECT);
        },
        error: (err: HttpErrorResponse) => {
          this.handleAuthError(err);
        }
      });
  };

  // ===== LINE 登入（原流程保留） =====
  private line = {
    clientId: '2007987566',
    redirectUri: 'http://localhost:4200/show/login',
    authorizeUrl: 'https://access.line.me/oauth2/v2.1/authorize',
    scope: 'openid profile email'
  };

  lineLogin() {
    const state = this.randomString(24);
    localStorage.setItem('line_state', state);
    const url =
      `${this.line.authorizeUrl}?response_type=code` +
      `&client_id=${encodeURIComponent(this.line.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.line.redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(this.line.scope)}`;
    window.location.href = url;
  }

  // ===== 共用工具 =====
  logout() {
    this.clearToken();
    location.replace('/login');
    setTimeout(() => location.reload(), 0);
  }

  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent) {
    const hasCode = new URLSearchParams(window.location.search).has('code');
    if (event.persisted && !hasCode) location.reload();
  }

  private extractSeconds(msg: string): number | null {
    const m = msg?.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  private startLockCountdown(sec: number) {
    if (this.lockTimer) clearInterval(this.lockTimer);
    this.lockCountdown = sec;

    this.lockTimer = setInterval(() => {
      this.lockCountdown--;
      if (this.lockCountdown <= 0) {
        clearInterval(this.lockTimer);
        this.lockTimer = undefined;
        this.errMsg = '';
      }
    }, 1000);
  }

  private randomString(len: number): string {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    const chars = Array.from(bytes).map(b => (b % 36).toString(36));
    return chars.join('');
  }

  // ===== Token 工具（同時支援 jwt 與 jwtToken）=====
  private setToken(t: string) {
    this.TOKEN_KEYS.forEach(k => localStorage.setItem(k, t));
  }
  private readToken(): string | null {
    for (const k of this.TOKEN_KEYS) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return null;
  }
  private clearToken() {
    this.TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('memberName');
  }
  private base64UrlDecode(s: string) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return atob(s);
  }
  private clearIfInvalidToken() {
    try {
      const token = this.readToken();
      if (!token) return;
      const payloadRaw = token.split('.')[1] || '';
      const payload = JSON.parse(this.base64UrlDecode(payloadRaw));
      const exp = Number(payload?.exp) || 0;
      const now = Math.floor(Date.now() / 1000);
      if (exp <= now) this.clearToken();
    } catch { this.clearToken(); }
  }

  private safeLogout() {
    this.clearToken();
  }

  private openBanDialog(serverMsg?: string) {
    // 後端訊息優先，否則顯示預設
    this.banMessage = serverMsg || '您的帳號已被停權，請聯繫安養院或客服。';
    this.showBanDialog = true;
  }

  closeBanDialog() {
    this.showBanDialog = false;
  }

  // ===== 統一處理 401/403/429（避免三處重複碼）=====
  private handleAuthError(err: HttpErrorResponse) {
    this.loading = false;

    if (err.status === 429) {
      const msg = (err.error?.message as string) || '嘗試過多，請稍後再試';
      const sec = this.extractSeconds(msg) ?? 60;
      this.errMsg = `已暫時鎖定，${sec} 秒後可再嘗試。`;
      this.startLockCountdown(sec);
      return; // 不導頁
    }

    if (err.status === 401) {
      this.safeLogout();
      const msg = (err.error?.message as string) || '';
      if (msg.includes('停權')) {
        this.openBanDialog(msg);
      } else {
        this.errMsg = msg || '帳號或密碼錯誤';
      }
      return;
    }

    if (err.status === 403) {
      this.safeLogout();
      this.openBanDialog(err.error?.message || '權限不足');
      return;
    }
    this.errMsg = err.error?.message || '系統忙碌或網路異常，請稍後再試';
  }
}
