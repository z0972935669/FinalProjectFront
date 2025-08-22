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

  // ★ 鎖定倒數（429 使用）
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

    // 確保 DOM 元素已經存在
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
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.lockTimer) clearInterval(this.lockTimer);
  }

  // ★ 新增：任一欄位輸入時，清掉舊錯誤，避免「一打字就跳錯」
  onFieldInput(): void {
    if (this.errMsg && this.lockCountdown === 0) this.errMsg = '';
  }

  login() {
    if (this.lockCountdown > 0) return; // 還在倒數就不送
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

        // ★ 429：連續失敗達門檻（後端訊息會含秒數）
        if (err.status === 429) {
          const msg = (err.error?.message as string) || '嘗試過多，請稍後再試';
          const sec = this.extractSeconds(msg) ?? 60;
          this.errMsg = `已暫時鎖定，${sec} 秒後可再嘗試。`;
          this.startLockCountdown(sec);
          return;
        }

        // ★ 401：帳號不存在 / 密碼錯誤 / 帳號已停權
        if (err.status === 401) {
          this.errMsg = (err.error?.message as string) || '帳號或密碼錯誤';
          return;
        }

        // 其他：通用錯誤
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

    if (this.lockCountdown > 0) return; // 若也想鎖 Google，保留這行；不想鎖可移除
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

  logout() {
    localStorage.removeItem('jwtToken');
    location.replace('/login');
    setTimeout(() => location.reload(), 0);
  }

  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent) {
    if (event.persisted) location.reload();
  }

  // ====== 小工具：解析秒數 + 倒數 ======
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
}
