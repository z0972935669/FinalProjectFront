import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  imports: [RouterModule,FormsModule],
  standalone: true,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  invoiceType: string = ''; // "Personal" 或 "Company"
  vehicleNumber: string = '';
  invoiceTitle: string = '';
  paymentMethod: string = ''; // 綁定付款方式
  deliveryMethod: string = '';

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
}
