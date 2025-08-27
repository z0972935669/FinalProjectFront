import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room, RoomVisitReservation } from '../../interfaces/room/room.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomListService {
  private baseApiUrl = 'https://localhost:7124/api/Rooms';

  constructor(private http: HttpClient) { }

  getRooms(): Observable<{ message: string, data: Room[] }> {
    return this.http.get<{ message: string, data: Room[] }>(this.baseApiUrl);
  }

  submitReservation(reservation: RoomVisitReservation): Observable<{ message: string, data: number }> {
    return this.http.post<{ message: string, data: number }>(`${this.baseApiUrl}/reservations`, reservation);
  }
}

