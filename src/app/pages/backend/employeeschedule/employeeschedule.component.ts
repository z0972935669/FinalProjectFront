import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

type CalCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items?: { text: string; color: 'primary' | 'success' | 'warning' }[];
};

@Component({
  selector: 'app-employeeschedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employeeschedule.component.html',
  styleUrls: ['./employeeschedule.component.scss'],
  providers: [DatePipe] // 只在此元件使用 DatePipe即可
})
export class EmployeescheduleComponent {
  // 目前指向的年月（0-11）
  private cursor = new Date(); // 預設本月
  weeks: CalCell[][] = [];     // 6 週 * 7 天
  monthLabel = '';

  constructor(private datePipe: DatePipe) {
    this.rebuild();
  }

  // === 導覽 ===
  prevMonth() {
    this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth() - 1, 1);
    this.rebuild();
  }
  nextMonth() {
    this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth() + 1, 1);
    this.rebuild();
  }
  today() {
    this.cursor = new Date();
    this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth(), 1);
    this.rebuild();
  }

  // === 建構當月 6x7 月曆矩陣 ===
  private rebuild() {
    const year = this.cursor.getFullYear();
    const month = this.cursor.getMonth(); // 0..11
    this.monthLabel = `${year} 年 ${month + 1} 月`;

    // 本月第一天、最後一天
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    // 以週一為一週開頭（你要週日改成 0）
    const weekStartsOn = 1;
    const start = this.startOfCalendar(first, weekStartsOn);
    const end = this.endOfCalendar(last, weekStartsOn);

    const days: CalCell[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cellDate = new Date(d);
      days.push({
        date: cellDate,
        inMonth: cellDate.getMonth() === month,
        isToday: this.isSameDate(cellDate, new Date()),
        items: this.mockItems(cellDate) // 先用假資料；之後你再換成 API
      });
    }

    // 切成 6 週
    this.weeks = [];
    for (let i = 0; i < 6; i++) {
      this.weeks.push(days.slice(i * 7, i * 7 + 7));
    }
  }

  private startOfCalendar(firstOfMonth: Date, weekStartsOn: number) {
    const d = new Date(firstOfMonth);
    const day = d.getDay();
    const diff = (day - weekStartsOn + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }
  private endOfCalendar(lastOfMonth: Date, weekStartsOn: number) {
    const d = new Date(lastOfMonth);
    const day = d.getDay();
    const diff = (weekStartsOn + 6 - day + 7) % 7; // 補到該週最後一天
    d.setDate(d.getDate() + diff);
    return d;
  }
  private isSameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  // === 假資料：依日期做幾筆示意（之後換成 API 資料） ===
  private mockItems(d: Date): CalCell['items'] {
    const day = d.getDate();
    if (!this.isSameMonth(d, this.cursor)) return [];
    if (day === 1) return [{ text: '王小明｜早班 08:30–17:30', color: 'primary' }];
    if (day === 3) return [{ text: '李小華｜中班 12:00–21:00', color: 'warning' }];
    if (day === 15) return [{ text: '張大同｜晚班 16:00–01:00', color: 'success' }];
    return [];
  }
  private isSameMonth(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }
}
