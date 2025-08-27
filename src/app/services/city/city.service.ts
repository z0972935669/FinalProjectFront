// src/app/services/city.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type CityMap = Record<string, string[]>;

@Injectable({ providedIn: 'root' })
export class CityService {
  private http = inject(HttpClient);
  private readonly base = 'https://localhost:7124/api/city';

  // 記憶體快取（整張縣市→區域對照）
  private cityMap$?: Observable<CityMap>;

  /** 一次拉回全對照表，shareReplay(1) 讓全站共用同一份 */
  getCityMap(): Observable<CityMap> {
    if (!this.cityMap$) {
      this.cityMap$ = this.http
        .get<CityMap>(`${this.base}/cities`)
        .pipe(shareReplay(1));
    }
    return this.cityMap$;
  }

  /** 取所有縣市清單 */
  getCityList(): Observable<string[]> {
    return this.getCityMap().pipe(map(m => Object.keys(m)));
  }

  /** 取單一縣市的區域清單 */
  getDistricts(city: string): Observable<string[]> {
    if (!city) return of([]);
    return this.getCityMap().pipe(map(m => m[city] ?? []));
  }

  /** 若後端資料更新，手動重抓 */
  refresh(): void {
    this.cityMap$ = undefined;
  }
}
