import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PostService, Post } from '../../../services/community/post.service';
import { BoardService, Board } from '../../../services/community/board.service';
import { PostStateService } from '../../../services/community/PostState.service';

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
export class PostListComponent implements OnInit {
  boardID: string = '';
  posts: PostWithExcerpt[] = [];
  filteredPosts: PostWithExcerpt[] = [];
  searchKeyword: string = '';
  isLoading: boolean = true;
  boardNameValue: string = '未知看板';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private postService: PostService,
    private boardService: BoardService,
    private postStateService: PostStateService // 注入 PostStateService
  ) {}

  ngOnInit() {
    const boardIDParam = this.route.snapshot.paramMap.get('boardID');
    // console.log('ngOnInit boardIDParam:', boardIDParam); // 除錯用

    if (!boardIDParam) {
      console.error('boardID 從路由無法取得！');
      return;
    }

    this.boardID = boardIDParam;
    const boardIdNumber = +this.boardID;

    this.fetchPostsByBoard(boardIdNumber);
    this.fetchBoardName(boardIdNumber);
  }

  // 取得文章計數
  getPostCounts(postId: string) {
    return this.postStateService.getPostCounts(postId);
  }

  // 取得文章
  fetchPostsByBoard(boardID: number) {
    this.isLoading = true;

    this.postService.getPostsByBoard(boardID).subscribe({
      next: (res: Post[]) => {
        this.posts = res.map((post) => ({
          ...post,
          excerpt:
            post.content && post.content.length > 100
              ? post.content.slice(0, 100) + '...'
              : post.content,
        }));

        // 修正：確保 comments 為數字型別
        this.posts.forEach((post) => {
          this.postStateService.updatePostCounts(post.postId.toString(), {
            likes: post.likes || 0,
            favorites: post.favorites || 0,
            comments: Array.isArray(post.comments)
              ? post.comments.length
              : post.comments || 0,
          });
        });

        this.filteredPosts = this.posts;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('取得文章失敗', err);
        this.isLoading = false;
      },
    });
  }

  // 清理文章計數
  ngOnDestroy() {
    this.postStateService.clearAllPostCounts();
  }

  // 取得看板名稱
  fetchBoardName(boardID: number) {
    this.boardService.getBoard(boardID).subscribe({
      next: (board: Board) => {
        // console.log('取得看板名稱:', board); // 除錯用
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

  onSearchChange() {
    const keyword = this.searchKeyword.trim().toLowerCase();
    if (!keyword) {
      this.filteredPosts = this.posts;
    } else {
      this.filteredPosts = this.posts.filter(
        (post) =>
          post.title.toLowerCase().includes(keyword) ||
          post.excerpt?.toLowerCase().includes(keyword)
      );
    }
  }

  navigateToCreatePost() {
    if (!this.boardID) {
      console.warn('boardID 未定義，無法導向新增文章');
      return;
    }

    const token = localStorage.getItem('jwtToken');
    // console.log('JWT token:', token); // 除錯用

    if (!token) {
      alert('請先登入會員');
      this.router.navigate(['show/community', this.boardID, 'posts']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() > payload.exp * 1000) {
        alert('登入已過期，請重新登入');
        localStorage.removeItem('jwtToken');
        this.router.navigate(['show/community', this.boardID, 'posts']);
        return;
      }

      this.router.navigate(['show/community', this.boardID, 'create']);
    } catch (err) {
      console.error('JWT 解析錯誤', err);
      alert('登入資訊錯誤，請重新登入');
      localStorage.removeItem('jwtToken');
      this.router.navigate(['show/community', this.boardID, 'posts']);
    }
  }

  get boardName(): string {
    return this.boardNameValue;
  }
}
