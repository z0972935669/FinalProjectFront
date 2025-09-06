// pages/backend/employeeapprovallist/employeeapprovallist.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';

import {
  EmployeeApprovalService,
  ApprovalInboxItemDto,
  MyRequestItemDto
} from '../../../services/employee/employee-approval.service';

@Component({
  selector: 'app-employeeapprovallist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employeeapprovallist.component.html',
  styleUrl: './employeeapprovallist.component.scss'
})
export class EmployeeapprovallistComponent implements OnInit {
  loading = signal(false);
  err = signal<string>('');
  rows = signal<ApprovalInboxItemDto[]>([]);
  /** true = 我送出的申請；false = 我參與過的（含待簽/已簽/退回/終止） */
  showMine = signal(false);

  constructor(private approvalSvc: EmployeeApprovalService) { }

  ngOnInit(): void {
    this.fetch();
  }

  /** Checkbox 變更 */
  onHandledChange(ev: Event): void {
    const el = ev.target as HTMLInputElement | null;
    this.showMine.set(Boolean(el?.checked));
    this.fetch();
  }

  /** 取得清單 */
  fetch(): void {
    this.loading.set(true);
    this.err.set('');

    const req$: Observable<ApprovalInboxItemDto[]> = this.showMine()
      // 我送出的申請 → /my
      ? this.approvalSvc.myRequests().pipe(
        map((list: MyRequestItemDto[]) =>
          list.map<ApprovalInboxItemDto>((x) => ({
            approvalId: 0, // 申請人不是簽核者，此頁不需
            formType: x.formType,
            formId: x.formId,
            receivedAt: x.appliedAt ?? '',
            status: this.normalizeForApplicant(x.status),
            // 後端已帶回就取回；否則顯示破折號
            departmentName: (x as any).departmentName ?? '—',
            jobTitleName: (x as any).jobTitleName ?? '—',
            applicantName: '我',
            // 類型中文可改在 zhFormType 內統一轉；這裡保留原欄位不動
            formTypeName: x.formType
          }))
        )
      )
      // 我參與過的全部（含待簽/已簽/退回/終止） → /mine
      : this.approvalSvc.mine().pipe(
        map((list: ApprovalInboxItemDto[]) =>
          list.map((r) => ({
            ...r,
            status: this.normalizeForApprover(r.status)
          }))
        )
      );

    req$.subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.err.set(this.pickErr(e));
        this.loading.set(false);
      }
    });
  }

  // ─────────────────────────────────────────
  // 顯示用：中文狀態、徽章樣式、表單類型、類型樣式
  // ─────────────────────────────────────────

  /** 狀態中文（通用） */
  zhStatus(s?: string): string {
    switch ((s || '').trim()) {
      case 'Waiting':
      case 'Pending': return '審核中';
      case 'Approved': return '已簽核';
      case 'Rejected': return '已退回';
      case 'Terminated': return '已終止';
      case 'Cancelled': return '已抽單';
      case 'Completed': return '已完成';
      default: return '—';
    }
  }

  /** 列表上的狀態徽章（樣式） */
  badgeClass(status?: string): string[] {
    switch ((status || '').trim()) {
      case 'Waiting':
      case 'Pending': return ['bg-warning', 'text-dark']; // 審核中
      case 'Approved': return ['bg-primary'];              // 已簽核（簽核者視角）
      case 'Rejected': return ['bg-danger'];               // 已退回
      case 'Terminated': return ['bg-secondary'];            // 已終止
      case 'Cancelled': return ['bg-secondary'];            // 已抽單
      case 'Completed': return ['bg-success'];              // 已完成（申請人視角）
      default: return ['bg-light', 'text-dark'];
    }
  }

  /**
   * 列表上的狀態文字（依 showMine 調整文案）
   * - /mine（簽核者視角）：Waiting→「待簽核」、Approved→「已簽核」
   * - /my  （申請人視角）：Waiting→「審核中」、 Approved/Completed→「已完成」
   */
  badgeText(r: ApprovalInboxItemDto): string {
    const s = (r.status || '').trim();
    if (this.showMine()) {
      if (s === 'Waiting') return '審核中';   // 你之前要顯示「審核中」也可改成「待簽核」
      if (s === 'Approved') return '已簽核';
      if (s === 'Rejected') return '已退回';
      if (s === 'Terminated') return '已終止';
      if (s === 'Cancelled') return '已抽單';
      if (s === 'Completed') return '已完成';
      return '—';
    } else {
      if (s === 'Waiting') return '待簽核';
      if (s === 'Approved') return '已簽核';
      if (s === 'Rejected') return '已退回';
      if (s === 'Terminated') return '已終止';
      if (s === 'Cancelled') return '已抽單';
      if (s === 'Completed') return '已完成';
      return '—';
    }
  }

  /** 表單類型中文顯示 */
  zhFormType(ft?: string | null): string {
    switch ((ft || '').trim()) {
      case 'Leave': return '請假單';
      case 'MissingPunch': return '忘卡單';
      default: return ft || '—';
    }
  }

  /** 表單類型徽章樣式（顏色） */
  formTypeClass(ft?: string | null): string[] {
    switch ((ft || '').trim()) {
      case 'Leave': return ['bg-success'];              // 綠色
      case 'MissingPunch': return ['bg-warning', 'text-dark']; // 黃底黑字
      default: return ['bg-secondary'];            // 其他→灰
    }
  }

  // ─────────────────────────────────────────
  // 正規化：/my（申請人）與 /mine（簽核者）
  // ─────────────────────────────────────────

  /** 申請人視角（/my）→ 共用枚舉 */
  private normalizeForApplicant(
    s?: string | null
  ): 'Waiting' | 'Approved' | 'Rejected' | 'Terminated' | 'Completed' | 'Cancelled' {
    const src = (s ?? '').trim();
    switch (src) {
      case '審核中':
      case 'Pending':
      case 'Waiting':
        return 'Waiting';
      case 'Approved': // 申請人通常看「已完成」
      case 'Completed':
        return 'Completed';
      case 'Rejected':
        return 'Rejected';
      case 'Cancelled':
        return 'Cancelled';
      case 'Terminated':
        return 'Terminated';
      default:
        return 'Waiting';
    }
  }

  /** 簽核者視角（/mine）→ 容錯多語字樣 */
  private normalizeForApprover(
    s?: string | null
  ): 'Waiting' | 'Approved' | 'Rejected' | 'Terminated' | 'Completed' | 'Cancelled' {
    const src = (s ?? '').trim();
    switch (src) {
      case '待簽核':
      case '待審核':
      case 'Waiting':
        return 'Waiting';
      case 'Approved':
      case '已簽核':
        return 'Approved';
      case 'Rejected':
      case '已退回':
        return 'Rejected';
      case 'Terminated':
        return 'Terminated';
      case 'Cancelled':
        return 'Cancelled';
      case 'Completed':
        return 'Completed';
      default:
        return 'Waiting';
    }
  }

  /** ngFor trackBy */
  trackById = (_: number, r: ApprovalInboxItemDto) =>
    `${r.formType}-${r.formId}-${r.approvalId}`;

  // ─────────────────────────────────────────
  // 其他
  // ─────────────────────────────────────────
  private pickErr(err: unknown): string {
    const anyErr = err as any;
    if (typeof anyErr?.error === 'string') return anyErr.error;
    if (typeof anyErr?.message === 'string') return anyErr.message;
    return '載入失敗';
  }
  // pages/backend/employeeapprovallist/employeeapprovallist.component.ts

  detailLink(r: ApprovalInboxItemDto): any[] {
    const ft = (r.formType || '').trim();
    // 請假單 → /erp/employeeapprovalflow/:formId/:approvalId
    if (ft === 'Leave') {
      return ['/erp/employeeapprovalflow', r.formId, r.approvalId ?? 0];
    }
    // 忘卡單 → /erp/employeeapprovalflowmissing/:formId/:approvalId
    if (ft === 'MissingPunch') {
      return ['/erp/employeeapprovalflowmissing', r.formId, r.approvalId ?? 0];
    }
    // 其他型別（暫時導到請假單頁，或改成你要的預設頁）
    return ['/erp/employeeapprovalflow', r.formId, r.approvalId ?? 0];
  }

}
