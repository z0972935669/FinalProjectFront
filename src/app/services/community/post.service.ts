import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
  hasLiked?: boolean;
  subReplies?: Reply[];
  floorTag?: string;
  parentFloorTag?: string;
  postId?: number;
  boardId?: number;
  memberName?: string; // 會員姓名
  replieStatus?: string; // 確保有此欄位
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
  replieStatus?: string; // 新增：回覆狀態
}

// 附件
export interface Attachment {
  AttachmentID: number;
  PostID: number;
  ReplyID: number | null;
  AttachmentUrl: string;
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
  views: number; // 新增瀏覽人數欄位

  // 額外欄位
  excerpt?: string;
  author?: string;
  comments?: Comment[];
  attachments?: Attachment[]; // 確保是物件陣列
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

// 檢舉請求介面
export interface ReportRequest {
  ContentType: 'Post' | 'Reply';
  ContentId: number;
  ReporterMemberId: number;
  ReasonType: string;
}

// 新增：會員介面
export interface Member {
  FMemberId: number;
  FName: string;
  // 其他屬性根據需要添加
}

// 新增：檢舉列表項目介面
export interface ReportListItem {
  reportId: number;
  reportStatus: string;
  reportedAt: Date;
  reasonType: string;
  reportedContentType: string;
  contentId: number;
  reporterMemberId: number;
  targetMemberId: number;
}

// 新增：檢舉詳情介面
export interface ReportDetailDto {
  reportId: number;
  reporterMemberId: number;
  targetMemberId: number;
  reportedContentType: string;
  reasonType: string;
  reportStatus: string;
  reportedAt: string;
  postId: number | null;
  replyId: number | null;
  boardId: number | null; // 如果需要
  handledEmployeeId: number;
  handledAt: Date;
  result: string;

  targetMemberName?: string; // 被檢舉會員姓名
  reportedContent?: string; // 被檢舉內容
}

// 新增：處理檢舉請求介面
export interface HandleReportRequest {
  newStatus: string;
  employeeId: number;
  result: string;
}

// 新增：用戶互動狀態介面
export interface UserInteractionStatus {
  hasLiked: boolean;
  hasFavorited: boolean;
  hasShared: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  // 修改：設為基底 URL
  private apiUrl = 'https://localhost:7124/api';

  constructor(
    private http: HttpClient,
    private postStateService: PostStateService
  ) {}

  // 私有方法：取得認證標頭（移除 Content-Type，讓瀏覽器自動設定 multipart/form-data）
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // 移除 'Content-Type'，避免覆蓋瀏覽器的自動設定
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
    return this.http.get<Post[]>(`${this.apiUrl}/CommunityPosts`).pipe(
      map((posts: any[]) =>
        posts.map((post) => ({
          ...post,
          createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
        }))
      )
    );
  }

  // 取得單篇文章（同時包含留言與附件）
  getPost(id: number): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/CommunityPosts/${id}`).pipe(
      map((res: any) => {
        console.log('API 原始回應:', res); // 除錯輸出
        console.log('API 回傳的附件:', res.attachments); // 除錯輸出

        // 修正：更全面地處理附件欄位名稱
        const attachments: Attachment[] = (res.attachments || [])
          .map((att: any, index: number) => {
            console.log(`處理附件 ${index}:`, att); // 除錯輸出

            // 嘗試多種可能的欄位名稱
            const attachmentId =
              att.AttachmentID ||
              att.attachmentID ||
              att.attachmentId ||
              att.AttachmentId ||
              att.id ||
              att.Id ||
              att.ID;

            const result = {
              AttachmentID: attachmentId,
              PostID:
                att.PostID ||
                att.postID ||
                att.postId ||
                att.PostId ||
                res.postId,
              ReplyID:
                att.ReplyID ||
                att.replyID ||
                att.replyId ||
                att.ReplyId ||
                null,
              AttachmentUrl:
                att.AttachmentUrl ||
                att.attachmentUrl ||
                att.attachmentURL ||
                att.url,
            };

            console.log(`轉換後的附件 ${index}:`, result); // 除錯輸出
            return result;
          });

        console.log('最終附件陣列:', attachments); // 除錯輸出

        // 處理留言與回覆的邏輯保持不變...
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

          const processedReplies = (c.replies || []).map((r: any) => ({
            replyID:
              r.id ||
              r.Id ||
              r.replyId ||
              r.ReplyId ||
              r.commentId ||
              r.CommentId ||
              r.replyID ||
              r.ReplyID,
            memberID: r.memberId || r.MemberId || r.memberID || r.MemberID,
            name: r.author || r.Author || r.name || r.Name || '匿名',
            avatar:
              r.avatar || r.Avatar
                ? `https://localhost:7124/images/avatars/${
                    r.avatar || r.Avatar
                  }`
                : `https://i.pravatar.cc/30?u=${r.memberId || r.MemberId}`,
            content: r.content || r.Content,
            rawContent: r.content || r.Content,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(), // 修正：處理時間
            likes: r.likes ?? r.Likes ?? 0,
            replieStatus: r.replieStatus || r.ReplieStatus || 'Active',
          }));

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
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(), // 修正：處理時間
            likes: c.likes ?? c.Likes ?? 0,
            replies: processedReplies,
            showAllReplies: false,
            draftReply: '',
            replieStatus: c.replieStatus || c.ReplieStatus || 'Active',
          };

          return processedComment;
        });

        const post: Post = {
          ...res,
          attachments,
          comments,
          author: res.author || res.Author || '匿名',
          likes: res.likes ?? res.Likes ?? 0,
          favorites: res.favorites ?? res.Favorites ?? 0,
          shares: res.shares ?? res.Shares ?? 0,
          // 修正：正確處理時間欄位
          createdAt: res.createdAt ? new Date(res.createdAt) : new Date(),
          updatedAt: res.updatedAt ? new Date(res.updatedAt) : undefined,
        };

        return post;
      })
    );
  }

  // 新增：根據 ID 獲取單篇文章
  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/CommunityPosts/${id}`);
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
        `${this.apiUrl}/CommunityPosts/${postId}/interaction/status/${memberId}`,
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
    return this.http.get<Post[]>(
      `${this.apiUrl}/CommunityPosts/board/${boardID}`
    ).pipe(
      map((posts: any[]) =>
        posts.map((post) => ({
          ...post,
          createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
        }))
      )
    );
  }

  // 更新喜歡數
  toggleLike(postId: string) {
    return this.http
      .post<any>(`${this.apiUrl}/CommunityPosts/posts/${postId}/like`, {})
      .pipe(
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
      .post<any>(`${this.apiUrl}/CommunityPosts/posts/${postId}/favorite`, {})
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
      .post<any>(
        `${this.apiUrl}/CommunityPosts/posts/${postId}/comments`,
        comment
      )
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

    return this.http.post<any>(`${this.apiUrl}/CommunityPosts`, formData, {
      headers,
    });
  }

  // 更新文章
  updatePost(postId: number, formData: FormData): Observable<any> {
    const token = localStorage.getItem('jwtToken') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`, // 只帶授權，不帶 Content-Type
    });

    // 直接使用傳入的 postId，不從 formData 中提取
    return this.http.put(`${this.apiUrl}/CommunityPosts/${postId}`, formData, {
      headers,
    });
  }

  // 更新文章（JSON 版本，無檔案時使用）
  updatePostJson(
    postId: number,
    updateData: {
      title: string;
      content: string;
      memberId?: number;
      deletedAttachmentIds?: number[];
    }
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/CommunityPosts/${postId}`,
      updateData,
      {
        headers: this.getAuthHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  // 刪除文章
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/CommunityPosts/${id}`);
  }

  // 新增留言
  createComment(postID: number, comment: Comment): Observable<Comment> {
    const memberId = this.getMemberIdFromToken();
    return this.http.post<Comment>(
      `${this.apiUrl}/CommunityPosts/${postID}/replies`,
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
      `${this.apiUrl}/CommunityPosts/${postID}/replies/${parentReplyID}/subReplies`,
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
    dto: InteractionDto
  ): Observable<InteractionResponse> {
    const memberId = this.getMemberIdFromToken();

    if (!memberId) {
      throw new Error('無法取得會員 ID');
    }

    // 使用傳入的 dto 而不是建立新的 payload
    return this.http.post<InteractionResponse>(
      `${this.apiUrl}/CommunityPosts/${postId}/interaction`,
      dto,
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
      `${this.apiUrl}/CommunityPosts/${postId}/replies/${replyId}/like`,
      { memberId: memberId, interactionType: 'Like' },
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得回覆的喜歡狀態
  getReplyLikeStatus(postId: number, replyId: number): Observable<boolean> {
    const memberId = this.getMemberIdFromToken();
    return this.http.get<boolean>(
      `${this.apiUrl}/CommunityPosts/${postId}/replies/${replyId}/like/status/${memberId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得指定文章附件
  getAttachments(postID: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(
      `${this.apiUrl}/CommunityPosts/${postID}/attachments`
    );
  }

  // 記錄文章瀏覽
  recordPostView(postId: number): Observable<{ viewCount: number }> {
    return this.http.post<{ viewCount: number }>(
      `${this.apiUrl}/CommunityPosts/${postId}/view`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // 取得分頁文章（用於無限滾動）
  getPostsByBoardPaged(
    boardID: number,
    page: number = 1,
    pageSize: number = 10
  ): Observable<{ posts: Post[]; hasMore: boolean }> {
    return this.http
      .get<{ posts: any[]; hasMore: boolean }>(
        `${this.apiUrl}/CommunityPosts/board/${boardID}/paged?page=${page}&pageSize=${pageSize}`
      )
      .pipe(
        map((response) => ({
          hasMore: response.hasMore,
          posts: response.posts.map((post) => ({
            ...post,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
          })),
        }))
      );
  }

  // 新增：提交檢舉
  submitReport(report: ReportRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/CommunityReports`, report, {
      headers: this.getAuthHeaders(),
    });
  }

  // 取得所有文章（後台用）
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/CommunityPosts`);
  }

  // 新增：取得所有會員（用於匹配名稱）
  getAllMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/Member`); // 修改為 /Member
  }

  // 更新文章狀態
  updatePostStatus(postId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/CommunityPosts/${postId}/status`, {
      status,
    });
  }

  // 修改：取得檢舉列表（支援篩選與分頁）
  getReports(params: HttpParams): Observable<{
    total: number;
    page: number;
    pageSize: number;
    items: ReportListItem[];
  }> {
    return this.http.get<{
      total: number;
      page: number;
      pageSize: number;
      items: ReportListItem[];
    }>(`${this.apiUrl}/CommunityReports`, { params });
  }

  // 新增：取得單一檢舉詳情
  getReportById(id: number): Observable<ReportDetailDto> {
    return this.http.get<ReportDetailDto>(
      `${this.apiUrl}/CommunityReports/${id}`
    );
  }

  // 新增：處理檢舉
  handleReport(id: number, request: HandleReportRequest): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/CommunityReports/${id}/handle`,
      request
    );
  }

  // 新增：根據 ID 獲取單個回覆
  getReplyById(id: number): Observable<Reply> {
    return this.http.get<Reply>(`${this.apiUrl}/CommunityPosts/replies/${id}`);
  }

  // 更新回覆狀態（軟刪除）
  updateReplyStatus(replyId: number, status: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/CommunityPosts/replies/${replyId}/status`,
      { status }
    );
  }

  // 新增：更新回覆內容
  updateReply(replyId: number, content: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/CommunityPosts/replies/${replyId}`, {
      content,
    });
  }

  // 新增：刪除附件
  deleteAttachment(attachmentId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/CommunityPosts/attachments/${attachmentId}`
    );
  }
}
