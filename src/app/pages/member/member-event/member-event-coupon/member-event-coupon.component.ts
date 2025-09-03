// member-event-coupon.component.ts
import {
  Component,
  OnInit,
  computed,
  signal,
  WritableSignal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { firstValueFrom } from 'rxjs';
import { EventService } from '../../../../services/event/event.service';
import { MemberService } from '../../../../services/member/member.service';

export interface EventCouponDto {
  ruleId: number;
  ruleName: string;
  amount: number;
  status: number; // 0 停用 / 1 啟用
  validFrom: string; // ISO
  validTo: string; // ISO
  isUsed: number; // 0 未使用 / 1 已使用（API 先回 0）
  statusText?: string;
  badgeClass?: string;
}

type TabKey = 'available' | 'upcoming' | 'expired' | 'used' | 'all';

@Component({
  standalone: true,
  selector: 'app-member-event-coupon',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './member-event-coupon.component.html',
})
export class MemberEventCouponComponent implements OnInit {
  // UI 狀態
  loading = signal<boolean>(false);
  error = signal<string>('');
  tab: WritableSignal<TabKey> = signal<TabKey>('available');
  q = ''; // 關鍵字（依名稱搜尋）

  // 資料
  rows = signal<EventCouponDto[]>([]);
  private memberSvc = inject(MemberService);

  constructor(private eventSvc: EventService) {}

  async ngOnInit() {
    await this.fetchCoupons();
  }

  private async fetchCoupons() {
    this.loading.set(true);
    this.error.set('');

    try {
      // 先抓登入者（沿用你「我的活動」的寫法）
      const me = await firstValueFrom(this.memberSvc.getMemberInfo());
      const memberId = Number(me.memberId);
      console.log('登入者id:', memberId);

      if (!Number.isFinite(memberId) || memberId <= 0) {
        this.error.set('會員資料異常，請重新登入');
        this.rows.set([]);
        return;
      }

      // 用 memberId 去拿該會員可見的折價券（含 isUsed 判斷）
      const data = await firstValueFrom(this.eventSvc.getEventCoupon(memberId));

      // 你的原本 enrich 流程保留（status / isUsed 轉文字與 badge）
      const enriched = (data ?? []).map((r) => {
        const statusNum = +r.status;
        const usedNum = +r.isUsed;
        const now = new Date().getTime();
        const start = new Date(r.validFrom).getTime();
        const end = new Date(r.validTo).getTime();

        let statusText = '狀態不明';
        if (statusNum === 0) statusText = '停用';
        else if (usedNum === 1) statusText = '已使用';
        else if (now < start) statusText = '未開始';
        else if (now > end) statusText = '已失效';
        else statusText = '可使用';

        let badgeClass = 'badge text-bg-light text-dark';
        switch (statusText) {
          case '可使用':
            badgeClass = 'badge bg-success text-white';
            break;
          case '未開始':
            badgeClass = 'badge bg-secondary text-white';
            break;
          case '已使用':
            badgeClass = 'badge bg-primary text-white';
            break;
          case '已失效':
            badgeClass = 'badge bg-danger text-white';
            break;
          case '停用':
            badgeClass = 'badge bg-dark text-white';
            break;
        }

        return {
          ...r,
          status: statusNum,
          isUsed: usedNum,
          statusText,
          badgeClass,
        };
      });

      this.rows.set(enriched);
    } catch (err: any) {
      console.error(err);
      this.error.set('載入折價券失敗');
    } finally {
      this.loading.set(false);
    }
  }

  // 狀態判斷（就地封裝）
  private now(): Date {
    return new Date();
  }
  private inRange(vFrom: string, vTo: string): boolean {
    const n = this.now().getTime();
    return n >= new Date(vFrom).getTime() && n <= new Date(vTo).getTime();
  }
  private isFuture(vFrom: string): boolean {
    return this.now().getTime() < new Date(vFrom).getTime();
  }
  private isPast(vTo: string): boolean {
    return this.now().getTime() > new Date(vTo).getTime();
  }

  // 顯示給使用者看的狀態文字
  statusLabel(r: any): string {
    console.log('coupon row =', r); // 👈 debug 看 r.status / r.isUsed 型別

    // 確保轉成數字再判斷
    const status = +r.status;
    const isUsed = +r.isUsed;

    if (status === 0) return '停用';
    if (isUsed === 1) return '已使用';

    const now = new Date();
    const start = new Date(r.validFrom);
    const end = new Date(r.validTo);

    if (now < start) return '未開始';
    if (now > end) return '已失效';
    if (status === 1 && now >= start && now <= end) return '可使用';

    return '狀態不明';
  }
  // 標籤樣式
  badgeClass(r: any): string {
    switch (this.statusLabel(r)) {
      case '可使用':
        return 'badge text-bg-success';
      case '未開始':
        return 'badge text-bg-secondary';
      case '已使用':
        return 'badge text-bg-primary';
      case '已失效':
        return 'badge text-bg-danger';
      case '停用':
        return 'badge text-bg-dark';
      default:
        return 'badge text-bg-light text-dark';
    }
  }

  // 篩選 + 分頁前整理（這裡先只做篩選）
  viewRows = computed(() => {
    const q = (this.q ?? '').trim();
    const tab = this.tab();

    let list = this.rows();

    if (q) {
      const qq = q.toLowerCase();
      list = list.filter(
        (x) =>
          x.ruleName?.toLowerCase().includes(qq) ||
          String(x.ruleId).includes(qq)
      );
    }

    switch (tab) {
      case 'available':
        list = list.filter(
          (r) =>
            r.status === 1 &&
            r.isUsed === 0 &&
            this.inRange(r.validFrom, r.validTo)
        );
        break;
      case 'upcoming':
        list = list.filter((r) => r.status === 1 && this.isFuture(r.validFrom));
        break;
      case 'expired':
        list = list.filter((r) => r.isUsed === 0 && this.isPast(r.validTo));
        break;
      case 'used':
        list = list.filter((r) => r.isUsed === 1);
        break;
      case 'all':
      default:
        break;
    }
    return list;
  });
}
