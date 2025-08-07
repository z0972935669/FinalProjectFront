import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-member-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-password.component.html',
  styleUrl: './member-password.component.scss',
})
export class MemberPasswordComponent {
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  errorMessage = '';
  successMessage = '';

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

    // TODO: 呼叫 API 修改密碼（這裡先模擬成功）
    this.errorMessage = '';
    this.successMessage = '密碼修改成功！（模擬）';

    // 清空欄位
    this.passwordData = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }
}
