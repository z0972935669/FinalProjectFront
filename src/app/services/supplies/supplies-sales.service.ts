import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Isuppliessales, CreateSalesOrderDto, CreateSalesOrderResponse } from '../../interfaces/supplies/isuppliessales';

@Injectable({
  providedIn: 'root'
})
export class SuppliesSalesService {
  private apiUrlsales = 'https://localhost:7124/api/SuppliesSalesOrders'

  constructor(private http: HttpClient) { }

  getSuppliesSalesList(keyword: string = '', page: number = 1, pageSize: number = 10, status: string = ''): Observable<any> {
    let url = `${this.apiUrlsales}?page=${page}&pageSize=${pageSize}`;
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return this.http.get<any>(url); // 回傳物件 { totalCount, page, pageSize, totalPages, data }
  }

  addSuppliesSalesList(sales: CreateSalesOrderDto): Observable<CreateSalesOrderResponse> {
    return this.http.post<CreateSalesOrderResponse>(this.apiUrlsales, sales);
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    // 依照 API 規劃，這裡我假設是 /{id}/status
    return this.http.put(`${this.apiUrlsales}/${orderId}/status`, { status });
  }


}
