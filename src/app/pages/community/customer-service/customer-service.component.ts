import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatResponse {
  aiReply: string; // 對應你後端 API 回傳的 JSON 屬性
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

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    const openingMessage = '您好，我是AI客服，有任何問題都可以問我喔！';
    const index = this.chatLog.push({ role: 'ai', content: '' }) - 1;
    this.animateAIResponse(index, openingMessage);
  }

  sendMessage() {
    if (this.isAIResponding) return; // AI 回覆中禁止輸入
    const rawInput = this.userInput.trim();
    if (!rawInput) return;

    // 使用者訊息
    this.chatLog.push({ role: 'user', content: rawInput });
    this.userInput = '';
    this.scrollToBottom();

    // AI 回覆中
    this.isAIResponding = true;

    // 顯示 AI 正在輸入
    const typingMessageIndex =
      this.chatLog.push({ role: 'ai', content: 'AI 正在回覆...' }) - 1;

    // 呼叫後端 ASP.NET Web API
    this.http
      .post<AIChatResponse>('https://localhost:7124/api/chat/ai-chat', {
        userMessage: rawInput,
      })
      .subscribe({
        next: (res) => {
          const aiReply = res.aiReply || '無回覆';
          this.animateAIResponse(typingMessageIndex, aiReply);
        },
        error: (err) => {
          console.error('Error: ', err);
          this.chatLog[typingMessageIndex].content = '發生錯誤: ' + err.message;
          this.chatLog[typingMessageIndex].role = 'ai';
          this.isAIResponding = false;
          this.scrollToBottom();
        },
      });
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
}
