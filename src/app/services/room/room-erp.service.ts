import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaymentHistoryDto, RoomOccupancyDto, VisitReservation, PaymentHistory } from '../../interfaces/room/roomerp.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomErpService {
  private apiUrl = 'https://localhost:7124/api/RoomsErp';

  constructor(private http: HttpClient) { }

  // 1. 獲取繳費紀錄
  getPaymentHistory(): Observable<PaymentHistoryDto[]> {
    return this.http.get<PaymentHistoryDto[]>(`${this.apiUrl}/payment-histories`, { responseType: 'json' }).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('獲取繳費紀錄錯誤:', err);
        return throwError(() => new Error('無法載入繳費紀錄: ' + err.message + ' - Status: ' + err.status));
      })
    );
  }
  getPaymentHistoriesByOccupancyId(occupancyId: number): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.apiUrl}/payment-histories/${occupancyId}`, { responseType: 'json' }).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('獲取訂單明細錯誤:', err);
        return throwError(() => new Error('無法載入訂單明細: ' + err.message + ' - Status: ' + err.status));
      })
    );
  }

  // 2. 獲取預約參訪列表
  getVisitReservations(): Observable<VisitReservation[]> {
    return this.http.get<VisitReservation[]>(`${this.apiUrl}/visit-reservations`, { responseType: 'json' }).pipe(
      catchError(err => {
        console.error('獲取預約參訪錯誤:', err);
        return throwError(() => new Error('無法載入預約參訪列表'));
      })
    );
  }
  //2. 預約參訪列表批量更新日期
  batchUpdateDate(dto: { reservationIds: number[], newDate: Date }): Observable<any> {
    return this.http.put(`${this.apiUrl}/visit-reservations/batch-update-date`, dto).pipe(
      catchError(err => {
        console.error('批量更新錯誤:', err);
        return throwError(() => new Error('批量更新失敗'));
      })
    );
  }
  // 預約參訪列表批量更新聯絡狀態
  batchUpdateContactStatus(dto: { reservationIds: number[], newStatus: boolean }): Observable<any> {
    return this.http.put(`${this.apiUrl}/visit-reservations/batch-update-contact`, dto).pipe(
      catchError(err => {
        console.error('批量聯絡更新錯誤:', err);
        return throwError(() => new Error('批量聯絡更新失敗'));
      })
    );
  }

  // 預約參訪列表批量刪除
  batchDeleteReservations(dto: { reservationIds: number[] }): Observable<any> {
    return this.http.delete(`${this.apiUrl}/visit-reservations/batch-delete`, { body: dto }).pipe(
      catchError(err => {
        console.error('批量刪除錯誤:', err);
        return throwError(() => new Error('批量刪除失敗'));
      })
    );
  }
  // 2. 更新預約參訪狀態
  updateVisitStatus(reservationId: number, status: number): Observable<any> {
    console.log('Sending update request:', { reservationId, status });
    return this.http.put(`${this.apiUrl}/visit-reservations/${reservationId}/status`, status, { headers: { 'Content-Type': 'application/json' } }).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('更新預約狀態錯誤:', err);
        return throwError(() => new Error('更新狀態失敗: ' + err.message + ' - Status: ' + err.status));
      })
    );
  }

  // 3. 辦理入住
  createOccupancy(dto: RoomOccupancyDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/occupancy`, dto).pipe(
      catchError(err => {
        console.error('辦理入住錯誤:', err);
        return throwError(() => new Error('辦理入住失敗'));
      })
    );
  }

  // 獲取會員列表
  getMembers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members`).pipe(
      catchError(err => {
        console.error('獲取會員列表錯誤:', err);
        return throwError(() => new Error('無法載入會員列表'));
      })
    );
  }

  // 獲取房間列表
  getRooms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rooms`).pipe(
      catchError(err => {
        console.error('獲取房間列表錯誤:', err);
        return throwError(() => new Error('無法載入房間列表'));
      })
    );
  }

  // 獲取床位列表 (根據房間 ID)
  getBeds(roomId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rooms/${roomId}/beds`).pipe(
      catchError(err => {
        console.error('獲取床位列表錯誤:', err);
        return throwError(() => new Error('無法載入床位列表'));
      })
    );
  }
}
