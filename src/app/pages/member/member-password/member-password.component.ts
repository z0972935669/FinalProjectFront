import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-member-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './member-password.component.html',
  styleUrl: './member-password.component.scss',
})
export class MemberPasswordComponent implements OnInit {
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  errorMessage = '';
  successMessage = '';
  private readonly apiUrl = 'https://localhost:7124/api/Member/change-password';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    //  補上登入驗證
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/show/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() > payload.exp * 1000) throw new Error('expired');
    } catch {
      localStorage.removeItem('jwtToken');
      this.router.navigate(['/show/login']);
      return;
    }
  }

  changePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      this.errorMessage = '所有欄位皆為必填';
      this.successMessage = '';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = '兩次輸入的新密碼不一致';
      this.successMessage = '';
      return;
    }

    //  呼叫 API 修改密碼
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const body = {
      oldPassword,
      newPassword
    };

    this.http.put(this.apiUrl, body, { headers })
      .subscribe({
        next: () => {
          this.successMessage = '密碼修改成功！';
          this.errorMessage = '';
          this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
        },
        error: err => {
          this.successMessage = '';
          this.errorMessage = err?.error?.message ?? '修改失敗';
        }
      });
  }
}
