// src/app/core/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

// 不加 Authorization 的白名單路徑（依你的 API 調整）
const BYPASS = [
  /\/api\/EmployeeUserAccounts\/login\b/i,
  /\/api\/EmployeeUserAccounts\/register-full\b/i,
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: EmployeeAuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 白名單直接放行
    if (BYPASS.some(r => r.test(req.url))) {
      return next.handle(req);
    }

    const token = this.auth.getToken();
    if (!token) {
      return next.handle(req);
    }

    // 加上 Bearer Token
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next.handle(authReq);
  }
}
