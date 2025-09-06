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

  // 狀態：是否檢查中 / 是否已被使用
  checkingAccount = false;
  checkingEmail = false;
  accountTaken?: boolean;
  emailTaken?: boolean;


  emailHasWhitespace = false;
  emailHasCJK = false;


  private acctTimer?: any;
  private emailTimer?: any;

  private readonly checkAccountUrl = 'https://localhost:7124/api/account/check-account';
  private readonly checkEmailUrl = 'https://localhost:7124/api/account/check-email';

  constructor(private http: HttpClient, private router: Router) {}

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }


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


  onAccountChange() { this.accountTaken = undefined; }
  onEmailChange()   { this.emailTaken   = undefined; } // 若 HTML 仍用 (ngModelChange) 時可沿用


  onEmailInput(ev: Event) {
    const val = (ev.target as HTMLInputElement).value;

    // 即時內容檢查
    this.emailHasWhitespace = /\s/.test(val);
    this.emailHasCJK = /[\u3000-\u303F\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/.test(val);

    // 清除舊的查重狀態與 loading
    this.emailTaken = undefined;
    this.checkingEmail = false;


    if (this.emailTimer) clearTimeout(this.emailTimer);
    this.emailTimer = setTimeout(() => this.checkEmail(true), 500);
  }

  checkAccount() {
    const val = this.account.trim();
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

  checkEmail(silent = false) {
    const val = (this.email ?? '').trim();


    const okFormat = this.isEmailFormatOk(val);
    const hasWs = /\s/.test(val);
    const hasCJK = /[\u3000-\u303F\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/.test(val);

    // 更新旗標
    this.emailHasWhitespace = hasWs;
    this.emailHasCJK = hasCJK;

    if (!val || !okFormat || hasWs || hasCJK) {
      this.emailTaken = undefined;
      this.checkingEmail = false;
      return;
    }

    if (!silent) this.checkingEmail = true;

    clearTimeout(this.emailTimer);
    this.emailTimer = setTimeout(() => {
      this.http.get<{ exists: boolean }>(this.checkEmailUrl, { params: { email: val } })
        .subscribe({
          next: r => this.emailTaken = r.exists,
          error: _ => this.emailTaken = undefined,
          complete: () => this.checkingEmail = false
        });
    }, silent ? 0 : 350);
  }

  // Email 檢核
  private isEmailFormatOk(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  // 前端欄位檢查
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
      if (this.emailHasWhitespace) errs.push('Email 不可含空白字元');
      if (this.emailHasCJK) errs.push('Email 不可包含中文或全形字元');
      if (this.password !== this.confirmPassword) errs.push('密碼與確認密碼不一致');
      if (this.password.length < 6) errs.push('密碼至少 6 碼');
    }

    return missing.length ? [`請填寫：${missing.join('、')}`] : errs;
  }

fillDemoData() {
  // const rand = Math.floor(Math.random() * 10000); // 保證唯一性
  // this.account = `demoUser${rand}`;
  this.account = `demoUser0912`;
  this.password = "123456";
  this.confirmPassword = "123456";
  this.name = "黃大爺";
  this.gender = "男";
  this.birthDate = "1971-09-06";
  this.phone = "0912345678";
  this.email = `ispan0912@gmail.com`;


  this.photoFile = undefined;
  this.photoPreview = "";


  this.agree = true;
}


  agree = false;

  // 送出註冊
  register() {
    if (!this.agree) {
      alert('請先勾選「我同意 服務條款」');
      return;
    }
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
