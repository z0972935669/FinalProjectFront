// src/app/pages/backend/employeelogin/employeelogin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

type Vm = { username: string; password: string; remember: boolean };

@Component({
  selector: 'app-employee-login',
  standalone: true,
  templateUrl: './employeelogin.component.html',
  styleUrls: ['./employeelogin.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class EmployeeLoginComponent implements OnInit {
  vm: Vm = { username: '', password: '', remember: true };
  loading = false;
  error: string | null = null;
  showPwd = false;

  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/erp/employeehome';
  }

  constructor(
    private auth: EmployeeAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // 已登入就直接跳到目標（避免回到登入頁還看到殼邏輯抖動）
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
      return;
    }

    const saved = localStorage.getItem('emp_username');
    if (saved) this.vm.username = saved;
  }

  login(f: NgForm) {
    this.error = null;
    if (!f.valid || this.loading) return;

    this.loading = true;

    const payload = {
      username: this.vm.username.trim(),
      password: this.vm.password,
    };

    // Service 內會負責把 token 存到 localStorage（employee_token）
    this.auth
      .login(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          // 記住帳號
          if (this.vm.remember) localStorage.setItem('emp_username', payload.username);
          else localStorage.removeItem('emp_username');

          // 導回 returnUrl（或預設首頁）；replaceUrl 避免使用者「上一頁」又回到 login
          this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        },
        error: (err: HttpErrorResponse) => {
          this.error = err?.error?.message ?? '帳號或密碼錯誤';
          console.error('login error =', err);
        },
      });
  }
}
