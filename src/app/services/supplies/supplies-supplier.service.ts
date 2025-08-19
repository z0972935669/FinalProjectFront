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
}
