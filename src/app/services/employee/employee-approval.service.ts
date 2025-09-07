import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** 清單：待我簽核/一般列表用 */
export interface ApprovalInboxItemDto {
  approvalId: number;
  formType: string;       // Leave / MissingPunch...
  formId: number;
  receivedAt: string;     // ISO
  status: string;         // Waiting / Approved / Rejected / Terminated / Completed
  departmentName: string;
  jobTitleName: string;
  applicantName: string;
  formTypeName: string;   // 顯示：請休假申請單 / 忘打卡申請單 ...
}

/** 明細（左側資料 + 簽核歷程） */
export interface ApprovalDetailDto {
  approvalId: number;     // 目前輪到我的那一關（若沒有則為 0）
  formType: string;
  formId: number;

  applicantName: string;
  applyDate?: string;
  leaveTypeName?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  leaveHours?: number;
  reason?: string | null;
  missingDate?: string | null;
  actualInTime?: string | null;

  logs: ApprovalLogDto[];
}

// services/employee/employee-approval.service.ts
export interface ApprovalLogDto {
  approvalId: number;
  stepName: string;
  role: string;
  approverName: string;
  approveStatus: string;
  approveComment?: string | null;
  approveDate?: string | null;

  // 可選：若後端有回就會用到；沒有就用前端 fallback
  stepNumber?: number;
}


export interface ApprovalActionDto {
  comment?: string | null;
}

// --- 新增：我的清單狀態型別 ---
export type MyStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface MyRequestItemDto {
  formType: string;
  formId: number;
  appliedAt?: string | null;
  status: MyStatus;  // ← 這裡改成英文碼
  currentStepNumber?: number | null;
  currentStepName?: string | null;
  waitingApprovers: string[];
  departmentName?: string | null;
  jobTitleName?: string | null;
}

// --- 新增：中文顯示工具（給列表/明細用）---
export function zhStatus(s: string) {
  switch (s) {
    case 'Waiting':
    case 'Pending': return '審核中';
    case 'Approved': return '已完成';
    case 'Rejected': return '已退回';
    case 'Terminated': return '已終止';
    case 'Cancelled': return '已抽單';
    default: return s;
  }
}

export function zhFormType(ft: string): string {
  switch (ft) {
    case 'Leave': return '請假單';
    case 'MissingPunch': return '忘卡單';
    default: return ft;
  }
}

export function formTypeClass(ft: string): string {
  switch (ft) {
    case 'Leave': return 'bg-success';     // 綠色
    case 'MissingPunch': return 'bg-warning text-dark'; // 黃色
    default: return 'bg-secondary';
  }
}


// 其餘既有的 apiRoot、logsBase、inbox/mine/my/detail/approve/reject/cancel 全部保留不動


// employee-approval.service.ts
@Injectable({ providedIn: 'root' })
export class EmployeeApprovalService {
  private http = inject(HttpClient);
  private readonly apiRoot = 'https://localhost:7124';
  private readonly logsBase = `${this.apiRoot}/api/EmployeeApprovalLogs`;

  private opt = { withCredentials: true }; // ★★★

  inbox(): Observable<ApprovalInboxItemDto[]> {
    return this.http.get<ApprovalInboxItemDto[]>(`${this.logsBase}/inbox`, this.opt);
  }
  mine(): Observable<ApprovalInboxItemDto[]> {
    return this.http.get<ApprovalInboxItemDto[]>(`${this.logsBase}/mine`, this.opt);
  }
  myRequests(): Observable<MyRequestItemDto[]> {
    return this.http.get<MyRequestItemDto[]>(`${this.logsBase}/my`, this.opt);
  }
  detail(formType: string, formId: number): Observable<ApprovalDetailDto> {
    return this.http.get<ApprovalDetailDto>(`${this.logsBase}/detail/${encodeURIComponent(formType)}/${formId}`, this.opt);
  }
  approve(approvalId: number, dto: ApprovalActionDto): Observable<void> {
    return this.http.put<void>(`${this.logsBase}/${approvalId}/approve`, dto, this.opt);
  }
  reject(approvalId: number, dto: ApprovalActionDto): Observable<void> {
    return this.http.put<void>(`${this.logsBase}/${approvalId}/reject`, dto, this.opt);
  }
  cancel(formType: string, formId: number): Observable<void> {
    return this.http.put<void>(`${this.logsBase}/cancel/${encodeURIComponent(formType)}/${formId}`, {}, this.opt);
  }
}
