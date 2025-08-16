import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  private readonly apiUrl = 'https://localhost:7124/api/Account/forgot-password';

  constructor(private http: HttpClient) {}

  submit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = '請輸入 Email';
      return;
    }

    this.loading = true;
    this.http.post(this.apiUrl, { email: this.email }).subscribe({
      next: () => {
        this.successMessage = '已寄出重設密碼連結，請查看您的信箱。';
        this.loading = false;
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? '發送失敗，請稍後再試';
        this.loading = false;
      }
    });
  }
}
