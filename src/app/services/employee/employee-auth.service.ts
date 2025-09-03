// src/app/services/employee/employee-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export type RegisterFullReq = {
  name: string;
  identityNumber: string;
  phone?: string;
  email: string;
  username: string;
  password: string;
};

export type LoginReq = { username: string; password: string };

// 後端登入可能回舊 JWT 與/或 Cookie 的使用者資訊
export type LoginRes = {
  token?: string;
  user?: any;          // { EmployeeId, Name, Username, ... }
  expiresIn?: number;
};

export type CurrentUser = {
  displayName: string;
  username?: string;
  employeeId?: number; // ✅ 讓前端在無 :id 時找回自己
  raw?: any;
};

//（可選）給 component 復用
export type Dept = { id: number; name: string };
export type Job = { id: number; name: string; deptId?: number };

@Injectable({ providedIn: 'root' })
export class EmployeeAuthService {
  private http = inject(HttpClient);

  /** 後端主機位址 */
  private readonly API_HOST = 'https://localhost:7124';

  /** 身分/帳號相關（登入、登出、/me…） */
  private readonly ACC_API = `${this.API_HOST}/api/EmployeeUserAccounts`;
  /** 員工資料相關（詳情、更新、上傳照…） */
  private readonly EMP_API = `${this.API_HOST}/api/Employees`;
  /** 部門 / 職稱 */
  private readonly DEPTS_API = `${this.API_HOST}/api/EmployeeDepartments`;
  private readonly JOBS_API = `${this.API_HOST}/api/EmployeeJobTitles`;

  /** XHR 要帶 Cookie */
  private readonly cred = { withCredentials: true };

  /** 舊 JWT 相容 */
  private readonly TOKEN_KEY = 'employee_token';
  private readonly DISPLAYNAME_KEY = 'employee_display_name';
  private readonly EMPLOYEE_ID_KEY = 'employee_id'; // ✅ 方便 component 快取取得

  /** 全站目前登入者（Cookie/JWT 任一皆可） */
  readonly currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  // ================= 身分流程 =================

  registerFull(payload: RegisterFullReq): Observable<any> {
    return this.http.post(`${this.ACC_API}/register-full`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** Cookie 登入：成功後瀏覽器會收到 Set-Cookie */
  login(payload: LoginReq): Observable<LoginRes> {
    return this.http.post<LoginRes>(`${this.ACC_API}/login-cookie`, payload, this.cred).pipe(
      tap((res) => {
        // 舊 JWT 相容
        if (res?.token) localStorage.setItem(this.TOKEN_KEY, res.token);

        const u = res?.user ?? {};
        const displayName: string =
          u.Name ?? u.name ?? u.displayName ?? payload.username ?? '';

        const employeeId: number | undefined =
          u.EmployeeId ?? u.employeeId ?? undefined;

        if (displayName) localStorage.setItem(this.DISPLAYNAME_KEY, displayName);
        if (employeeId) localStorage.setItem(this.EMPLOYEE_ID_KEY, String(employeeId));

        if (displayName || employeeId) {
          this.currentUser$.next({
            displayName,
            username: u.Username ?? u.username ?? payload.username,
            employeeId,
            raw: u,
          });
        } else {
          this.currentUser$.next(null);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.DISPLAYNAME_KEY);
    localStorage.removeItem(this.EMPLOYEE_ID_KEY);
    this.currentUser$.next(null);
    // 若後端有 /logout-cookie，可開啟這行一併清 Cookie：
    // this.http.post(`${this.ACC_API}/logout-cookie`, {}, this.cred).subscribe();
  }

  /** Cookie 流程的登入判斷（或有 JWT 也視為已登入） */
  isLoggedIn(): boolean {
    return !!this.getToken() || !!this.getDisplayName();
  }

  /** 舊相容：仍被某些地方呼叫 */
  isTokenValid(token: string | null = this.getToken()): boolean {
    if (!token) {
      // 沒 token → 在 Cookie 流程下用 displayName 檢查
      return !!this.getDisplayName();
    }
    try {
      const p = this.decodeJwtPayload(token);
      const now = Math.floor(Date.now() / 1000);
      return p && typeof p.exp === 'number' ? p.exp > now : true;
    } catch {
      return false;
    }
  }

  /** 啟動時從 localStorage 恢復顯示名稱與 employeeId（提升 UI 即時感） */
  private loadFromStorage(): void {
    const name = localStorage.getItem(this.DISPLAYNAME_KEY) || '';
    const idStr = localStorage.getItem(this.EMPLOYEE_ID_KEY) || '';
    const id = Number(idStr);
    if (name || Number.isFinite(id)) {
      this.currentUser$.next({
        displayName: name,
        employeeId: Number.isFinite(id) ? id : undefined,
      });
    }
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  getDisplayName(): string { return localStorage.getItem(this.DISPLAYNAME_KEY) || ''; }
  getEmployeeIdCached(): number | null {
    const id = Number(localStorage.getItem(this.EMPLOYEE_ID_KEY) || '');
    return Number.isFinite(id) ? id : null;
  }

  /** 讀取 /me：Cookie 流程下的「我是誰」 */
  fetchMe(): Observable<{ id: number | null; name: string }> {
    return this.http.get<any>(`${this.ACC_API}/me`, this.cred).pipe(
      map((r) => {
        const id = Number(r?.employeeId ?? r?.EmployeeId ?? NaN);
        const name: string = r?.name ?? r?.Name ?? this.getDisplayName() ?? '';
        // 更新快取與 currentUser$
        if (Number.isFinite(id)) {
          localStorage.setItem(this.EMPLOYEE_ID_KEY, String(id));
        }
        if (name) {
          localStorage.setItem(this.DISPLAYNAME_KEY, name);
        }
        const cu: CurrentUser = {
          displayName: name,
          employeeId: Number.isFinite(id) ? id : undefined,
          raw: r,
        };
        this.currentUser$.next(cu);
        return { id: Number.isFinite(id) ? id : null, name };
      })
    );
  }

  // ================ 員工詳情（/api/Employees） ================

  /** 取員工詳情：GET /api/Employees/{id} */
  /** 取員工詳情：GET /api/Employees/{id}/detail */
  getEmployeeDetail(id: number) {
    return this.http.get<any>(`${this.EMP_API}/${id}/detail`, this.cred).pipe(
      map((api) => {
        const rawPath =
          api?.photoPath ?? api?.PhotoPath ?? '/images/employees/noimage.jpg';
        const abs = this.toAbsoluteUrl(rawPath);

        return {
          EmployeeId: api.employeeId ?? api.EmployeeId,
          Name: api.name ?? api.Name,

          // ✅ 性別（DB 直接存「男／女」；若沒有 GenderText 就用 Gender）
          Gender: api.gender ?? api.Gender ?? '',
          GenderText: api.genderText ?? api.GenderText ?? (api.gender ?? api.Gender ?? ''),

          IdentityNumber: api.identityNumber ?? api.IdentityNumber,
          BirthDate: api.birthDate ?? api.BirthDate,
          Phone: api.phone ?? api.Phone,
          Email: api.email ?? api.Email,
          EducationLevel: api.educationLevel ?? api.EducationLevel,
          RegisteredAddress: api.registeredAddress ?? api.RegisteredAddress,
          CurrentAddress: api.currentAddress ?? api.CurrentAddress,
          Height: api.height ?? api.Height,
          Weight: api.weight ?? api.Weight,
          PayrollBankAccount: api.payrollBankAccount ?? api.PayrollBankAccount,

          // ✅ 後端已轉好的顯示文字
          EmploymentStatusText: api.employmentStatusText ?? api.EmploymentStatusText ?? '',

          // 可能後端沒帶 ID，也不影響顯示（有就留著）
          DepartmentId: api.departmentId ?? api.DepartmentId ?? null,
          DepartmentName: api.departmentName ?? api.DepartmentName ?? null,
          JobTitleId: api.jobTitleId ?? api.JobTitleId ?? null,
          JobTitleName: api.jobTitleName ?? api.JobTitleName ?? null,

          HireDate: api.hireDate ?? api.HireDate,
          PoliceClearanceCertified: api.policeClearanceCertified ?? api.PoliceClearanceCertified,
          IsSupervisor: api.isSupervisor ?? api.IsSupervisor,
          IsAdmin: api.isAdmin ?? api.IsAdmin,

          EmergencyContactPerson: api.emergencyContactPerson ?? api.EmergencyContactPerson,
          EmergencyContactPhone: api.emergencyContactPhone ?? api.EmergencyContactPhone,
          EmergencyContactRelationship: api.emergencyContactRelationship ?? api.EmergencyContactRelationship,

          PhotoPath: abs,
        };
      })
    );
  }

  /** 更新員工詳情：PUT /api/Employees/{id} */
  updateEmployeeDetail(id: number, dto: any) {
    const body = {
      EmployeeId: id,
      Name: dto.Name,
      Gender: dto.Gender,
      IdentityNumber: dto.IdentityNumber,
      BirthDate: dto.BirthDate,
      Phone: dto.Phone,
      Email: dto.Email,
      EducationLevel: dto.EducationLevel,
      RegisteredAddress: dto.RegisteredAddress,
      CurrentAddress: dto.CurrentAddress,
      Height: dto.Height,
      Weight: dto.Weight,
      PayrollBankAccount: dto.PayrollBankAccount,
      EmploymentStatusText: dto.EmploymentStatusText,
      DepartmentId: dto.DepartmentId,
      DepartmentName: dto.DepartmentName,
      JobTitleId: dto.JobTitleId,
      JobTitleName: dto.JobTitleName,
      HireDate: dto.HireDate,
      PoliceClearanceCertified: dto.PoliceClearanceCertified,
      IsSupervisor: dto.IsSupervisor,
      IsAdmin: dto.IsAdmin,
      EmergencyContactPerson: dto.EmergencyContactPerson,
      EmergencyContactPhone: dto.EmergencyContactPhone,
      EmergencyContactRelationship: dto.EmergencyContactRelationship,
      PhotoPath: dto.PhotoPath,
    };
    return this.http.put(`${this.EMP_API}/${id}`, body, {
      ...this.cred,
      responseType: 'text',
    });
  }

  /** 上傳員工大頭照：POST /api/Employees/{id}/photo */
  uploadEmployeePhoto(id: number, file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post(`${this.EMP_API}/${id}/photo`, fd, {
      ...this.cred,
      responseType: 'text',
    });
  }

  /** 若你的後端仍把修改密碼放在 EmployeeUserAccounts，就保留 */
  verifyOldPassword(oldPassword: string) {
    return this.http.post(`${this.ACC_API}/password/verify`, { oldPassword }, {
      ...this.cred, responseType: 'text'
    });
  }
  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post(`${this.ACC_API}/password/change`, { oldPassword, newPassword }, {
      ...this.cred, responseType: 'text'
    });
  }

  // ================ 部門 / 職稱 ================

  /** 取得部門清單：GET /api/EmployeeDepartments  →  統一映射為 {id, name} */
  // src/app/services/employee/employee-auth.service.ts

  getDepartments(): Observable<Dept[]> {
    return this.http.get<any[]>(this.DEPTS_API, this.cred).pipe(
      map(rows => (rows ?? []).map(r => ({
        id: Number(r.id ?? r.DepartmentID),
        name: String(r.name ?? r.DepartmentName ?? '')
      })))
    );
  }

  getJobsByDepartment(departmentId: number): Observable<Job[]> {
    return this.http.get<any[]>(this.JOBS_API, {
      ...this.cred,
      params: { departmentId: String(departmentId) }
    }).pipe(
      map(rows => (rows ?? []).map(r => ({
        id: Number(r.id ?? r.JobTitleID),
        name: String(r.name ?? r.TitleName ?? ''),
        deptId: r.deptId != null ? Number(r.deptId)
          : (r.DepartmentID != null ? Number(r.DepartmentID) : undefined)
      })))
    );
  }
  // 忘記密碼：請求寄信
  requestPasswordReset(accountOrEmail: string) {
    return this.http.post(`${this.ACC_API}/password/forgot`,
      { accountOrEmail }, { ...this.cred, responseType: 'text' as const });
  }

  // 以 Token 重設密碼
  resetPasswordByToken(token: string, newPassword: string) {
    return this.http.post(`${this.ACC_API}/password/reset`,
      { token, newPassword }, { ...this.cred, responseType: 'text' as const });
  }

  // ================= helpers =================

  /** 將 /images/... 轉為絕對位址；assets/... 直接回傳原樣 */
  private toAbsoluteUrl(p: string | null | undefined): string {
    if (!p || !p.trim()) return `${this.API_HOST}/images/employees/noimage.jpg`;
    if (p.startsWith('assets/')) return p;               // 前端資產
    if (/^https?:\/\//i.test(p)) return p;               // 已是完整網址
    const rel = p.startsWith('/') ? p : `/${p}`;
    return `${this.API_HOST}${rel}`;                     // API 靜態檔
  }

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
  private base64Decode(src: string): string {
    if (typeof globalThis.atob === 'function') return globalThis.atob(src);
    const g: any = globalThis as any;
    if (g.Buffer && typeof g.Buffer.from === 'function') {
      return g.Buffer.from(src, 'base64').toString('utf-8');
    }
    throw new Error('No base64 decoder available in this environment.');
  }

}
