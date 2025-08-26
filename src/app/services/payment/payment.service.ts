import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // ← 加入 HttpParams
import { Observable } from 'rxjs';
import { ECPayRequest } from '../../interfaces/payment/ecpay.interface';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = 'https://localhost:7124/api/ECPay'; // 視情況調整

  constructor(private http: HttpClient) {}

  // 建立 ECPay 訂單
  createOrder(order: ECPayRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/CreateOrder`, order);
  }

  // 查詢訂單狀態
  getOrderStatus(
    merchantTradeNo: string
  ): Observable<{ merchantTradeNo: string; status: string }> {
    const params = new HttpParams().set('merchantTradeNo', merchantTradeNo);
    return this.http.get<{ merchantTradeNo: string; status: string }>(
      `${this.apiUrl}/Status`,
      { params }
    );
  }
}
