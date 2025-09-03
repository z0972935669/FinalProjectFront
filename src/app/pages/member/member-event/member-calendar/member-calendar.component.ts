import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FullCalendarModule,
  FullCalendarComponent,
} from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { firstValueFrom } from 'rxjs';

import { EventService } from '../../../../services/event/event.service';
import { MemberService } from '../../../../services/member/member.service';
import { MyRegistrationDto } from '../../../../interfaces/event/event-list'; // ★補上

@Component({
  standalone: true,
  selector: 'app-member-calendar',
  templateUrl: './member-calendar.component.html',
  styleUrls: ['./member-calendar.component.scss'],
  imports: [CommonModule, FullCalendarModule],
})
export class MemberCalendarComponent implements OnInit {
  private eventSvc = inject(EventService);
  private memberSvc = inject(MemberService);

  @ViewChild('fc') fc?: FullCalendarComponent;

  loading = false;
  errorMsg = '';
  monthLabel = '';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'zh-tw',
    height: 'auto',
    headerToolbar: false,
    events: [],
    datesSet: (arg) => this.updateMonthLabel(arg.view.calendar),
    // ★ 兩行顯示（時間 / 標題）
    eventContent: (arg) => {
      const start = arg.event.start as Date | null;
      if (!start) return { domNodes: [] };

      const hh = start.getHours();
      const mm = String(start.getMinutes()).padStart(2, '0');
      const ampm = hh < 12 ? '上午' : '下午';
      const hh12 = ((hh + 11) % 12) + 1;
      const timeText = `${ampm}${hh12}:${mm}`;

      const wrap = document.createElement('div');
      wrap.className = 'fc-my-event';

      const lineTime = document.createElement('div');
      lineTime.className = 'fc-my-event-time';
      lineTime.textContent = timeText;

      const lineTitle = document.createElement('div');
      lineTitle.className = 'fc-my-event-title';
      lineTitle.textContent = arg.event.title;

      wrap.appendChild(lineTime);
      wrap.appendChild(lineTitle);
      return { domNodes: [wrap] };
    },
    eventDisplay: 'block',
  };

  async ngOnInit() {
    this.loading = true;
    try {
      // 1) 取得登入會員
      const me = await firstValueFrom(this.memberSvc.getMemberInfo());
      const memberId = me?.memberId;
      if (!memberId) {
        this.errorMsg = '找不到會員資訊';
        return;
      }

      // 2) 取得該會員的「已報名清單」(一次就好)
      const rows = await firstValueFrom(
        this.eventSvc.getMyRegistrations(memberId)
      );

      // 3) 轉 EventInput[]：排除取消、同活動取最新一筆
      const events = this.toEvents(rows);

      // 4) 套進日曆
      this.calendarOptions = { ...this.calendarOptions, events };

      // 5) 初始化月份抬頭
      const api = this.fc?.getApi();
      if (api) this.updateMonthLabel(api);
    } catch (err) {
      console.error(err);
      this.errorMsg = '載入我的報名行事曆失敗';
    } finally {
      this.loading = false;
    }
  }

  // 將清單轉為 FullCalendar 事件：排除取消、同活動只保留最新註冊
  private toEvents(list: MyRegistrationDto[]): EventInput[] {
    if (!Array.isArray(list)) return [];

    const valid = list.filter((x) => x.currentStatus !== 0); // ★排除已取消

    // 以「活動名稱」當 key 去重（若你有 eventId，建議改用 eventId 更穩）
    const latestByEvent = new Map<string, MyRegistrationDto>();
    for (const r of valid) {
      const key = (r.eventName ?? '').trim();
      if (!key) continue;
      const prev = latestByEvent.get(key);
      const curAt = new Date(r.registrationDateTime).getTime();
      const prevAt = prev ? new Date(prev.registrationDateTime).getTime() : -1;
      if (!prev || curAt > prevAt) latestByEvent.set(key, r);
    }

    return Array.from(latestByEvent.values()).map((r) => ({
      title: r.eventName,
      start: r.eventDateTimeStart,
      end: r.eventDateTimeEnd ?? null,
      allDay: false,
      extendedProps: {
        eventLocation: r.eventLocation,
        registrationId: r.registrationId,
        eventBatchId: r.eventBatchId,
      },
    }));
  }

  // 供 HTML 按鈕 (prev/today/next) 呼叫
  nav(cmd: 'prev' | 'today' | 'next') {
    const api = this.fc?.getApi();
    if (!api) return;
    if (cmd === 'prev') api.prev();
    if (cmd === 'today') api.today();
    if (cmd === 'next') api.next();
    this.updateMonthLabel(api);
  }

  // 更新上方月份標題（例：2025 年 9 月）
  private updateMonthLabel(cal: any) {
    const d = cal.getDate();
    this.monthLabel = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
  }
}
