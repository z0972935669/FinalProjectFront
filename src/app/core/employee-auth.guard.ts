import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const employeeAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 假設 JWT 存在 localStorage
  const token = localStorage.getItem('jwtToken');

  if (token) {
    // ✅ 已登入，允許通行
    return true;
  } else {
    // ❌ 未登入，導回後台登入畫面（orders 當作登入首頁）
    router.navigate(['/erp/orders']);
    return false;
  }
};
