// event-calendar.component.ts
import {
  Component,
  ViewChild,
  AfterViewInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FullCalendarModule,
  FullCalendarComponent,
} from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhTw from '@fullcalendar/core/locales/zh-tw';

import { EventService } from '../../../services/event/event.service';
import {
  EventTemplateDto,
  EventBatchDto,
} from '../../../interfaces/event/event-list';
//月曆使用
type TemplateCompat = EventTemplateDto & { eventBatches?: EventBatchDto[] };

// 支援 batchId / BatchID 與可選 end
type BatchCompat = EventBatchDto & {
  batchId?: number | string; //api的
};

@Component({
  standalone: true,
  selector: 'app-event-calendar',
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './event-calendar.component.html',
  styleUrls: ['./event-calendar.component.scss'],
  // 讓 .fc 樣式生效 讓angular預設的樣式可以被蓋過去
  encapsulation: ViewEncapsulation.None,
})
export class EventCalendarComponent implements AfterViewInit {
  @ViewChild('fc') fc!: FullCalendarComponent; //和畫面細節|!: 表示「一定不會是 null」。
  heroImgSrc = '';
  fallbackHero = '/assets/img/event/月份/9月.png'; //如果主要橫幅圖失敗，就顯示這張後備圖片。
  //  calendarTitle = '';//用來存放日曆標題（例如「2025 年 9 月」），可在頁面上顯示。

  constructor(private eventSvc: EventService, private router: Router) {
    //呼叫 API
    this.loadEvents();
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false as any,
    locales: [zhTw],
    locale: 'zh-tw',
    datesSet: (arg) => this.onDatesSet(arg),
    events: [],
    // 點選月曆→ 直接導到 /show/event/:batchId
    eventClick: (info) => {
      const batchId = info.event.extendedProps['batchId'] ?? info.event.id;
      if (batchId) this.router.navigate(['/show/event', String(batchId)]);
    },
  };

  ngAfterViewInit() {
    //月曆載入
    const api = this.fc.getApi();
    this.updateHeroByCalendar(api); //根據月份換圖片
  }

  nav(dir: 'prev' | 'next' | 'today') {
    //FullCalendar 的 API 裡固定用法
    //切換月份
    const api = this.fc.getApi();
    api[dir]();
  }

  private loadEvents() {
    this.eventSvc.getEventTemplates().subscribe({
      // next: (data) => { ... },      // ✅ 成功時
      // error: (err) => { ... },      // ❌ 失敗時
      // complete: () => { ... }       // ✔️ 結束時

      next: (list: EventTemplateDto[]) => {
        const events: EventInput[] = (list as TemplateCompat[]).flatMap((t) => {
          // 先把批次陣列拿出來
          const batches: BatchCompat[] =
            (t.eventBatches as BatchCompat[] | undefined) ?? [];

          return batches.map((b) => {
            const batchID = b.batchId ?? null;

            const ev: EventInput = {
              title: t.eventName ?? '(未命名活動)',
              start: b.eventDateTimeStart, // 建議用 ISO 字串
              allDay: true,
              extendedProps: { batchID },
            };
            if (batchID != null) {
              ev.id = String(batchID);
            }
            return ev;
          });
        });

        this.calendarOptions = { ...this.calendarOptions, events }; //將撈出的資料攤開後回傳
      },
      error: (err) => console.error('[Calendar] 讀取錯誤', err),
    });
  }

  //只要日曆顯示的「日期範圍」變動（例如切換到下個月 / 回今天），就會觸發。
  //參數 arg: DatesSetArg 會包含目前視圖 (view)、日曆物件 (calendar)、日期範圍等資訊。
  private onDatesSet(arg: DatesSetArg) {
    this.updateHeroByCalendar(arg.view.calendar);
  }

  private updateHeroByCalendar(cal: any) {
    const d = cal.getDate(); //焦點日期 判斷你目前在的頁面在哪裡
    const m = d.getMonth() + 1; // 1..12
    this.heroImgSrc = this.monthImage(m);
  }

  private monthImage(m: number): string {
    return `/assets/img/event/月份/${m}月.png`;
  }
  //當天日期是套件自己抓取的 程式碼中無顯示
}
