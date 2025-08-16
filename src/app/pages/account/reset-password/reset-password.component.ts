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
    });
  }

  resetPassword() {
    this.message = '';
    if (this.newPassword !== this.confirmPassword) {
      this.message = '兩次輸入的密碼不一致';
      return;
    }

    const data = {
      email: this.email,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.loading = true;

    this.http.post(`${this.apiBase}/reset-password`, data).subscribe({
      next: () => {
        this.message = '密碼重設成功，即將前往登入頁...';
        setTimeout(() => this.router.navigate(['/show/login']), 2000);
      },
      error: (err) => {
        this.message = '重設失敗：' + (err.error?.message ?? '請稍後再試');
        this.loading = false;
      }
    });
  }
}
