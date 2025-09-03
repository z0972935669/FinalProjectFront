import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PostService, Post } from '../../../services/community/post.service';
import { BoardService, Board } from '../../../services/community/board.service';
import { PostStateService } from '../../../services/community/PostState.service';
import Swal from 'sweetalert2'; // SweetAlert2

// 擴展 Post 型別，加上 excerpt
export interface PostWithExcerpt extends Post {
  excerpt?: string;
}

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss'],
})
export class PostListComponent implements OnInit, OnDestroy {
  boardID: string = '';
  posts: PostWithExcerpt[] = [];
  filteredPosts: PostWithExcerpt[] = [];
  searchKeyword: string = '';
  isLoading: boolean = true;
  isLoadingMore: boolean = false; // 載入更多文章的狀態
  hasMorePosts: boolean = true; // 是否還有更多文章
  currentPage: number = 1;
  pageSize: number = 10; // 每頁載入10篇文章
  boardNameValue: string = '未知看板';

  private scrollThreshold: number = 200; // 距離底部多少像素時開始載入

  private searchTimeout: any; // 搜尋延遲計時器
  isSearchingAll: boolean = false; // 是否正在搜尋所有文章

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private postService: PostService,
    private boardService: BoardService,
    private postStateService: PostStateService
  ) {}

  ngOnInit() {
    const boardIDParam = this.route.snapshot.paramMap.get('boardID');

    if (!boardIDParam) {
      console.error('boardID 從路由無法取得！');
      return;
    }

    this.boardID = boardIDParam;
    const boardIdNumber = +this.boardID;

    this.fetchBoardName(boardIdNumber);
    this.loadInitialPosts(boardIdNumber);
  }

  ngOnDestroy() {
    this.postStateService.clearAllPostCounts();
  }

  // 載入初始文章
  loadInitialPosts(boardID: number) {
    this.isLoading = true;
    this.currentPage = 1;

    this.postService.getPostsByBoardPaged(boardID, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        const postsWithExcerpt = response.posts.map((post: Post) => ({
          ...post,
          excerpt:
            post.content && post.content.length > 100
              ? post.content.slice(0, 100) + '...'
              : post.content,
        }));

        this.posts = postsWithExcerpt;
        this.filteredPosts = postsWithExcerpt;
        this.hasMorePosts = response.hasMore;

        // 更新統計資料
        this.updatePostCounts(postsWithExcerpt);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('載入初始文章失敗', err);
        this.isLoading = false;
      },
    });
  }

  // 載入更多文章
  loadMorePosts() {
    if (this.isLoadingMore || !this.hasMorePosts) return;

    this.isLoadingMore = true;
    this.currentPage++;

    this.postService.getPostsByBoardPaged(+this.boardID, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        const newPostsWithExcerpt = response.posts.map((post: Post) => ({
          ...post,
          excerpt:
            post.content && post.content.length > 100
              ? post.content.slice(0, 100) + '...'
              : post.content,
        }));

        // 添加新文章到現有列表
        this.posts = [...this.posts, ...newPostsWithExcerpt];
        this.filteredPosts = [...this.filteredPosts, ...newPostsWithExcerpt];
        this.hasMorePosts = response.hasMore;

        // 更新統計資料
        this.updatePostCounts(newPostsWithExcerpt);

        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('載入更多文章失敗', err);
        this.isLoadingMore = false;
        this.currentPage--; // 載入失敗時恢復頁碼
      },
    });
  }

  // 更新文章統計資料
  private updatePostCounts(posts: PostWithExcerpt[]) {
    posts.forEach((post) => {
      this.postStateService.updatePostCounts(post.postId.toString(), {
        likes: post.likes || 0,
        favorites: post.favorites || 0,
        comments: Array.isArray(post.comments)
          ? post.comments.length
          : (post.comments || 0),
        views: post.views || 0,
      });
    });
  }

  // 監聽滾動事件
  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    if (this.isLoading || this.isLoadingMore || !this.hasMorePosts) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 檢查是否接近底部
    if (scrollTop + windowHeight >= documentHeight - this.scrollThreshold) {
      this.loadMorePosts();
    }
  }

  // 取得文章計數
  getPostCounts(postId: string) {
    return this.postStateService.getPostCounts(postId);
  }

  // 取得看板名稱
  fetchBoardName(boardID: number) {
    this.boardService.getBoard(boardID).subscribe({
      next: (board: Board) => {
        if (board.boardName) {
          this.boardNameValue = board.boardName;
        }
      },
      error: (err) => {
        console.error('取得看板名稱失敗', err);
      },
    });
  }

  // 導向文章
  goToPost(post: PostWithExcerpt) {
    if (!this.boardID) {
      console.warn('boardID 未定義');
      return;
    }
    if (post.postId == null) {
      console.warn('postID 未定義', post);
      return;
    }

    this.router.navigate([
      'show/community',
      this.boardID,
      'posts',
      post.postId.toString(),
    ]);
  }

  // 上一頁按鈕，回社區看板
  goBack(): void {
    this.router.navigate([`/show/community/`]);
  }

  // 修改搜尋功能
  onSearchChange() {
    const keyword = this.searchKeyword.trim().toLowerCase();

    // 清除之前的延遲計時器
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (!keyword) {
      // 如果搜尋關鍵字為空，顯示所有已載入的文章
      this.filteredPosts = this.posts;
      this.isSearchingAll = false;
      return;
    }

    // 設定延遲搜尋，避免過度請求
    this.searchTimeout = setTimeout(() => {
      this.performSearch(keyword);
    }, 300); // 300ms 延遲
  }

  // 執行搜尋邏輯
  private performSearch(keyword: string) {
    // 先在已載入的文章中搜尋
    const localResults = this.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(keyword) ||
        post.excerpt?.toLowerCase().includes(keyword)
    );

    // 如果在本地找到了結果，直接顯示
    if (localResults.length > 0) {
      this.filteredPosts = localResults;
      this.isSearchingAll = false;
      return;
    }

    // 如果本地沒有找到，且還有更多文章，開始載入所有文章進行完整搜尋
    if (this.hasMorePosts && !this.isSearchingAll) {
      this.searchAllPosts(keyword);
    } else {
      // 沒有更多文章了，顯示空結果
      this.filteredPosts = [];
      this.isSearchingAll = false;
    }
  }

  // 載入所有文章進行完整搜尋
  private async searchAllPosts(keyword: string) {
    this.isSearchingAll = true;

    // 載入所有剩餘的文章
    while (this.hasMorePosts && !this.isLoadingMore) {
      await this.loadMorePostsForSearch();

      // 每載入一批後檢查是否找到結果
      const results = this.posts.filter(
        (post) =>
          post.title.toLowerCase().includes(keyword) ||
          post.excerpt?.toLowerCase().includes(keyword)
      );

      if (results.length > 0) {
        this.filteredPosts = results;
        this.isSearchingAll = false;
        return;
      }
    }

    // 載入完所有文章後再檢查一次
    const finalResults = this.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(keyword) ||
        post.excerpt?.toLowerCase().includes(keyword)
    );

    this.filteredPosts = finalResults;
    this.isSearchingAll = false;
  }

  // 專門用於搜尋的載入更多文章方法
  private loadMorePostsForSearch(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoadingMore || !this.hasMorePosts) {
        resolve();
        return;
      }

      this.isLoadingMore = true;
      this.currentPage++;

      this.postService.getPostsByBoardPaged(+this.boardID, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          const newPostsWithExcerpt = response.posts.map((post: Post) => ({
            ...post,
            excerpt: post.content && post.content.length > 100
              ? post.content.slice(0, 100) + '...'
              : post.content,
          }));

          // 添加新文章到現有列表
          this.posts = [...this.posts, ...newPostsWithExcerpt];
          this.hasMorePosts = response.hasMore;

          // 更新統計資料
          this.updatePostCounts(newPostsWithExcerpt);

          this.isLoadingMore = false;
          resolve();
        },
        error: (err) => {
          console.error('載入更多文章失敗', err);
          this.isLoadingMore = false;
          this.currentPage--; // 載入失敗時恢復頁碼
          reject(err);
        },
      });
    });
  }

  // 清除搜尋
  clearSearch() {
    this.searchKeyword = '';
    this.filteredPosts = this.posts;
    this.isSearchingAll = false;

    // 清除延遲計時器
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  navigateToCreatePost() {
    if (!this.boardID) {
      console.warn('boardID 未定義，無法導向新增文章');
      return;
    }

    const token = localStorage.getItem('jwtToken');

    if (!token) {
      // 使用 SweetAlert2 彈出提示
      Swal.fire({
        title: '請先登入',
        text: '您需要登入才能新增文章',
        icon: 'warning',
        confirmButtonText: '前往登入',
        showCancelButton: true,
        cancelButtonText: '取消'
      }).then((result) => {
        if (result.isConfirmed) {
          // 跳轉到登入頁面
          this.router.navigate(['/show/login']);
        }
      });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() > payload.exp * 1000) {
        // 登入過期，使用 SweetAlert2 提示
        Swal.fire({
          title: '登入已過期',
          text: '請重新登入',
          icon: 'error',
          confirmButtonText: '前往登入'
        }).then(() => {
          localStorage.removeItem('jwtToken');
          this.router.navigate(['/show/login']);
        });
        return;
      }

      this.router.navigate(['show/community', this.boardID, 'create']);
    } catch (err) {
      console.error('JWT 解析錯誤', err);
      // JWT 錯誤，使用 SweetAlert2 提示
      Swal.fire({
        title: '登入資訊錯誤',
        text: '請重新登入',
        icon: 'error',
        confirmButtonText: '前往登入'
      }).then(() => {
        localStorage.removeItem('jwtToken');
        this.router.navigate(['/show/login']);
      });
    }
  }

  get boardName(): string {
    return this.boardNameValue;
  }
}
