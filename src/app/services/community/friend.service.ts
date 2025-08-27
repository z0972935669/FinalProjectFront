import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Friend {
  id: number;
  name: string;
}

export interface FriendRequestDto {
  requestID: number;
  requesterID: number;
  receiverID: number;
  sentAt: string;
  requestStatus: string;
}

export interface FriendRequestRespondDto {
  requestID: number;
  action: string; // "Accepted" 或 "Rejected"
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = 'https://localhost:7124/api/CommunityFriend';

  constructor(private http: HttpClient) {}

  sendFriendRequest(receiverId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/request/${receiverId}`, {});
  }

  respondFriendRequest(dto: FriendRequestRespondDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/request/respond`, dto);
  }

  getFriends(memberId: number): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/list/${memberId}`);
  }

  getFriendRequests(): Observable<FriendRequestDto[]> {
    return this.http.get<FriendRequestDto[]>(`${this.apiUrl}/requests`);
  }
}
