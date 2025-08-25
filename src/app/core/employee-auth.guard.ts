import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

export const employeeAuthGuard: CanActivateChildFn = (childRoute, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(EmployeeAuthService);

  const url = state.url;

  // 例外頁面（不檢查登入）
  if (
    url.startsWith('/erp/login') ||
    url.startsWith('/erp/employeeregister') ||
    url.startsWith('/erp/employeepasswordreset')
  ) {
    return true;
  }

  // 其它頁面 → 必須 token 有效
  if (auth.isTokenValid()) {
    return true;
  }

  // 沒有登入 → 導回登入頁
  return router.createUrlTree(['/erp/login'], { queryParams: { returnUrl: state.url } });
};
