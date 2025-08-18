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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', // ⭐ 換頁回到最上方
        anchorScrolling: 'enabled',
      })
    ),
    // 其餘 providers ...
    // ① 讓 HttpClient 從 DI 讀取攔截器
    provideHttpClient(withInterceptorsFromDi()),

    // ② 在 DI 中註冊你的 class 攔截器（注意 multi: true）
    { provide: HTTP_INTERCEPTORS, useClass: MemberService, multi: true },
  ],
};
