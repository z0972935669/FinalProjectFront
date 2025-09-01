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
}
