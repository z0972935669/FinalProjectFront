// src/app/services/room/room-table-erp.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoomTableErp } from '../../interfaces/room/roomerp.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomTableErpService {
  private apiUrl = 'https://localhost:7124/api/RoomsErp'; // 修正為 RoomsErp

  constructor(private http: HttpClient) { }

  getRooms(): Observable<{ message: string, data: RoomTableErp[] }> {
    return this.http.get<{ message: string, data: RoomTableErp[] }>(this.apiUrl);
  }

  createRoom(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  updateRoom(roomId: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${roomId}`, formData);
  }

  deleteRoom(roomId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${roomId}`);
  }

  toggleRoomStatus(roomId: number, newStatus: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${roomId}/status`, { status: newStatus });
  }
}
