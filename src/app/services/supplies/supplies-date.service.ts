import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Isuppliesdate } from '../../interfaces/supplies/isuppliesdate';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuppliesDateService {
  private apiUrldate = 'https://localhost:7124/api/SuppliesProductsDates'

  constructor(private http: HttpClient) { }

  getSuppliesDateData(): Observable<Isuppliesdate[]> {
    return this.http.get<Isuppliesdate[]>(this.apiUrldate);
  }

  getSuppliesDateDataById(suppliesProductsDateID: number): Observable<Isuppliesdate> {
    const url = `${this.apiUrldate}/${suppliesProductsDateID}`;
    return this.http.get<Isuppliesdate>(url);
  }
}
