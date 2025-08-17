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
import { EventTemplateDto } from '../../../interfaces/event/event-list';

@Component({
  standalone: true,
  selector: 'app-event-calendar',
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './event-calendar.component.html',
  styleUrls: ['./event-calendar.component.scss'],
  encapsulation: ViewEncapsulation.None, // ★ 讓 .fc 樣式生效
})
export class EventCalendarComponent implements AfterViewInit {
  @ViewChild('fc') fc!: FullCalendarComponent;
  heroImgSrc = ''; // 目前橫幅圖
  fallbackHero = '/assets/img/event/月份/8月.png'; // 沒圖時的備用

  calendarTitle = '';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false as any, // ★ 隱藏預設工具列，改用我們的橫幅按鈕
    locales: [zhTw],
    locale: 'zh-tw',
    datesSet: (arg) => this.onDatesSet(arg),
    events: [],
    eventClick: (info) => {
      const id = info.event.extendedProps['eventId'];
      if (id) this.router.navigate(['/show/event', id]);
    },
  };

  constructor(private eventSvc: EventService, private router: Router) {
    this.loadEvents();
  }

  ngAfterViewInit() {
    this.updateTitle();
    const api = this.fc.getApi();
    this.updateHeroByCalendar(api);
  }

  private updateTitle() {
    const api = this.fc?.getApi();
    if (api) this.calendarTitle = api.view.title;
  }

  nav(dir: 'prev' | 'next' | 'today') {
    const api = this.fc.getApi();
    api[dir]();
    this.updateTitle();
  }

  private loadEvents() {
    this.eventSvc.getEventTemplates().subscribe({
      next: (data: EventTemplateDto[]) => {
        const events: EventInput[] = data.flatMap((t) =>
          (t.batches ?? t.eventBatches ?? []).map((b) => ({
            id: `${t.eventID}-${b.batchID}`,
            title: t.eventName,
            start: b.eventDateTimeStart,
            end: b.eventDateTimeEnd ?? undefined,
            allDay: true,
            extendedProps: { eventId: t.eventID },
          }))
        );
        this.calendarOptions = { ...this.calendarOptions, events };
      },
      error: (err) => console.error('[Calendar] load error', err),
    });
  }
  private onDatesSet(arg: DatesSetArg) {
    // 使用 FullCalendar 的 API 取得「目前視圖的焦點日期」
    this.updateHeroByCalendar(arg.view.calendar);
  }

  private updateHeroByCalendar(cal: any) {
    const d = cal.getDate(); // 例如 2025-09-01T...
    const m = d.getMonth() + 1; // 1..12
    this.heroImgSrc = this.monthImage(m);
  }

  private monthImage(m: number): string {
    // 路徑對應你的 assets 目錄：/assets/img/event/月份/8月.png
    return `/assets/img/event/月份/${m}月.png`;
  }
}
