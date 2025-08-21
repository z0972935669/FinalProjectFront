import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room } from '../../interfaces/room/room.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomSwiperService {
  private apiUrl = 'https://localhost:7124/api/Rooms'; //Home房間資訊 圖片.名子.敘述.價格
  constructor(private http: HttpClient) { }

  getRooms(): Observable<{ message: string, data: Room[] }> {
    return this.http.get<{ message: string, data: Room[] }>(this.apiUrl);
  }
}
