import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

export const employeeAuthGuard: CanActivateChildFn = (_childRoute, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(EmployeeAuthService);

  // token 有效就放行；否則導到獨立的登入頁，並帶回跳網址
  return auth.isTokenValid()
    ? true
    : router.createUrlTree(['/erp/login'], { queryParams: { returnUrl: state.url } });
};
