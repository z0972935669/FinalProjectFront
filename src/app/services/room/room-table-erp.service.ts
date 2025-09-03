import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RoomTableErp } from '../../interfaces/room/roomerp.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomTableErpService {
  private apiUrl = 'https://localhost:7124/api/RoomsErp';

  constructor(private http: HttpClient) { }

  getRooms(): Observable<{ data: RoomTableErp[] }> {
    return this.http.get<{ data: RoomTableErp[] }>(this.apiUrl).pipe(
      catchError(error => {
        console.error('獲取房間列表失敗', error);
        return throwError(() => new Error('無法獲取房間列表，請稍後重試'));
      })
    );
  }

  createRoom(formData: FormData): Observable<{ message: string, roomId: number }> {
    return this.http.post<{ message: string, roomId: number }>(this.apiUrl, formData).pipe(
      catchError(error => {
        console.error('新增房間失敗', error);
        return throwError(() => new Error(error.error?.message || '無法新增房間，請檢查輸入數據'));
      })
    );
  }

  updateRoom(roomId: number, formData: FormData): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${roomId}`, formData).pipe(
      catchError(error => {
        console.error('更新房間失敗', error);
        return throwError(() => new Error(error.error?.message || '無法更新房間，請檢查輸入數據'));
      })
    );
  }

  deleteRoom(roomId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${roomId}`).pipe(
      catchError(error => {
        console.error('刪除房間失敗', error);
        return throwError(() => new Error('無法刪除房間，請稍後重試'));
      })
    );
  }

  toggleRoomStatus(roomId: number, newStatus: string): Observable<{ message: string }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${roomId}/status`, `"${newStatus}"`, { headers }).pipe(
      catchError(error => {
        console.error('切換房間狀態失敗', error);
        return throwError(() => new Error('無法切換房間狀態，請稍後重試'));
      })
    );
  }

  // 新增: 離院 API 呼叫
  checkoutOccupancies(occupancyIds: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/checkout`, occupancyIds).pipe(
      catchError(error => {
        console.error('離院失敗', error);
        return throwError(() => new Error(error.error?.message || '離院失敗，請檢查輸入數據'));
      })
    );
  }
}
