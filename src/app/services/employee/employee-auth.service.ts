import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EmployeeDetailDto,
  EmployeeDetailApi,
  mapEmployeeDetail
} from '../../models/employee-detail.dto';

export type RegisterFullReq = {
  name: string;
  identityNumber: string;
  phone?: string;
  email: string;
  username: string;
  password: string;
};

export type LoginReq = { username: string; password: string; };

export type LoginRes = {
  token: string;     // 後端 JWT
  user?: any;        // 若有回傳使用者資料會優先採用
  expiresIn?: number;
};

export type CurrentUser = {
  displayName: string;
  name?: string;
  id?: number;
  username?: string;
  raw?: any;
};

// 與 component 一致
export type Dept = { id: number; name: string };
export type Job = { id: number; name: string; deptId?: number };

@Injectable({ providedIn: 'root' })
export class EmployeeAuthService {
  private http = inject(HttpClient);

  // ⬇️ 新增：把相對路徑補成完整 URL；空值給後端 noimage
  private toAbsoluteUrl(p: string | null | undefined): string {
    // 後端預設圖（請確保檔案在 wwwroot/images/employees/noimage.jpg）
    const fallback = `${this.API_HOST}/images/employees/noimage.jpg`;

    if (!p || !p.trim()) return fallback;
    const src = p.trim();
    if (/^https?:\/\//i.test(src)) return src;           // 已是完整 URL
    const rel = src.startsWith('/') ? src : `/${src}`;   // 確保有前導斜線
    return `${this.API_HOST}${rel}`;
  }
  // ⬇️ 新增：你的後端 Host（跟你測圖用的一樣）
  private readonly API_HOST = 'https://localhost:7124';

  // 你的 UserAccounts API
  private readonly BASE = 'https://localhost:7124/api/EmployeeUserAccounts';
  private readonly LOGIN_PATH = `${this.BASE}/login`;
  private readonly REGISTER_FULL_PATH = `${this.BASE}/register-full`;

  // 部門 / 職稱 API（依你的專案命名）
  private readonly DEPTS_API = 'https://localhost:7124/api/EmployeeDepartments';
  private readonly JOBS_API = 'https://localhost:7124/api/EmployeeJobTitles';

  private readonly TOKEN_KEY = 'employee_token';
  private readonly DISPLAYNAME_KEY = 'employee_display_name';

  /** 全站可訂閱目前使用者（Header/SideNav 用這個拿名字） */
  readonly currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  constructor() {
    // App 啟動 / F5 時，嘗試從 localStorage/Token 還原
    this.loadFromStorage();
  }

  /** 註冊 */
  registerFull(payload: RegisterFullReq): Observable<any> {
    return this.http.post(this.REGISTER_FULL_PATH, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** 登入：成功後保存 token 與 displayName（從回傳或 JWT claim 取） */
  login(payload: LoginReq): Observable<LoginRes> {
    return this.http.post<LoginRes>(this.LOGIN_PATH, payload).pipe(
      tap((res) => {
        // 1) 存 token
        if (res?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }

        // 2) 取 displayName（先 user 欄位、再 JWT claims）
        const displayName =
          (res?.user?.displayName ??
            res?.user?.name ??
            res?.user?.nickName ??
            this.getDisplayNameFromTokenInternal(res?.token ?? null)) ?? '';

        // 3) 寫入 localStorage + 推送給訂閱者（Header/SideNav）
        if (displayName) {
          localStorage.setItem(this.DISPLAYNAME_KEY, displayName);
          this.currentUser$.next({ displayName, name: displayName, raw: res?.user });
        } else {
          this.currentUser$.next(null);
        }
      })
    );
  }

  /** 登出 */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.DISPLAYNAME_KEY);
    this.currentUser$.next(null);
  }

  /** 是否已登入（token 存在且有效） */
  isLoggedIn(): boolean {
    return this.isTokenValid();
  }

  /** 啟動/重整時還原狀態 */
  loadFromStorage(): void {
    const token = this.getToken();
    if (!token || !this.isTokenValid(token)) {
      this.currentUser$.next(null);
      return;
    }

    // 先用 localStorage 的名稱；若沒有再從 token 解析
    let displayName = localStorage.getItem(this.DISPLAYNAME_KEY) || '';
    if (!displayName) {
      displayName = this.getDisplayNameFromTokenInternal(token) || '';
      if (displayName) {
        localStorage.setItem(this.DISPLAYNAME_KEY, displayName);
      }
    }

    if (displayName) {
      this.currentUser$.next({ displayName, name: displayName });
    } else {
      this.currentUser$.next(null);
    }
  }

  /** 取得 token（攔截器會用到） */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** 檢查 JWT 是否有效（exp > now） */
  isTokenValid(token: string | null = this.getToken()): boolean {
    if (!token) return false;
    try {
      const p = this.decodeJwtPayload(token);
      const now = Math.floor(Date.now() / 1000);
      return p && typeof p.exp === 'number' ? p.exp > now : true;
    } catch {
      return false;
    }
  }

  /** 直接取 displayName（給 Header 初次渲染） */
  getDisplayName(): string {
    return localStorage.getItem(this.DISPLAYNAME_KEY) || '';
  }

  /** ✅ 提供給頁面顯示帳號（從 JWT 解析） */
  getUsernameFromToken(): string {
    const t = this.getToken();
    if (!t) return '';
    const p = this.decodeJwtPayload(t);
    if (!p) return '';
    return (
      p.username ||
      p.unique_name ||
      p.sub ||
      p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      ''
    );
  }

  /** 從 JWT 取 EmployeeId（後端以 ClaimTypes.NameIdentifier 寫入） */
  getEmployeeIdFromToken(): number | null {
    const t = this.getToken();
    if (!t) return null;
    const p = this.decodeJwtPayload(t);
    const idStr =
      p?.nameid ||
      p?.sub ||
      p?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    const id = Number(idStr);
    return Number.isFinite(id) ? id : null;
  }

  /** 驗證舊密碼（不傳 username，後端從 JWT 判斷） */
  verifyOldPassword(oldPassword: string) {
    const url = `${this.BASE}/password/verify`;
    return this.http.post(url, { oldPassword }, { responseType: 'text' });
  }

  /** 變更密碼：舊密碼 + 新密碼，一次完成 */
  changePassword(oldPassword: string, newPassword: string) {
    const url = `${this.BASE}/password/change`;
    return this.http.post(url, { oldPassword, newPassword }, { responseType: 'text' });
  }

  /**
   * 取得個人詳細資料（後端 camelCase → 前端 PascalCase）
   * 並在 photoPath 缺漏時補上預設圖
   */
  getEmployeeDetail(id: number): Observable<EmployeeDetailDto> {
    return this.http
      .get<EmployeeDetailApi>(`${this.BASE}/${id}/detail`)
      .pipe(
        map(api => {
          // 後端若沒給 photoPath，先用後端的 noimage 相對路徑
          const rawPath =
            api?.photoPath && api.photoPath.trim()
              ? api.photoPath.trim()
              : '/images/employees/noimage.jpg';

          // 轉成完整 URL，再交給 mapEmployeeDetail
          const withFull: EmployeeDetailApi = {
            ...api,
            photoPath: this.toAbsoluteUrl(rawPath),
          };
          return mapEmployeeDetail(withFull);
        })
      );
  }


  // ---------------- 更新、上傳 ----------------

  /**
   * 更新（把 form.getRawValue() 丟進來即可；同時送出名稱與 ID，避免資料遺失）
   */
  updateEmployeeDetail(id: number, dto: any) {
    const body = {
      employeeId: id,

      // 基本
      name: dto.Name,
      identityNumber: dto.IdentityNumber,
      birthDate: dto.BirthDate, // yyyy-MM-dd
      phone: dto.Phone,
      email: dto.Email,
      educationLevel: dto.EducationLevel,
      registeredAddress: dto.RegisteredAddress,
      currentAddress: dto.CurrentAddress,
      height: dto.Height,
      weight: dto.Weight,
      payrollBankAccount: dto.PayrollBankAccount,

      // 職務（同時傳名稱與ID，後端視情況採用）
      employmentStatusText: dto.EmploymentStatusText,
      departmentId: dto.DepartmentId ?? null,
      departmentName: dto.DepartmentName ?? null,
      jobTitleId: dto.JobTitleId ?? null,
      jobTitleName: dto.JobTitleName ?? null,

      hireDate: dto.HireDate, // yyyy-MM-dd
      policeClearanceCertified: dto.PoliceClearanceCertified,
      isSupervisor: dto.IsSupervisor,
      isAdmin: dto.IsAdmin,

      // 緊急聯絡人
      emergencyContactPerson: dto.EmergencyContactPerson,
      emergencyContactPhone: dto.EmergencyContactPhone,
      emergencyContactRelationship: dto.EmergencyContactRelationship,
    };

    return this.http.put(`${this.BASE}/${id}/detail`, body, { responseType: 'text' });
  }

  /** 上傳頭像（FormData） */
  uploadEmployeePhoto(id: number, file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post(`${this.BASE}/${id}/photo`, fd, { responseType: 'text' });
  }

  // ---------------- 部門 / 職稱 清單 ----------------

  /**
   * 取得部門清單（對應 EmployeeDepartment）
   * 期待後端回傳欄位：DepartmentID, DepartmentName
   * GET https://localhost:7124/api/EmployeeDepartments
   */
  getDepartments(): Observable<Dept[]> {
    return this.http.get<any[]>(this.DEPARTS_API_FALLBACK()).pipe(
      map(rows =>
        (rows ?? []).map(r => ({
          id: r.DepartmentID ?? r.departmentID ?? r.id,
          name: r.DepartmentName ?? r.departmentName ?? r.name,
        }) as Dept)
      )
    );
  }

  /**
   * 依部門取得職稱清單（對應 EmployeeJobTitle）
   * 期待後端回傳欄位：JobTitleID, TitleName, DepartmentID
   * GET https://localhost:7124/api/EmployeeJobTitles?departmentId=1
   */
  getJobsByDepartment(departmentId: number): Observable<Job[]> {
    const params = { departmentId: String(departmentId) };
    return this.http.get<any[]>(this.JOBS_API, { params }).pipe(
      map(rows =>
        (rows ?? []).map(r => ({
          id: r.JobTitleID ?? r.jobTitleID ?? r.id,
          name: r.TitleName ?? r.titleName ?? r.name,
          deptId: r.DepartmentID ?? r.departmentID ?? r.deptId,
        }) as Job)
      )
    );
  }

  // 若你尚未建立 EmployeeDepartments Controller，可暫時改用此 fallback（請依實際情況移除）
  private DEPARTS_API_FALLBACK() { return this.DEPARTS_API_EXISTS() ? this.DEPARTS_API_EXISTS() : this.DEPTS_API; }
  private DEPARTS_API_EXISTS() { return this.DEPTS_API; }

  // ---------------- private helpers ----------------

  /** 從 JWT 解出可能的名稱欄位 */
  private getDisplayNameFromTokenInternal(token: string | null): string | null {
    if (!token) return null;
    const p = this.decodeJwtPayload(token);
    if (!p) return null;
    return (
      p.name ||
      p.displayName ||
      p.username ||
      p.unique_name ||
      p.sub ||
      p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      null
    );
  }

  /** 安全解析 JWT payload（支援瀏覽器 / SSR / 單元測試環境） */
  private decodeJwtPayload(token: string): any | null {
    try {
      const payload = token.split('.')[1] || '';
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = this.base64Decode(normalized);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** Base64 解碼：瀏覽器用 atob；SSR/測試用 Buffer（若存在） */
  private base64Decode(src: string): string {
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(src);
    }
    const g: any = globalThis as any;
    if (g.Buffer && typeof g.Buffer.from === 'function') {
      return g.Buffer.from(src, 'base64').toString('utf-8');
    }
    throw new Error('No base64 decoder available in this environment.');
  }
}
