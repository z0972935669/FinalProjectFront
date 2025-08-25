import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // 需要帶員工 JWT 的「路徑前綴」
  private protectedPaths = [
    '/api/EmployeeUserAccounts',
    '/api/erp',
    '/api/auth/employee',
  ];

  // 可選：只對後端主機加（避免外站）
  private apiHosts = new Set(['localhost:7124']);

  constructor(
    private auth: EmployeeAuthService,
    private router: Router
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 允許以 header 跳過（例如 login/register）
    if (req.headers.has('X-Skip-Auth')) {
      return next.handle(req.clone({ headers: req.headers.delete('X-Skip-Auth') }));
    }

    // 取得 pathname（相對或絕對都能處理）
    let pathname = req.url;
    let host: string | null = null;
    try {
      const u = new URL(req.url);
      pathname = u.pathname;       // 例如 /api/EmployeeUserAccounts/password/verify
      host = u.host;               // 例如 localhost:7124
    } catch {
      // 相對路徑時 new URL 會拋例外，保持 pathname = req.url
    }

    const needsAuth =
      this.protectedPaths.some(p => pathname.startsWith(p)) &&
      (!host || this.apiHosts.has(host)); // 有 host 就必須在白名單

    const token = this.auth.getToken();
    let finalReq = req;

    if (needsAuth && token && !req.headers.has('Authorization')) {
      finalReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(finalReq).pipe(
      catchError((err: unknown) => {
        // 只有真的未授權才導回登入；不要把舊密碼錯誤(400)也導走
        if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
          const returnUrl = this.router.url || '/erp/employeehome';
          this.auth.logout();
          this.router.navigate(['/erp/login'], { queryParams: { returnUrl } });
        }
        return throwError(() => err);
      })
    );
  }
}
