import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Isuppliessales } from '../../interfaces/supplies/isuppliessales';

@Injectable({
  providedIn: 'root'
})
export class SuppliesSalesService {
  private apiUrlsales = 'https://localhost:7124/api/SuppliesSalesOrders'

  constructor(private http: HttpClient) { }

  getSuppliesSalesList(): Observable<Isuppliessales[]> {
    return this.http.get<Isuppliessales[]>(this.apiUrlsales)
  }
}
