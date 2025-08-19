import { Isuppliessupplier } from './../../interfaces/supplies/isuppliessupplier';
import { Injectable } from '@angular/core';
import { Isupplieslist } from '../../interfaces/supplies/isupplieslist';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuppliesListService {
  private apiUrlsup = 'https://localhost:7124/api/SuppliesProducts'

  constructor(private http: HttpClient) { }

  getSuppliesData(): Observable<Isupplieslist[]> {
    return this.http.get<Isupplieslist[]>(this.apiUrlsup);
  }

}
