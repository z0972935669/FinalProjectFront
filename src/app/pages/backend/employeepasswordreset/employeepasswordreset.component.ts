import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-employeepasswordreset',
  standalone: true,
  templateUrl: './employeepasswordreset.component.html',
  styleUrls: ['./employeepasswordreset.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class EmployeepasswordresetComponent {
  oldPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  displayName = '';
  error: string | null = null;
  success: string | null = null;
  verifying = false;
  changing = false;

  constructor(private auth: EmployeeAuthService, private router: Router) {
    this.displayName = this.auth.getDisplayName();
  }
  /** 兩次新密碼是否不一致（用來即時顯示紅字） */
  get pwdMismatch(): boolean {
    return !!this.newPassword && !!this.confirmNewPassword
      && this.newPassword !== this.confirmNewPassword;
  }
  /** 驗證舊密碼 */
  verifyOldPassword() {
    this.error = null;
    this.success = null;
    if (!this.oldPassword) {
      this.error = '請輸入舊密碼';
      return;
    }
    this.verifying = true;
    this.auth.verifyOldPassword(this.oldPassword).subscribe({
      next: () => {
        this.verifying = false;
        this.success = '舊密碼正確';
      },
      error: (err: HttpErrorResponse) => {
        this.verifying = false;
        this.error = err?.error ?? '舊密碼錯誤';
      },
    });
  }

  /** 提交修改密碼 */
  changePassword(f: NgForm) {
    this.error = null;
    this.success = null;

    if (!f.valid) {
      this.error = '請確認所有欄位皆已正確填寫';
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.error = '兩次新密碼不一致';
      return;
    }

    // ✅ 前端檢查規則：4–12 位英數字
    const PASS_REGEX = /^[A-Za-z0-9]{4,12}$/;
    if (!PASS_REGEX.test(this.newPassword)) {
      this.error = '新密碼需為 4–12 位英數字';
      return;
    }

    this.changing = true;
    this.auth.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: () => {
        this.changing = false;
        alert('密碼修改成功，請重新登入');
        this.auth.logout();
        this.router.navigate(['/erp/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.changing = false;
        this.error = err?.error ?? '密碼修改失敗';
      },
    });
  }
}
