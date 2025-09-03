import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Conversation {
  id: number;
  memberName: string;
  memberAccount: string;
  latestMessage: string;
  status: '等待' | '進行中' | '已完成';
  waitTime: number;
  messages: { sender: string; content: string; timestamp: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomerServiceService {
  private apiUrl = 'https://localhost:7124/api/communityconversations'; // 替換為您的 API 網址

  constructor(private http: HttpClient) {}

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}`);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }

  getMessages(ticketId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${ticketId}/messages`);
  }
}
