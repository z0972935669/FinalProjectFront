import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(EmployeeAuthService);
  private router = inject(Router);

  // 你的 API 主機
  private readonly API_HOSTS = new Set<string>(['localhost:7124', '127.0.0.1:7124']);

  //  前台「認證相關」白名單：讓 401 回到元件顯示紅字，不做全域導頁
  private readonly MEMBER_AUTH_WHITELIST = [
    '/api/account/login',
    '/api/account/google-login',
    '/api/account/line-exchange-code',
    '/api/account/forgot-password',
    '/api/account/reset-password'
  ];

  // 跳過掛 Token 或錯誤處理的路徑（原本清單 + 新增的 password/verify、password/change）
  private readonly SKIP_PATHS = [
    '/api/EmployeeUserAccounts/login-cookie', // 後台 Cookie 版登入
    '/api/EmployeeUserAccounts/password/change', // ⬅ 來自第二段
  ];

  // 後台 API 的前綴（只有這些 401 才要全域導「員工登入」）
  private readonly BACKEND_PREFIXES = [
    '/api/EmployeeUserAccounts',
    '/api/backend',
    '/api/Employee' // 依你們實際命名可增刪
  ];

  // 解析 URL
  private parseUrl(raw: string): URL | null {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      return new URL(raw, base);
    } catch { return null; }
  }

  // 僅視為我方 API 的條件：/api 前綴 + （同源 或 在 API_HOSTS 白名單）
  private isMyApi(u: URL): boolean {
    const isApi = u.pathname.startsWith('/api');
    const known = this.API_HOSTS.has(u.host);
    const sameOrigin = typeof window !== 'undefined' && u.origin === window.location.origin;
    return isApi && (known || sameOrigin);
  }

  // 是否為後台 API
  private isBackendApi(u: URL): boolean {
    return this.BACKEND_PREFIXES.some(p => u.pathname.startsWith(p));
  }

  // 跳過掛 Token 或錯誤處理的路徑
  private isSkip(u: URL): boolean {
    return [...this.SKIP_PATHS, ...this.MEMBER_AUTH_WHITELIST].some(p => u.pathname.startsWith(p));
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = this.parseUrl(req.url);
    let forward = req;

    if (url && this.isMyApi(url)) {
      // 後台 API 一律帶 Cookie；前台不需要
      if (this.isBackendApi(url)) {
        forward = forward.clone({ withCredentials: true });
      }

      // 只對「後台 API」自動掛後台員工的 JWT；前台會員 API 不自動掛
      const token = this.auth.getToken();
      if (token && this.isBackendApi(url) && !this.isSkip(url) && !req.headers.has('Authorization')) {
        forward = forward.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
    }

    return next.handle(forward).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
          // 只有「後台 API」的 401/403 才做全域導頁；前台維持原頁面呈現錯誤
          if (url && this.isMyApi(url) && this.isBackendApi(url) && !this.isSkip(url)) {
            const returnUrl = this.router.url || '/';
            this.auth.logout?.();
            this.router.navigate(['/erp/employeelogin'], { queryParams: { returnUrl } });
          }
        }
        return throwError(() => err);
      })
    );
  }
}
