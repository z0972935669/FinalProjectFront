import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type MyRegistration = {
  registrationId: number;
  registrationNum: string; // REG20250806001
  eventId: number;
  eventName: string;
  startAt: string; // ISO or 'YYYY-MM-DDTHH:mm:ss'
  endAt: string; // 同上（可由後端算好）
  currentStatus: 'SUCCESS' | 'CANCELLED' | 'ENDED'; // 來自資料表
};

@Component({
  standalone: true,
  selector: 'app-member-event',
  imports: [RouterModule, CommonModule],
  templateUrl: './member-event.component.html',
  styleUrl: './member-event.component.scss',
})
export class MemberEventComponent {
  // 假資料：實務上請改呼叫 API
  private now = new Date();
  rows = signal<MyRegistration[]>([
    {
      registrationId: 1,
      registrationNum: 'REG20250806001',
      eventId: 3,
      eventName: '太極體驗課',
      startAt: '2025-08-15T10:00:00',
      endAt: '2025-08-15T11:00:00',
      currentStatus: 'SUCCESS',
    },
    {
      registrationId: 2,
      registrationNum: 'REG20240601001',
      eventId: 8,
      eventName: '經典老歌音樂會',
      startAt: '2025-06-01T10:00:00',
      endAt: '2025-06-01T12:00:00',
      currentStatus: 'SUCCESS',
    },
    {
      registrationId: 3,
      registrationNum: 'REG20240601002',
      eventId: 9,
      eventName: '懷舊電影夜',
      startAt: '2025-08-20T20:00:00',
      endAt: '2025-08-20T22:00:00',
      currentStatus: 'SUCCESS',
    },
  ]);

  // UI 狀態
  tab = signal<'upcoming' | 'completed' | 'all'>('upcoming');
  keyword = signal<string>('');

  // 分類計算
  private isUpcoming = (r: MyRegistration) =>
    new Date(r.startAt) > this.now && r.currentStatus === 'SUCCESS';
  private isCompleted = (r: MyRegistration) =>
    new Date(r.endAt) < this.now && r.currentStatus === 'SUCCESS';

  // 過濾 + 排序（時間近的在上）
  viewRows = computed(() => {
    const k = this.keyword().trim().toLowerCase();
    const base = this.rows().filter(
      (r) =>
        !k ||
        r.registrationNum.toLowerCase().includes(k) ||
        r.eventName.toLowerCase().includes(k)
    );

    const picked =
      this.tab() === 'upcoming'
        ? base.filter(this.isUpcoming)
        : this.tab() === 'completed'
        ? base.filter(this.isCompleted)
        : base;

    return picked.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  });

  // UI 小工具
  badgeClass(r: MyRegistration) {
    if (r.currentStatus === 'CANCELLED') return 'badge bg-secondary';
    if (this.isUpcoming(r)) return 'badge bg-success';
    if (this.isCompleted(r)) return 'badge bg-info text-dark';
    return 'badge bg-warning text-dark'; // 進行中或其它
  }

  // （實務）掛 API 的骨架
  // ngOnInit() {
  //   this.service.getMyRegistrations().subscribe(data => this.rows.set(data));
  // }

  statusLabel(r: MyRegistration): string {
    if (r.currentStatus === 'CANCELLED') return '已取消';
    const start = new Date(r.startAt);
    const end = new Date(r.endAt);
    const now = this.now;

    if (end < now) return '已結束';
    if (start > now) return '未開始';
    return '進行中';
  }
}
