import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

/**
 * 後台路由守衛（Cookie / JWT 皆相容）
 * - 公開頁放行
 * - 其他頁需已登入（Cookie）或 token 有效（JWT）
 */
export const employeeAuthGuard: CanActivateChildFn = (_childRoute, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(EmployeeAuthService);

  // 公開頁白名單
  const publicPaths = ['/erp/login', '/erp/employeeregister', '/erp/employeepasswordreset', '/erp/employeeforgotpassword'];
  if (publicPaths.some(p => state.url.startsWith(p))) return true;

  // Cookie 或 JWT 任一種通過即可
  if (auth.isLoggedIn() || auth.isTokenValid()) return true;

  // 未登入 → 帶回目的地
  return router.createUrlTree(['/erp/login'], {
    queryParams: { returnUrl: state.url },
  });
};
