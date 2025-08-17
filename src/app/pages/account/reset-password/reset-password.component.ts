import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {

  token: string = '';

  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';
  loading = false;

  private readonly apiBase = 'https://localhost:7124/api/account';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
      this.token = params['token'] || ''; // 需要上面那個屬性
    });
  }

  resetPassword() {
    this.message = '';
    if (!this.token) {
      this.message = '!!! 缺少驗證資訊，請重新申請重設密碼';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.message = '兩次輸入的密碼不一致';
      return;
    }

    const data = {
      email: this.email,           // 若後端改為只驗證 token，可拿掉 email
      token: this.token,           // 帶 token
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.loading = true;
    this.http.post(`${this.apiBase}/reset-password`, data).subscribe({
      next: () => {
        this.message = '密碼重設成功，即將前往登入頁...';
        setTimeout(() => this.router.navigate(['/show/login']), 1500);
      },
      error: (err) => {
        this.message = '重設失敗：' + (err?.error?.message ?? '請稍後再試');
        this.loading = false;
      }
    });
  }
}
