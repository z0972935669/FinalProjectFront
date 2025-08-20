// src/app/services/employee/employee-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type RegisterFullReq = {
  name: string;
  identityNumber: string;
  phone?: string;
  email: string;
  username: string;
  password: string;
};

export type LoginReq = {
  username: string;
  password: string;
};

// 後端登入回傳格式（可依你的 API 調整）
export type LoginRes = {
  token: string;     // JWT
  user?: any;        // 可選：回傳的使用者資訊
  expiresIn?: number;
};

@Injectable({ providedIn: 'root' })
export class EmployeeAuthService {
  private http = inject(HttpClient);

  // 建議用環境檔管理，這裡先沿用你原本的寫法
  private readonly BASE = 'https://localhost:7124/api/EmployeeUserAccounts';
  private readonly LOGIN_PATH = `${this.BASE}/login`;
  private readonly REGISTER_FULL_PATH = `${this.BASE}/register-full`;

  private readonly TOKEN_KEY = 'emp_token';

  /** 登入後的使用者狀態（如果後端回 user 就放這裡） */
  currentUser$ = new BehaviorSubject<any | null>(null);

  /** 註冊（你原本就有的） */
  registerFull(payload: RegisterFullReq): Observable<any> {
    return this.http.post(this.REGISTER_FULL_PATH, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /** 登入：成功就把 token 存起來 */
  login(payload: LoginReq): Observable<LoginRes> {
    return this.http.post<LoginRes>(this.LOGIN_PATH, payload).pipe(
      tap(res => {
        if (res?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }
        this.currentUser$.next(res?.user ?? null);
      })
    );
  }

  /** 登出：清 token、清狀態 */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser$.next(null);
  }

  /** 取得目前的 JWT（給攔截器用） */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** 是否已登入（是否有 token） */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
