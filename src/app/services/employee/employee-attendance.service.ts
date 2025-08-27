// src/app/services/employee/employee-attendance.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TodayAttendance = {
  attendanceId?: number;
  employeeId: number;
  workDate: string;
  clockInTime?: string;
  clockOutTime?: string;
  status?: string;
  canClockIn: boolean;
  canClockOut: boolean;
};

@Injectable({ providedIn: 'root' })
export class EmployeeAttendanceService {
  private http = inject(HttpClient);

  // 🔑 直接寫死後端 API 位址
  private base = 'https://localhost:7124/api/EmployeeAttendanceLogs';

  getToday(): Observable<TodayAttendance> {
    return this.http.get<TodayAttendance>(`${this.base}/today`);
  }

  clockIn(): Observable<TodayAttendance> {
    return this.http.post<TodayAttendance>(`${this.base}/clock-in`, {});
  }

  clockOut(): Observable<TodayAttendance> {
    return this.http.post<TodayAttendance>(`${this.base}/clock-out`, {});
  }

  toLocal(t?: string) {
    if (!t) return '--:--:--';
    const d = new Date(t);
    return d.toLocaleTimeString();
  }
}
