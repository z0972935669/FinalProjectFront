import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  EmployeeLeaveService,
  EmployeeLeaveTypeDto,
  EmployeeAgentDto,
  EmployeeLeaveCreateDto,
} from '../../../services/employee/employee-leave.service';

@Component({
  selector: 'app-employeeleaveform',
  standalone: true, // ★ 必須為 true 才能在 Component 上使用 imports
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './employeeleaveform.component.html',
  styleUrls: ['./employeeleaveform.component.scss'],
})
export class EmployeeleaveformComponent implements OnInit {
  // 申請人（由後端取得）
  applicantName = '';

  // 日期（後端需要開始/結束各一個）
  startDate: string | null = null; // yyyy-MM-dd
  endDate: string | null = null;   // yyyy-MM-dd

  // 時間
  timeOptions: string[] = []; // 00:00 ~ 23:30，每 30 分
  startTime = '09:00';
  endTime = '18:00';

  // 假別
  leaveTypes: EmployeeLeaveTypeDto[] = [];
  leaveTypeId: number | null = null;

  // 職務代理人（必填；可選自己，但後端會擋主管身分）
  agents: EmployeeAgentDto[] = [];
  agentId: number | null = null;

  // 其他
  reason = '';
  loading = false;
  errMsg = '';
  okMsg = '';

  constructor(private leaveSvc: EmployeeLeaveService) { }

  ngOnInit(): void {
    // 申請人姓名
    this.leaveSvc.me().subscribe({
      next: me => (this.applicantName = me.applicantName),
      error: _ => (this.applicantName = '(未知)'),
    });

    // 假別清單
    this.leaveSvc.getTypes().subscribe({
      next: list => (this.leaveTypes = list),
      error: _ => (this.errMsg = '無法載入假別清單'),
    });

    // 同部門代理人（含「自己（申請人）」；後端已排除主管）
    this.leaveSvc.getAgents().subscribe({
      next: list => {
        this.agents = list;
        // 預設帶入「自己（申請人）」以降低填寫失敗
        const me = list.find(a => a.display === '自己（申請人）');
        if (me) this.agentId = me.employeeId;
      },
      error: _ => (this.errMsg = '無法載入代理人清單'),
    });

    this.timeOptions = this.buildTimeOptions();
    this.enforceMinGap();
  }

  /** 產生 00:00 ~ 23:30、每 30 分鐘的選項 */
  private buildTimeOptions(): string[] {
    const list: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        list.push(`${hh}:${mm}`);
      }
    }
    return list;
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  private toHHMM(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** 規則：結束時間 >= 開始時間 + 30 分鐘 */
  private enforceMinGap(): void {
    const startMin = this.toMinutes(this.startTime);
    const minEnd = startMin + 30;

    const endMin = this.toMinutes(this.endTime);
    if (endMin < minEnd) {
      const rounded = Math.ceil(minEnd / 30) * 30;
      const safe = Math.min(rounded, 23 * 60 + 30);
      this.endTime = this.toHHMM(safe);
    }
  }

  /** 規則：開始時間 <= 結束時間 - 30 分鐘 */
  private enforceStartUpperBound(): void {
    const endMin = this.toMinutes(this.endTime);
    const maxStart = endMin - 30;

    const startMin = this.toMinutes(this.startTime);
    if (startMin > maxStart) {
      const rounded = Math.floor(maxStart / 30) * 30;
      const safe = Math.max(rounded, 0);
      this.startTime = this.toHHMM(safe);
    }
  }

  onStartChange(_: string): void {
    this.enforceMinGap();
  }

  onEndChange(_: string): void {
    this.enforceStartUpperBound();
  }

  /** 禁用不合法的開始時間（> 結束時間 - 30 分） */
  isStartDisabled(t: string): boolean {
    const endMin = this.toMinutes(this.endTime);
    const maxStart = endMin - 30;
    return this.toMinutes(t) > maxStart;
  }

  /** 禁用不合法的結束時間（< 開始時間 + 30 分） */
  isEndDisabled(t: string): boolean {
    const startMin = this.toMinutes(this.startTime);
    const minEnd = startMin + 30;
    return this.toMinutes(t) < minEnd;
  }

  submit(): void {
    this.errMsg = this.okMsg = '';

    if (!this.startDate || !this.endDate) {
      this.errMsg = '請選擇開始/結束日期';
      return;
    }
    if (!this.leaveTypeId) {
      this.errMsg = '請選擇假別';
      return;
    }
    if (!this.agentId) {
      this.errMsg = '請選擇職務代理人（可選自己）';
      return;
    }

    const payload: EmployeeLeaveCreateDto = {
      leaveTypeId: this.leaveTypeId,
      startDate: this.startDate,
      endDate: this.endDate,
      startTime: this.startTime,
      endTime: this.endTime,
      reason: this.reason?.trim() || null,
      // ★ 帶到後端，第一關一定由代理人簽
      agentEmployeeId: this.agentId,
    };

    this.loading = true;
    this.leaveSvc.create(payload).subscribe({
      next: _ => {
        this.loading = false;
        this.okMsg = '已送出申請';
      },
      error: err => {
        this.loading = false;
        this.errMsg = (err?.error ?? '送出失敗').toString();
      },
    });
  }
}
