// src/app/core/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(EmployeeAuthService);
  private router = inject(Router);

  /** 你的後端 API Host（可加多個） */
  private readonly API_HOSTS = new Set<string>(['localhost:7124']);

  /** 不掛 Token 的路徑前綴（登入/註冊/靜態檔等） */
  private readonly SKIP_PATHS = [
    '/api/EmployeeUserAccounts/login',
    '/api/EmployeeUserAccounts/register-full',
    '/images/',
    '/uploads/',
  ];

  /** 是否要跳過這次攔截（自訂 header） */
  private shouldSkipByHeader(req: HttpRequest<any>): boolean {
    return req.headers.has('X-Skip-Auth');
  }

  /** 以 URL 物件安全解析（相對路徑也能解析） */
  private parseUrlSafe(raw: string): URL | null {
    try {
      // 對相對路徑加 base，避免 new URL 失敗
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      return new URL(raw, base);
    } catch {
      return null;
    }
  }

  /** 判斷是否我方 API 請求（/api/... 或命中 API_HOSTS） */
  private isMyApi(url: URL): boolean {
    const isApiPath = url.pathname.startsWith('/api');
    const isKnownHost = this.API_HOSTS.has(url.host);
    // 允許同源（例如 http://localhost:4200 走相對 /api）也視為我方 API
    const isSameOrigin = typeof window !== 'undefined' && url.origin === window.location.origin;
    return isApiPath && (isKnownHost || isSameOrigin);
  }

  /** 判斷是否在白名單（不掛 Token） */
  private isSkipPath(url: URL): boolean {
    const p = url.pathname;
    return this.SKIP_PATHS.some(prefix => p.startsWith(prefix));
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 預檢請求與明確宣告跳過 → 直接放行
    if (req.method === 'OPTIONS' || this.shouldSkipByHeader(req)) {
      const cleaned = req.headers.has('X-Skip-Auth') ? req.clone({ headers: req.headers.delete('X-Skip-Auth') }) : req;
      return next.handle(cleaned);
    }

    const url = this.parseUrlSafe(req.url);
    const token = this.auth.getToken();

    let forward = req;

    if (url && this.isMyApi(url) && !this.isSkipPath(url)) {
      // 需要掛 Token
      if (token && !req.headers.has('Authorization')) {
        forward = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
      }
    }

    return next.handle(forward).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
          // 避免對登入/註冊的回應做導轉，造成循環
          if (url && !this.isSkipPath(url)) {
            const returnUrl = this.router.url || '/';
            this.auth.logout();
            this.router.navigate(['/erp/login'], { queryParams: { returnUrl } });
          }
        }
        return throwError(() => err);
      })
    );
  }
}
