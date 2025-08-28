import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EmployeeDetailDto, EmployeeDetailApi, mapEmployeeDetail
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

// 兼容：可能同時回 token（舊 JWT）與 user（Cookie 登入）
export type LoginRes = {
  token?: string;
  user?: any;
  expiresIn?: number;
};

export type CurrentUser = {
  displayName: string;
  name?: string;
  id?: number;
  username?: string;
  raw?: any;
};

export type Dept = { id: number; name: string };
export type Job = { id: number; name: string; deptId?: number };

@Injectable({ providedIn: 'root' })
export class EmployeeAuthService {
  private http = inject(HttpClient);

  /** 後端主機 */
  private readonly API_HOST = 'https://localhost:7124';

  /** 員工帳號 API */
  private readonly BASE = `${this.API_HOST}/api/EmployeeUserAccounts`;
  private readonly LOGIN_COOKIE = `${this.BASE}/login-cookie`;
  private readonly REGISTER_FULL = `${this.BASE}/register-full`;

  /** 其他後台 API */
  private readonly DEPTS_API = `${this.API_HOST}/api/EmployeeDepartments`;
  private readonly JOBS_API = `${this.API_HOST}/api/EmployeeJobTitles`;

  /** XHR 必須帶 Cookie */
  private readonly cred = { withCredentials: true };

  /** 舊 JWT 流程相容 */
  private readonly TOKEN_KEY = 'employee_token';
  private readonly DISPLAYNAME_KEY = 'employee_display_name';

  /** 全站目前使用者 */
  readonly currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  // =============== Auth ===============

  /** 註冊（匿名） */
  registerFull(payload: RegisterFullReq): Observable<any> {
    return this.http.post(this.REGISTER_FULL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** 🔑 登入（Cookie 版；成功後瀏覽器會收到 Set-Cookie: erp.emp=...） */
  login(payload: LoginReq): Observable<LoginRes> {
    return this.http.post<LoginRes>(this.LOGIN_COOKIE, payload, this.cred).pipe(
      tap(res => {
        // 兼容：後端若仍回 token，就存起來讓舊程式可運作
        if (res?.token) localStorage.setItem(this.TOKEN_KEY, res.token);

        const name =
          res?.user?.Name ??
          res?.user?.name ??
          res?.user?.displayName ??
          '';

        if (name) {
          localStorage.setItem(this.DISPLAYNAME_KEY, name);
          this.currentUser$.next({ displayName: name, name, raw: res?.user });
        } else {
          this.currentUser$.next(null);
        }
      })
    );
  }

  /** 登出（清掉前端狀態；如需登出 Cookie 也可打 /logout-cookie） */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.DISPLAYNAME_KEY);
    this.currentUser$.next(null);
  }

  /** ✅ 新：Cookie 流程的判斷（或有 JWT 也視為已登入） */
  isLoggedIn(): boolean {
    const t = this.getToken();
    return !!t || !!this.getDisplayName();
  }

  /** 🔁 舊相容：部分 guard/元件仍呼叫 isTokenValid() */
  isTokenValid(token: string | null = this.getToken()): boolean {
    if (!token) {
      // 沒 token 時，在 Cookie 流程下用 displayName 檢查
      return !!this.getDisplayName();
    }
    // 有 token → 解析 exp 檢查
    try {
      const p = this.decodeJwtPayload(token);
      const now = Math.floor(Date.now() / 1000);
      return p && typeof p.exp === 'number' ? p.exp > now : true;
    } catch {
      return false;
    }
  }

  loadFromStorage(): void {
    const displayName = localStorage.getItem(this.DISPLAYNAME_KEY) || '';
    if (displayName) this.currentUser$.next({ displayName, name: displayName });
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  getDisplayName(): string { return localStorage.getItem(this.DISPLAYNAME_KEY) || ''; }

  /** 🔁 舊相容：從 JWT 取使用者名稱（Cookie 流程沒有就回空字串） */
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

  /** 🔁 舊相容：從 JWT 取 EmployeeId（Cookie 流程沒有就回 null） */
  getEmployeeIdFromToken(): number | null {
    const t = this.getToken();
    if (!t) return null;
    const p = this.decodeJwtPayload(t);
    const idStr =
      p?.employeeid ||
      p?.nameid ||
      p?.sub ||
      p?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    const id = Number(idStr);
    return Number.isFinite(id) ? id : null;
  }

  // =============== 員工詳細（都帶 Cookie） ===============

  getEmployeeDetail(id: number): Observable<EmployeeDetailDto> {
    return this.http
      .get<EmployeeDetailApi>(`${this.BASE}/${id}/detail`, this.cred)
      .pipe(
        map(api => {
          const rawPath =
            api?.photoPath && api.photoPath.trim()
              ? api.photoPath.trim()
              : '/images/employees/noimage.jpg';
          const abs = this.toAbsoluteUrl(rawPath);
          return mapEmployeeDetail({ ...api, photoPath: abs });
        })
      );
  }

  updateEmployeeDetail(id: number, dto: any) {
    const body = {
      employeeId: id,
      name: dto.Name,
      identityNumber: dto.IdentityNumber,
      birthDate: dto.BirthDate,
      phone: dto.Phone,
      email: dto.Email,
      educationLevel: dto.EducationLevel,
      registeredAddress: dto.RegisteredAddress,
      currentAddress: dto.CurrentAddress,
      height: dto.Height,
      weight: dto.Weight,
      payrollBankAccount: dto.PayrollBankAccount,
      employmentStatusText: dto.EmploymentStatusText,
      departmentId: dto.DepartmentId ?? null,
      departmentName: dto.DepartmentName ?? null,
      jobTitleId: dto.JobTitleId ?? null,
      jobTitleName: dto.JobTitleName ?? null,
      hireDate: dto.HireDate,
      policeClearanceCertified: dto.PoliceClearanceCertified,
      isSupervisor: dto.IsSupervisor,
      isAdmin: dto.IsAdmin,
      emergencyContactPerson: dto.EmergencyContactPerson,
      emergencyContactPhone: dto.EmergencyContactPhone,
      emergencyContactRelationship: dto.EmergencyContactRelationship,
    };

    return this.http.put(`${this.BASE}/${id}/detail`, body, {
      ...this.cred, responseType: 'text'
    });
  }

  uploadEmployeePhoto(id: number, file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post(`${this.BASE}/${id}/photo`, fd, {
      ...this.cred, responseType: 'text'
    });
  }

  verifyOldPassword(oldPassword: string) {
    return this.http.post(`${this.BASE}/password/verify`, { oldPassword }, {
      ...this.cred, responseType: 'text'
    });
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post(`${this.BASE}/password/change`, { oldPassword, newPassword }, {
      ...this.cred, responseType: 'text'
    });
  }

  // =============== 部門 / 職稱（保險起見一律帶 Cookie） ===============

  getDepartments(): Observable<Dept[]> {
    return this.http.get<any[]>(this.DEPTS_API, this.cred).pipe(
      map(rows => (rows ?? []).map(r => ({
        id: r.DepartmentID ?? r.id,
        name: r.DepartmentName ?? r.name,
      }) as Dept))
    );
  }

  getJobsByDepartment(departmentId: number): Observable<Job[]> {
    return this.http.get<any[]>(this.JOBS_API, {
      ...this.cred, params: { departmentId: String(departmentId) }
    }).pipe(
      map(rows => (rows ?? []).map(r => ({
        id: r.JobTitleID ?? r.id,
        name: r.TitleName ?? r.name,
        deptId: r.DepartmentID ?? r.deptId,
      }) as Job))
    );
  }

  // =============== helpers ===============

  private toAbsoluteUrl(p: string | null | undefined): string {
    const fallback = `${this.API_HOST}/images/employees/noimage.jpg`;
    if (!p || !p.trim()) return fallback;
    if (/^https?:\/\//i.test(p)) return p;
    const rel = p.startsWith('/') ? p : `/${p}`;
    return `${this.API_HOST}${rel}`;
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
