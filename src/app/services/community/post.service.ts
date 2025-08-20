import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PostStateService } from './PostState.service';
import { map } from 'rxjs/operators';

// 回覆（子留言）
export interface Reply {
  replyID?: number;
  memberID?: number;
  name: string;
  avatar: string;
  content: string;
  rawContent?: string;
  createdAt: string | Date;
  likes: number;
  hasLiked?: boolean; // 是否已經喜歡過
  subReplies?: Reply[]; // 子回覆
  floorTag?: string; // 樓層標籤
  parentFloorTag?: string; // 父留言樓層標籤
}

// 主留言
export interface Comment {
  id?: number;
  replyID?: number;
  memberID?: number;
  name: string;
  avatar: string;
  content: string;
  rawContent?: string;
  createdAt: string | Date;
  likes: number; // 喜歡數量
  hasLiked?: boolean; // 是否已經喜歡過
  replies?: Reply[]; // 子回覆
  showAllReplies?: boolean; // 是否顯示所有回覆
  floorTag?: string; // 樓層標籤
  draftReply?: string; // 草稿回覆內容
}

// 附件
export interface Attachment {
  AttachmentID: number;
  PostID: number;
  ReplyID: number | null;
  AttachmentUrl: string;
}

// 用戶互動狀態
export interface UserInteractionStatus {
  hasLiked: boolean;
  hasFavorited: boolean;
  hasShared: boolean;
}

// 文章
export interface Post {
  postId: number;
  memberId: number;
  boardId: number;
  title: string;
  content: string;
  isPinned: boolean;
  postStatus: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  favorites: number;
  shares: number;

  // 額外欄位
  excerpt?: string;
  author?: string;
  comments?: Comment[];
  attachments?: Attachment[]; // 將型別從 string[] 改為 Attachment[]
}

// 互動回應
export interface InteractionResponse {
  interactionType: string;
  count: number;
}

// 文章狀態服務
export interface InteractionDto {
  memberId: number;
  interactionType: 'Like' | 'Favorite' | 'Share';
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'https://localhost:7124/api/CommunityPosts'; // 後端 API

  constructor(
    private http: HttpClient,
    private postStateService: PostStateService
  ) {}

  // 私有方法：取得認證標頭
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // 私有方法：從 JWT Token 取得會員 ID
  private getMemberIdFromToken(): number | null {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // // 檢查 payload 中的會員 ID
      // console.log('Token payload:', payload); // 除錯輸出

      // 根據您的 JWT token 結構修改這裡
      const memberId = payload.MemberId;

      if (!memberId) {
        console.error('Token 中找不到會員 ID');
        return null;
      }

      // 確保返回數字類型
      const numericMemberId = Number(memberId);
      if (isNaN(numericMemberId)) {
        console.error('會員 ID 不是有效的數字');
        return null;
      }

      // console.log('從 Token 取得會員 ID:', numericMemberId); // 除錯輸出
      return numericMemberId;
    } catch (error) {
      console.error('解析 Token 失敗:', error);
      return null;
    }
  }

  // 取得全部文章
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  // 取得單篇文章（同時包含留言與附件）
  getPost(id: number): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => {
        // 處理附件
        const attachments: Attachment[] = (res.attachments || [])
          .filter(
            (url: string | undefined): url is string =>
              !!url && typeof url === 'string'
          )
          .map((url: string, index: number) => ({
            AttachmentID: index + 1,
            PostID: res.postId,
            ReplyID: null,
            AttachmentUrl: url.startsWith('http')
              ? url
              : `https://localhost:7124/uploads/${url}`,
          }));

        // 處理留言與回覆
        const comments: Comment[] = (res.comments || []).map((c: any) => {
          const commentId =
            c.id ||
            c.Id ||
            c.replyId ||
            c.ReplyId ||
            c.commentId ||
            c.CommentId ||
            c.replyID ||
            c.ReplyID ||
            c.ID ||
            c.REPLYID ||
            c.COMMENTID;

          if (!commentId) {
            console.error('警告：無法找到留言 ID！留言資料:', c);
            console.error('可用的屬性:', Object.keys(c));
          }

          const processedReplies = (c.replies || []).map((sr: any) => {
            const subReplyId =
              sr.id ||
              sr.Id ||
              sr.replyId ||
              sr.ReplyId ||
              sr.commentId ||
              sr.CommentId ||
              sr.replyID ||
              sr.ReplyID;

            return {
              replyID: subReplyId,
              memberID:
                sr.memberId || sr.MemberId || sr.memberID || sr.MemberID,
              name: sr.author || sr.Author || sr.name || sr.Name || '匿名',
              avatar:
                sr.avatar || sr.Avatar
                  ? `https://localhost:7124/images/avatars/${
                      sr.avatar || sr.Avatar
                    }`
                  : `https://i.pravatar.cc/30?u=${sr.memberId || sr.MemberId}`,
              content: sr.content || sr.Content,
              rawContent: sr.content || sr.Content,
              createdAt: sr.createdAt || sr.CreatedAt,
              likes: sr.likes ?? sr.Likes ?? 0,
            };
          });

          const processedComment = {
            id: commentId,
            replyID: commentId,
            memberID: c.memberId || c.MemberId || c.memberID || c.MemberID,
            name: c.author || c.Author || c.name || c.Name || '匿名',
            avatar:
              c.avatar || c.Avatar
                ? `https://localhost:7124/images/avatars/${
                    c.avatar || c.Avatar
                  }`
                : `https://i.pravatar.cc/40?u=${c.memberId || c.MemberId}`,
            content: c.content || c.Content,
            rawContent: c.content || c.Content,
            createdAt: c.createdAt || c.CreatedAt,
            likes: c.likes ?? c.Likes ?? 0,
            replies: processedReplies,
            showAllReplies: false,
            draftReply: '',
          };

          return processedComment;
        });

        const post: Post = {
          ...res,
          attachments,
          comments,
          author: res.author || res.Author || '匿名',
          likes: res.likes ?? res.Likes ?? 0, // 修正：使用後端回傳的正確數量
          favorites: res.favorites ?? res.Favorites ?? 0, // 修正：使用後端回傳的正確數量
          shares: res.shares ?? res.Shares ?? 0, // 修正：使用後端回傳的正確數量
        };

        return post;
      })
    );
  }

  // 取得用戶互動狀態
  getUserInteractionStatus(postId: number): Observable<UserInteractionStatus> {
    const memberId = this.getMemberIdFromToken();
    if (!memberId) {
      throw new Error('無法取得會員 ID');
    }

    // console.log('發送互動狀態查詢:', {
    //   postId: Number(postId),
    //   memberId: memberId,
    // }); // 除錯輸出

    return this.http
      .get<UserInteractionStatus>(
        `${this.apiUrl}/${postId}/interaction/status/${memberId}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        tap((response) => {
          // console.log('API 回應:', response); // 除錯輸出
        })
      );
  }

  // 取得指定看板文章
  getPostsByBoard(boardID: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/board/${boardID}`);
  }

  // 更新喜歡數
  toggleLike(postId: string) {
    return this.http.post<any>(`${this.apiUrl}/posts/${postId}/like`, {}).pipe(
      tap((response) => {
        this.postStateService.updatePostCounts(postId, {
          likes: response.likeCount,
        });
      })
    );
  }

  // 更新收藏數
  toggleFavorite(postId: string) {
    return this.http
      .post<any>(`${this.apiUrl}/posts/${postId}/favorite`, {})
      .pipe(
        tap((response) => {
          this.postStateService.updatePostCounts(postId, {
            favorites: response.favoriteCount,
          });
        })
      );
  }

  // 更新留言數
  addComment(postId: string, comment: any) {
    return this.http
      .post<any>(`${this.apiUrl}/posts/${postId}/comments`, comment)
      .pipe(
        tap((response) => {
          this.postStateService.updatePostCounts(postId, {
            comments: response.commentCount,
          });
        })
      );
  }

  // 新增文章
  createPost(formData: FormData): Observable<any> {
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<any>(this.apiUrl, formData, { headers });
  }

  // 更新文章
  updatePost(post: Post): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${post.postId}`, post);
  }

  // 刪除文章
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 新增留言
  createComment(postID: number, comment: Comment): Observable<Comment> {
    const memberId = this.getMemberIdFromToken();
    return this.http.post<Comment>(
      `${this.apiUrl}/${postID}/replies`,
      {
        memberId: memberId,
        content: comment.content,
      },
      { headers: this.getAuthHeaders() }
    );
  }

  // 新增回覆
  createReply(
    postID: number,
    parentReplyID: number,
    reply: Reply
  ): Observable<Reply> {
    const memberId = this.getMemberIdFromToken();
    return this.http.post<Reply>(
      `${this.apiUrl}/${postID}/replies/${parentReplyID}/subReplies`,
      {
        memberId: memberId,
        content: reply.content,
      },
      { headers: this.getAuthHeaders() }
    );
  }

  // 處理喜歡、收藏與分享的方法
  toggleInteraction(
    postId: number,
    dto: InteractionDto // 修改參數型別為 InteractionDto
  ): Observable<InteractionResponse> {
    const memberId = this.getMemberIdFromToken();

    if (!memberId) {
      throw new Error('無法取得會員 ID');
    }

    // 使用傳入的 dto 而不是建立新的 payload
    return this.http.post<InteractionResponse>(
      `${this.apiUrl}/${postId}/interaction`,
      dto, // 直接使用傳入的 dto
      { headers: this.getAuthHeaders() }
    );
  }

  // 切換回覆的喜歡狀態
  toggleReplyLike(
    postId: number,
    replyId: number
  ): Observable<{ count: number }> {
    const memberId = this.getMemberIdFromToken();

    if (!memberId) {
      throw new Error('無法取得會員 ID');
    }

    return this.http.post<{ count: number }>(
      `${this.apiUrl}/${postId}/replies/${replyId}/like`,
      { memberId: memberId, interactionType: 'Like' },
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得回覆的喜歡狀態
  getReplyLikeStatus(postId: number, replyId: number): Observable<boolean> {
    const memberId = this.getMemberIdFromToken();
    return this.http.get<boolean>(
      `${this.apiUrl}/${postId}/replies/${replyId}/like/status/${memberId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得指定文章附件
  getAttachments(postID: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}/${postID}/attachments`);
  }
}
