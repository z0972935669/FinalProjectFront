import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CityService {
  constructor(private http: HttpClient) {}

  getCities(): Observable<string[]> {
    return this.http.get<string[]>('https://localhost:7124/api/city/cities');
  }

  getDistricts(city: string): Observable<string[]> {
    return this.http.get<string[]>(
      `https://localhost:7124/api/city/districts/${encodeURIComponent(city)}`
    );
  }
}
