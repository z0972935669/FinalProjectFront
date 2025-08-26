import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private storageKey = 'cart';

  // 角標用：即時推播購物車數量
  private cartCountSubject = new BehaviorSubject<number>(this.readCountFromLS());
  cartCount$ = this.cartCountSubject.asObservable();

  // ---- 讀寫 cart 基本功能 ----
  getCart(): CartItem[] {
    const cart = localStorage.getItem(this.storageKey);
    return cart ? JSON.parse(cart) : [];
  }

  add(item: CartItem): void {
    const cart = this.getCart();
    const existing = cart.find((c) => c.productId === item.productId);

    if (existing) {
      // 保留你的需求：把數量「設為」傳入的 quantity
      existing.quantity = item.quantity;
    } else {
      cart.push(item);
    }

    this.saveCart(cart);
  }

  remove(productId: number): void {
    const cart = this.getCart().filter((c) => c.productId !== productId);
    this.saveCart(cart);
  }

  clearCart(): void {
    // 清空購物車並即時通知 Navbar
    localStorage.removeItem(this.storageKey);
    this.emitCount();
  }

  // ---- 私有工具 ----
  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.emitCount();
  }

  private emitCount(): void {
    this.cartCountSubject.next(this.readCountFromLS());
  }

  private readCountFromLS(): number {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return 0;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return 0;
      // 以 quantity 為主（沒有就當 1）
      return arr.reduce((sum: number, it: any) => sum + (Number(it?.quantity) || 1), 0);
    } catch {
      return 0;
    }
  }
}
