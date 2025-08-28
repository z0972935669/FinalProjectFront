import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

/**
 * 後台路由守衛：驗證 JWT token
 * - 公開頁（登入/註冊/重設密碼）直接放行
 * - 其他頁面需 token 有效
 */
export const employeeAuthGuard: CanActivateChildFn = (_childRoute, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(EmployeeAuthService);

  // 公開頁白名單
  const publicPaths = ['/erp/login', '/erp/employeeregister', '/erp/employeepasswordreset'];
  if (publicPaths.some(p => state.url.startsWith(p))) {
    return true;
  }

  // token 有效 → 放行
  if (auth.isTokenValid()) {
    return true;
  }

  // token 無效 → 導回登入頁，並帶回 returnUrl
  return router.createUrlTree(['/erp/login'], {
    queryParams: { returnUrl: state.url },
  });
};
