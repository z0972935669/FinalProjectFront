import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  EmployeeApprovalService,
  ApprovalDetailDto,
  ApprovalLogDto,
} from '../../../services/employee/employee-approval.service';
import { EmployeeLeaveService } from '../../../services/employee/employee-leave.service';

/** 群組時間軸用型別 */
type GroupKey = 'Agent' | 'Dept' | 'HR';
type GroupState = 'todo' | 'active' | 'done';
interface GroupStep {
  key: GroupKey;
  label: string;
  total: number;
  approved: number;
  state: GroupState;
  doneAt?: string | null;
}

@Component({
  selector: 'app-employeeapprovalflowmissing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employeeapprovalflowmissing.component.html',
  styleUrl: './employeeapprovalflowmissing.component.scss',
})
export class EmployeeapprovalflowmissingComponent implements OnInit {
  /** 固定為忘卡單 */
  formType = 'MissingPunch';
  formId = 0;
  /** 只拿來高亮，如果網址沒帶則用後端回傳的 approvalId */
  approvalId = 0;

  loading = signal(false);
  err = signal<string>('');
  okMsg = signal<string>('');
  data = signal<ApprovalDetailDto | null>(null);

  /** 是否為申請人本人（顯示抽單用） */
  isMine = false;

  /** 前端群組化後的 2~3 個步驟（忘卡：僅 Dept / HR） */
  groups: GroupStep[] = [];

  comment = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: EmployeeApprovalService,
    private leaveSvc: EmployeeLeaveService,
  ) { }

  ngOnInit(): void {
    // 路由：/erp/employeeapprovalflowmissing/:formId/:approvalId
    this.formId = Number(this.route.snapshot.paramMap.get('formId') || 0);
    this.approvalId = Number(this.route.snapshot.paramMap.get('approvalId') || 0);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.err.set('');

    this.svc.detail(this.formType, this.formId).subscribe({
      next: (d) => {
        this.data.set(d);

        // 如果網址沒帶/帶錯 approvalId，就用後端回來的
        if ((!this.approvalId || this.approvalId <= 0) && d?.approvalId) {
          this.approvalId = d.approvalId;
        }

        // 以 logs 群組 -> 生成 2 點（Dept / HR）
        this.groups = this.buildGroups(d);

        // 檢查是否本人（為了顯示抽單）
        this.leaveSvc.me().subscribe({
          next: (me) => {
            const meName = (me?.applicantName || '').trim();
            const apName = (d?.applicantName || '').trim();
            this.isMine = !!meName && !!apName && meName === apName;
            this.loading.set(false);
          },
          error: () => {
            this.isMine = false;
            this.loading.set(false);
          },
        });
      },
      error: (e) => {
        this.err.set(e?.error ?? '載入失敗');
        this.loading.set(false);
      },
    });
  }

  /** 是否輪到我簽（以後端算好的 approvalId 為準） */
  get canApprove(): boolean {
    const d = this.data();
    return !!d && (d.approvalId || 0) > 0;
  }

  /** 是否流程仍有待簽（任何 Waiting 即視為進行中） */
  private hasPending(d: ApprovalDetailDto | null = this.data()): boolean {
    if (!d?.logs?.length) return false;
    return d.logs.some((l) => l.approveStatus === 'Waiting');
  }

  /** 申請人本人 & 流程進行中 & 非輪到我簽 → 可抽單 */
  get canCancel(): boolean {
    return this.isMine && this.hasPending() && !this.canApprove;
  }

  approve(): void {
    if (!this.canApprove) return;
    const currentId = this.data()!.approvalId;
    this.loading.set(true);
    this.svc.approve(currentId, { comment: this.comment || null }).subscribe({
      next: () => {
        this.okMsg.set('已簽核');
        this.load();
      },
      error: (e) => {
        this.err.set(e?.error ?? '簽核失敗');
        this.loading.set(false);
      },
    });
  }

  reject(): void {
    if (!this.canApprove) return;
    if (!confirm('確定要退回嗎？')) return;

    const currentId = this.data()!.approvalId;
    this.loading.set(true);
    this.svc.reject(currentId, { comment: this.comment || null }).subscribe({
      next: () => {
        this.okMsg.set('已退回');
        this.load();
      },
      error: (e) => {
        this.err.set(e?.error ?? '退回失敗');
        this.loading.set(false);
      },
    });
  }

  /** 抽單 */
  cancel(): void {
    if (!this.canCancel) return;
    if (!confirm('確定要抽單嗎？')) return;

    this.loading.set(true);
    this.svc.cancel(this.formType, this.formId).subscribe({
      next: () => {
        this.okMsg.set('已抽單');
        this.load();
      },
      error: (e) => {
        this.err.set(e?.error ?? '抽單失敗');
        this.loading.set(false);
      },
    });
  }

  /** 顯示「簽核層級」用（優先以後端回的 approvalId 找當前關卡） */
  currentStepName(): string {
    const d = this.data();
    if (!d?.logs?.length) return '—';
    const id = d.approvalId && d.approvalId > 0 ? d.approvalId : this.approvalId;
    return d.logs.find((l) => l.approvalId === id)?.stepName ?? '—';
  }

  /** 群組時間軸：把多筆節點壓成 2 點（Dept / HR） */
  private buildGroups(d: ApprovalDetailDto | null): GroupStep[] {
    if (!d?.logs?.length) return [];

    const raw = d.logs;

    // 先以 role / stepName 判斷群組鍵值
    const buckets: Record<GroupKey, ApprovalLogDto[]> = {
      Agent: [],
      Dept: [],
      HR: [],
    };

    for (const l of raw) {
      const key = this.normalizeRole(l);
      if (key) buckets[key].push(l);
    }

    // 忘卡：拿掉 Agent
    const order: GroupKey[] = ['Dept', 'HR'];

    // 轉為前端顯示資料
    const result: GroupStep[] = [];
    for (const k of order) {
      const list = buckets[k];
      if (!list || list.length === 0) continue;

      const total = list.length;
      const approved = list.filter((x) => x.approveStatus === 'Approved').length;
      const anyWaiting = list.some((x) => x.approveStatus === 'Waiting');
      const doneAt =
        list
          .filter((x) => x.approveStatus === 'Approved' && !!x.approveDate)
          .map((x) => x.approveDate!)
          .sort()
          .slice(-1)[0] ?? null;

      let state: GroupState = 'todo';
      if (anyWaiting) state = 'active';
      else if (approved > 0) state = 'done';

      result.push({
        key: k,
        label: this.labelOf(k),
        total,
        approved,
        state,
        doneAt,
      });
    }

    return result;
  }

  /** 把後端節點歸類成 Agent / Dept / HR */
  private normalizeRole(l: ApprovalLogDto): GroupKey | null {
    const r = (l.role || '').trim().toLowerCase();
    const n = (l.stepName || '').trim();

    if (r === 'agent' || n.includes('代理')) return 'Agent';
    if (r === 'deptsupervisor' || n.includes('部門主管')) return 'Dept';
    if (r === 'hr' || n.includes('人資')) return 'HR';

    // 無法判斷就丟到 Dept（或改 null 直接忽略）
    return 'Dept';
  }

  private labelOf(k: GroupKey): string {
    switch (k) {
      case 'Agent':
        return '職務代理人';
      case 'Dept':
        return '部門主管';
      case 'HR':
        return '人資覆核';
    }
  }

  /** trackBy for groups */
  trackByGroup = (_: number, g: GroupStep) => g.key;
}
