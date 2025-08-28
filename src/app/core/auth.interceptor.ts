// src/app/core/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(EmployeeAuthService);
  private router = inject(Router);

  private readonly API_HOSTS = new Set<string>([
    'localhost:7124', '127.0.0.1:7124'
  ]);

  private readonly SKIP_PATHS = [
    '/api/EmployeeUserAccounts/login-cookie', // ⬅︎ 新增：Cookie 版登入
    '/api/EmployeeUserAccounts/login',        // 若還保留 JWT 端點也跳過
    '/api/EmployeeUserAccounts/register-full',
    '/images/', '/uploads/',
  ];

  private parseUrl(raw: string): URL | null {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      return new URL(raw, base);
    } catch { return null; }
  }

  private isMyApi(u: URL): boolean {
    const isApi = u.pathname.startsWith('/api');
    const known = this.API_HOSTS.has(u.host);
    const same = typeof window !== 'undefined' && u.origin === window.location.origin;
    return isApi && (known || same);
  }

  private isSkip(u: URL): boolean {
    return this.SKIP_PATHS.some(p => u.pathname.startsWith(p));
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = this.parseUrl(req.url);
    let forward = req;

    if (url && this.isMyApi(url)) {
      // 後台 API 一律帶 Cookie
      forward = forward.clone({ withCredentials: true });

      // 有舊 JWT 就掛（前台會員仍可用）；沒有就不掛
      const token = this.auth.getToken();
      if (token && !this.isSkip(url) && !req.headers.has('Authorization')) {
        forward = forward.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
    }

    return next.handle(forward).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
          // 只要是打到後台 API 的 401，就導回員工登入
          if (url && this.isMyApi(url) && !this.isSkip(url)) {
            const returnUrl = this.router.url || '/';
            this.auth.logout();
            this.router.navigate(['/erp/employeelogin'], { queryParams: { returnUrl } });
          }
        }
        return throwError(() => err);
      })
    );
  }
}
