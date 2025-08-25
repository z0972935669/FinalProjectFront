import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class RegisterComponent {
  // 欄位
  account = '';
  password = '';
  confirmPassword = '';
  email = '';
  name = '';
  gender = '';
  phone = '';
  birthDate: string = '';
  photoFile?: File;
  photoPreview: string = '';

  showPassword = false;
  showConfirmPassword = false;

  private readonly apiUrl = 'https://localhost:7124/api/account/register';

  constructor(private http: HttpClient, private router: Router) {}

  // 顯示/隱藏密碼
  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  // 大頭貼預覽（選填）
  onPhotoSelected(event: any) {
    this.photoFile = event.target.files?.[0];
    if (this.photoFile) {
      const reader = new FileReader();
      reader.onload = () => this.photoPreview = reader.result as string;
      reader.readAsDataURL(this.photoFile);
    } else {
      this.photoPreview = '';
    }
  }

  // 基本 Email 檢核（簡潔）
  private isEmailFormatOk(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  // 前端欄位檢查：回傳「缺少」清單；同時做格式檢查
  private validate(): string[] {
    const missing: string[] = [];
    if (!this.account.trim()) missing.push('帳號');
    if (!this.name.trim()) missing.push('姓名');
    if (!this.gender.trim()) missing.push('性別');
    if (!this.email.trim()) missing.push('電子郵件');
    if (!this.password.trim()) missing.push('密碼');
    if (!this.confirmPassword.trim()) missing.push('確認密碼');

    // 進一步格式檢查
    const errs: string[] = [];
    if (missing.length === 0) {
      if (!this.isEmailFormatOk(this.email)) errs.push('Email 格式不正確');
      if (this.password !== this.confirmPassword) errs.push('密碼與確認密碼不一致');
      // 可選：密碼強度（最少 6 碼）
      if (this.password.length < 6) errs.push('密碼至少 6 碼');
    }

    return missing.length ? [`請填寫：${missing.join('、')}`] : errs;
  }

  // 送出註冊
  register() {
    const problems = this.validate();
    if (problems.length > 0) {
      alert(problems.join('\n'));
      return;
    }

    const formData = new FormData();
    formData.append('account', this.account.trim());
    formData.append('password', this.password);
    formData.append('confirmPassword', this.confirmPassword);
    formData.append('email', this.email.trim());
    formData.append('name', this.name.trim());
    formData.append('gender', this.gender);
    formData.append('phone', this.phone.trim());
    formData.append('birthDate', this.birthDate ?? '');
    if (this.photoFile) formData.append('photo', this.photoFile);

    this.http.post(this.apiUrl, formData).subscribe({
      next: () => {
        alert('註冊成功，請重新登入');
        this.router.navigate(['/show/login']);
      },
      error: err => {
        console.error('註冊失敗:', err);
        // 後端若有 message 就顯示 message，否則顯示一般錯誤
        const msg = err?.error?.message || err?.error || err?.message || '請查看 Console';
        alert('註冊失敗：' + msg);
      }
    });
  }
}
