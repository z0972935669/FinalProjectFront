import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // 🔹 這行保證整個應用程式都能注入
})
export class AiChatService {
  constructor(private http: HttpClient) {}

  // 送整段對話到後端，由後端呼叫 AI provider
  sendMessage(
    conversation: Array<{ role: string; content: string }>
  ): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      'https://localhost:7124/api/ai/chat',
      { conversation }
    );
  }

  // 轉人工：後端可建立工單、通知客服或傳到第三方工單系統
  escalate(payload: {
    conversation: any;
    meta?: any;
  }): Observable<{ ticketId?: string; agentContact?: string }> {
    return this.http.post<{ ticketId?: string; agentContact?: string }>(
      'https://localhost:7124/api/escalate',
      payload
    );
  }
}
