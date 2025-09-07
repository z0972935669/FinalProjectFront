import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PersonalService,
  CommunityProfileDto,
  UserPost,
} from '../../../services/community/personal.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FriendService } from '../../../services/community/friend.service';
import { ChatService } from '../../../services/community/chat.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personal-community',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-community.component.html',
  styleUrls: ['./personal-community.component.scss'],
})
export class PersonalCommunityComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  userProfile?: CommunityProfileDto;
  userPosts: UserPost[] = [];
  favoritePosts: UserPost[] = [];
  memberId!: number;
  loading = true;
  error = '';
  isOwnPage = false;
  isShowingFavorites: boolean = false;
  isUploadingPhoto = false;
  currentUserId: number | null = null; // 新增屬性

  constructor(
    private personalService: PersonalService,
    private route: ActivatedRoute,
    private router: Router,
    private friendService: FriendService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      this.currentUserId = this.getCurrentUserIdFromJWT(); // 設定屬性

      if (!idParam) {
        const id = this.currentUserId;
        if (!id) {
          this.error = '無法取得會員 ID';
          this.loading = false;
          return;
        }
        this.memberId = id;
        this.isOwnPage = true;
      } else {
        const id = Number(idParam);
        this.memberId = id;
        this.isOwnPage = id === this.currentUserId;

        if (this.isOwnPage) {
          this.router.navigate(['/show/member-management/community']);
          return;
        }
      }

      if (!this.isOwnPage) {
        this.isShowingFavorites = false;
      }

      this.loadData();
    });
  }

  // 開啟照片編輯器
  openPhotoEditor(): void {
    if (!this.isOwnPage) {
      Swal.fire({
        icon: 'warning',
        title: '權限不足',
        text: '只能編輯自己的頭像',
        confirmButtonText: '確定'
      });
      return;
    }
    this.fileInput.nativeElement.click();
  }

  // 處理檔案選擇
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (!target || !target.files || target.files.length === 0) {
      return;
    }

    const file = target.files[0];

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: '檔案類型錯誤',
        text: '請選擇圖片檔案',
        confirmButtonText: '確定'
      });
      return;
    }

    // 檢查檔案大小 (限制 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: '檔案過大',
        text: '圖片檔案不能超過 5MB',
        confirmButtonText: '確定'
      });
      return;
    }

    this.uploadPhoto(file);
  }

  // 上傳照片
  private uploadPhoto(file: File): void {
    this.isUploadingPhoto = true;

    const currentUserId = this.getCurrentUserIdFromJWT();
    if (!currentUserId) {
      this.isUploadingPhoto = false;
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '需要登入才能上傳照片',
        confirmButtonText: '確定'
      });
      return;
    }

    this.personalService.uploadUserPhoto(currentUserId, file).subscribe({
      next: (response) => {
        // console.log('照片上傳成功', response);

        // 更新使用者頭像 - 添加空值檢查
        if (this.userProfile && response?.photoUrl) {
          this.userProfile.photoUrl = response.photoUrl;
        }

        this.isUploadingPhoto = false;

        // 成功訊息
        Swal.fire({
          icon: 'success',
          title: '上傳成功',
          text: '照片更新成功！',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('照片上傳失敗', error);
        this.isUploadingPhoto = false;

        // 詳細的錯誤處理 - 添加空值檢查
        let errorTitle = '上傳失敗';
        let errorText = '照片上傳失敗，請稍後再試';

        if (error?.status === 400) {
          errorTitle = '檔案格式錯誤';
          errorText = error.error || '檔案格式不符合要求，請選擇 JPG、PNG 或 GIF 格式的圖片';
        } else if (error?.status === 401) {
          errorTitle = '認證失敗';
          errorText = '請先登入';
        } else if (error?.status === 403) {
          errorTitle = '權限不足';
          errorText = '沒有權限上傳照片';
        } else if (error?.status === 413) {
          errorTitle = '檔案過大';
          errorText = '檔案太大，請選擇小於 5MB 的圖片';
        } else if (error?.status === 500) {
          errorTitle = '伺服器錯誤';
          errorText = '伺服器發生錯誤，請稍後再試';
        }

        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorText,
          confirmButtonText: '確定'
        });
      }
    });
  }

  // JWT 解析
  private getCurrentUserIdFromJWT(): number | null {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (!payload) return null;

      // 嘗試不同的 ID 欄位名稱
      const idStr = payload.MemberID ||
                    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                    payload.sub || // 標準 JWT subject 欄位
                    payload.id;    // 其他可能的 ID 欄位

      if (!idStr) return null;

      const id = Number(idStr);
      return isNaN(id) ? null : id;
    } catch (error) {
      console.error('JWT 解析失敗:', error);
      return null;
    }
  }

  // 載入資料
  public loadData() {
    this.loading = true;
    this.error = '';

    const currentUserId = this.getCurrentUserIdFromJWT();

    forkJoin({
      profile: this.personalService.getUserProfile(this.memberId).pipe(
        catchError((err) => {
          this.error = `取得會員資料失敗: ${err?.message || '未知錯誤'}`;
          return of(null);
        })
      ),
      posts: this.personalService
        .getUserPosts(this.memberId)
        .pipe(catchError(() => of([]))),
      favorites: this.isOwnPage && currentUserId
        ? this.personalService
            .getFavorites(currentUserId)
            .pipe(catchError(() => of([])))
        : of([]),
    }).subscribe(({ profile, posts, favorites }) => {
      this.userProfile = profile || undefined;

      // 添加空值檢查
      this.userPosts = (posts as UserPost[] || []).map((p) => ({
        ...p,
        isFavorited: false,
      }));

      if (this.isOwnPage) {
        // 添加空值檢查
        const favPostIds = (favorites as { postId: number }[] || []).map(
          (f) => f?.postId
        ).filter(id => id != null);

        if (favPostIds.length === 0) {
          this.favoritePosts = [];
          this.loading = false;
          return;
        }

        this.personalService.getPostsByIds(favPostIds).subscribe({
          next: (favPosts) => {
            // 添加空值檢查
            if (favPosts) {
              favPosts.forEach((fp) => {
                if (fp) fp.isFavorited = true;
              });
              this.favoritePosts = favPosts;
            }

            this.userPosts.forEach((p) => {
              if (p && favPostIds.includes(p.id)) p.isFavorited = true;
            });

            this.loading = false;
          },
          error: () => {
            this.favoritePosts = [];
            this.loading = false;
          },
        });
      } else {
        this.loading = false;
        // 在載入資料後檢查好友狀態
        this.checkFriendStatus();
      }
    });
  }

  // 修正 checkFriendStatus 方法
  private checkFriendStatus(): void {
    if (this.userProfile?.memberId && this.currentUserId) {
      this.friendService.isFriend(this.currentUserId, this.userProfile.memberId).subscribe({
        next: (isFriend) => {
          if (this.userProfile) {
            (this.userProfile as any).isFriend = isFriend;
          }
        },
        error: () => {
          if (this.userProfile) {
            (this.userProfile as any).isFriend = false;
          }
        }
      });
    }
  }

  // 產生用戶名
  getUsername(name: string): string {
    if (!name) return '';
    return name.toLowerCase().replace(/\s+/g, '');
  }

  toggleFavorite(post: UserPost) {
    // 切換收藏
    if (!post) return;

    if (!this.isOwnPage) {
      Swal.fire({
        icon: 'warning',
        title: '權限不足',
        text: '只能收藏自己的貼文',
        confirmButtonText: '確定'
      });
      return;
    }

    const currentUserId = this.getCurrentUserIdFromJWT();
    if (!currentUserId) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '需要登入才能收藏貼文',
        confirmButtonText: '確定'
      });
      return;
    }

    if (post.isFavorited) {
      this.personalService.removeFavorite(currentUserId, post.id).subscribe({
        next: () => {
          post.isFavorited = false;
          this.updateFavoritePosts();
          Swal.fire({
            icon: 'success',
            title: '已取消收藏',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('取消收藏失敗', err);
          Swal.fire({
            icon: 'error',
            title: '操作失敗',
            text: '取消收藏失敗，請稍後再試',
            confirmButtonText: '確定'
          });
        },
      });
    } else {
      this.personalService.addFavorite(currentUserId, post.id).subscribe({
        next: () => {
          post.isFavorited = true;
          this.updateFavoritePosts();
          Swal.fire({
            icon: 'success',
            title: '已加入收藏',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('新增收藏失敗', err);
          Swal.fire({
            icon: 'error',
            title: '操作失敗',
            text: '新增收藏失敗，請稍後再試',
            confirmButtonText: '確定'
          });
        },
      });
    }
  }

  // 更新收藏貼文 - 添加空值檢查
  private updateFavoritePosts() {
    this.favoritePosts = this.userPosts.filter((p) => p && p.isFavorited);
  }

  toggleFollow() {
    if (!this.userProfile || this.isOwnPage) return;

    const currentUserId = this.getCurrentUserIdFromJWT();
    if (!currentUserId) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '需要登入才能追蹤',
        confirmButtonText: '確定'
      });
      return;
    }

    const originalState = this.userProfile.isFollowing;
    const originalFollowers = this.userProfile.followers;

    this.userProfile.isFollowing = !this.userProfile.isFollowing;
    this.userProfile.followers += this.userProfile.isFollowing ? 1 : -1;

    this.personalService.toggleFollow(this.memberId).subscribe({
      next: (response) => {
        // console.log('追蹤狀態更新成功', response);
        if (this.userProfile && response) {
          this.userProfile.isFollowing = response.isFollowing;
          this.userProfile.followers = response.followers;
        }

        Swal.fire({
          icon: 'success',
          title: this.userProfile?.isFollowing ? '已追蹤' : '已取消追蹤',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('追蹤狀態更新失敗', err);
        if (this.userProfile) {
          this.userProfile.isFollowing = originalState;
          this.userProfile.followers = originalFollowers;
        }

        Swal.fire({
          icon: 'error',
          title: '操作失敗',
          text: '追蹤狀態更新失敗，請稍後再試',
          confirmButtonText: '確定'
        });
      },
    });
  }

  goToPost(post: UserPost) {
    // 前往貼文
    if (!post || !(post as any).boardID) { // 臨時使用 any，若介面有 boardID 則移除
      console.error('貼文缺少必要資訊');
      return;
    }

    this.router.navigate([
      'show/community',
      (post as any).boardID, // 臨時使用 any
      'posts',
      post.id.toString(),
    ]);
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== 'assets/img/component/default-avatar.png') {
      target.src = 'assets/img/component/default-avatar.png';
    }
  }

  // 取得用戶名顯示
  getUsernameDisplay(): string {
    if (!this.userProfile?.name) return '';
    return this.userProfile.name.toLowerCase().replace(/\s+/g, '');
  }

  // 格式化日期
  getFormattedDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化失敗:', error);
      return '';
    }
  }

  // 修正 sendFriendRequest 方法
  sendFriendRequest(): void {
    if (!this.userProfile?.memberId) return;

    const currentUserId = this.getCurrentUserIdFromJWT();
    if (!currentUserId) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '需要登入才能發送好友邀請',
        confirmButtonText: '確定'
      });
      return;
    }

    this.friendService.sendFriendRequest(this.userProfile.memberId).subscribe({
      next: () => {
        (this.userProfile as any).isFriend = true;

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
        }

        Swal.fire({
          icon: 'error',
          title: '發送失敗',
          text: errorMessage,
          confirmButtonText: '確定'
        });
      }
    });
  }

  // 修正 startChat 方法
  startChat(): void {
    if (!this.userProfile?.memberId || !this.currentUserId) return;

    this.friendService.isFriend(this.currentUserId, this.userProfile.memberId).subscribe({
      next: (isFriend) => {
        if (isFriend) {
          this.router.navigate(['/chat'], {
            queryParams: { friendId: this.userProfile!.memberId }
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: '無法聊天',
            text: '只能與好友聊天，請先發送好友邀請',
            confirmButtonText: '確定'
          });
        }
      },
      error: () => {
        this.router.navigate(['/chat'], {
          queryParams: { friendId: this.userProfile!.memberId }
        });
      }
    });
  }
}
