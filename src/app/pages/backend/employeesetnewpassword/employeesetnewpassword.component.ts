import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

@Component({
  standalone: true,
  selector: 'app-employeesetnewpassword',
  templateUrl: './employeesetnewpassword.component.html',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class EmployeesetnewpasswordComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(EmployeeAuthService);

  token = '';
  newPassword = '';
  confirm = '';
  err = '';
  ok = '';
  saving = false;

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  get mismatch() {
    return !!this.newPassword && this.newPassword !== this.confirm;
  }

  submit(f: NgForm) {
    this.err = this.ok = '';
    if (!this.token) {
      this.err = '連結無效或已過期';
      return;
    }
    if (!f.valid || this.mismatch) {
      this.err = '請確認新密碼輸入無誤';
      return;
    }
    const passOk = /^[A-Za-z0-9]{4,12}$/.test(this.newPassword);
    if (!passOk) {
      this.err = '新密碼需為 4–12 位英數字';
      return;
    }

    this.saving = true;
    this.auth.resetPasswordByToken(this.token, this.newPassword).subscribe({
      next: () => {
        this.ok = '密碼已更新，請用新密碼登入';
        this.saving = false;
        setTimeout(() => this.router.navigate(['/erp/employeelogin']), 1000);
      },
      error: (e) => {
        this.err = e?.error ?? '重設失敗';
        this.saving = false;
      },
    });
  }
}
