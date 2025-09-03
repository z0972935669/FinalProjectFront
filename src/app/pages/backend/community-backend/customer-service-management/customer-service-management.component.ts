import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { CustomerServiceService } from '../../../../services/community/CustomerService.service';
import { HttpClient } from '@angular/common/http';

interface Conversation {
  id: number;
  memberId: number;
  memberName: string;
  memberAccount: string;
  status: '等待' | '進行中' | '已完成';
  priority: '高' | '中' | '低';
  category: string;
  latestMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  waitTime: number;
  assignedAgent?: string;
}

interface ChatMessage {
  messageId: number;
  ticketId: number;
  senderType: 'member' | 'staff';
  senderName: string;
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-customer-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-service-management.component.html',
  styleUrls: ['./customer-service-management.component.scss'],
})
export class CustomerServiceManagementComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;

  // 數據
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  chatMessages: ChatMessage[] = [];

  // 狀態
  searchTerm: string = '';
  isOnline: boolean = true;
  newMessage: string = '';

  // SignalR
  hubConnection: HubConnection | null = null;

  constructor(private http: HttpClient, private customerService: CustomerServiceService) {}

  ngOnInit() {
    this.loadConversations();
    this.startSignalRConnection();
  }

  ngOnDestroy() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  // 載入會話
  loadConversations() {
    this.http.get<any[]>('https://localhost:7124/api/CommunityCustomerService/staff/conversations').subscribe({
      next: (data) => {
        this.conversations = data.map(conv => ({
          ...conv,
          lastMessageTime: new Date(conv.lastMessageTime)
        }));
        this.filterConversations();
      },
      error: (err) => console.error('載入會話失敗:', err)
    });
  }

  // 篩選會話
  filterConversations() {
    this.filteredConversations = this.conversations.filter(conv =>
      conv.memberName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      conv.memberAccount.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // 選擇會話
  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.loadChatMessages(conversation.id);
    this.markAsRead(conversation.id);

    // 加入房間（使用固定員工 ID）
    const employeeId = 1; // 固定值，用於測試
    if (this.hubConnection) {
      this.hubConnection.invoke('JoinConversation', conversation.id, employeeId)
        .then(() => console.log('加入房間成功'))
        .catch(err => console.error('加入房間失敗:', err));
    }
  }

  // 載入訊息
  loadChatMessages(conversationId: number) {
    this.http.get<any[]>(`https://localhost:7124/api/CommunityCustomerService/staff/conversations/${conversationId}/messages`).subscribe({
      next: (messages) => {
        this.chatMessages = messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        this.scrollToBottom();
      },
      error: (err) => console.error('載入訊息失敗:', err)
    });
  }

  // 發送訊息
  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    // 使用固定員工 ID
    const employeeId = 1; // 固定值，用於測試

    // 使用 SignalR 發送訊息
    this.hubConnection?.invoke('SendMessage', this.selectedConversation.id, employeeId, this.newMessage.trim())
      .then(() => {
        console.log('訊息發送成功');
        this.newMessage = '';
      })
      .catch(err => {
        console.error('訊息發送失敗:', err);
        alert('發送失敗，請檢查連線');
      });
  }

  // 標記為已讀
  markAsRead(conversationId: number) {
    this.http.patch(`https://localhost:7124/api/conversations/${conversationId}/read`, {}).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: (err) => console.error('標記已讀失敗:', err)
    });
  }

  // 結束對話
  endConversation() {
    if (this.selectedConversation) {
      this.updateStatus(this.selectedConversation.id, '已完成');
      this.selectedConversation = null;
      this.chatMessages = [];
    }
  }

  // 更新狀態
  updateStatus(conversationId: number, status: string) {
    this.http.patch(`https://localhost:7124/api/CommunityCustomerService/staff/conversations/${conversationId}/status`, { status }).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: (err) => console.error('更新狀態失敗:', err)
    });
  }

  // 切換狀態
  toggleStatus() {
    this.isOnline = !this.isOnline;
  }

  // 工具方法
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case '等待': return 'bg-warning';
      case '進行中': return 'bg-success';
      case '已完成': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    return status;
  }

  // 滾動到底部
  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        const container = this.chatMessagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // SignalR 連線
  private startSignalRConnection() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7124/customerServiceHub', {
        accessTokenFactory: () => localStorage.getItem('jwtToken') || ''
      })
      .build();

    this.hubConnection.on('ReceiveMessage', (ticketId, senderId, senderName, message, timestamp, senderType) => {
      console.log('收到訊息:', message);
      if (this.selectedConversation && this.selectedConversation.id === parseInt(ticketId)) {
        const newMessage: ChatMessage = {
          messageId: Date.now(),
          ticketId: parseInt(ticketId),
          senderType: senderType,
          senderName: senderName,
          content: message,
          timestamp: new Date(timestamp)
        };
        this.chatMessages.push(newMessage);
        this.scrollToBottom();
      }
      this.loadConversations();
    });

    this.hubConnection.start()
      .then(() => console.log('SignalR 連線成功'))
      .catch(err => console.error('SignalR 連線失敗:', err));
  }
}
