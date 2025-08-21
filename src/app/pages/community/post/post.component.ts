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
} from '../../../services/community/post.service';
import { BoardService, Board } from '../../../services/community/board.service';

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

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private postService: PostService,
    private boardService: BoardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 載入使用者資訊
    this.loadCurrentUser();

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

      const memberId = payload.MemberId;
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
        this.post = post;
        this.comments = post.comments || [];

        // 確保在這裡呼叫 loadUserInteractionStatus
        if (this.currentMemberId) {
          // console.log('開始載入使用者互動狀態...', {
          //   postId: postID,
          //   memberId: Number(this.currentMemberId), // 確保轉換為數字
          // }); // 除錯輸出

          this.postService.getUserInteractionStatus(postID).subscribe({
            next: (status) => {
              // console.log('取得互動狀態:', status); // 除錯輸出
              // // 在設定狀態前先輸出除錯訊息
              // console.log('互動記錄查詢參數:', {
              //   postId: postID,
              //   memberId: Number(this.currentMemberId),
              //   currentStatus: status,
              // });

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
      },
      error: (err) => {
        console.error(`取得文章(ID: ${postID})失敗`, err);
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
      alert('請先登入才能回覆或留言！');
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
        alert('回覆失敗：留言資料不完整，請重新整理頁面後再試');
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

  isImage(url?: string): boolean {
    return !!url && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
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
      alert('請先登入後才能操作');
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
        alert('操作失敗，請稍後再試');
      },
    });
  }

  // 切換回覆的喜歡狀態
  toggleReplyLike(reply: Comment | Reply): void {
    if (!this.isLoggedIn) {
      alert('請先登入後才能操作');
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
          alert('操作失敗，請稍後再試');
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
            error: (err) => console.error('載入留言喜歡狀態失敗:', err),
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
              error: (err) => console.error('載入子回覆喜歡狀態失敗:', err),
            });
        }
      });
    });
  }

  // 分享功能
  sharePost(): void {
    if (!this.post) {
      alert('無法取得文章資訊，無法分享。');
      return;
    }

    const postUrl = window.location.href;

    navigator.clipboard
      .writeText(postUrl)
      .then(() => {
        alert('連結已複製到剪貼簿！');
        // 更新分享狀態和計數（如果需要的話）
        this.userInteractions.hasShared = true;
        if (this.post) {
          this.post.shares = (this.post.shares || 0) + 1;
        }
      })
      .catch((err) => {
        console.error('無法複製連結: ', err);
        alert('複製連結失敗，請手動複製。');
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

  get currentPreviewImage(): string | null {
    if (this.previewImageIndex === null) return null;
    return (
      this.post?.attachments?.[this.previewImageIndex]?.AttachmentUrl ?? null
    );
  }
}
