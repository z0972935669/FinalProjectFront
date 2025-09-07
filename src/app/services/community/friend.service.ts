import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Friend {
  id: number;
  name: string;
  photoUrl?: string;
  bio?: string;
}

export interface FriendRequestDto {
  requestID: number;      // 對應 RequestID
  requesterID: number;    // 對應 RequesterID
  requesteeID: number;    // 對應 ReceiverID
  sentAt: string;         // 對應 SentAt
  requesterName?: string; // 從後端獲取
  requestStatus: string; // 對應 RequestStatus
}

export interface FriendRequestRespondDto {
  RequestID: number;    // 修正：使用大寫 R
  Action: string;       // 修正：使用大寫 A，"Accepted" 或 "Rejected"
}

export interface UserSearchResult {
  id: number;
  name: string;
  photoUrl?: string;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = 'https://localhost:7124';

  constructor(private http: HttpClient) {}

  // 取得認證標頭
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken') || '';
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // 發送好友請求
  sendFriendRequest(receiverId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/CommunityFriend/request/${receiverId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // 回應好友請求
  respondFriendRequest(request: FriendRequestRespondDto): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/CommunityFriend/request/respond`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得好友列表
  getFriends(memberId: number): Observable<Friend[]> {
    return this.http.get<Friend[]>(
      `${this.apiUrl}/api/CommunityFriend/list/${memberId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得好友請求列表
  getFriendRequests(): Observable<FriendRequestDto[]> {
    const url = `${this.apiUrl}/api/CommunityFriend/requests`;
    // console.log('🔍 請求好友邀請 API:', url);

    return this.http.get<FriendRequestDto[]>(url, { headers: this.getAuthHeaders() }).pipe(
      // tap(requests => console.log('📡 API 回傳資料:', requests)),
      catchError(error => {
        console.error('❌ API 請求失敗:', error);
        return throwError(error);
      })
    );
  }

  // 搜尋用戶
  searchUsers(query: string): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(
      `${this.apiUrl}/api/CommunityFriend/search?query=${query}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 移除好友
  removeFriend(friendId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/api/CommunityFriend/friend/${friendId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 檢查是否為好友
  isFriend(memberId: number, friendId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/api/CommunityFriend/is-friend/${memberId}/${friendId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得好友統計
  getFriendStats(memberId: number): Observable<{ friendsCount: number; pendingRequestsCount: number }> {
    return this.http.get<{ friendsCount: number; pendingRequestsCount: number }>(
      `${this.apiUrl}/api/CommunityFriend/stats/${memberId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 檢查是否有對某人發出的待處理邀請（使用目前登入者）
  hasOutgoingRequest(receiverId: number) {
    return this.http.get<{ hasOutgoing: boolean }>(`api/CommunityFriend/request/outgoing/${receiverId}`);
  }
}
