import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { CustomerServiceService } from '../../../../services/community/CustomerService.service';
import { HttpClient } from '@angular/common/http';
import { toast } from 'ngx-sonner'; // 修改匯入

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
  newMessage: string = '';

  // SignalR
  hubConnection: HubConnection | null = null;

  // 移除 isOnline，因為不再需要
  // isOnline: boolean = true;

  // 新增屬性：狀態選項
  statusOptions: string[] = ['等待', '進行中', '已完成'];

  constructor(
    private http: HttpClient,
    private customerService: CustomerServiceService
    // 移除 private toaster: ToasterService
  ) {}

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
    const token = localStorage.getItem('jwtToken');
    this.http
      .get<any[]>
      ('https://localhost:7124/api/CommunityCustomerService/staff/conversations',
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      )
      .subscribe({
        next: (data) => {
          console.log('載入會話成功:', data.length, '個會話');
          this.conversations = data.map((conv) => ({
            ...conv,
            memberName: conv.memberName || '', // 預設空字串
            memberAccount: conv.memberAccount || '', // 預設空字串
            lastMessageTime: new Date(conv.lastMessageTime),
          }));
          this.filterConversations();
        },
        error: (err) => {
          console.error('載入會話失敗:', err);
          toast.error('載入會話失敗，請檢查網路或權限。'); // 使用 toast
        },
      });
  }

  // 篩選會話
  filterConversations() {
    this.filteredConversations = this.conversations.filter(
      (conv) =>
        (conv.memberName && conv.memberName.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (conv.memberAccount && conv.memberAccount.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  // 選擇會話
  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.loadChatMessages(conversation.id);
    this.markAsRead(conversation.id);

    // 加入房間（使用固定員工 ID）
    const employeeId = this.getEmployeeIdFromToken(); // 新增方法
    if (this.hubConnection) {
      this.hubConnection
        .invoke('JoinConversation', conversation.id, employeeId)
        .then(() => console.log('加入房間成功'))
        .catch((err) => console.error('加入房間失敗:', err));
    }
  }

  // 載入訊息
  loadChatMessages(conversationId: number) {
    this.http
      .get<any[]>(
        `https://localhost:7124/api/CommunityCustomerService/staff/conversations/${conversationId}/messages`,
        {
          withCredentials: true,
        }
      )
      .subscribe({
        next: (messages) => {
          this.chatMessages = messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          this.scrollToBottom();
        },
        error: (err) => console.error('載入訊息失敗:', err),
      });
  }

  // 發送訊息
  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    // 使用固定員工 ID
    const employeeId = 1; // 固定值，用於測試

    // 使用 SignalR 發送訊息
    this.hubConnection
      ?.invoke(
        'SendMessage',
        this.selectedConversation.id,
        employeeId,
        this.newMessage.trim()
      )
      .then(() => {
        // console.log('訊息發送成功');
        this.newMessage = '';
      })
      .catch((err) => {
        console.error('訊息發送失敗:', err);
        toast.error('發送失敗，請檢查連線'); // 使用 toast
      });
  }

  // 標記為已讀
  markAsRead(conversationId: number) {
    // 如果後端沒有 API，暫時移除呼叫，或使用正確的路徑
    // this.http
    //   .patch(
    //     `https://localhost:7124/api/CommunityCustomerService/staff/conversations/${conversationId}/read`,
    //     {}
    //   )
    //   .subscribe({
    //     next: () => {
    //       this.loadConversations();
    //     },
    //     error: (err) => console.error('標記已讀失敗:', err),
    //   });
    // 暫時移除，避免 404 錯誤
  }

  // 結束對話
  endConversation() {
    if (this.selectedConversation) {
      this.selectedConversation = null;
      this.chatMessages = [];
    }
  }

  // 新增方法處理狀態變更
  onStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (this.selectedConversation) {
      this.updateStatus(this.selectedConversation.id, target.value);
    }
  }

  // 修改 updateStatus
  updateStatus(conversationId: number, status: string) {
    // console.log('嘗試更新狀態:', { conversationId, status });
    this.http
      .patch(
        `https://localhost:7124/api/CommunityCustomerService/staff/conversations/${conversationId}/status`,
        { status },
        { withCredentials: true } // 新增認證
      )
      .subscribe({
        next: (response) => {
          this.loadConversations();
          // 更新本地選中會話的狀態
          if (this.selectedConversation) {
            this.selectedConversation.status = status as
              | '等待'
              | '進行中'
              | '已完成';
            // console.log('本地狀態更新為:', this.selectedConversation.status);
          }
        },
        error: (err) => {
          console.error('更新狀態失敗:', err);
          toast.error('更新狀態失敗，請檢查網路或權限。'); // 使用 toast
        },
      });
  }

  // 工具方法
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case '等待':
        return 'bg-warning';
      case '進行中':
        return 'bg-success';
      case '已完成':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
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
        withCredentials: true,
      })
      .build();

    this.hubConnection.on(
      'ReceiveMessage',
      (
        ticketId: string | number,
        senderId: string | number,
        senderName: string,
        message: string,
        timestamp: string,
        senderType: string
      ) => {
        console.log('收到訊息:', {
          ticketId,
          senderId,
          senderName,
          message,
          senderType,
        });
        const parsedTicketId =
          typeof ticketId === 'string' ? parseInt(ticketId) : ticketId;
        const parsedSenderId =
          typeof senderId === 'string' ? parseInt(senderId) : senderId;

        // 如果不是當前選中的會話，自動選擇它（保持同一個對話框）
        if (
          !this.selectedConversation ||
          this.selectedConversation.id !== parsedTicketId
        ) {
          const conversation = this.conversations.find(
            (conv) => conv.id === parsedTicketId
          );
          if (conversation) {
            this.selectConversation(conversation);
          }
        }

        // 如果是當前選中的會話，更新訊息
        if (
          this.selectedConversation &&
          this.selectedConversation.id === parsedTicketId
        ) {
          const newMessage: ChatMessage = {
            messageId: Date.now(),
            ticketId: parsedTicketId,
            senderType: senderType as 'member' | 'staff',
            senderName: senderName,
            content: message,
            timestamp: new Date(timestamp),
          };
          this.chatMessages.push(newMessage);
          this.chatMessages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          this.scrollToBottom();
        }
        this.loadConversations(); // 更新會話清單
      }
    );

    this.hubConnection.on('NewConversation', (conversation) => {
      // console.log('收到 NewConversation 事件:', conversation);
      // 刷新頁面：重新載入會話清單
      this.loadConversations();
    });

    this.hubConnection
      .start()
      .then(() => console.log('SignalR 連線成功'))
      .catch((err) => {
        console.error('SignalR 連線失敗:', err);
        toast.error('SignalR 連線失敗，請檢查網路。'); // 使用 toast
      });
  }

  // 新增方法：從 JWT 取得員工 ID
  private getEmployeeIdFromToken(): number {
    const token = localStorage.getItem('jwtToken');
    if (!token) return 1; // 預設值或處理無法取得 ID 的情況

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.employeeId || 1; // 預設值或處理無法取得 ID 的情況
    } catch (error) {
      console.error('解析 JWT 失敗:', error);
      return 1; // 預設值或處理無法取得 ID 的情況
    }
  }
}
