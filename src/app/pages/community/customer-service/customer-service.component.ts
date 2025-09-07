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

  constructor(
    private http: HttpClient,
    private customerService: CustomerServiceService
  ) {} // 注入服務

  ngAfterViewInit() {
    const openingMessage =
      '您好，我是AI客服，有任何問題都可以問我喔！\n\n我可以回答你各種我們安養院的問題。\n\n如果需要人工服務，請點擊「轉人工客服」按鈕。';

    const rawContent = openingMessage; // 原始純文字
    const formattedContent = this.formatAIResponse(openingMessage); // 格式化 HTML

    const index = this.chatLog.push({ role: 'ai', content: '' }) - 1;
    this.animateAIResponse(index, rawContent, formattedContent);
  }

  ngOnInit() {
    this.startSignalRConnection();
    // 移除 loadConversations，因為此組件不需要
  }

  // 格式化 AI 回應的方法
  private formatAIResponse(content: string): string {
    if (!content) return '';

    return (
      content
        // 處理換行符號
        .replace(/\n/g, '<br>')

        // 處理項目符號列表 (- 開頭或 • 開頭)
        .replace(/^[-•]\s(.+)$/gm, '• $1')

        // 處理數字列表 (1. 2. 3. 開頭)
        .replace(/^(\d+\.)\s(.+)$/gm, '<strong>$1</strong> $2')

        // 處理粗體 **text** 或 __text__
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')

        // 處理斜體 *text* 或 _text_ (避免與粗體衝突)
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')

        // 處理行內代碼 `code`
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // 處理多行代碼塊 ```code```
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

        // 處理分隔線
        .replace(/^---$/gm, '<hr>')

        // 處理標題 (### ## #)
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')

        // 處理引用 > text
        .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')

        // 處理簡單的連結 [text](url)
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank">$1</a>'
        )

        // 處理段落 (雙換行變成段落)
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/, '<p>$1</p>')

        // 清理多餘的空段落
        .replace(/<p><\/p>/g, '')
        .replace(/<p><br><\/p>/g, '')
    );
  }

  // 發送訊息方法
  sendMessage() {
    if (!this.userInput.trim()) return;

    if (this.isHumanMode) {
      const memberId = this.getMemberIdFromToken();
      if (!this.ticketId || !memberId) {
        console.error('ticketId 或 memberId 為 null，無法發送訊息');
        return;
      }

      // console.log('發送訊息:', this.ticketId, memberId, this.userInput);
      this.hubConnection
        ?.invoke('SendMessage', this.ticketId, memberId, this.userInput)
        .then(() => console.log('訊息發送成功'))
        .catch((err) => console.error('訊息發送失敗:', err));

      this.userInput = '';
      this.scrollToBottom();
    } else {
      // AI 模式：呼叫 AI API
      this.chatLog.push({ role: 'user', content: this.userInput });
      this.isAIResponding = true;

      this.http
        .post<AIChatResponse>('https://localhost:7124/api/Chat/ai-chat', {
          userMessage: this.userInput,
        })
        .subscribe({
          next: (response) => {
            const rawContent = response.aiReply; // 原始純文字
            const formattedContent = this.formatAIResponse(rawContent); // 格式化 HTML

            // 使用動畫效果顯示原始內容
            const index = this.chatLog.push({ role: 'ai', content: '' }) - 1;
            this.animateAIResponse(index, rawContent, formattedContent); // 傳入原始和格式化

            this.isAIResponding = false;
          },
          error: (err) => {
            console.error('AI 回應失敗:', err);
            this.chatLog.push({
              role: 'ai',
              content: '抱歉，智能客服暫時無法回應。',
            });
            this.isAIResponding = false;
            this.scrollToBottom();
          },
        });
    }

    this.userInput = '';
    this.scrollToBottom();
  }

  // animateAIResponse，接受原始和格式化內容
  private animateAIResponse(index: number, rawContent: string, formattedContent: string) {
    this.chatLog[index].role = 'ai';
    this.chatLog[index].content = '';

    let i = 0;
    const interval = setInterval(() => {
      this.chatLog[index].content += rawContent[i]; // 逐字顯示原始文字
      i++;
      this.scrollToBottom();

      if (i >= rawContent.length) {
        clearInterval(interval);
        this.chatLog[index].content = formattedContent; // 動畫完成後應用格式化 HTML
        this.isAIResponding = false;
      }
    }, 20); // 調整速度（毫秒）
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
      .withUrl('https://localhost:7124/customerServiceHub', {
        // 切換到新 Hub
        accessTokenFactory: () => localStorage.getItem('jwtToken') || '',
      })
      .build();

    this.hubConnection.on(
      'ReceiveMessage',
      (ticketId, senderId, senderName, message, timestamp, senderType) => {
        console.log('收到訊息:', {
          ticketId,
          senderId,
          senderName,
          message,
          senderType,
        });
        if (this.isHumanMode && this.ticketId === parseInt(ticketId)) {
          const role = senderType === 'staff' ? 'ai' : 'user'; // 客服為 'ai'，用戶為 'user'
          this.chatLog.push({ role, content: message });
          this.scrollToBottom();
        }
      }
    );

    this.hubConnection.start().catch((err) => {
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

    // 檢查會員的所有 ticket，過濾狀態為 "等待" 或 "進行中"
    this.http
      .get<any[]>(
        'https://localhost:7124/api/CommunityCustomerService/member/tickets',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          },
          withCredentials: true,
        }
      )
      .subscribe({
        next: (tickets) => {
          // 過濾狀態為 "等待" 或 "進行中" 的 ticket
          const openTickets = tickets.filter(
            (t) => t.status === '等待' || t.status === '進行中'
          );
          if (openTickets.length > 0) {
            // 使用現有的 open ticket（假設取最新的）
            const existingTicket = openTickets[0]; // 或根據 updatedAt 排序取最新
            this.ticketId = existingTicket.ticketId;
            // 儲存到本地
            localStorage.setItem(
              `openTicket_${memberId}`,
              this.ticketId!.toString()
            );
            // console.log('使用現有 ticket:', this.ticketId);
            // 加入對話
            this.hubConnection
              ?.invoke('JoinConversation', this.ticketId, memberId)
              .then(() => {
                // console.log('加入現有房間成功');
                this.loadMessageHistory();
                this.isHumanMode = true;
                this.chatLog.push({
                  role: 'ai',
                  content: '已繼續您之前的對話，請稍候客服回應...',
                });
                this.scrollToBottom();
              })
              .catch((err) => {
                console.error('加入現有房間失敗:', err);
                this.chatLog.push({
                  role: 'ai',
                  content: '繼續對話失敗，請稍後再試。',
                });
                this.scrollToBottom();
              });
          } else {
            // 沒有 open ticket，建立新的
            this.createNewTicket(memberId);
          }
        },
        error: (err) => {
          console.error('檢查 tickets 失敗:', err);
          // 如果檢查失敗，假設沒有 open ticket，建立新 ticket
          this.createNewTicket(memberId);
        },
      });
  }

  // createNewTicket，儲存 ticket ID
  private createNewTicket(memberId: number) {
    const title = '轉人工客服請求';
    const category = '客服';
    const priority = '高';
    const status = '等待'; // 設定狀態為 '等待'

    this.http
      .post(
        'https://localhost:7124/api/CommunityCustomerService/member/tickets',
        {
          memberId,
          category,
          priority,
          subject: title,
          initialMessage: '請求轉人工客服',
          status, // 新增狀態欄位
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          },
          withCredentials: true,
        }
      )
      .subscribe({
        next: (response: any) => {
          // console.log('新 Ticket 建立成功:', response.ticketId);
          this.ticketId = response.ticketId;
          // 儲存到本地
          localStorage.setItem(
            `openTicket_${memberId}`,
            this.ticketId!.toString() // 使用非空斷言，因為已設定
          );
          if (this.ticketId && memberId) {
            this.hubConnection
              ?.invoke('JoinConversation', this.ticketId, memberId)
              .then(() => console.log('加入新房間成功'))
              .catch((err) => console.error('加入新房間失敗:', err));
          }
          this.loadMessageHistory();
          this.isHumanMode = true;
          this.chatLog.push({
            role: 'ai',
            content: '已轉接人工客服，請稍候...',
          });
          this.scrollToBottom();

          // 新增：更新狀態為 '等待'
          // console.log('嘗試更新狀態為等待:', this.ticketId);
          this.http
            .patch(
              `https://localhost:7124/api/CommunityCustomerService/member/tickets/${this.ticketId}/status`,
              { status: '等待' },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                withCredentials: true,
              }
            )
            .subscribe({
              next: (patchResponse) => {
                // console.log('狀態更新成功:', patchResponse);
              },
              error: (err) => {
                console.error('更新狀態失敗:', err);
              },
            });
        },
        error: (err) => {
          console.error('轉人工失敗:', err);
          this.chatLog.push({
            role: 'ai',
            content: '轉人工失敗，請稍後再試。',
          });
          this.scrollToBottom();
        },
      });
  }

  loadMessageHistory(): void {
    if (!this.ticketId) return;
    this.http
      .get<any[]>(
        `https://localhost:7124/api/CommunityCustomerService/member/tickets/${this.ticketId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          },
          withCredentials: true,
        }
      )
      .subscribe({
        next: (messages: any[]) => {
          messages.forEach((msg: any) => {
            this.chatLog.push({
              role: msg.senderType === 'member' ? 'user' : 'ai',
              content: msg.content,
            });
          });
          this.scrollToBottom();
        },
        error: (err) => {
          console.error('載入歷史訊息失敗:', err);
          // 臨時修復：靜默處理，避免干擾用戶
          // 移除：alert 或其他提示
        },
      });
  }

  clearLocalStorage() {
    const memberId = this.getMemberIdFromToken();
    if (memberId) {
      localStorage.removeItem(`openTicket_${memberId}`);
      // console.log('本地儲存已清除');
    }
  }

  // 移除不相關的方法：loadConversations, nextPage, prevPage, sortConversations
}
