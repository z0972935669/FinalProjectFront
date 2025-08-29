// src/app/services/order/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../../interfaces/order/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'https://localhost:7124/api/Checkout';

  constructor(private http: HttpClient) {}

  createOrder(order: Order): Observable<any> {
    return this.http.post(this.apiUrl, order);
  }

  // 新增：扣庫存（後端請提供對應端點；此處以 POST /DeductStock 為例
  deductStock(orderNo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeductStock`, { orderNo });
  }
}
