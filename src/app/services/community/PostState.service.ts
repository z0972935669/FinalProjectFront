import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PostCounts {
  likes: number;
  favorites: number;
  comments: number;
  views: number; // 新增瀏覽人數
}

@Injectable({
  providedIn: 'root'
})
export class PostStateService {
  private postCountsMap = new Map<string, BehaviorSubject<PostCounts>>();

  // 取得或創建特定文章的計數 BehaviorSubject
  getPostCounts(postId: string) {
    if (!this.postCountsMap.has(postId)) {
      this.postCountsMap.set(postId, new BehaviorSubject<PostCounts>({
        likes: 0,
        favorites: 0,
        comments: 0,
        views: 0, // 新增預設值
      }));
    }
    return this.postCountsMap.get(postId)!;
  }

  // 更新文章計數
  updatePostCounts(postId: string, counts: Partial<PostCounts>) {
    const currentCounts = this.getPostCounts(postId);
    currentCounts.next({
      ...currentCounts.value,
      ...counts
    });
  }

  // 清理特定文章的計數
  clearPostCounts(postId: string) {
    this.postCountsMap.delete(postId);
  }

  // 清理所有文章計數
  clearAllPostCounts() {
    this.postCountsMap.clear();
  }
}
