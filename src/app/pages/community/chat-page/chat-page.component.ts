// chat-page.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FriendService, Friend, FriendRequestDto, UserSearchResult } from '../../../services/community/friend.service';
import { ChatService, ChatRoom } from '../../../services/community/chat.service';
import { ChatFloatingComponent } from '../chat-floating/chat-floating.component';
import { FriendListComponent } from '../friend-list/friend-list.component';
import { FriendNotificationsComponent } from '../friend-notifications/friend-notifications.component'; // 新增：引入好友通知元件
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FriendListComponent,
    ChatFloatingComponent,
    FriendNotificationsComponent
  ],
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit, AfterViewInit {
  @ViewChild(ChatFloatingComponent) chatFloating!: ChatFloatingComponent;

  friends: Friend[] = [];
  friendRequests: FriendRequestDto[] = [];
  searchQuery: string = '';
  searchResults: UserSearchResult[] = [];
  currentUserId: number = 0;
  isLoading = false;

  constructor(
    private chatService: ChatService,
    private friendService: FriendService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    if (this.currentUserId) {
      this.loadFriends();
      this.loadFriendRequests();
    }
  }

  ngAfterViewInit(): void {
    // 確保 ChatFloatingComponent 已經初始化
  }

  // 取得當前用戶 ID
  private getCurrentUserId(): number {
    const token = localStorage.getItem('jwtToken');
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idStr = payload.MemberID || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub;
      return Number(idStr) || 0;
    } catch {
      return 0;
    }
  }

  // 載入好友列表
  loadFriends(): void {
    this.isLoading = true;
    this.friendService.getFriends(this.currentUserId).subscribe({
      next: (friends) => {
        this.friends = friends;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('載入好友失敗:', err);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: '載入失敗',
          text: '無法載入好友列表，請稍後再試',
          confirmButtonText: '確定'
        });
      },
    });
  }

  // 載入好友請求
  loadFriendRequests(): void {
    this.friendService.getFriendRequests().subscribe({
      next: (requests) => {
        this.friendRequests = requests;
      },
      error: (err) => {
        console.error('載入好友請求失敗:', err);
      },
    });
  }

  // 開啟私人聊天 - 修正版本
  openPrivateChat(friendId: number): void {
    console.log('🔄 開啟私人聊天，好友ID:', friendId, '當前用戶ID:', this.currentUserId);

    if (!this.currentUserId || !friendId || !this.chatFloating) {
      console.error('❌ 參數錯誤:', { currentUserId: this.currentUserId, friendId, chatFloating: !!this.chatFloating });
      return;
    }

    // 檢查是否為好友
    this.friendService.isFriend(this.currentUserId, friendId).subscribe({
      next: (isFriend) => {
        console.log('✅ 好友檢查結果:', isFriend);
        if (isFriend) {
          // 直接開啟聊天室
          this.chatFloating.openPrivateChat(friendId);
        } else {
          Swal.fire({
            icon: 'warning',
            title: '無法聊天',
            text: '只能與好友聊天',
            confirmButtonText: '確定'
          });
        }
      },
      error: (err) => {
        console.warn('⚠️ 好友檢查失敗，嘗試直接開啟聊天:', err);
        // 如果檢查失敗，嘗試直接開啟（向後相容）
        this.chatFloating.openPrivateChat(friendId);
      }
    });
  }

  // 搜尋用戶
  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.friendService.searchUsers(this.searchQuery).subscribe({
      next: (results) => {
        // 過濾掉自己和已經是好友的用戶
        this.searchResults = results.filter(user =>
          user.id !== this.currentUserId &&
          !this.friends.some(friend => friend.id === user.id)
        );
      },
      error: (err) => {
        console.error('搜尋用戶失敗:', err);
        Swal.fire({
          icon: 'error',
          title: '搜尋失敗',
          text: '搜尋用戶時發生錯誤，請稍後再試',
          confirmButtonText: '確定'
        });
      },
    });
  }

  // 發送好友請求
  sendFriendRequest(userId: number): void {
    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => {
        // 從搜尋結果中移除該用戶
        this.searchResults = this.searchResults.filter(user => user.id !== userId);

        Swal.fire({
          icon: 'success',
          title: '邀請已發送',
          text: '好友邀請已成功發送',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('發送好友請求失敗:', err);
        let errorMessage = '發送好友邀請失敗，請稍後再試';

        if (err?.status === 400) {
          errorMessage = '無法發送邀請，可能已經是好友或已發送過邀請';
        } else if (err?.status === 404) {
          errorMessage = '找不到該用戶';
        }

        Swal.fire({
          icon: 'error',
          title: '發送失敗',
          text: errorMessage,
          confirmButtonText: '確定'
        });
      },
    });
  }

  // 回應好友請求
  respondFriendRequest(requestId: number, action: 'Accepted' | 'Rejected'): void {
    const request = this.friendRequests.find(r => r.requestID === requestId);
    if (!request) return;

    const actionText = action === 'Accepted' ? '接受' : '拒絕';

    Swal.fire({
      icon: 'question',
      title: '確認操作',
      text: `確定要${actionText}來自 ${request.requesterName || '用戶'} 的好友邀請嗎？`,
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      confirmButtonColor: action === 'Accepted' ? '#28a745' : '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.friendService.respondFriendRequest({
          RequestID: requestId,   // 修正：使用大寫 R
          Action: action          // 修正：使用大寫 A
        }).subscribe({
          next: () => {
            // 從請求列表中移除
            this.friendRequests = this.friendRequests.filter(r => r.requestID !== requestId);

            if (action === 'Accepted') {
              // 如果接受了請求，重新載入好友列表
              this.loadFriends();
            }

            Swal.fire({
              icon: 'success',
              title: '操作成功',
              text: `已${actionText}好友邀請`,
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('回應好友請求失敗:', err);
            Swal.fire({
              icon: 'error',
              title: '操作失敗',
              text: `回應好友邀請失敗，請稍後再試`,
              confirmButtonText: '確定'
            });
          },
        });
      }
    });
  }

  // 移除好友
  removeFriend(friendId: number): void {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return;

    Swal.fire({
      icon: 'warning',
      title: '確認移除',
      text: `確定要移除好友 ${friend.name} 嗎？`,
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.friendService.removeFriend(friendId).subscribe({
          next: () => {
            // 從好友列表中移除
            this.friends = this.friends.filter(f => f.id !== friendId);

            Swal.fire({
              icon: 'success',
              title: '移除成功',
              text: '已移除好友',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('移除好友失敗:', err);
            Swal.fire({
              icon: 'error',
              title: '移除失敗',
              text: '移除好友失敗，請稍後再試',
              confirmButtonText: '確定'
            });
          },
        });
      }
    });
  }

  // 清除搜尋結果
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  // 處理成員名稱顯示的方法
  getRoomMembersText(room: any): string {
    if (!room?.members || room.members.length === 0) {
      return '無成員資訊';
    }

    const memberNames = room.members
      .map((m: any) => m?.memberName)
      .filter((name: string) => name && name.trim())
      .join(', ');

    return memberNames || '無成員資訊';
  }

  // 處理未讀訊息顯示的方法
  getUnreadCount(room: any): number {
    return room?.unread || 0;
  }

  // 檢查是否有未讀訊息
  hasUnread(room: any): boolean {
    return (room?.unread || 0) > 0;
  }
}
