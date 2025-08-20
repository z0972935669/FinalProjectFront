// src/app/pages/backend/orders/orders.component.ts  (或你的登入 component 檔名)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

type Vm = { username: string; password: string; remember: boolean; };

@Component({
  selector: 'app-employee-login',
  standalone: true,
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class OrdersComponent implements OnInit {
  vm: Vm = { username: '', password: '', remember: true };
  loading = false;
  error: string | null = null;
  showPwd = false;

  constructor(private auth: EmployeeAuthService, private router: Router) { }

  ngOnInit(): void {
    // 自動帶入記住的帳號
    const saved = localStorage.getItem('emp_username');
    if (saved) this.vm.username = saved;
  }

  login(f: NgForm) {
    this.error = null;
    if (!f.valid) return;

    this.loading = true;
    const payload = {
      username: this.vm.username.trim(),
      password: this.vm.password
    };

    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading = false;

        // 記住帳號
        if (this.vm.remember) {
          localStorage.setItem('emp_username', payload.username);
        } else {
          localStorage.removeItem('emp_username');
        }

        // 導到員工主頁（你也可改成 /erp/employeehome）
        this.router.navigate(['/erp/employeehome']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = err?.error?.message ?? '帳號或密碼錯誤';
      }
    });
  }
}
