import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { CustomerServiceService } from '../../../services/community/CustomerService.service'; // 添加匯入

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface ChatMessage {
  messageId: number;
  ticketId: number;
  senderType: string;
  content: string;
  sentAt: string;
}

interface AIChatResponse {
  aiReply: string; // 對應你後端 API 回傳的 JSON 屬性
}

interface Conversation {
  // 移除不相關的屬性，因為此組件不需要
}

@Component({
  selector: 'app-customer-service',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './customer-service.component.html',
  styleUrls: ['./customer-service.component.scss'],
})
export class CustomerServiceComponent implements AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  userInput: string = '';
  chatLog: Message[] = [];
  isComposing: boolean = false;
  isAIResponding: boolean = false;
  hubConnection: HubConnection | null = null;
  ticketId: number | null = null; // 儲存 ticket ID
  isHumanMode: boolean = false; // 添加狀態
  // 移除不相關的屬性：conversations, pageSize, currentPage

  constructor(private http: HttpClient, private customerService: CustomerServiceService) {} // 注入服務

  ngAfterViewInit() {
    const openingMessage = '您好，我是AI客服，有任何問題都可以問我喔！';
    const index = this.chatLog.push({ role: 'ai', content: '' }) - 1;
    this.animateAIResponse(index, openingMessage);
  }

  ngOnInit() {
    this.startSignalRConnection();
    // 移除 loadConversations，因為此組件不需要
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    if (this.isHumanMode) {
      const memberId = this.getMemberIdFromToken();
      if (!this.ticketId || !memberId) {
        console.error('ticketId 或 memberId 為 null，無法發送訊息');
        return;
      }
      // 人工模式：發送訊息給人工客服
      console.log('發送訊息:', this.ticketId, memberId, this.userInput); // 添加日誌
      this.hubConnection?.invoke('SendMessage', this.ticketId, memberId, this.userInput)
        .then(() => console.log('訊息發送成功'))
        .catch(err => console.error('訊息發送失敗:', err)); // 添加錯誤處理
      this.chatLog.push({ role: 'user', content: this.userInput }); // 立即推送用戶訊息
      // 移除 API 呼叫，因為 SignalR 已處理儲存
      this.userInput = '';
      this.scrollToBottom();
    } else {
      // AI 模式：呼叫 AI API
      this.chatLog.push({ role: 'user', content: this.userInput });
      this.isAIResponding = true;

      this.http.post<AIChatResponse>('https://localhost:7124/api/Chat/ai-chat', {
        userMessage: this.userInput
      }).subscribe({
        next: (response) => {
          this.chatLog.push({ role: 'ai', content: response.aiReply });
          this.isAIResponding = false;
          this.scrollToBottom();
        },
        error: (err) => {
          console.error('AI 回應失敗:', err);
          this.chatLog.push({ role: 'ai', content: '抱歉，AI 服務暫時無法回應。' });
          this.isAIResponding = false;
          this.scrollToBottom();
        }
      });
    }

    this.userInput = '';
    this.scrollToBottom();
  }

  private animateAIResponse(index: number, text: string) {
    // 先將 typing 改為 ai
    this.chatLog[index].role = 'ai';
    let i = 0;
    const interval = setInterval(() => {
      this.chatLog[index].content =
        text.slice(0, i + 1) + (i < text.length ? '▌' : '');
      i++;
      this.scrollToBottom();
      if (i > text.length) {
        clearInterval(interval);
        this.chatLog[index].content = text; // 完整文字
        this.isAIResponding = false;
      }
    }, 30); // 每 30ms 打出一個字
  }

  // 處理 Enter 鍵事件
  onEnter(event: Event) {
    const e = event as KeyboardEvent; // 強制轉型成 KeyboardEvent
    if (!this.isComposing) {
      e.preventDefault(); // 避免換行
      this.sendMessage();
    }
  }

  onCompositionStart() {
    this.isComposing = true;
  }

  onCompositionEnd() {
    this.isComposing = false;
  }

  ngAfterViewChecked() {
    // 只在需要時滾動
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        const container = this.chatContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }

  private getMemberIdFromToken(): number | null {
    const token = localStorage.getItem('jwtToken'); // 假設 Token 存儲在 localStorage
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // 解碼 JWT payload
      return parseInt(payload.MemberId, 10);
    } catch (error) {
      console.error('解析 Token 失敗:', error);
      return null;
    }
  }

  startSignalRConnection(): void {
    if (this.hubConnection) return; // 避免重複連線
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7124/customerServiceHub', { // 切換到新 Hub
        accessTokenFactory: () => localStorage.getItem('jwtToken') || ''
      })
      .build();

    this.hubConnection.on('ReceiveMessage', (ticketId, senderId, senderName, message, timestamp, senderType) => { // 添加 senderType
      if (this.isHumanMode && this.ticketId === parseInt(ticketId)) {
        const role = senderType === 'staff' ? 'ai' : 'user'; // 客服為 'ai'，用戶為 'user'
        this.chatLog.push({ role, content: message });
        this.scrollToBottom();
      }
    });

    this.hubConnection.start().catch(err => {
      console.error('SignalR 連線失敗:', err);
    });
  }

  transferToHuman() {
    if (this.isAIResponding) return;

    const memberId = this.getMemberIdFromToken();
    if (!memberId) {
      this.chatLog.push({ role: 'ai', content: '請先登入以轉接人工客服。' });
      this.scrollToBottom();
      return;
    }

    const title = '轉人工客服請求';
    const category = '客服';
    const priority = '高';

    // 更新為新 API 端點
    this.http.post('https://localhost:7124/api/CommunityCustomerService/member/tickets', {
      memberId,
      category,
      priority,
      subject: title,
      initialMessage: '用戶請求轉人工客服'
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    }).subscribe({
      next: (response: any) => {
        console.log('Ticket 建立成功:', response.ticketId);
        this.ticketId = response.ticketId;
        if (this.ticketId && memberId) {
          this.hubConnection?.invoke('JoinConversation', this.ticketId, memberId)
            .then(() => console.log('加入房間成功'))
            .catch(err => console.error('加入房間失敗:', err));
        }
        this.loadMessageHistory();
        this.isHumanMode = true;
        this.chatLog.push({ role: 'ai', content: '已轉接人工客服，請稍候...' });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('轉人工失敗:', err);
        this.chatLog.push({ role: 'ai', content: '轉人工失敗，請稍後再試。' });
        this.scrollToBottom();
      }
    });
  }

  loadMessageHistory(): void {
    if (!this.ticketId) return;
    // 添加泛型 <any[]> 以修正類型錯誤
    this.http.get<any[]>(`https://localhost:7124/api/CommunityCustomerService/member/tickets/${this.ticketId}/messages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    }).subscribe({
      next: (messages: any[]) => {
        messages.forEach((msg: any) => {
          this.chatLog.push({
            role: msg.senderType === 'member' ? 'user' : 'ai',
            content: msg.content
          });
        });
        this.scrollToBottom();
      },
      error: (err) => console.error('載入歷史訊息失敗:', err)
    });
  }

  // 移除不相關的方法：loadConversations, nextPage, prevPage, sortConversations
}
