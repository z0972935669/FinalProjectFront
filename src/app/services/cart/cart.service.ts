import { Injectable } from '@angular/core';

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

  getCart(): CartItem[] {
    const cart = localStorage.getItem(this.storageKey);
    return cart ? JSON.parse(cart) : [];
  }

  add(item: CartItem): void {
    let cart = this.getCart();
    const existing = cart.find((c) => c.productId === item.productId);

    if (existing) {
      existing.quantity = item.quantity;
    } else {
      cart.push(item);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(cart));
  }

  remove(productId: number): void {
    let cart = this.getCart().filter((c) => c.productId !== productId);
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
