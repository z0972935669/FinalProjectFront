import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Isuppliespurchasing } from '../../interfaces/supplies/isuppliespurchasing';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuppliesPurchasingService {
  private apiUrlpurchase = 'https://localhost:7124/api/SuppliesPurchasing'

  constructor(private http: HttpClient) { }

  getSuppliesPurchasingList(): Observable<Isuppliespurchasing[]> {
    return this.http.get<Isuppliespurchasing[]>(this.apiUrlpurchase)
  }

  // 新增查詢 + 分頁
  searchPurchasingOrders(keyword: string = '', page: number = 1, pageSize: number = 10) {
    let url = `${this.apiUrlpurchase}/search?page=${page}&pageSize=${pageSize}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    return this.http.get<any>(url); // { totalCount, totalPages, page, pageSize, data }
  }

  // 新增進貨單
  createPurchasingOrder(order: any) {
    return this.http.post(`${this.apiUrlpurchase}/CreatePurchasingOrder`, order, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
