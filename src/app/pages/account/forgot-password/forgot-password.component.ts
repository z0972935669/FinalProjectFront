import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  loading = false;
  cooldown = 0; // 剩餘秒數
  cooldownTimer: any;

  private readonly apiBase = 'https://localhost:7124/api/account';

  constructor(private http: HttpClient) {}

  sendResetLink() {
    if (this.cooldown > 0) return;

    if (!this.email) {
      this.message = '請輸入 Email';
      return;
    }

    this.message = '';
    this.loading = true;

    this.http.post(`${this.apiBase}/forgot-password`, { email: this.email }).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.loading = false;

        // 冷卻時間開始
        this.cooldown = 30;
        this.cooldownTimer = setInterval(() => {
          this.cooldown--;
          if (this.cooldown <= 0) {
            clearInterval(this.cooldownTimer);
          }
        }, 1000);
      },
      error: (err) => {
        this.message = '寄送失敗：' + (err?.error?.message ?? '請稍後再試');
        this.loading = false;
      }
    });
  }
}
