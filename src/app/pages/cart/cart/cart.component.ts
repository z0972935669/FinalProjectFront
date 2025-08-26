import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuantityComponent } from '../../../components/shared/quantity/quantity.component';
import { CartService, CartItem } from '../../../services/cart/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, QuantityComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  shippingFee = 60;

  constructor(private cartService: CartService) {}

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
      this.cartService.add(item); // ✅ 改用 update()
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
}
