import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface EmployeeLeaveTypeDto {
  leaveTypeId: number;
  typeName: string;
}

/** 建立請假單用的 DTO（第一關代理人必填） */
export interface EmployeeLeaveCreateDto {
  leaveTypeId: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  reason?: string | null;

  /** ★ 第一關一定要有代理人（可選自己；後端會驗證不可是主管/需同部門） */
  agentEmployeeId: number;
}

export interface EmployeeLeaveMeDto {
  applicantName: string;
}

/** 跟後端 /agents 對齊 */
export interface EmployeeAgentDto {
  employeeId: number;
  name: string;
  jobTitleId: number;
  jobTitleName: string;
  display?: string; // 例如「自己（申請人）」或「職稱-姓名」
}

/** 我送出的清單（對應 GET /api/EmployeeLeaveApplications/my） */
export interface EmployeeLeaveMyRow {
  leaveId: number;
  employeeId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;           // 後端 DateOnly?，前端以字串接
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  leaveHours: number;
  status: string;              // 審核中 / Approved / Rejected / Cancelled...
  applyDate?: string | null;
  approvedDate?: string | null;
  reason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmployeeLeaveService {
  private readonly apiRoot = 'https://localhost:7124';
  private readonly base = `${this.apiRoot}/api/EmployeeLeaveApplications`;

  constructor(private http: HttpClient) { }

  me() {
    return this.http.get<EmployeeLeaveMeDto>(`${this.base}/me`, { withCredentials: true });
  }

  getTypes() {
    return this.http.get<EmployeeLeaveTypeDto[]>(`${this.base}/types`, { withCredentials: true });
  }

  /** 建立請假單（帶 agentEmployeeId） */
  create(payload: EmployeeLeaveCreateDto) {
    return this.http.post(`${this.base}`, payload, { withCredentials: true });
  }

  /** 我送出的請假單清單 */
  getMy() {
    return this.http.get<EmployeeLeaveMyRow[]>(`${this.base}/my`, { withCredentials: true });
  }

  /** 同部門可選的代理人（含「自己（申請人）」；已排除主管） */
  getAgents() {
    return this.http.get<EmployeeAgentDto[]>(`${this.base}/agents`, { withCredentials: true });
  }
}
