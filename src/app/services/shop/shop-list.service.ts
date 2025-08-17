import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IShopCategory,
  IShopProductList,
} from '../../interfaces/shop/shop-list';
import { IShopProductDetail } from '../../interfaces/shop/shop-detail';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private apiUrl = 'https://localhost:7124/api/ShopProducts';

  constructor(private http: HttpClient) {}

  /** 商品分類列表 */
  getCategories(): Observable<IShopCategory[]> {
    return this.http.get<IShopCategory[]>(`${this.apiUrl}/categories`);
  }

  /** 商品清單（前台用） */
  getProducts(page: number, pageSize: number, categoryId?: number): Observable<any> {
    let url = `${this.apiUrl}/list?page=${page}&pageSize=${pageSize}`;
    if (categoryId && categoryId > 0) {
      url += `&categoryId=${categoryId}`;
    }
    return this.http.get<any>(url);
  }


  getProductDetail(slug: string): Observable<IShopProductDetail> {
    return this.http.get<IShopProductDetail>(`${this.apiUrl}/detail/${slug}`);
  }
}
