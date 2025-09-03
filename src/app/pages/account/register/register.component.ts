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
  // ===== 既有欄位（原樣保留） =====
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

  // 你原本的註冊 API（保留）
  private readonly apiUrl = 'https://localhost:7124/api/account/register';

  // ====== 這段是「新增」：查重需要的狀態與端點 ======
  // 狀態：是否檢查中 / 是否已被使用（true 表示已被註冊）
  checkingAccount = false;
  checkingEmail = false;
  accountTaken?: boolean; // undefined=尚未檢查 / true=已被用 / false=可用
  emailTaken?: boolean;

  // 防抖用計時器（避免每次輸入就打 API）
  private acctTimer?: any;
  private emailTimer?: any;

  // 查重端點（不動你原本的 apiUrl）
  private readonly checkAccountUrl = 'https://localhost:7124/api/account/check-account';
  private readonly checkEmailUrl = 'https://localhost:7124/api/account/check-email';

  constructor(private http: HttpClient, private router: Router) {}

  // 顯示/隱藏密碼（原本保留）
  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  // 大頭貼預覽（原本保留）
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

  // ===== 新增：輸入中先清掉紅字，避免舊結果殘留 =====
  onAccountChange() { this.accountTaken = undefined; }
  onEmailChange()   { this.emailTaken   = undefined; }

  // ===== 新增：blur 後做「帳號」查重（含 350ms 防抖）=====
  checkAccount() {
    const val = this.account.trim();
    // 空值就不檢查、也不顯示紅字
    if (!val) { this.accountTaken = undefined; return; }

    clearTimeout(this.acctTimer);
    this.checkingAccount = true;
    this.acctTimer = setTimeout(() => {
      this.http.get<{ exists: boolean }>(this.checkAccountUrl, { params: { account: val } })
        .subscribe({
          next: r => this.accountTaken = r.exists,
          error: _ => this.accountTaken = undefined,
          complete: () => this.checkingAccount = false
        });
    }, 350);
  }

  // ===== 新增：blur 後做「Email」查重（格式正確才打，350ms 防抖）=====
  checkEmail() {
    const val = this.email.trim();
    if (!val || !this.isEmailFormatOk(val)) { this.emailTaken = undefined; return; }

    clearTimeout(this.emailTimer);
    this.checkingEmail = true;
    this.emailTimer = setTimeout(() => {
      this.http.get<{ exists: boolean }>(this.checkEmailUrl, { params: { email: val } })
        .subscribe({
          next: r => this.emailTaken = r.exists,
          error: _ => this.emailTaken = undefined,
          complete: () => this.checkingEmail = false
        });
    }, 350);
  }

  // 基本 Email 檢核（原本保留）
  private isEmailFormatOk(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  // 前端欄位檢查（原本保留）
  private validate(): string[] {
    const missing: string[] = [];
    if (!this.account.trim()) missing.push('帳號');
    if (!this.name.trim()) missing.push('姓名');
    if (!this.gender.trim()) missing.push('性別');
    if (!this.email.trim()) missing.push('電子郵件');
    if (!this.password.trim()) missing.push('密碼');
    if (!this.confirmPassword.trim()) missing.push('確認密碼');

    const errs: string[] = [];
    if (missing.length === 0) {
      if (!this.isEmailFormatOk(this.email)) errs.push('Email 格式不正確');
      if (this.password !== this.confirmPassword) errs.push('密碼與確認密碼不一致');
      if (this.password.length < 6) errs.push('密碼至少 6 碼');
    }

    return missing.length ? [`請填寫：${missing.join('、')}`] : errs;
  }

  agree = false;
  // 送出註冊（原本保留；僅多兩道保護：查重期間/已被註冊則擋）
  register() {
      if (!this.agree) {
    alert('請先勾選「我同意 服務條款」');
    return;
  }
    // 若還在查重或確定重複，先擋掉
    if (this.checkingAccount || this.checkingEmail) {
      alert('正在檢查帳號/Email，請稍候再送出');
      return;
    }
    if (this.accountTaken || this.emailTaken) {
      alert('帳號或 Email 已被註冊，請更換');
      return;
    }

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
        const msg = err?.error?.message || err?.error || err?.message || '請查看 Console';
        alert('註冊失敗：' + msg);
      }
    });
  }
}
