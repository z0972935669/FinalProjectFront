import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Isuppliescategory } from '../../interfaces/supplies/isuppliescategory';

@Injectable({
  providedIn: 'root'
})
export class SuppliesCategoryService {
  private apiUrlsupcategory = 'https://localhost:7124/api/SuppliesCategories'

  constructor(private http: HttpClient) { }

  getSuppliesCategoryData(): Observable<Isuppliescategory[]> {
    return this.http.get<Isuppliescategory[]>(this.apiUrlsupcategory)
  }
}
