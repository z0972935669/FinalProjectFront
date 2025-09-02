import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Hhmm = string; // e.g. "09:00"

@Component({
  selector: 'app-employeemissingpunchform',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employeemissingpunchform.component.html',
  styleUrl: './employeemissingpunchform.component.scss'
})
export class EmployeemissingpunchformComponent implements OnInit {

  // UI 狀態
  submitting = false;
  err = '';

  // 表單欄位
  leaveDate: string | null = null;     // yyyy-MM-dd
  startTime: Hhmm = '09:00';           // HH:mm（實際打卡時間）
  timeOptions: Hhmm[] = [];            // 00:00 ~ 23:30（每 30 分）

  // 後端 API 根
  private readonly apiRoot = 'https://localhost:7124';
  private readonly base = `${this.apiRoot}/api/EmployeeMissingPunchApplications`;

  constructor(private http: HttpClient) { }
  meName = '';

  ngOnInit(): void {
    this.timeOptions = this.buildTimeOptions();
    this.leaveDate = this.toTodayISO();   // 預設今天
    // 取得登入者姓名
    this.http.get(this.base + '/me-name', { responseType: 'text', withCredentials: true })
      .subscribe(name => this.meName = name ?? '');
  }

  /** 產生 00:00 ~ 23:30，每 30 分鐘 */
  private buildTimeOptions(): Hhmm[] {
    const list: Hhmm[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        list.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return list;
  }

  /** 今天 yyyy-MM-dd */
  private toTodayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  /** 範本用：時間變更 */
  onStartChange(val: Hhmm): void {
    this.startTime = val;
  }
  /** 範本用：是否要禁用某些時間（目前不禁用，全給用） */
  isStartDisabled(_: Hhmm): boolean {
    return false;
  }
  /** 送出表單 */
  submit(): void {
    this.err = '';
    if (!this.leaveDate || !this.startTime) {
      this.err = '請選擇忘卡日期與實際打卡時間';
      return;
    }
    // ✅ 不要用 toISOString()；送本地時間字串（沒有 Z）
    const workDateStr = `${this.leaveDate}T00:00:00`;
    const requestedStr = `${this.leaveDate}T${this.startTime}:00`;

    const body = {
      workDate: workDateStr,
      missingType: 'In',
      applyReason: null,
      requestedTime: requestedStr
    };

    this.submitting = true;
    this.http.post<{ applicationID: number }>(this.base, body, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          alert(`已送出！單號：${res.applicationID}`);
        },
        error: (e) => {
          this.submitting = false;
          this.err = typeof e?.error === 'string' ? e.error : '送出失敗';
        }
      });
  }
}
