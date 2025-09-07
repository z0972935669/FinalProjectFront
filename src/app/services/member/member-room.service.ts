import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MemberRoomData } from '../../interfaces/room/room.interface';

@Injectable({
  providedIn: 'root'
})
export class MemberRoomService {
  private apiUrl = 'https://localhost:7124/api/MemberMyRoom/room'; // 確認路徑

  constructor(private http: HttpClient) { }

  getMemberRoom(): Observable<MemberRoomData> {
    return this.http.get<MemberRoomData>(this.apiUrl).pipe(
      tap(response => {
        console.log('API 回傳的房間資料:', response);
      }),
      catchError(err => {
        console.error('獲取房間資料錯誤:', err);
        return throwError(() => new Error('無法載入房間資料，請聯繫客服'));
      })
    );
  }

  recordPayment(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/record-payment`, dto).pipe(
      catchError(err => {
        console.error('記錄支付錯誤:', err);
        return throwError(() => new Error('繳費記錄失敗'));
      })
    );
  }
}
