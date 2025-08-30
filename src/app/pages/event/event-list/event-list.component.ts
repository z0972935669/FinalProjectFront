import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, Injectable } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { EventService } from './../../../services/event/event.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  EventTemplateDto,
  EventList,
  EventBatchDto,
} from '../../../interfaces/event/event-list';

/* ========== Service ========== */
@Injectable({ providedIn: 'root' })
export class EventTemplateService {
  private http = inject(HttpClient);
  private readonly base = '/api/EventTemplate';

  list(): Observable<EventTemplateDto[]> {
    return this.http.get<EventTemplateDto[]>(`${this.base}/list`);
  }
}

/* ========== Component（把 @Component 貼在正確的 class 上） ========== */
@Component({
  standalone: true,
  selector: 'app-event-list',
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
})
export class EventListComponent implements OnInit {
  private router = inject(Router);
  private api = inject(EventTemplateService);
  private eventService = inject(EventService);

  events: EventList[] = [];
  private allEvents: EventList[] = [];
  loading = true;
  error = '';
  selectedCategory = '所有活動';
  // 新增：搜尋輸入框
  searchCtrl = new FormControl<string>('', { nonNullable: true });
  // === 分頁設定 ===
  pageSize = 12;
  currentPage = 1;

  ngOnInit() {
    this.eventService.getEventTemplates().subscribe({
      next: (data) => {
        console.log('[EventTemplate/list] raw =>', data); // ← 看實際回傳長相

        this.events = this.mapToEventItems(data);
        this.allEvents = this.events;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = '讀取活動清單失敗';
        this.loading = false;
      },
    });
    this.searchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged()) // 停止輸入 200ms 才觸發（避免每敲一鍵就跑一次）
      .subscribe((q) => this.applyFilter(q)); // 與上一次相同的字串不重複執行
  }

  private applyFilter(q: string) {
    //搜尋功能
    const kw = (q || '').trim().toLowerCase(); // 去前後空白、轉小寫（不分大小寫）
    this.events = !kw
      ? this.allEvents
      : this.allEvents.filter((x) => x.title.toLowerCase().includes(kw)); // 標題含關鍵字就留下
    this.currentPage = 1;
  }

  goDetail(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).src = 'assets/img/event/placeholder.jpg';
  }

  /* ===== 映射邏輯 ===== */
  private mapToEventItems(list: EventTemplateDto[]): EventList[] {
    const now = Date.now();

    return list.map((t: any) => {
      const groups = (t.batches ?? t.eventBatches ?? []) as EventBatchDto[];
      const batches = groups
        .slice()
        .sort(
          (a, b) =>
            new Date(a.eventDateTimeStart).getTime() -
            new Date(b.eventDateTimeStart).getTime()
        );
      const upcoming =
        batches.find((b) => new Date(b.eventDateTimeStart).getTime() >= now) ??
        batches[0];

      const start = upcoming?.eventDateTimeStart
        ? new Date(upcoming.eventDateTimeStart)
        : null;
      const end = upcoming?.eventDateTimeEnd
        ? new Date(upcoming.eventDateTimeEnd)
        : null;

      // ✅ 從最近梯次抓 batchId（大小寫容錯）
      const batchIdValue =
        (upcoming as any)?.batchId ?? //和後端api對應
        null;

      const durationText =
        t.durationMinutes != null
          ? this.fmtMinutes(Number(t.durationMinutes))
          : start && end
          ? this.fmtMinutes(Math.max(0, Math.round((+end - +start) / 60000)))
          : '';

      const item: EventList = {
        id: String(t.eventID ?? t.eventId ?? t.id ?? ''),
        batchID: batchIdValue != null ? String(batchIdValue) : '', // ✅ 這裡塞好
        imageUrl: t.coverImageUrl ?? 'assets/img/event/placeholder.jpg',
        title: t.eventName ?? t.title ?? '',
        subtitle: t.subtitle ?? '',
        priceText: (t.amount ?? 0) > 0 ? `$${t.amount}` : '免費',
        eventDateTimeStart: start ? this.fmtDate(start) : '',
        organizer: t.organizer ?? '',
        location: t.eventLocation ?? t.location ?? '',
        duration: durationText,
        attendees: upcoming?.quota ?? t.quota ?? 0,
        states: this.mapStatus(t.status ?? 0),
        categoryID: Number(t.categoryID ?? t.categoryId ?? 0),
      };
      return item;
    });
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
  //按鈕塞選類別
  // 名稱 ↔ ID 對照
  private readonly CATEGORY_TO_ID: Record<string, number> = {
    運動類: 1,
    手作類: 2,
    講座類: 3,
    出去玩: 4,
  };

  public setCategory(cat: string) {
    this.selectedCategory = cat;

    if (cat === '所有活動') {
      this.events = this.allEvents;
      return;
    }
    const cid = this.CATEGORY_TO_ID[cat];
    this.events = this.allEvents.filter((x) => Number(x.categoryID) === cid);
    this.currentPage = 1;
  }

  // === 分頁設定 ===

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.events.length / this.pageSize));
  }
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get pageItems(): EventList[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.events.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    // 可選：切頁捲回頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  prevPage() {
    this.goToPage(this.currentPage - 1);
  }
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  // trackBy（效能用，可選）
  trackById(_: number, e: EventList) {
    return e.id;
  }

  toSlug(title: string) {
    return title
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-') // 空白/底線 → -
      .replace(/[^a-z0-9\-]+/g, '') // 去掉非英數與 -
      .replace(/\-+/g, '-'); // 合併重複 -
  }

  buildSlug(id: string | number, title: string) {
    return `${id}-${this.toSlug(title)}`;
  }
}
