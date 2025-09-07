import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  PostService,
  Post,
  Comment,
  Reply,
  Attachment,
  InteractionDto,
  ReportRequest,
} from '../../../services/community/post.service';
import { BoardService, Board } from '../../../services/community/board.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2'; // 新增 SweetAlert2 匯入

// 新增：宣告 Bootstrap 全域變數
declare var bootstrap: any;

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent implements OnInit {
  boardID: string | null = null;
  postId: string | null = null;
  post: Post | null = null;

  // 模態框控制
  private reportModal: any;
  private currentReportContentType: 'Post' | 'Reply' | null = null;
  private currentReportContentId: number | null = null;

  newPostComment: string = '';
  boardName: string = '未知看板';
  comments: Comment[] = [];

  currentMemberId: number | null = null;
  previewImageIndex: number | null = null;
  currentUserName: string | null = null;
  currentUserAvatar: string | null = null;
  isLoggedIn: boolean = false;

  // 新增：追蹤用戶的互動狀態
  userInteractions = {
    hasLiked: false,
    hasFavorited: false,
    hasShared: false,
  };

  sanitizedContent: SafeHtml = ''; // 新增屬性

  // 新增：檢舉原因選項
  reportReasons: string[] = ['垃圾內容', '騷擾', '違規', '其他'];

  // 新增：編輯狀態（模態框）
  editingPost: Post | null = null;
  editingComment: Comment | null = null;
  editingReply: Reply | null = null;

  // 新增：編輯狀態
  selectedFiles: File[] = [];

  // 新增：要刪除的附件 ID
  attachmentsToDelete: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private postService: PostService,
    private boardService: BoardService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer // 新增注入
  ) {}

  ngOnInit(): void {
    // 載入使用者資訊
    this.loadCurrentUser();
    // 初始化模態框
    this.initializeReportModal();

    // 載入文章資訊
    this.postId = this.route.snapshot.paramMap.get('postId');
    this.boardID = this.route.snapshot.paramMap.get('boardID');

    if (this.boardID) {
      this.loadBoardName(+this.boardID);
    }

    // 確保使用者資訊載入後再載入文章
    if (this.postId) {
      setTimeout(() => {
        this.loadPost(+this.postId!);
      }, 0);
    }
  }

  // 初始化檢舉模態框
  private initializeReportModal(): void {
    const modalElement = document.getElementById('reportModal');
    if (modalElement) {
      this.reportModal = new bootstrap.Modal(modalElement);
    }
  }

  // 載入當前使用者資訊
  loadCurrentUser(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.isLoggedIn = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isTokenValid = !payload.exp || Date.now() < payload.exp * 1000;
      if (!isTokenValid) {
        localStorage.removeItem('jwtToken');
        this.isLoggedIn = false;
        this.cdr.detectChanges();
        return;
      }

      const memberId = Number(payload.MemberId); // 轉換為 number
      // console.log('目前登入的會員 ID:', memberId); // 除錯輸出

      this.currentUserName =
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        '會員';
      this.currentUserAvatar = `/assets/img/default-avatar.png`;
      this.isLoggedIn = true;
      this.currentMemberId = memberId;

      // 如果已有 postId，立即載入互動狀態
      if (this.postId && this.currentMemberId) {
        this.loadUserInteractionStatus();
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('解析 JWT 時發生錯誤:', error);
      this.isLoggedIn = false;
      this.cdr.detectChanges();
    }
  }

  // 載入看板名稱
  loadBoardName(boardID: number): void {
    this.boardService.getBoard(boardID).subscribe({
      next: (board: Board) => (this.boardName = board?.boardName ?? '未知看板'),
      error: (err) => console.error('取得看板名稱失敗', err),
    });
  }

  // 載入文章同時載入回覆的喜歡狀態
  loadPost(postID: number): void {
    this.postService.getPost(postID).subscribe({
      next: (post: Post) => {
        // console.log('收到的文章資料:', post);
        // console.log('文章創建時間:', post.createdAt);
        // console.log('本地時間:', new Date(post.createdAt).toLocaleString());

        // 檢查每個附件的結構
        // if (post.attachments && post.attachments.length > 0) {
        //   post.attachments.forEach((att, index) => {
        //     console.log(`附件 ${index}:`, att);
        //     console.log(`附件 ${index} 的所有屬性:`, Object.keys(att));
        //   });
        // }

        this.post = post;
        this.sanitizedContent = this.processContent(post.content || '');

        // 不過濾主回覆，但修改刪除的內容，並處理子回覆
        this.comments = (post.comments || []).map((comment) => ({
          ...comment,
          // 如果主回覆被刪除，修改內容（忽略大小寫）
          content:
            (comment.replieStatus || '').toLowerCase() === 'deleted'
              ? '該條回覆已被刪除'
              : comment.content,
          // 子回覆也修改刪除的內容，但不隱藏
          replies: (comment.replies || []).map((reply) => {
            // console.log('Reply replieStatus:', reply.replieStatus, 'Content:', reply.content);  // 新增：檢查
            return {
              ...reply,
              content:
                (reply.replieStatus || '').toLowerCase() === 'deleted'
                  ? '該條回覆已被刪除'
                  : reply.content,
            };
          }),
        }));

        // 確保在這裡呼叫 loadUserInteractionStatus
        if (this.currentMemberId) {
          this.postService.getUserInteractionStatus(postID).subscribe({
            next: (status) => {
              this.userInteractions = {
                hasLiked: Boolean(status.hasLiked),
                hasFavorited: Boolean(status.hasFavorited),
                hasShared: Boolean(status.hasShared),
              };
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('載入互動狀態失敗:', err);
            },
          });
        }

        this.loadAllRepliesLikeStatus();
        this.assignFloorTagsAndFlatten();
        this.recordPostView(postID);
      },
      error: (err) => {
        console.error(`取得文章(ID: ${postID})失敗`, err);
      },
    });
  }

  // 新增：記錄文章瀏覽
  private recordPostView(postId: number): void {
    this.postService.recordPostView(postId).subscribe({
      next: (response) => {
        // console.log('瀏覽記錄成功:', response);
        // 更新本地瀏覽人數
        if (this.post) {
          this.post.views = response.viewCount;
        }
      },
      error: (err) => {
        console.error('記錄瀏覽失敗:', err);
        // 即使失敗也不要影響用戶體驗
      },
    });
  }

  // 載入用戶互動狀態
  loadUserInteractionStatus(): void {
    if (!this.postId || !this.currentMemberId) {
      // console.log('缺少必要資訊:', {
      //   postId: this.postId,
      //   currentMemberId: this.currentMemberId,
      // }); // 除錯輸出
      this.resetUserInteractions();
      return;
    }

    // 新增：檢查 currentMemberId 是否為有效值
    if (typeof this.currentMemberId !== 'number' || this.currentMemberId <= 0) {
      console.error('無效的會員 ID:', this.currentMemberId);
      this.resetUserInteractions();
      return;
    }

    // console.log(
    //   `載入文章 ${this.postId} 的使用者(ID:${this.currentMemberId})互動狀態`
    // ); // 除錯輸出

    this.postService.getUserInteractionStatus(+this.postId).subscribe({
      next: (status) => {
        if (!status || typeof status !== 'object') {
          console.error('收到無效的互動狀態回應:', status);
          this.resetUserInteractions();
          return;
        }

        // console.log('收到互動狀態回應:', {
        //   postId: this.postId,
        //   memberId: this.currentMemberId,
        //   status,
        // }); // 除錯輸出

        // 確保回傳值為布林值
        this.userInteractions = {
          hasLiked: Boolean(status.hasLiked),
          hasFavorited: Boolean(status.hasFavorited),
          hasShared: Boolean(status.hasShared),
        };

        // console.log('更新後的互動狀態:', this.userInteractions); // 除錯輸出
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('載入互動狀態失敗:', err);
        this.resetUserInteractions();
      },
    });
  }

  // 驗證互動狀態的方法
  private validateInteractionStatus(status: any): boolean {
    return (
      status &&
      typeof status === 'object' &&
      typeof status.hasLiked === 'boolean' &&
      typeof status.hasFavorited === 'boolean' &&
      typeof status.hasShared === 'boolean'
    );
  }

  // 重置使用者互動狀態的方法
  private resetUserInteractions(): void {
    this.userInteractions = {
      hasLiked: false,
      hasFavorited: false,
      hasShared: false,
    };
    this.cdr.detectChanges();
  }

  // 提交留言或回覆
  submitComment(comment?: Comment): void {
    if (!this.isLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '請先登入才能回覆或留言！',
        confirmButtonText: '確定',
      });
      return;
    }

    const content = comment ? comment.draftReply : this.newPostComment;
    if (!content?.trim()) return;

    const replyId = comment ? comment.replyID || comment.id : null;

    if (comment) {
      if (replyId !== undefined) {
        this.handleReplySubmission(comment, replyId, content);
      } else {
        console.error('replyId 是 undefined，無法提交回覆');
        Swal.fire({
          icon: 'error',
          title: '回覆失敗',
          text: '留言資料不完整，請重新整理頁面後再試',
          confirmButtonText: '確定',
        });
      }
    } else {
      this.handleCommentSubmission(content);
    }
  }

  // 處理留言或回覆提交
  private handleReplySubmission(
    comment: Comment,
    replyId: number | null,
    content: string
  ): void {
    if (!replyId || !this.postId) {
      console.error('留言資料錯誤：缺少有效的 replyID 或 postId', {
        replyID: comment.replyID,
        id: comment.id,
        postId: this.postId,
        comment: comment,
      });
      alert('回覆失敗：留言資料不完整，請重新整理頁面後再試');
      return;
    }

    const replyData: Reply = {
      name: this.currentUserName!,
      avatar: this.currentUserAvatar!,
      content: content.trim(),
      rawContent: content.trim(),
      createdAt: new Date(),
      likes: 0,
    };

    this.postService.createReply(+this.postId, replyId, replyData).subscribe({
      next: (res: Reply) => {
        comment.replies = comment.replies || [];
        comment.replies.push(res);
        comment.showAllReplies = true; // 新增後自動展開
        comment.draftReply = '';
        this.assignFloorTagsAndFlatten();
      },
      error: (err) => {
        console.error('回覆失敗', err);
        alert('回覆失敗，請稍後再試');
      },
    });
  }

  // 處理留言提交
  private handleCommentSubmission(content: string): void {
    const commentData: Comment = {
      name: this.currentUserName!,
      avatar: this.currentUserAvatar!,
      content: content.trim(),
      rawContent: content.trim(),
      createdAt: new Date(),
      likes: 0,
      replies: [],
      showAllReplies: false,
      floorTag: '',
    };

    if (!this.postId) return;

    this.postService.createComment(+this.postId, commentData).subscribe({
      next: (res) => {
        this.comments.push(res);
        this.newPostComment = '';
        this.assignFloorTagsAndFlatten();
      },
      error: (err) => {
        console.error('留言失敗', err);
        alert('留言失敗，請稍後再試');
      },
    });
  }

  // 分配樓層標籤並展平回覆結構
  assignFloorTagsAndFlatten(): void {
    this.comments.forEach((comment, cIndex) => {
      comment.floorTag = `B${cIndex + 1}`;
      if (!comment.replies) {
        comment.replies = [];
      }
      // console.log(
      //   `Processing comment ${cIndex + 1}, replies count:`,
      //   comment.replies.length
      // ); // 調試輸出
      let replyCount = 0;
      for (let i = 0; i < comment.replies.length; i++) {
        const reply = comment.replies[i];
        replyCount++;
        reply.floorTag = `${comment.floorTag}-${replyCount}`;

        if (!reply.rawContent && reply.content) {
          reply.rawContent = reply.content;
        }

        // 添加樓層標籤到內容
        // const parentFloor = reply.parentFloorTag ?? comment.floorTag;
        // const rawContent = reply.rawContent ?? reply.content;
        // reply.content = `${parentFloor} ${rawContent}`;
        // console.log(`Reply ${replyCount}:`, reply); // 調試輸出
      }
    });
    this.cdr.detectChanges();
  }

  // 修改：isImage 方法，支援 any 類型
  isImage(urlOrFile: any): boolean {
    if (typeof urlOrFile === 'string') {
      return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(urlOrFile);
    } else if (urlOrFile && urlOrFile.type) {
      return urlOrFile.type.startsWith('image/');
    }
    return false;
  }

  // 上一頁按鈕功能
  goBack(): void {
    if (this.boardID) {
      this.router.navigate([`/show/community/${this.boardID}/posts`]);
    } else {
      this.router.navigate(['/show/community']);
    }
  }

  // 切換回覆顯示
  toggleReplies(comment: Comment) {
    comment.showAllReplies = !comment.showAllReplies;
  }

  // 獲取可見的回覆
  getVisibleReplies(comment: Comment): Reply[] {
    return comment.replies && comment.replies.length > 0
      ? comment.showAllReplies
        ? comment.replies
        : comment.replies.slice(0, 1)
      : [];
  }

  // 預覽圖片功能
  openPreview(url: string) {
    if (!this.post?.attachments) return;
    const index = this.post.attachments.findIndex(
      (a) => a.AttachmentUrl === url
    );
    if (index !== -1) this.previewImageIndex = index;
  }

  // 關閉圖片預覽
  closePreview() {
    this.previewImageIndex = null;
  }

  // 切換圖片預覽
  prevImage() {
    if (!this.post?.attachments || this.previewImageIndex === null) return;
    const len = this.post.attachments.length;
    this.previewImageIndex = (this.previewImageIndex - 1 + len) % len;
  }

  // 切換到下一張圖片
  nextImage() {
    if (!this.post?.attachments || this.previewImageIndex === null) return;
    const len = this.post.attachments.length;
    this.previewImageIndex = (this.previewImageIndex + 1) % len;
  }

  // 切換互動狀態（喜歡、收藏、分享）
  toggleInteraction(type: 'Like' | 'Favorite' | 'Share'): void {
    if (!this.isLoggedIn || !this.currentMemberId) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '請先登入後才能操作',
        confirmButtonText: '確定',
      });
      return;
    }

    if (!this.post?.postId) {
      console.error('找不到文章 ID');
      return;
    }

    const dto: InteractionDto = {
      memberId: this.currentMemberId,
      interactionType: type,
    };

    this.postService.toggleInteraction(this.post.postId, dto).subscribe({
      next: (response) => {
        if (!this.post) return;

        // 更新互動狀態和計數
        switch (type) {
          case 'Like':
            this.userInteractions.hasLiked = !this.userInteractions.hasLiked;
            this.post.likes = response.count;
            break;
          case 'Favorite':
            this.userInteractions.hasFavorited =
              !this.userInteractions.hasFavorited;
            this.post.favorites = response.count;
            break;
          case 'Share':
            this.userInteractions.hasShared = !this.userInteractions.hasShared;
            this.post.shares = response.count;
            break;
        }

        // 強制更新視圖
        this.cdr.detectChanges();

        // // 用於除錯
        // console.log(`${type} 狀態更新:`, {
        //   type,
        //   newCount: response.count,
        //   userInteractions: this.userInteractions,
        //   post: this.post,
        // });
      },
      error: (error) => {
        console.error('互動操作失敗:', error);
        Swal.fire({
          icon: 'error',
          title: '操作失敗',
          text: '請稍後再試',
          confirmButtonText: '確定',
        });
      },
    });
  }

  // 切換回覆的喜歡狀態
  toggleReplyLike(reply: Comment | Reply): void {
    if (!this.isLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '請先登入後才能操作',
        confirmButtonText: '確定',
      });
      return;
    }

    if (!this.post?.postId) {
      console.error('找不到文章 ID');
      return;
    }

    const replyId = 'id' in reply ? reply.id : reply.replyID;
    if (!replyId) {
      console.error('找不到回覆 ID');
      return;
    }

    this.postService
      .toggleReplyLike(this.post.postId, replyId)
      .pipe(
        catchError((error) => {
          console.error('喜歡操作失敗:', error);
          Swal.fire({
            icon: 'error',
            title: '操作失敗',
            text: '請稍後再試',
            confirmButtonText: '確定',
          });
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          if ('id' in reply) {
            (reply as Comment).hasLiked = !(reply as Comment).hasLiked;
          } else {
            (reply as Reply).hasLiked = !(reply as Reply).hasLiked;
          }
          reply.likes = response.count;
        },
      });
  }

  // 載入所有回覆的喜歡狀態
  private loadAllRepliesLikeStatus(): void {
    if (!this.post?.postId || !this.isLoggedIn) return;

    // 載入主留言的喜歡狀態
    this.comments.forEach((comment) => {
      if (comment.id) {
        this.postService
          .getReplyLikeStatus(this.post!.postId, comment.id)
          .subscribe({
            next: (hasLiked) => {
              comment.hasLiked = hasLiked;
              this.cdr.detectChanges();
            },
            error: (err) => console.error('載入留言喜歡狀態失敗', err),
          });
      }

      // 載入子回覆的喜歡狀態
      comment.replies?.forEach((reply) => {
        if (reply.replyID) {
          this.postService
            .getReplyLikeStatus(this.post!.postId, reply.replyID)
            .subscribe({
              next: (hasLiked) => {
                reply.hasLiked = hasLiked;
                this.cdr.detectChanges();
              },
              error: (err) => console.error('載入子回覆喜歡狀態失敗', err),
            });
        }
      });
    });
  }

  // 分享功能
  sharePost(): void {
    if (!this.post) {
      Swal.fire({
        icon: 'error',
        title: '無法分享',
        text: '無法取得文章資訊，無法分享。',
        confirmButtonText: '確定',
      });
      return;
    }

    const postUrl = window.location.href;

    navigator.clipboard
      .writeText(postUrl)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: '分享成功',
          text: '連結已複製到剪貼簿！',
          confirmButtonText: '確定',
        });
        // 更新分享狀態和計數（如果需要的話）
        this.userInteractions.hasShared = true;
        if (this.post) {
          this.post.shares = (this.post.shares || 0) + 1;
        }
      })
      .catch((err) => {
        console.error('無法複製連結: ', err);
        Swal.fire({
          icon: 'error',
          title: '複製失敗',
          text: '複製連結失敗，請手動複製。',
          confirmButtonText: '確定',
        });
      });
  }

  // 喜歡文章
  likePost(): void {
    this.toggleInteraction('Like');
  }

  // 收藏文章
  favoritePost(): void {
    this.toggleInteraction('Favorite');
  }

  // 新增方法：解析YouTube URL並轉換為iframe
  processContent(content: string): SafeHtml {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let processedContent = content.replace(urlRegex, (url) => {
      if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtube.com')
          ? url.split('v=')[1]?.split('&')[0]
          : url.split('/').pop();
        if (videoId) {
          return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        }
      }
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(processedContent);
  }

  get currentPreviewImage(): string | null {
    if (this.previewImageIndex === null) return null;
    return (
      this.post?.attachments?.[this.previewImageIndex]?.AttachmentUrl ?? null
    );
  }

  // 取得個人主頁 routerLink（從 post 取 id 的通用方法）
  getProfileLinkFromPost(post: Post): any[] {
    const id =
      (post as any).authorId ??
      (post as any).memberId ??
      (post as any).memberID ??
      (post as any).author ??
      (post as any).authorName ??
      '';
    return ['/show/community/personal/', id];
  }

  // 取得個人主頁 routerLink（從 comment）
  getProfileLinkForComment(comment: Comment): any[] {
    const id =
      (comment as any).userId ??
      (comment as any).memberId ??
      (comment as any).memberID ??
      (comment as any).id ??
      (comment as any).name ??
      '';
    return ['/show/community/personal/', id];
  }

  // 取得個人主頁 routerLink（從 reply）
  getProfileLinkForReply(reply: Reply): any[] {
    const id =
      (reply as any).userId ??
      (reply as any).memberId ??
      (reply as any).memberID ??
      (reply as any).replyID ??
      (reply as any).name ??
      '';
    return ['/show/community/personal/', id];
  }

  // 處理檢舉 （打開模態框）
  reportContent(contentType: 'Post' | 'Reply', contentId: number): void {
    if (!this.isLoggedIn || !this.currentMemberId) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '請先登入才能檢舉！',
        confirmButtonText: '確定',
      });
      return;
    }

    // 新增：檢查 contentId 是否有效
    if (!contentId || typeof contentId !== 'number') {
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: '內容 ID 無效，無法檢舉。',
        confirmButtonText: '確定',
      });
      return;
    }

    // 儲存當前檢舉內容資訊
    this.currentReportContentType = contentType;
    this.currentReportContentId = contentId;

    // 確保模態框實例存在
    if (!this.reportModal) {
      this.initializeReportModal();
    }

    // 打開模態框
    if (this.reportModal) {
      this.reportModal.show();
    } else {
      console.error('無法初始化檢舉模態框');
      Swal.fire({
        icon: 'error',
        title: '系統錯誤',
        text: '無法開啟檢舉視窗，請重新整理頁面後再試。',
        confirmButtonText: '確定',
      });
    }
  }

  // 新增：選擇檢舉原因並提交
  selectReportReason(reason: string): void {
    if (
      !this.currentReportContentType ||
      !this.currentReportContentId ||
      !this.currentMemberId
    ) {
      this.showReportError('檢舉資訊不完整，請重新嘗試。');
      return;
    }

    const report: ReportRequest = {
      ContentType: this.currentReportContentType,
      ContentId: this.currentReportContentId,
      ReporterMemberId: this.currentMemberId,
      ReasonType: reason,
    };

    this.postService.submitReport(report).subscribe({
      next: () => {
        // 先關閉模態框
        this.closeReportModal();

        // 再顯示成功訊息
        Swal.fire({
          icon: 'success',
          title: '檢舉已提交',
          text: '感謝您的回報！',
          confirmButtonText: '確定',
        });
      },
      error: (err) => {
        console.error('檢舉失敗:', err);

        // 先關閉模態框
        this.closeReportModal();

        // 再顯示錯誤訊息
        Swal.fire({
          icon: 'error',
          title: '檢舉失敗',
          text: '請稍後再試。',
          confirmButtonText: '確定',
        });
      },
    });
  }

  // 關閉檢舉模態框並重置狀態的輔助方法
  closeReportModal(): void {
    // 重置狀態
    this.currentReportContentType = null;
    this.currentReportContentId = null;

    // 直接關閉模態框
    if (this.reportModal) {
      try {
        this.reportModal.hide();
      } catch (error) {
        console.warn('關閉模態框失敗:', error);
        // 如果失敗，手動移除類別
        const modalElement = document.getElementById('reportModal');
        if (modalElement) {
          modalElement.classList.remove('show');
          modalElement.style.display = 'none';
          modalElement.setAttribute('aria-hidden', 'true');
        }
      }
    }

    // 簡單清理背景遮罩
    setTimeout(() => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      });
    }, 100);

    // 確保頁面可互動
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  // 新增：最終清理（當模態框正常關閉後）
  private finalCleanup(): void {
    // 確保頁面狀態正常
    this.ensurePageInteractivity();
    // 重新初始化模態框
    this.reinitializeReportModal();
  }

  // 新增：強制清理（當正常關閉失敗時）
  private forceCleanup(): void {
    try {
      const modalElement = document.getElementById('reportModal');
      if (modalElement) {
        // 檢查模態框是否仍然顯示
        if (
          modalElement.classList.contains('show') ||
          modalElement.style.display !== 'none'
        ) {
          modalElement.classList.remove('show');
          modalElement.style.display = 'none';
          modalElement.setAttribute('aria-hidden', 'true');
          modalElement.removeAttribute('aria-modal');
          modalElement.removeAttribute('role');
        }
      }

      // 安全地清理背景遮罩
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop) => {
          try {
            if (backdrop.parentNode) {
              backdrop.parentNode.removeChild(backdrop);
            } else {
              backdrop.remove();
            }
          } catch (error) {
            console.warn('清理背景遮罩時出錯:', error);
          }
        });
      }, 50);

      this.ensurePageInteractivity();
      this.reinitializeReportModal();
    } catch (error) {
      console.error('強制清理時發生錯誤:', error);
    }
  }

  // 新增：確保頁面可互動
  private ensurePageInteractivity(): void {
    // 完全恢復 body 的正常狀態
    const body = document.body;
    body.classList.remove('modal-open');
    body.style.overflow = '';
    body.style.paddingRight = '';

    // 如果有多餘的樣式，清理掉
    const bodyStyle = body.getAttribute('style');
    if (
      (bodyStyle && bodyStyle.includes('overflow')) ||
      (bodyStyle && bodyStyle.includes('padding'))
    ) {
      body.removeAttribute('style');
    }

    // 確保 html 元素也沒有被鎖定
    const html = document.documentElement;
    html.classList.remove('modal-open');
    html.style.overflow = '';
    html.style.paddingRight = '';
  }

  // 重新初始化檢舉模態框
  private reinitializeReportModal(): void {
    try {
      // 銷毀現有的 Modal 實例
      if (this.reportModal) {
        this.reportModal.dispose();
        this.reportModal = null;
      }

      // 重新創建 Modal 實例
      const modalElement = document.getElementById('reportModal');
      if (modalElement) {
        this.reportModal = new bootstrap.Modal(modalElement);
      }
    } catch (error) {
      console.warn('重新初始化模態框失敗:', error);
      // 如果重新初始化失敗，在下次打開時再次嘗試
      this.reportModal = null;
    }
  }

  // 顯示檢舉錯誤的輔助方法
  private showReportError(message: string): void {
    this.closeReportModal();

    Swal.fire({
      icon: 'error',
      title: '檢舉失敗',
      text: message,
      confirmButtonText: '確定',
    });
  }

  // 新增：檢查是否為作者
  isAuthor(memberId: number | undefined): boolean {
    if (!memberId || !this.currentMemberId) return false;
    // console.log('isAuthor check:', { currentMemberId: this.currentMemberId, memberId });  // 檢查值
    return this.currentMemberId === memberId;
  }

  // 新增：開始編輯文章
  startEditPost(): void {
    this.editingPost = this.post;
    // 打開模態框
    const modal = document.getElementById('editPostModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      // 添加 backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // 移除現有附件
  removeExistingAttachment(attachment: Attachment): void {
    if (this.editingPost) {
      // console.log('準備刪除附件:', attachment);
      // console.log('附件的所有屬性:', Object.keys(attachment));

      // 修正：更全面地嘗試取得附件 ID
      const attachmentId =
        attachment.AttachmentID ||
        (attachment as any).attachmentID ||
        (attachment as any).attachmentId ||
        (attachment as any).AttachmentId ||
        (attachment as any).id ||
        (attachment as any).Id ||
        (attachment as any).ID;

      // console.log('提取的附件 ID:', attachmentId, typeof attachmentId);

      if (!attachmentId && attachmentId !== 0) {
        // 允許 ID 為 0
        console.error('附件缺少有效的 ID:', attachment);

        // 嘗試從 URL 中提取檔名作為備用方案
        const urlParts = attachment.AttachmentUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];

        Swal.fire({
          icon: 'error',
          title: '錯誤',
          text: `無法識別附件 ID (檔案: ${fileName})`,
          confirmButtonText: '確定',
        });
        return;
      }

      // 從編輯中的文章移除附件
      this.editingPost.attachments = this.editingPost.attachments?.filter(
        (a) => {
          const aId =
            a.AttachmentID ||
            (a as any).attachmentID ||
            (a as any).attachmentId ||
            (a as any).AttachmentId ||
            (a as any).id ||
            (a as any).Id ||
            (a as any).ID;
          return aId !== attachmentId;
        }
      );

      // 添加到刪除列表
      if (!this.attachmentsToDelete.includes(attachmentId)) {
        this.attachmentsToDelete.push(attachmentId);
        // console.log('已添加到刪除列表:', attachmentId);
      }

      // console.log('當前刪除列表:', this.attachmentsToDelete);
      // console.log('剩餘附件:', this.editingPost.attachments?.length || 0);
    }
  }

  // 儲存編輯文章
  saveEditPost(): void {
    // console.log('開始更新文章');
    // console.log('文章 ID:', this.editingPost?.postId);
    // console.log('要刪除的附件:', this.attachmentsToDelete);
    // console.log('新上傳的檔案:', this.selectedFiles);

    if (!this.editingPost || !this.editingPost.postId) return;

    // 驗證標題和內容
    if (!this.editingPost.title.trim() || !this.editingPost.content.trim()) {
      Swal.fire({
        icon: 'error',
        title: '更新失敗',
        text: '標題和內容不能為空',
        confirmButtonText: '確定',
      });
      return;
    }

    // 修改：直接構建更新請求，讓後端處理附件刪除
    const formData = new FormData();
    formData.append('title', this.editingPost!.title.trim());
    formData.append('content', this.editingPost!.content.trim());

    // 添加會員 ID
    if (this.currentMemberId) {
      formData.append('memberId', this.currentMemberId.toString());
    }

    // 添加要刪除的附件 ID 列表
    if (this.attachmentsToDelete.length > 0) {
      formData.append(
        'deletedAttachmentIds',
        JSON.stringify(this.attachmentsToDelete)
      );
      // console.log(
      //   '要刪除的附件 IDs:',
      //   JSON.stringify(this.attachmentsToDelete)
      // );
    }

    // 添加新附件
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });
      // console.log(`添加了 ${this.selectedFiles.length} 個新附件`);
    } else {
      // console.log('沒有新附件需要上傳');
    }

    // 發送更新請求
    this.postService.updatePost(this.editingPost!.postId, formData).subscribe({
      next: () => {
        if (this.post) {
          this.post.title = this.editingPost!.title;
          this.post.content = this.editingPost!.content;
          this.sanitizedContent = this.processContent(
            this.editingPost!.content
          );

          // 更新附件列表 - 移除已刪除的附件
          if (this.post.attachments && this.attachmentsToDelete.length > 0) {
            this.post.attachments = this.post.attachments.filter((att) => {
              const attId = att.AttachmentID;
              return !this.attachmentsToDelete.includes(attId);
            });
          }
        }

        this.closeEditPostModal();
        this.selectedFiles = [];
        this.attachmentsToDelete = [];

        Swal.fire({
          icon: 'success',
          title: '文章更新成功',
          confirmButtonText: '確定',
        }).then(() => {
          // 重新載入文章以獲取最新的附件狀態
          if (this.postId) {
            this.loadPost(+this.postId);
          }
        });
      },
      error: (err: any) => {
        console.error('更新文章失敗:', err);

        let errorMessage = '請稍後再試';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.errors) {
            errorMessage = Object.values(err.error.errors).flat().join(', ');
          }
        }

        Swal.fire({
          icon: 'error',
          title: '更新失敗',
          text: errorMessage,
          confirmButtonText: '確定',
        });
      },
    });
  }

  // 修改：取消編輯文章
  cancelEditPost(): void {
    this.selectedFiles = [];
    this.attachmentsToDelete = [];
    this.closeEditPostModal();
  }

  // 修改：開始編輯回覆（打開模態框）
  startEditComment(comment: Comment): void {
    this.editingComment = comment;
    // 打開模態框
    const modal = document.getElementById('editCommentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      // 添加 backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // 修改：儲存編輯回覆
  saveEditComment(): void {
    if (!this.editingComment || !this.editingComment.id) return;
    this.postService
      .updateReply(this.editingComment.id, this.editingComment.content)
      .subscribe({
        next: () => {
          this.editingComment!.content = this.editingComment!.content;
          this.closeEditCommentModal();
          Swal.fire({
            icon: 'success',
            title: '回覆更新成功',
            confirmButtonText: '確定',
          });
        },
        error: (err: any) => {
          console.error('更新回覆失敗:', err);
          Swal.fire({
            icon: 'error',
            title: '更新失敗',
            text: '請稍後再試',
            confirmButtonText: '確定',
          });
        },
      });
  }

  // 修改：關閉編輯回覆模態框
  closeEditCommentModal(): void {
    this.editingComment = null;
    const modal = document.getElementById('editCommentModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      // 移除 backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => document.body.removeChild(backdrop));
    }
  }

  // 新增：開始編輯子回覆（打開模態框）
  startEditReply(reply: Reply): void {
    this.editingReply = reply;
    // 打開模態框
    const modal = document.getElementById('editReplyModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      // 添加 backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // 新增：儲存編輯子回覆
  saveEditReply(): void {
    if (!this.editingReply || !this.editingReply.replyID) return;
    this.postService
      .updateReply(this.editingReply.replyID, this.editingReply.content)
      .subscribe({
        next: () => {
          this.closeEditReplyModal();
          Swal.fire({
            icon: 'success',
            title: '回覆更新成功',
            confirmButtonText: '確定',
          });
        },
        error: (err: any) => {
          console.error('更新回覆失敗:', err);
          Swal.fire({
            icon: 'error',
            title: '更新失敗',
            text: '請稍後再試',
            confirmButtonText: '確定',
          });
        },
      });
  }

  // 修改：取消編輯回覆
  cancelEditReply(): void {
    this.closeEditReplyModal();
  }

  // 新增：關閉編輯模態框
  closeEditReplyModal(): void {
    this.editingReply = null;
    const modal = document.getElementById('editReplyModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      // 移除 backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => document.body.removeChild(backdrop));
    }
  }

  // 新增：軟刪除文章
  deletePost(): void {
    if (!this.postId || !this.post) return;
    this.postService.updatePostStatus(+this.postId, 'Inactive').subscribe({
      next: () => {
        if (this.post) {
          this.post.postStatus = 'Inactive';
        }
        Swal.fire({
          icon: 'success',
          title: '文章已刪除',
          confirmButtonText: '確定',
        });
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: '刪除失敗',
          text: '請稍後再試',
          confirmButtonText: '確定',
        });
      },
    });
  }

  // 新增：軟刪除回覆
  deleteComment(comment: Comment): void {
    const replyId = comment.id || comment.replyID;
    if (!replyId) return;
    Swal.fire({
      title: '確認刪除回覆',
      text: '確定要刪除這個回覆嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService.updateReplyStatus(replyId, 'Deleted').subscribe({
          next: () => {
            comment.replieStatus = 'Deleted';
            comment.content = '該條回覆已被刪除';
            Swal.fire({
              icon: 'success',
              title: '回覆已刪除',
              confirmButtonText: '確定',
            });
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: '刪除失敗',
              text: '請稍後再試',
              confirmButtonText: '確定',
            });
          },
        });
      }
    });
  }

  // 新增：軟刪除子回覆
  deleteReply(reply: Reply): void {
    if (!reply.replyID) return;
    Swal.fire({
      title: '確認刪除回覆',
      text: '確定要刪除這個回覆嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService
          .updateReplyStatus(reply.replyID!, 'Deleted')
          .subscribe({
            next: () => {
              reply.replieStatus = 'Deleted';
              reply.content = '該條回覆已被刪除';
              Swal.fire({
                icon: 'success',
                title: '回覆已刪除',
                confirmButtonText: '確定',
              });
            },
            error: (err: any) => {
              Swal.fire({
                icon: 'error',
                title: '刪除失敗',
                text: '請稍後再試',
                confirmButtonText: '確定',
              });
            },
          });
      }
    });
  }

  // 取消編輯回覆（用於編輯回覆模態框）
  cancelEditComment(): void {
    this.closeEditCommentModal();
  }

  // 新增：檔案選擇事件
  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  // 新增：關閉編輯文章模態框
  closeEditPostModal(): void {
    this.editingPost = null;
    const modal = document.getElementById('editPostModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      // 移除 backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => document.body.removeChild(backdrop));
    }
  }

  // 新增：移除新上傳的檔案
  removeFile(index: number): void {
    if (this.selectedFiles && index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
    }
  }

  // 新增：獲取檔案 URL
  getFileUrl(file: File): string {
    return URL.createObjectURL(file);
  }
}
