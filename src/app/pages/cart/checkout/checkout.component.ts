import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order/order.service';
import { Order } from '../../../interfaces/order/order.interface';
import { CartService, CartItem } from '../../../services/cart/cart.service';
import { TrimPipe } from '../../../pipes/cart/checkout.pipe';
import {
  MemberInfo,
  MemberService,
} from '../../../services/member/member.service';
import { CityService } from '../../../services/city/checkout-city.service';
import { PaymentService } from '../../../services/payment/payment.service';
import { ECPayRequest } from '../../../interfaces/payment/ecpay.interface';
import { CurrencyPipe } from '@angular/common';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterModule, FormsModule, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  providers: [TrimPipe],
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
    public trimPipe: TrimPipe,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.items = this.cartService.getCart();

    // 取得縣市清單
    this.cityService.getCities().subscribe({
      next: (res: any) => {
        this.cityData = res;
        this.cities = Object.keys(res);
      },
      error: (err) => console.error('載入城市資料失敗', err),
    });

    this.memberSvc.getMemberInfo().subscribe({
      next: (me: MemberInfo) => {
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
      this.districts = this.cityData[this.city];
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

  // 一鍵帶入假資料（Credit / COD)
  fillFake(kind: 'Credit' | 'COD') {
    // 基本資料
    if (kind === 'Credit') {
      this.buyerName = '王小明';
      this.receiverName = '王小明';
      this.receiverPhone = '0912345678';
      this.paymentMethod = 'Credit';
      this.invoiceType = '載具';
      this.vehicleNumber = '/AB123456'; // 隨機載具
      this.invoiceTitle = '';
      this.invoiceTax = '';
      this.note = '測試用－信用卡';
    } else {
      this.buyerName = '李小華';
      this.receiverName = '李小華';
      this.receiverPhone = '0987654321';
      this.paymentMethod = 'COD';
      this.invoiceType = '三聯式發票';
      this.invoiceTitle = '御景長村';
      this.invoiceTax = '12345678';
      this.vehicleNumber = '';
      this.note = '測試用－貨到付款';
    }

    // 地址（盡量選到存在的縣市/區）
    const preferCity = kind === 'COD' ? '新北市' : '台北市';
    const fallbackCity = Object.keys(this.cityData)[0] ?? '';
    this.city = this.cityData[preferCity] ? preferCity : fallbackCity;
    this.onCityChange();

    const preferDistrict = kind === 'COD' ? '板橋區' : '中正區';
    const list = this.cityData[this.city] || [];
    this.district = list.includes(preferDistrict)
      ? preferDistrict
      : list[0] || '';
    this.streetAddress =
      kind === 'COD' ? '文化路一段 1 號' : '忠孝東路一段 1 號';

    // 配送方式（依付款方式自動選）
    const preferDelivery = kind === 'COD' ? 'CVS_711_COD' : 'CVS_711';
    const available = this.availableDeliveryMethods.map((x) => x.value);
    this.deliveryMethod = available.includes(preferDelivery)
      ? preferDelivery
      : available[0] || '';
  }

  async placeOrder() {
    // SweetAlert2 確認視窗
    const ok = await Swal.fire({
      title: '確認送出訂單？',
      html: `總金額 <b>${this.totalAmount.toLocaleString()}</b> 元`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '送出',
      cancelButtonText: '再看看',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#888',
    });

    if (!ok.isConfirmed) return; // 使用者取消

    const fullAddress = `${this.city}${this.district}${this.streetAddress}`;

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
      next: async (res) => {
        // 後端回傳的訂單編號（請確保後端有其一）
        const merchantTradeNo: string = res.merchantTradeNo ?? res.orderNo;

        // === 貨到付款：直接扣庫存 + 清空 + 導成功頁 ===
        if (this.paymentMethod === 'COD') {
          try {
            // 扣庫存（後端 /api/Checkout/DeductStock）
            await firstValueFrom(this.orderService.deductStock(res.orderNo));
          } catch (e) {
            console.error('扣庫存失敗', e);
            // 不中斷使用者流程，但給提醒
            await Swal.fire({
              icon: 'warning',
              title: '訂單已建立，但扣庫存失敗',
              text: '請稍後到訂單查詢或聯繫客服處理。',
            });
          }

          // 清空購物車 + 成功提示 + 導頁（與你原本一致）
          this.cartService.clearCart();
          await Swal.fire({
            icon: 'success',
            title: '下單成功',
            text: '您的訂單已成立，將為您導向成功頁。',
            timer: 1400,
            showConfirmButton: false,
          });
          this.router.navigateByUrl(
            `/show/checkoutsuccessful?orderNo=${merchantTradeNo}`
          );
          return;
        }

        // === 線上付款：帶 orderNo 回前端成功頁，待確認已付款後再清空 ===
        const clientBackUrl = `${window.location.origin}/show/checkoutsuccessful?orderNo=${merchantTradeNo}`;

        // Step 2: 產生 ECPay 訂單請求（後端會補上 CheckMacValue 等欄位）
        const ecpayRequest: ECPayRequest = {
          MerchantTradeNo: merchantTradeNo,
          TotalAmount: this.totalAmount,
          ItemName: this.items.map((i) => `${i.name} x${i.quantity}`).join('#'),
          ChoosePayment: this.paymentMethod,
          ClientBackURL: clientBackUrl, // 關鍵：帶回成功頁
        };

        const ecRes = await firstValueFrom(
          this.paymentService.createOrder(ecpayRequest)
        );

        // 小提示（非必要）
        await Swal.fire({
          icon: 'info',
          title: '前往綠界付款',
          text: '即將前往付款頁面，請勿關閉視窗。',
          timer: 1000,
          showConfirmButton: false,
        });

        // Step 3: 自動產生 form 跳轉綠界
        const form = document.createElement('form');
        form.method = 'POST';
        form.action =
          'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

        for (const key in ecRes) {
          if (!ecRes.hasOwnProperty(key)) continue;

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
        }

        document.body.appendChild(form);
        form.submit();
      },
      error: async (err) => {
        console.error('建立訂單失敗', err);
        await Swal.fire({
          icon: 'error',
          title: '下單失敗',
          text: '',
        });
      },
    });
  }
}
