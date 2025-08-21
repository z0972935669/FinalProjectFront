// src/app/pages/backend/employeeregister/employeeregister.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

type Vm = {
  // Employee
  name: string;
  identityNumber: string;
  phone: string;
  email: string;

  // Account
  username: string;
  password: string;
  confirm: string;
};

// === 驗證規則 ===
const IDN_REGEX = /^[A-Za-z][0-9]{9}$/;      // 身分證：1 英 + 9 數
const USER_REGEX = /^[A-Za-z0-9]{6,12}$/;     // 帳號：6–12 英數
const PASS_REGEX = /^[A-Za-z0-9]{4,12}$/;     // 密碼：4–12 英數
const SHOW_PLAIN_ALERT = true;                // ⚠️ 資安風險：是否在成功後 alert 明文帳密

@Component({
  selector: 'app-employeeregister',
  standalone: true,
  templateUrl: './employeeregister.component.html',
  styleUrls: ['./employeeregister.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class EmployeeRegisterComponent {
  vm: Vm = {
    name: '',
    identityNumber: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirm: ''
  };

  loading = false;
  error: string | null = null;
  success = false;

  // 提供給 HTML 眼睛圖示切換（密碼/密碼確認）
  showPwd = false;
  showConfirm = false;

  constructor(
    private auth: EmployeeAuthService,
    private router: Router
  ) { }

  register(f: NgForm) {
    this.error = null;
    this.success = false;

    // 先做基本必填驗證（表單層級）
    if (!f.valid) {
      this.error = '請完整填寫表單。';
      return;
    }

    // 前處理：去空白 & 身分證轉大寫
    const name = (this.vm.name || '').trim();
    const identityNumber = (this.vm.identityNumber || '').trim().toUpperCase();
    const phone = (this.vm.phone || '').trim();
    const email = (this.vm.email || '').trim();
    const username = (this.vm.username || '').trim();
    const password = this.vm.password || '';
    const confirm = this.vm.confirm || '';

    // === 客製規則檢核 ===
    // 身分證
    if (!IDN_REGEX.test(identityNumber)) {
      this.error = '身分證格式需為「英文1碼 + 數字9碼」，例如 A123456789。';
      return;
    }
    // Email 至少要包含 @
    if (!email.includes('@')) {
      this.error = 'Email 格式不正確，需包含 @。';
      return;
    }
    // 帳號
    if (!USER_REGEX.test(username)) {
      this.error = '帳號需為 6–12 位英數字。';
      return;
    }
    // 密碼 & 確認密碼
    if (!PASS_REGEX.test(password)) {
      this.error = '密碼需為 4–12 位英數字。';
      return;
    }
    if (!PASS_REGEX.test(confirm)) {
      this.error = '密碼確認需為 4–12 位英數字。';
      return;
    }
    if (password !== confirm) {
      this.error = '兩次密碼不一致。';
      return;
    }

    // 供成功後顯示（若啟用 SHOW_PLAIN_ALERT）
    const plainUsername = username;
    const plainPassword = password;

    const payload = {
      name,
      identityNumber, // 已強制大寫
      phone,
      email,
      username,
      password // 後端請務必 Hash + Salt +（可選）Pepper
    };

    this.loading = true;

    this.auth.registerFull(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        // ⚠️ 可用開關控制是否顯示明文帳密（不建議於正式環境開啟）
        if (SHOW_PLAIN_ALERT) {
          alert(
            `註冊成功！\n\n您的帳號：${plainUsername}\n您的密碼：${plainPassword}\n\n請妥善保存，勿外流。`
          );
        }

        // 清敏感欄位
        this.vm.password = '';
        this.vm.confirm = '';

        // 若你希望整張表單清空（包含姓名、Email 等），保留此行
        f.resetForm();

        // 1 秒後導向登入頁（orders）
        setTimeout(() => this.router.navigate(['/erp/orders']), 1000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = err?.error?.message ?? err?.error ?? err.message ?? '註冊失敗';
      }
    });
  }
  canSubmit(f: NgForm): boolean {
    const formValid = !!f?.valid;                              // 確保是 boolean
    const pwdMatch = this.vm.password === this.vm.confirm;    // 兩次一致
    return !this.loading && formValid && pwdMatch;
  }
  firstError(f: NgForm): string {
    if (!f?.controls) return '請確認所有欄位皆已正確填寫';

    const c = f.controls;

    if (c['name']?.invalid && (c['name']?.dirty || c['name']?.touched)) return '請輸入姓名';
    if (c['identityNumber']?.invalid && (c['identityNumber']?.dirty || c['identityNumber']?.touched))
      return '身分證需為「英文1碼 + 數字9碼」';
    if (c['email']?.invalid && (c['email']?.dirty || c['email']?.touched))
      return 'Email 格式不正確（需包含 @）';
    if (c['username']?.invalid && (c['username']?.dirty || c['username']?.touched))
      return '帳號需為 6–12 位英數字';
    if (c['password']?.invalid && (c['password']?.dirty || c['password']?.touched))
      return '密碼需為 4–12 位英數字';
    if (c['confirm']?.invalid && (c['confirm']?.dirty || c['confirm']?.touched))
      return '密碼確認需為 4–12 位英數字';
    if (this.vm.confirm && this.vm.password !== this.vm.confirm)
      return '兩次密碼不一致';

    return '請確認所有欄位皆已正確填寫';
  }

}
