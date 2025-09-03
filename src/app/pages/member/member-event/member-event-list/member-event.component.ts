import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../services/event/event.service';
import { MyRegistrationDto } from '../../../../interfaces/event/event-list';
import {
  MemberInfo,
  MemberService,
} from '../../../../services/member/member.service';
import { catchError, finalize, firstValueFrom, of, switchMap, tap } from 'rxjs';

type TabKey = 'upcoming' | 'completed' | 'all';

interface ViewRow {
  registrationId: number;
  registrationNum: string;
  eventName: string;
  startAt: Date;
  eventLocation: string;
  amountDue: number;
  currentStatus: number;
  eventBatchId: number;
  regAt: Date;
}

@Component({
  selector: 'app-member-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './member-event.component.html',
})
export class MemberEventComponent implements OnInit {
  private eventSvc = inject(EventService);
  private memberSvc = inject(MemberService);
  private router = inject(Router);

  // UI 狀態
  loading = signal(true);
  error = signal<string | null>(null);
  tab = signal<TabKey>('upcoming');
  q: string = '';
  private me?: MemberInfo;

  // 原始列
  rows = signal<ViewRow[]>([]);

  // 顯示列（分頁 + 搜尋）
  viewRows() {
    const now = new Date();
    const key = this.tab();
    const kw = this.q.trim().toLowerCase();
    const src = this.dedupLatestByBatch(this.rows()); // 去除重複的

    return src
      .filter((r) => r.currentStatus !== 0) // 以取消的活動不顯示
      .filter((r) => {
        if (key === 'upcoming') return r.startAt >= now;
        if (key === 'completed') return r.startAt < now;
        return true;
      })
      .filter(
        (r) =>
          !kw ||
          r.registrationNum.toLowerCase().includes(kw) ||
          r.eventName.toLowerCase().includes(kw)
      )
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  ngOnInit(): void {
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    this.memberSvc
      .getMemberInfo()
      .pipe(
        tap((me) => {
          this.me = me;
        }),
        switchMap((me) => {
          const memberId = Number(me.memberId);
          console.log('✅ 登入者資料', me.memberId);
          if (!Number.isFinite(memberId) || memberId <= 0) {
            this.error.set('會員資料異常，請重新登入');
            return of([] as MyRegistrationDto[]);
          }
          return this.eventSvc.getMyRegistrations(memberId);
        }),
        tap((list: MyRegistrationDto[]) => {
          const mapped: ViewRow[] = list.map((x) => ({
            registrationId: x.registrationId,
            registrationNum: x.registrationNum,
            eventName: x.eventName,
            startAt: new Date(x.eventDateTimeStart),
            eventLocation: x.eventLocation,
            amountDue: x.amountDue,
            currentStatus: x.currentStatus,
            eventBatchId: x.eventBatchId,
            regAt: new Date(x.registrationDateTime),
          }));
          this.rows.set(mapped);
        }),

        catchError((err) => {
          if (err.status === 404) {
            //無報名資料
            this.rows.set([]);
            this.error.set(null);
            return of([] as MyRegistrationDto[]);
          }
          console.error(err);
          this.error.set('資料讀取失敗，請稍後再試');
          return of([] as MyRegistrationDto[]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }

  statusLabel(r: ViewRow): string {
    // 我主觀建議：依時間過去與否切「已報名 / 已參加」，取消則獨立顯示
    if (r.currentStatus === 0) return '已取消';
    return r.startAt >= new Date() ? '已報名' : '已參加';
  }

  badgeClass(r: ViewRow): string {
    const common = 'badge rounded-pill badge-pill text-white';
    if (r.currentStatus === 0) return `${common} bg-secondary badge-secondary`;
    const isUpcoming = r.startAt >= new Date();
    return isUpcoming
      ? `${common} bg-primary badge-primary`
      : `${common} bg-success badge-success`;
  }

  private dedupLatestByBatch(rows: ViewRow[]): ViewRow[] {
    const latest = new Map<number, ViewRow>();
    for (const r of rows) {
      const prev = latest.get(r.eventBatchId);
      if (!prev || r.regAt > prev.regAt) latest.set(r.eventBatchId, r);
    }
    return Array.from(latest.values());
  }
  async viewDetail(r: any) {
    const batchID = Number(r?.eventBatchId ?? 0);
    if (!Number.isFinite(batchID) || batchID <= 0) {
      console.warn('⚠️ eventBatchId 無效', r);
      return;
    }

    try {
      // 你已經有 by-batch API：/api/EventTemplate/by-batch/{batchId}
      const dto = await firstValueFrom(this.eventSvc.getEventByBatch(batchID));
      const slug =
        dto?.eventSlug ??
        dto?.canonicalPath?.split('/')?.[0] ?? // 若有 canonicalPath 可備援
        '';

      if (!slug) {
        console.warn('⚠️ 取得 slug 失敗', { batchID, dto });
        return;
      }

      this.router.navigate(['/show/event', slug, batchID]);
    } catch (err) {
      console.error('讀取活動 slug 失敗', err);
    }
  }
}
