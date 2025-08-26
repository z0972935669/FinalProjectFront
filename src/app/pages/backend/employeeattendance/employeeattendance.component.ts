import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subscription, interval, startWith } from 'rxjs';

import { EmployeeAttendanceService, TodayAttendance } from '../../../services/employee/employee-attendance.service';

@Component({
  selector: 'app-employeeattendance',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './employeeattendance.component.html',
  styleUrls: ['./employeeattendance.component.scss']
})
export class EmployeeattendanceComponent implements OnInit, OnDestroy {
  private svc = inject(EmployeeAttendanceService);

  meName = '—';              // 員工姓名 (可後續串 JWT 或直接寫死)
  nowStr = '--:--:--';       // 現在時間
  model?: TodayAttendance;   // 後端回傳的資料
  busy = false;

  private clock$?: Subscription;

  ngOnInit(): void {
    // 時鐘
    this.clock$ = interval(1000).pipe(startWith(0)).subscribe(() => {
      this.nowStr = new Date().toLocaleTimeString();
    });

    // 一開始就讀取今天狀態
    this.refresh();
  }

  ngOnDestroy(): void {
    this.clock$?.unsubscribe();
  }

  refresh(): void {
    this.svc.getToday().subscribe({
      next: (res) => { this.model = res; },
      error: () => alert('讀取失敗')
    });
  }

  onClockIn(): void {
    if (this.busy) return;
    this.busy = true;
    this.svc.clockIn().subscribe({
      next: (res) => {
        this.model = res;
        this.busy = false;
        alert('✅ 上班打卡成功');
      },
      error: () => {
        alert('上班打卡失敗');
        this.busy = false;
      }
    });
  }

  onClockOut(): void {
    if (this.busy) return;
    this.busy = true;
    this.svc.clockOut().subscribe({
      next: (res) => {
        this.model = res;
        this.busy = false;
        alert('✅ 下班打卡成功');
      },
      error: () => {
        alert('下班打卡失敗');
        this.busy = false;
      }
    });
  }

  // 顯示用：直接轉成本地時間
  get clockInStr() { return this.svc.toLocal(this.model?.clockInTime); }
  get clockOutStr() { return this.svc.toLocal(this.model?.clockOutTime); }
}
