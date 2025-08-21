import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-employeeleaveform',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './employeeleaveform.component.html',
  styleUrl: './employeeleaveform.component.scss'
})
export class EmployeeleaveformComponent implements OnInit {

  // 日期 & 時間
  leaveDate: string | null = null;

  timeOptions: string[] = [];     // 00:00 ~ 23:30，每 30 分鐘
  startTime = '09:00';
  endTime = '18:00';

  ngOnInit(): void {
    this.timeOptions = this.buildTimeOptions();
    // 可在此設定預設日期
    // this.leaveDate = this.toTodayISO();
    this.enforceMinGap();          // 初始校正
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

    let endMin = this.toMinutes(this.endTime);
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

    let startMin = this.toMinutes(this.startTime);
    if (startMin > maxStart) {
      const rounded = Math.floor(maxStart / 30) * 30;
      const safe = Math.max(rounded, 0);
      this.startTime = this.toHHMM(safe);
    }
  }

  // Template 事件處理
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

  /** 取得今天 yyyy-MM-dd（可選） */
  private toTodayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  leaveTypes: string[] = [
    '特休', '補休', '病假', '生理假', '公傷病假', '公假',
    '事假', '婚假', '喪假', '產假', '陪產假', '安胎假'
  ];

  leaveType: string = ''; // 預設為未選
}


