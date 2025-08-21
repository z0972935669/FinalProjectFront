import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { RoomDetail, RoomOccupancy } from '../../interfaces/room/room.interface';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoomDetailService {
  private apiUrl = 'https://localhost:7124/api/Rooms'; // 指定的編號去找房間資料

  constructor(private http: HttpClient) { }

  getRoomById(id: number): Observable<{ message: string, data: RoomDetail }> {
    return this.http.get<{ message: string, data: RoomDetail }>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.data && response.data.images) {
          response.data.images.forEach(img => console.log('API回傳的圖片路徑:', img));
        }
      }),
      catchError(err => {
        console.error('API錯誤:', err);
        return throwError(() => new Error('無法載入房間資料，請稍後重試'));
      })
    );
  }

  submitBooking(booking: RoomOccupancy): Observable<{ message: string, occupancyId: number }> {
    const bookingDto = {
      fBedId: booking.fBedId,
      fCheckInDate: new Date(booking.checkInDate || ''),
      fBillingAmount: booking.fBillingAmount || 0,
      fPaymentMethod: booking.paymentMethod
    };
    return this.http.post<{ message: string, occupancyId: number }>(`${this.apiUrl}/bookings`, bookingDto).pipe(
      catchError(err => {
        console.error('預訂API錯誤:', err);
        return throwError(() => new Error('預訂失敗，請檢查輸入或聯繫客服'));
      })
    );
  }
}
