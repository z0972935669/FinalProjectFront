import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Isuppliessupplier } from '../../interfaces/supplies/isuppliessupplier';

@Injectable({
  providedIn: 'root'
})
export class SuppliesSupplierService {
  private apiUrlsupplier = 'https://localhost:7124/api/SuppliesSuppliers'

  constructor(private http: HttpClient) { }

  getSuppliesSupplierData(): Observable<Isuppliessupplier[]> {
    return this.http.get<Isuppliessupplier[]>(this.apiUrlsupplier)
  }
  addSuppliesSupplier(supplier: Isuppliessupplier): Observable<Isuppliessupplier> {
    return this.http.post<Isuppliessupplier>(this.apiUrlsupplier, supplier)
  }
  editSuppliesSupplier(supplier: Isuppliessupplier): Observable<Isuppliessupplier> {
    const url = `${this.apiUrlsupplier}/${supplier.suppliesSupplierId}`;
    return this.http.put<Isuppliessupplier>(url, supplier)
  }

  searchSuppliers(keyword: string = '', page: number = 1, pageSize: number = 10, continued: '' | 'true' | 'false' = ''): Observable<any> {
    let url = `${this.apiUrlsupplier}/search?page=${page}&pageSize=${pageSize}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (continued === 'true') url += `&continued=true`;
    if (continued === 'false') url += `&continued=false`;
    return this.http.get<any>(url);// 回傳 { totalCount, totalPages, page, pageSize, data }
  }
}
