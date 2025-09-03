import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

@Component({
  standalone: true,
  selector: 'app-employeeforgotpassword',
  templateUrl: './employeeforgotpassword.component.html',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class EmployeeforgotpasswordComponent {
  private auth = inject(EmployeeAuthService);

  accountOrEmail = '';
  msg = '';
  err = '';
  sending = false;

  submit(f: NgForm) {
    this.msg = this.err = '';
    if (!f.valid) {
      this.err = '請輸入帳號或 Email';
      return;
    }
    this.sending = true;
    this.auth.requestPasswordReset(this.accountOrEmail).subscribe({
      next: () => {
        this.msg = '若資料存在，已寄出重設信。請查收 Email。';
        this.sending = false;
      },
      error: (e) => {
        this.err = e?.error ?? '送出失敗';
        this.sending = false;
      },
    });
  }
}
