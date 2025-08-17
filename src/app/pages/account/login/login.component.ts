import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, HttpClientModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  account = '';
  password = '';
  loading = false;
  errMsg = '';

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


  login() {
    this.loading = true;
    this.errMsg = '';

    const loginData = {
      account: this.account,
      password: this.password
    };

    this.http.post<any>(`${this.apiBase}/login`, loginData)
      .subscribe({
        next: res => {
          localStorage.setItem('jwtToken', res.token);
          this.loading = false;
          this.router.navigate(['/member-info']);
        },
        error: err => {
          this.errMsg = '帳號或密碼錯誤';
          this.loading = false;
        }
      });
  }

  loginWithGoogle() {
    // 手動觸發 One Tap 或 popup 模式
    google.accounts.id.prompt();
  }

handleCredentialResponse(response: any) {
  const idToken = response.credential;

  const headers = { 'Content-Type': 'application/json' };

  this.loading = true;
  this.errMsg = '';

  this.http.post<any>(
    `${this.apiBase}/google-login`,
    JSON.stringify(idToken),    // 確保是字串的 JSON 格式
    { headers }
  ).subscribe({
    next: res => {
      localStorage.setItem('jwtToken', res.token);
      this.loading=false;
      this.router.navigate(['/member-info']);
    },
    error: err => {
      this.loading = false;
      console.error('Google 登入失敗', err);
      this.errMsg = err?.error?.message ?? 'Google 登入失敗';
    }
  });
}


logout() {
  localStorage.removeItem('jwtToken');
  location.replace('/login');
  setTimeout(() => location.reload(), 0);
  }

  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent) {
    if (event.persisted) {
      location.reload();
    }
  }
}
