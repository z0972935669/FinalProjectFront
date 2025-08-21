import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room, RoomVisitReservation } from '../../interfaces/room/room.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomListService {
  private baseApiUrl = 'https://localhost:7124/api/Rooms'; // 基底 URL 用於 getRooms

  constructor(private http: HttpClient) { }

  getRooms(): Observable<{ message: string, data: Room[] }> {
    return this.http.get<{ message: string, data: Room[] }>(this.baseApiUrl); // /api/Rooms
  }

  submitReservation(reservation: RoomVisitReservation): Observable<{ message: string, data: number }> {
    // 如果後端需要 fCheckInDate，可在這裡添加：{ ...reservation, fCheckInDate: reservation.fReservationDate }
    // 但目前介面無此屬性，建議調整後端 DTO
    return this.http.post<{ message: string, data: number }>(`${this.baseApiUrl}/reservations`, reservation); // 用 /reservations (複數)
  }
}
