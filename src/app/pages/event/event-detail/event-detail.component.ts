import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventListComponent } from '../event-list/event-list.component';
import { CommonModule } from '@angular/common';
import { EventService } from '../../../services/event/event.service';
import {
  EventBatchDto,
  EventTemplateDto,
  EventDetailVM,
} from '../../../interfaces/event/event-list';
import { catchError, of, switchMap, forkJoin } from 'rxjs';
import {
  MemberInfo,
  MemberService,
} from '../../../services/member/member.service';

@Component({
  selector: 'app-event-detail',
  imports: [RouterModule, CommonModule, EventListComponent],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent {
  private route = inject(ActivatedRoute);
  private eventSvc = inject(EventService);
  private router = inject(Router);
  private memberSvc = inject(MemberService);
  private me?: MemberInfo;

  //會用到的參數
  loading = true;
  error = '';
  event?: EventDetailVM;
  public batchID!: number;
  isRegistered = false;

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('slug') ?? '';
    this.batchID = Number(raw.match(/^\d+/)?.[0]); // 取開頭數字

    if (!Number.isFinite(this.batchID)) {
      this.error = '缺少活動編號';
      this.loading = false;
      return;
    }

    // 1) 取登入者 → 2) 同步取活動 & 是否已報名
    this.memberSvc
      .getMemberInfo()
      .pipe(
        switchMap((me: MemberInfo) => {
          this.me = me;

          return forkJoin({
            dto: this.eventSvc.getEventByBatch(this.batchID),
            has: this.eventSvc.getHasRegistered(
              Number(me.memberId),
              this.batchID
            ),
          });
        }),
        catchError((err) => {
          // 取不到登入者就導去登入頁
          console.error('❌ 無法取得登入者資料', err);
          this.router.navigate(['/show/login']);
          return of({ dto: null, has: false });
        })
      )
      .subscribe({
        next: (res) => {
          if (!res.dto) {
            this.error = '讀取活動失敗';
            this.loading = false;
            return;
          }
          this.event = this.mapToVM(res.dto);
          this.isRegistered = !!res.has; //暫時把判斷使否以報名過的卡控拿掉
          this.loading = false;
        },
        error: (err) => {
          console.error('getEventByBatch / getHasRegistered error:', err);
          this.error = '讀取活動失敗';
          this.loading = false;
        },
      });
  }
  // ====== 將後端 DTO → 你的畫面 VM ======
  private mapToVM(t: EventTemplateDto): EventDetailVM {
    const now = Date.now();
    const batches = (t.batches ?? t.eventBatches ?? []) as EventBatchDto[];
    const sorted = batches
      .slice()
      .sort(
        (a, b) =>
          new Date(a.eventDateTimeStart).getTime() -
          new Date(b.eventDateTimeStart).getTime()
      );
    const upcoming =
      sorted.find((b) => new Date(b.eventDateTimeStart).getTime() >= now) ??
      sorted[0];

    const start = upcoming?.eventDateTimeStart
      ? new Date(upcoming.eventDateTimeStart)
      : null;
    const end = upcoming?.eventDateTimeEnd
      ? new Date(upcoming.eventDateTimeEnd)
      : null;

    console.log('所有資料', t);
    return {
      id: String(t.eventID),
      title: t.eventName,
      subtitle: t.subtitle ?? '',
      priceText: (t.amount ?? 0) > 0 ? `$${t.amount}` : '免費',
      date: start ? this.fmtDate(start) : '',
      organizer: t.organizer ?? '',
      location: t.eventLocation ?? '',
      contactPersonId: t.contactPersonId ?? '',
      contactPersonName:
        Number(t.contactPersonId ?? NaN) === 20
          ? '黃曉莉'
          : t.contactPersonName ?? '',
      contactPhone: t.contactPhone ?? '',
      duration: this.buildDuration(t.durationMinutes, start, end),
      attendees: upcoming?.quota ?? t.quota ?? 0,
      imageUrl: t.coverImageUrl ?? 'assets/img/event/placeholder.jpg',
      states: this.mapStatus(t.status ?? 0),
      description: t.description ?? '',
      batchID: String(this.batchID),
    };
  }

  private buildDuration(
    durationMinutes?: number | null,
    start?: Date | null,
    end?: Date | null
  ): string {
    if (durationMinutes != null)
      return this.fmtMinutes(Number(durationMinutes));
    if (start && end) {
      const mins = Math.max(0, Math.round((+end - +start) / 60000));
      return this.fmtMinutes(mins);
    }
    return '';
  }

  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${hh}:${mm}`;
  }

  private fmtMinutes(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h} 小時 ${m} 分`;
    if (h) return `${h} 小時`;
    return `${m} 分鐘`;
  }

  private mapStatus(s: number): string {
    switch (s) {
      case 1:
        return '招生中';
      case 2:
        return '下架';
      case 3:
        return '關閉';
      default:
        return '草稿';
    }
  }
  cancelRegistration() {
    if (!this.me || !this.event) return;

    if (!confirm('確定要取消報名嗎？')) return;

    //0821取消報名回傳api還沒寫
  }
}
