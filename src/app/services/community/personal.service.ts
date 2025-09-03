// src/app/services/community/personal.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CommunityProfileDto {
  memberId: number;
  name: string | null;
  photoUrl: string | null;
  bio: string | null;
  followers: number;
  isFollowing: boolean;
  isFriend?: boolean; // 好友狀態
}

export interface UserPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  boardID: number;
  isFavorited?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  private profileUrl = 'https://localhost:7124/api/CommunityProfile';
  private postsUrl = 'https://localhost:7124/api/CommunityPosts';
  private favoritesUrl = 'https://localhost:7124/api/CommunityFavorites';

  constructor(private http: HttpClient) {}

  /** 取得會員資料 */
  getUserProfile(memberId: number): Observable<CommunityProfileDto> {
    return this.http.get<CommunityProfileDto>(
      `${this.profileUrl}/${memberId}/profile`
    );
  }

  /** 取得會員貼文 */
  getUserPosts(memberId: number): Observable<UserPost[]> {
    return this.http.get<UserPost[]>(`${this.profileUrl}/${memberId}/posts`);
  }

  /** 切換追蹤 */
  toggleFollow(memberId: number): Observable<any> {
    const headers = this.getAuthHeaders(); // 修正方法名稱

    // 修正為正確的後端路徑
    return this.http.post(`${this.profileUrl}/${memberId}/toggle-follow`, {}, { headers }).pipe(
      catchError((error) => {
        console.error('追蹤操作失敗:', error);
        return throwError(() => error);
      })
    );
  }

  /** 取得認證標頭 */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });
  }

  /** 取得使用者收藏貼文列表 (只回傳 postId) */
  getFavorites(memberId: number): Observable<{ postId: number }[]> {
    return this.http.get<{ postId: number }[]>(`${this.favoritesUrl}/${memberId}/favorites`);
  }

  /** 新增收藏 */
  addFavorite(memberId: number, postId: number): Observable<any> {
    return this.http.post(`${this.favoritesUrl}/${memberId}/favorites`, { postId });
  }

  /** 移除收藏 */
  removeFavorite(memberId: number, postId: number): Observable<any> {
    return this.http.delete(`${this.favoritesUrl}/${memberId}/favorites/${postId}`);
  }

  /** 切換單篇文章收藏狀態 */
  toggleFavorite(memberId: number, post: UserPost): Observable<any> {
    return post.isFavorited
      ? this.removeFavorite(memberId, post.id)
      : this.addFavorite(memberId, post.id);
  }

  /** 根據多個 PostId 取得完整貼文資料 */
  getPostsByIds(postIds: number[]): Observable<UserPost[]> {
    return this.http.post<UserPost[]>(`${this.postsUrl}/postsByIds`, postIds, {
      headers: this.getAuthHeaders(),
    });
  }

  /** 上傳使用者照片 */
  uploadUserPhoto(memberId: number, file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('photo', file);

    // 只設定 Authorization 標頭，不要設定 Content-Type
    const token = localStorage.getItem('jwtToken') || '';
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      // 不要設定 Content-Type，讓瀏覽器自動處理
    });

    return this.http.post<{ photoUrl: string }>(
      `${this.profileUrl}/${memberId}/upload-photo`,
      formData,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('照片上傳失敗:', error);
        return throwError(() => error);
      })
    );
  }
}
