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
import Swal from 'sweetalert2';

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
  // 取消報名追加一個旗標避免連點
  isCancelling = false;
  memberid!: number;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.batchID = Number(this.route.snapshot.paramMap.get('batchId') ?? 0); // ★ 名稱大小寫要和路由一致

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
          this.memberid = me.memberId;

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
      eventSlug: t.eventSlug ?? '',
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
  /** 取消報名 */
  cancelRegistration() {
    if (this.isCancelling) return;

    // ① 取得 memberId（依你專案實際來源調整：AuthService / MemberService / localStorage）
    const memberId = this.memberid;

    // ② 取得 batchId（你的 HTML 有 ev.batchID，可從現有 this.event 拿）
    const batchId = (this as any).event?.batchID;

    if (!memberId || !batchId) {
      Swal.fire({
        icon: 'error',
        title: '缺少資訊',
        text: '找不到會員或批次，無法取消。',
      });
      return;
    }

    // SweetAlert 確認視窗
    Swal.fire({
      title: '確定要取消報名嗎？',
      text: '取消後需要重新報名才能參加活動',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '是的，取消報名',
      cancelButtonText: '我再想想',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isCancelling = true;

        this.eventSvc
          .cancelRegistration(memberId, batchId, '前台取消')
          .subscribe({
            next: (res) => {
              this.isRegistered = false;

              Swal.fire({
                icon: 'success',
                title: '已取消報名',
                text: '期待您下次參加 🙂',
                confirmButtonText: '確定',
                confirmButtonColor: '#6b4e3d',
              });
            },
            error: (err) => {
              console.error('取消失敗', err);
              Swal.fire({
                icon: 'error',
                title: '取消失敗',
                text: err?.error?.message ?? '取消失敗，請稍後再試',
              });
            },
            complete: () => (this.isCancelling = false),
          });
      }
    });
  }
  // 紀錄本頁路由，報名完成後導回此頁面
  goRegister(slug: string, batchID: number) {
    const returnTo = this.router.url; // e.g. /show/event/classic-old-songs-concert/1
    this.router.navigate(
      ['/show/event', slug, batchID, 'register'], // 依你的路由結構調整
      { state: { returnTo } }
    );
  }
}
