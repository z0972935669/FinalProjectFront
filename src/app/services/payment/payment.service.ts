import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ECPayRequest } from '../../interfaces/payment/ecpay.interface';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = 'https://localhost:7124/api/ECPay';

  constructor(private http: HttpClient) {}

  // 建立 ECPay 訂單
  createOrder(order: ECPayRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/CreateOrder`, order);
  }
}
