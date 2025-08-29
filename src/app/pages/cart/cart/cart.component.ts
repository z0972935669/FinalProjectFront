import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { QuantityComponent } from '../../../components/shared/quantity/quantity.component';
import { CartService, CartItem } from '../../../services/cart/cart.service';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, QuantityComponent, NgxSonnerToaster],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  shippingFee = 60;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.items = this.cartService.getCart();
  }

  // 計算小計
  get subtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  // 計算總金額
  get total(): number {
    return this.subtotal + this.shippingFee;
  }

  // 更新數量
  updateQuantity(item: CartItem, newValue: number): void {
    if (newValue <= 0) {
      this.remove(item.productId);
    } else {
      item.quantity = newValue;
      this.cartService.add(item); // 改用 update()
      this.loadCart();
    }
  }

  // 移除商品
  remove(productId: number): void {
    this.cartService.remove(productId);
    this.loadCart();
  }

  // 清空購物車
  clearCart(): void {
    this.cartService.clearCart();
    this.loadCart();
  }

  // 取得庫存並強制轉成數字；若不存在或無法轉數字則回傳 undefined
  private getStock(item: CartItem): number | undefined {
    const raw = (item as any)?.stock;
    if (raw === null || raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }

  // 找出第一個不合法的品項：
  // 1 沒有 stock → 視為不合法（多半是舊資料）；
  // 2 有 stock 且 quantity > stock → 不合法
  private findOverStock(): CartItem | null {
    for (const it of this.items) {
      const stock = this.getStock(it);
      if (stock === undefined) {
        return it; // 沒帶庫存也擋
      }
      if (it.quantity > stock) {
        return it;
      }
    }
    return null;
  }

  // 繼續結帳：先檢查庫存，不符就 toast 並阻擋；都符合才導頁
  proceedCheckout(): void {
    const bad = this.findOverStock();
    if (bad) {
      const stock = this.getStock(bad);
      toast.error('無法結帳：包含超過庫存的商品', {
        description: `${bad.name} 庫存 ${stock ?? '未知'} 件，請先調整數量。`,
      });
      return; // 阻擋進入結帳頁
    }
    this.router.navigate(['/show/checkout']); // ✅ 全部符合才放行
  }
}
