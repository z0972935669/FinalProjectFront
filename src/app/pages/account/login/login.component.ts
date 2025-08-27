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

  private readonly apiBase = 'https://localhost:7124/api/account';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
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
  } else {
    console.warn('googleLoginBtn not found');
  }
}, 100);

    // LINE 授權回傳處理
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem('line_state');

    if (code && state && storedState && state === storedState) {
      this.http.post<any>(`${this.apiBase}/line-exchange-code`, { code })
        .subscribe({
          next: (res) => {
            localStorage.setItem('jwtToken', res.token);
            localStorage.removeItem('line_state');
            this.router.navigateByUrl('/show/member');
          },
          error: (err) => {
            this.errMsg = err?.error?.message ?? 'LINE 登入失敗';
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

  login() {
    if (this.lockCountdown > 0) return;
    this.loading = true;
    this.errMsg = '';

    const loginData = { account: this.account, password: this.password };

    this.http.post<any>(`${this.apiBase}/login`, loginData).subscribe({
      next: (res) => {
        localStorage.setItem('jwtToken', res.token);
        localStorage.setItem('memberName', res.name);
        this.loading = false;
        this.router.navigate(['/member-info']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;

        if (err.status === 429) {
          const msg = (err.error?.message as string) || '嘗試過多，請稍後再試';
          const sec = this.extractSeconds(msg) ?? 60;
          this.errMsg = `已暫時鎖定，${sec} 秒後可再嘗試。`;
          this.startLockCountdown(sec);
          return;
        }

        if (err.status === 401) {
          this.errMsg = (err.error?.message as string) || '帳號或密碼錯誤';
          return;
        }

        this.errMsg = '系統忙碌或網路異常，請稍後再試';
      }
    });
  }

  loginWithGoogle() {
    google.accounts.id.prompt();
  }

  handleCredentialResponse = (response: any) => {
    const idToken = response.credential;
    const headers = { 'Content-Type': 'application/json' };

    if (this.lockCountdown > 0) return;
    this.loading = true;
    this.errMsg = '';

    this.http.post<any>(`${this.apiBase}/google-login`, JSON.stringify(idToken), { headers })
      .subscribe({
        next: (res) => {
          localStorage.setItem('jwtToken', res.token);
          this.loading = false;
          this.router.navigate(['/member-info']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;

          if (err.status === 429) {
            const msg = (err.error?.message as string) || '嘗試過多，請稍後再試';
            const sec = this.extractSeconds(msg) ?? 60;
            this.errMsg = `已暫時鎖定，${sec} 秒後可再嘗試。`;
            this.startLockCountdown(sec);
            return;
          }

          if (err.status === 401) {
            this.errMsg = (err.error?.message as string) || 'Google 登入失敗';
            return;
          }

          console.error('Google 登入失敗', err);
          this.errMsg = err?.error?.message ?? 'Google 登入失敗';
        }
      });
  };

  //  LINE 登入流程
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

  logout() {
    localStorage.removeItem('jwtToken');
    location.replace('/login');
    setTimeout(() => location.reload(), 0);
  }

  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent) {
    if (event.persisted) location.reload();
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
}
