import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { RoomDetail, RoomOccupancy } from '../../interfaces/room/room.interface';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoomDetailService {
  private apiUrl = 'https://localhost:7124/api/Rooms';
  private memberApiUrl = 'https://localhost:7124/api/Member';

  constructor(private http: HttpClient) { }

  getRoomById(id: number): Observable<{ message: string, data: RoomDetail }> {
    return this.http.get<{ message: string, data: RoomDetail }>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.data && response.data.images) {
          // response.data.images.forEach(img => console.log('API回傳的圖片路徑:', img));
        }
      }),
      catchError(err => {
        console.error('API錯誤:', err);
        return throwError(() => new Error('無法載入房間資料，請稍後重試'));
      })
    );
  }

  getCurrentMember(): Observable<any> {
    return this.http.get<any>(`${this.memberApiUrl}/me`).pipe(
      catchError(err => {
        console.error('獲取會員資訊錯誤:', err);
        return throwError(() => err);
      })
    );
  }

  submitBooking(booking: RoomOccupancy): Observable<{ message: string, occupancyId: number }> {
    const bookingDto = {
      FBedId: booking.fBedId,
      FCheckInDate: new Date(booking.checkInDate).toISOString(),
      FBillingAmount: booking.fBillingAmount,
      FPaymentMethod: booking.paymentMethod,
      FPaypalOrderId: booking.paypalOrderId || '' // 確保傳遞字符串
    };
    return this.http.post<{ message: string, occupancyId: number }>(`${this.apiUrl}/bookings`, bookingDto).pipe(
      catchError(err => {
        console.error('預訂API錯誤:', err);
        return throwError(() => new Error('預訂失敗，請檢查輸入或聯繫客服'));
      })
    );
  }
}
