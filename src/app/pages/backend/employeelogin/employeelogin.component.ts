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

  constructor(
    private auth: EmployeeAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  /** 登入後導向的目標路徑（預設員工首頁） */
  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/erp/employeehome';
  }

  ngOnInit(): void {
    // 如果 token 還有效，就直接導回目標頁，避免停在登入畫面
    if (this.auth.isTokenValid && this.auth.isTokenValid()) {
      this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
      return;
    }

    // 還原記住的帳號
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

    // 假設 EmployeeAuthService.login(payload) 會自行保存 token
    this.auth
      .login(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          // 記住帳號
          if (this.vm.remember) localStorage.setItem('emp_username', payload.username);
          else localStorage.removeItem('emp_username');

          // 導回原本想去的頁面；replaceUrl 避免「上一頁」回到登入
          this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        },
        error: (err: HttpErrorResponse) => {
          this.error = err?.error?.message ?? '帳號或密碼錯誤，請再試一次。';
          console.error('login error =', err);
        },
      });
  }

  toggleShowPwd() {
    this.showPwd = !this.showPwd;
  }
  fillAccount(user: string, pwd: string) {
    this.vm.username = user;
    this.vm.password = pwd;
  }

}
