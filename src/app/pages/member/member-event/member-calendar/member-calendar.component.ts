import {
  AfterViewInit,
  Component,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  FullCalendarModule,
  FullCalendarComponent,
} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhTw from '@fullcalendar/core/locales/zh-tw';
import { CalendarOptions, DatesSetArg, EventInput } from '@fullcalendar/core';

import { EventService } from '../../../../services/event/event.service';
import {
  EventBatchDto,
  EventTemplateDto,
} from '../../../../interfaces/event/event-list';

// 讓 API 結構更寬鬆一點的相容型別
type TemplateCompat = EventTemplateDto & { eventBatches?: EventBatchDto[] };
type BatchCompat = EventBatchDto & { batchId?: number | string };

@Component({
  standalone: true,
  selector: 'app-member-calendar',
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './member-calendar.component.html',
  styleUrls: ['./member-calendar.component.scss'],
  encapsulation: ViewEncapsulation.None, // 讓 .fc 樣式生效
})
export class MemberCalendarComponent implements AfterViewInit {
  @ViewChild('fc') fc!: FullCalendarComponent;

  monthLabel = '';

  constructor(private eventSvc: EventService, private router: Router) {
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
    eventClick: (info) => {
      const batchId = info.event.extendedProps['batchId'] ?? info.event.id;
      if (batchId) this.router.navigate(['/show/event', String(batchId)]);
    },
  };

  ngAfterViewInit(): void {
    const api = this.fc.getApi();
    this.updateHeroByCalendar(api);
  }

  nav(dir: 'prev' | 'next' | 'today') {
    const api = this.fc.getApi();
    api[dir]();
  }

  private loadEvents() {
    this.eventSvc.getEventTemplates().subscribe({
      next: (list: EventTemplateDto[]) => {
        const events: EventInput[] = (list as TemplateCompat[]).flatMap((t) => {
          const batches: BatchCompat[] = t.eventBatches ?? [];
          return batches.map((b) => {
            const batchId = b.batchId ?? (b as any).batchID ?? null;
            const ev: EventInput = {
              id: batchId != null ? String(batchId) : undefined,
              title: t.eventName ?? '(未命名活動)',
              start: b.eventDateTimeStart, // ISO 字串
              allDay: true,
              extendedProps: { batchId }, // ← 統一用 batchId
            };
            return ev;
          });
        });

        // 重新指派（讓變更偵測觸發）
        this.calendarOptions = { ...this.calendarOptions, events };
      },
      error: (err) => console.error('[Calendar] 讀取錯誤', err),
    });
  }

  private onDatesSet(arg: DatesSetArg) {
    this.updateHeroByCalendar(arg.view.calendar);
  }

  private updateHeroByCalendar(cal: any) {
    const d = cal.getDate();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    this.monthLabel = `${y} 年 ${m} 月`;
  }
}
