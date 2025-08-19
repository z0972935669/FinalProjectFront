import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MemberInfo {
  memberId: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class MemberService implements HttpInterceptor {
  private readonly meUrl = 'https://localhost:7124/api/Member/me'; // ← 依你的 API 調整

  constructor(private http: HttpClient) {}

  /** ★ 讓元件呼叫用：抓登入者資料並回傳 Observable */
  getMemberInfo(): Observable<MemberInfo> {
    return this.http.get<MemberInfo>(this.meUrl);
  }

  /** ★ 攔截器：自動在每個 request 加 Bearer Token */
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('jwtToken');
    if (!token || req.headers.has('Authorization')) {
      return next.handle(req);
    }
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next.handle(authReq);
  }
}
