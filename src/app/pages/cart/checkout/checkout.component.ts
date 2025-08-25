import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order/order.service';
import { Order } from '../../../interfaces/order/order.interface';
import { CartService, CartItem } from '../../../services/cart/cart.service';
import { TrimPipe } from '../../../pipes/cart/checkout.pipe'; // 引入 Pipe
import {
  MemberInfo,
  MemberService,
} from '../../../services/member/member.service';
import { CityService } from '../../../services/city/city.service';
import { PaymentService } from '../../../services/payment/payment.service';
import { ECPayRequest } from '../../../interfaces/payment/ecpay.interface';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterModule, FormsModule, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  providers: [TrimPipe], // 在component注入Pipe
})
export class CheckoutComponent {
  // 原始資料 (Dictionary)
  cityData: { [key: string]: string[] } = {};

  // 下拉清單用
  cities: string[] = [];
  districts: string[] = [];

  // 使用者選擇
  city = '';
  district = '';
  streetAddress = '';

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
  error = '';
  // 會員ID
  memberId: number = 0;

  private memberSvc = inject(MemberService);

  // 購物車
  items: CartItem[] = [];
  shippingFee = 60;

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private cityService: CityService,
    private router: Router,
    public trimPipe: TrimPipe, //注入 TrimPipe
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.items = this.cartService.getCart();

    // 取得縣市清單
    this.cityService.getCities().subscribe({
      next: (res: any) => {
        this.cityData = res; // 存 Dictionary
        this.cities = Object.keys(res); // 取出縣市清單
      },
      error: (err) => console.error('載入城市資料失敗', err),
    });

    this.memberSvc.getMemberInfo().subscribe({
      next: (me: MemberInfo) => {
        // console.log(me);
        this.memberId = me.memberId;
      },
      error: (err) => {
        console.error('無法取得登入者資料', err);
        this.error = '請先登入後再結帳';
      },
    });
  }

  // 切換城市時，載入對應區域
  onCityChange(): void {
    if (this.city && this.cityData[this.city]) {
      this.districts = this.cityData[this.city]; // 取出該城市的區域
    } else {
      this.districts = [];
    }
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
    const fullAddress = `${this.city}${this.district}${this.streetAddress}`;

    // 送出前使用 TrimPipe 清理字串欄位
    const order: Order = {
      memberId: this.memberId,
      buyerName: this.trimPipe.transform(this.buyerName),
      receiverName: this.trimPipe.transform(this.receiverName),
      receiverPhone: this.trimPipe.transform(this.receiverPhone),
      paymentMethod: this.trimPipe.transform(this.paymentMethod),
      deliveryMethod: this.trimPipe.transform(this.deliveryMethod),
      deliveryAddress: this.trimPipe.transform(fullAddress),
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

    // Step 1: 先建立訂單 (DB)
    this.orderService.createOrder(order).subscribe({
      next: (res) => {
        console.log('訂單建立成功', res);

        // Step 2: 產生 ECPay 訂單請求
        const ecpayRequest: ECPayRequest = {
          MerchantTradeNo: res.orderNo, // 後端訂單編號
          TotalAmount: this.totalAmount,
          ItemName: this.items.map((i) => `${i.name} x${i.quantity}`).join('#'),
          ChoosePayment:
            this.paymentMethod === 'COD' ? 'Credit' : this.paymentMethod,
        };

        this.paymentService.createOrder(ecpayRequest).subscribe((ecRes) => {
          // Step 3: 自動產生 form 跳轉綠界
          const form = document.createElement('form');
          form.method = 'POST';
          form.action =
            'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

          for (const key in ecRes) {
            if (ecRes.hasOwnProperty(key)) {
              const input = document.createElement('input');
              input.type = 'hidden';

              let properKey = key;
              switch (key.toLowerCase()) {
                case 'merchantid':
                  properKey = 'MerchantID';
                  break;
                case 'merchanttradeno':
                  properKey = 'MerchantTradeNo';
                  break;
                case 'merchanttradedate':
                  properKey = 'MerchantTradeDate';
                  break;
                case 'totalamount':
                  properKey = 'TotalAmount';
                  break;
                case 'tradedesc':
                  properKey = 'TradeDesc';
                  break;
                case 'itemname':
                  properKey = 'ItemName';
                  break;
                case 'returnurl':
                  properKey = 'ReturnURL';
                  break;
                case 'clientbackurl':
                  properKey = 'ClientBackURL';
                  break;
                case 'choosepayment':
                  properKey = 'ChoosePayment';
                  break;
                case 'encrypttype':
                  properKey = 'EncryptType';
                  break;
                case 'paymenttype':
                  properKey = 'PaymentType';
                  break;
                case 'checkmacvalue':
                  properKey = 'CheckMacValue';
                  break;
              }

              input.name = properKey;
              input.value = ecRes[key];
              form.appendChild(input);

              console.log(`${key} = ${ecRes[key]}`);
            }
          }

          document.body.appendChild(form);
          form.submit();
        });
      },
      error: (err) => {
        console.error('建立訂單失敗', err);
        alert('建立訂單失敗，請稍後再試');
      },
    });
  }
}
