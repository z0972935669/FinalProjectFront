import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MemberService } from './services/member/member.service';
import { AuthInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
    ),
    // 其餘 providers ...
    // ① 讓 HttpClient 從 DI 讀取攔截器
    provideHttpClient(withInterceptorsFromDi()),
    // withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })

    // ② 在 DI 中註冊你的 class 攔截器（注意 multi: true）
    { provide: HTTP_INTERCEPTORS, useClass: MemberService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
};
