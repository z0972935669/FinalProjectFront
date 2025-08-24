import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order/order.service';
import { Order, OrderDetail } from '../../../interfaces/order/order.interface';
import { CartService, CartItem } from '../../../services/cart/cart.service';
import { TrimPipe } from '../../../pipes/cart/checkout.pipe'; // 引入 Pipe

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  providers: [TrimPipe], // 在component注入Pipe
})
export class CheckoutComponent {
  invoiceType: string = '';
  vehicleNumber: string = '';
  invoiceTitle: string = '';
  invoiceTax: string = '';
  paymentMethod: string = '';
  deliveryMethod: string = '';
  buyerName: string = '';
  receiverName: string = '';
  receiverPhone: string = '';
  deliveryAddress: string = '';
  note: string = '';

  // 購物車
  items: CartItem[] = [];
  shippingFee = 60;

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    public trimPipe: TrimPipe //注入 TrimPipe
  ) {}

  ngOnInit(): void {
    this.items = this.cartService.getCart();
  }

  get availableDeliveryMethods() {
    if (this.paymentMethod === 'COD') {
      return [
        { label: '7-11 取貨付款', value: 'CVS_711_COD' },
        { label: '全家 取貨付款', value: 'CVS_FAMI_COD' },
        { label: '黑貓宅急便 貨到付款', value: 'HOME_BlackCat_COD' },
      ];
    } else if (
      this.paymentMethod === 'Credit' ||
      this.paymentMethod === 'ATM' ||
      this.paymentMethod === 'CVS'
    ) {
      return [
        { label: '7-11 超商取貨', value: 'CVS_711' },
        { label: '全家 超商取貨', value: 'CVS_FAMI' },
        { label: 'OK 超商取貨', value: 'CVS_OK' },
        { label: '萊爾富 超商取貨', value: 'CVS_HILIFE' },
        { label: '黑貓宅急便', value: 'HOME_BlackCat' },
      ];
    } else {
      return [];
    }
  }

  get subtotal(): number {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get totalAmount(): number {
    return this.subtotal + this.shippingFee;
  }

  placeOrder() {
    // 送出前使用 TrimPipe 清理字串欄位
    const order: Order = {
      buyerName: this.trimPipe.transform(this.buyerName),
      receiverName: this.trimPipe.transform(this.receiverName),
      receiverPhone: this.trimPipe.transform(this.receiverPhone),
      paymentMethod: this.trimPipe.transform(this.paymentMethod),
      deliveryMethod: this.trimPipe.transform(this.deliveryMethod),
      deliveryAddress: this.trimPipe.transform(this.deliveryAddress),
      invoiceType: this.trimPipe.transform(this.invoiceType),
      invoiceTax: this.trimPipe.transform(this.invoiceTax),
      carrierNumber: this.trimPipe.transform(this.vehicleNumber),
      invoiceTitle: this.trimPipe.transform(this.invoiceTitle),
      note: this.trimPipe.transform(this.note),
      totalAmount: this.totalAmount,
      orderDetails: this.items.map((i) => ({
        productId: i.productId,
        productName: this.trimPipe.transform(i.name),
        quantity: i.quantity,
        unitPrice: i.price,
        subtotal: i.price * i.quantity,
      })),
    };

    this.orderService.createOrder(order).subscribe({
      next: (res) => {
        console.log('訂單建立成功', res);
        this.cartService.clear(); // ✅ 清空購物車
        this.router.navigate(['/show/checkoutsuccessful']);
      },
      error: (err) => {
        console.error('建立訂單失敗', err);
      },
    });
  }
}
