import { Component, inject } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../services/cart/cart.service';
import { PaymentService } from '../../../services/payment/payment.service';

@Component({
  selector: 'app-checkoutsuccessful',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './checkoutsuccessful.component.html',
  styleUrl: './checkoutsuccessful.component.scss',
})
export class CheckoutsuccessfulComponent {
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  statusText = '訂單處理中…';
  orderNo: string | null = null;

  ngOnInit() {
    this.orderNo = this.route.snapshot.queryParamMap.get('orderNo');

    if (!this.orderNo) {
      this.statusText = '缺少訂單編號';
      return;
    }

    // 避免重整反覆清空
    const key = `cartClearedForOrder::${this.orderNo}`;
    const alreadyCleared = localStorage.getItem(key) === '1';

    // orderNo 一定存在，使用 non-null assertion
    this.paymentService.getOrderStatus(this.orderNo!).subscribe({
      next: (res) => {
        const isDone =
          res.status === 'Paid' || res.status === 'COD' || res.status === 'Completed';

        if (isDone && !alreadyCleared) {
          this.cartService.clearCart();
          localStorage.setItem(key, '1'); // ← 修正變數名稱
          this.statusText = '訂單完成，已清空購物車';
        } else if (isDone && alreadyCleared) {
          this.statusText = '訂單完成';
        } else {
          this.statusText = `訂單狀態：${res.status}（尚未清空購物車）`;
        }
      },
      error: () => {
        this.statusText = '查詢訂單狀態失敗';
      },
    });
  }

  goHome() {
    this.router.navigateByUrl('/show/home');
  }
}
