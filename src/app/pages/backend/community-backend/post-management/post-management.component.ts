import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService, Post } from '../../../../services/community/post.service';
import { BoardService, Board } from '../../../../services/community/board.service';
import Swal from 'sweetalert2';  // SweetAlert2 匯入
import { toast } from 'ngx-sonner';  // ngx-sonner 匯入

@Component({
  selector: 'app-post-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-management.component.html',
  styleUrls: ['./post-management.component.scss'],
})
export class PostManagementComponent implements OnInit {
  posts: Post[] = [];
  filteredPosts: any[] = [];  // 改為 any[] 以包含 boardName
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  boards: Board[] = [];  // 保留 boards 屬性
  selectedBoardId: string = '';  // 新增：選中的看板 ID
  selectedStatus: string = '';  // 新增：選中的狀態

  // 新增：選中的文章
  selectedPost: any = null;
  // 新增：選中的回覆
  selectedReplies: any[] = [];
  // 新增：載入狀態
  isLoadingContent: boolean = false;
  // 新增：預覽附件 URL
  previewAttachmentUrl: string | null = null;

  constructor(
    private postService: PostService,
    private boardService: BoardService  // 保留注入
  ) {}

  ngOnInit(): void {
    this.loadBoards();  // 保留載入看板
    this.loadPosts();
  }

  // 保留：載入所有看板
  loadBoards(): void {
    this.boardService.getBoards().subscribe({  // 修改為 getBoards()
      next: (data: Board[]) => {  // 新增類型
        this.boards = data;
      },
      error: (err: any) => {  // 新增類型
        console.error('載入看板失敗:', err);
      },
    });
  }

  // 載入所有文章
  loadPosts(): void {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        // 確保時間欄位是 Date 物件
        this.posts = data.map(post => ({
          ...post,
          createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date()
        }));
        this.filterPosts();
      },
      error: (err: any) => {
        console.error('載入文章失敗:', err);
        alert('載入文章失敗');
      },
    });
  }

  // 搜尋和分頁過濾
  filterPosts(): void {
    let filtered = this.posts;

    // 過濾看板
    if (this.selectedBoardId) {
      filtered = filtered.filter((post) => post.boardId === +this.selectedBoardId);
    }

    // 過濾狀態
    if (this.selectedStatus) {
      filtered = filtered.filter((post) => post.postStatus === this.selectedStatus);
    }

    // 過濾搜尋
    if (this.searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // 匹配名稱並確保排序
    this.filteredPosts = filtered.map((post) => ({
      ...post,
      boardName:
        this.boards.find((b: Board) => b.boardId === post.boardId)?.boardName ||
        '未知看板',
      authorName: post.author || '未知作者',
    }));

    // 按照更新時間由新到舊排序
    this.filteredPosts.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime; // 由新到舊
    });

    this.totalPages = Math.ceil(this.filteredPosts.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredPosts = this.filteredPosts.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  // 搜尋輸入變化
  onSearchChange(): void {
    this.currentPage = 1;
    this.filterPosts();
  }

  // 新增：下拉選單變化
  onFilterChange(): void {
    this.currentPage = 1;
    this.filterPosts();
  }

  // 切換文章狀態
  togglePostStatus(post: any): void {
    const isDeleting = post.postStatus === 'Active';
    const actionText = isDeleting ? '刪除' : '恢復';
    const confirmText = `確定要${actionText}這篇文章嗎？`;
    const successText = isDeleting ? '文章已刪除' : '文章已恢復發表';

    Swal.fire({
      title: confirmText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        const newStatus = isDeleting ? 'Inactive' : 'Active';

        this.postService.updatePostStatus(post.postId, newStatus).subscribe({
          next: () => {
            // 重新載入文章列表以反映最新狀態
            this.loadPosts();
            // 使用 ngx-sonner 顯示通知：刪除用紅色，恢復用綠色
            if (isDeleting) {
              toast.error(successText, {
                position: 'top-right',
              });
            } else {
              toast.success(successText, {
                position: 'top-right',
              });
            }
          },
          error: (err: any) => {
            console.error('更新狀態失敗:', err);
            // 使用 ngx-sonner 顯示錯誤通知
            toast.error('更新狀態失敗，請重試', {
              position: 'top-right',
            });
          },
        });
      }
    });
  }

  // 修改：查看文章（載入到模態框）
  viewPost(post: any): void {
    this.isLoadingContent = true;
    this.selectedPost = null;
    this.selectedReplies = [];

    this.postService.getPostById(post.postId).subscribe({
      next: (data) => {
        this.selectedPost = data;
        console.log('載入的文章資料:', data);
        console.log('附件:', data.attachments);
        this.selectedReplies = data.comments || [];
        this.isLoadingContent = false;
        this.showContentModal();
      },
      error: (err) => {
        console.error('載入文章失敗:', err);
        toast.error('載入文章失敗', { position: 'top-right' });
        this.isLoadingContent = false;
      },
    });
  }

  // 新增：顯示內容模態框
  private showContentModal(): void {
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // 新增：隱藏內容模態框
  public hideContentModal(): void {
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        document.body.removeChild(backdrop);
      }
    }
    this.selectedPost = null;
    this.selectedReplies = [];
  }

  // 新增：刪除文章（從模態框）
  deletePost(): void {
    if (!this.selectedPost) return;
    Swal.fire({
      title: '確認刪除文章',
      text: '確定要刪除這篇文章嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService.updatePostStatus(this.selectedPost.postId, 'Inactive').subscribe({
          next: () => {
            toast.success('文章已刪除', { position: 'top-right' });
            this.hideContentModal();
            this.loadPosts();  // 重新載入列表
          },
          error: (err) => {
            toast.error('刪除失敗', { position: 'top-right' });
          }
        });
      }
    });
  }

  // 修改：刪除回覆（從模態框）
  deleteReply(replyId: number): void {
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
            toast.success('回覆已刪除', { position: 'top-right' });
            // 刷新內容
            this.postService.getPostById(this.selectedPost.postId).subscribe({
              next: (data) => {
                this.selectedPost = data;
                this.selectedReplies = data.comments || [];
              },
              error: (err) => {
                console.error('刷新失敗:', err);
              }
            });
          },
          error: (err) => {
            toast.error('刪除失敗', { position: 'top-right' });
          }
        });
      }
    });
  }

  // 修改：恢復回覆
  restoreReply(replyId: number): void {
    Swal.fire({
      title: '確認恢復回覆',
      text: '確定要恢復這個回覆嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '恢復',
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService.updateReplyStatus(replyId, 'Active').subscribe({
          next: () => {
            toast.success('回覆已恢復', { position: 'top-right' });
            // 刷新內容
            this.postService.getPostById(this.selectedPost.postId).subscribe({
              next: (data) => {
                this.selectedPost = data;
                this.selectedReplies = data.comments || [];
              },
              error: (err) => {
                console.error('刷新失敗:', err);
              }
            });
          },
          error: (err) => {
            toast.error('恢復失敗', { position: 'top-right' });
          }
        });
      }
    });
  }

  // 新增：開啟附件預覽
  openAttachmentPreview(url: string): void {
    this.previewAttachmentUrl = url;
    const modal = document.getElementById('attachmentPreviewModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // 新增：關閉附件預覽
  closeAttachmentPreview(): void {
    this.previewAttachmentUrl = null;
    const modal = document.getElementById('attachmentPreviewModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        document.body.removeChild(backdrop);
      }
    }
  }

  // 分頁方法
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.filterPosts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterPosts();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterPosts();
    }
  }

  // 取得頁碼陣列（顯示 1 2 3 ... 總頁數）
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // 添加內容格式化方法
  formatContent(content: string): string {
    if (!content) return '';

    // 將換行符轉換為 <br> 標籤，並處理連續空格
    return content
      .replace(/\n/g, '<br>')  // 將 \n 轉換為 <br>
      .replace(/\r/g, '')      // 移除 \r
      .replace(/\s{2,}/g, (match) => '&nbsp;'.repeat(match.length)); // 處理連續空格
  }

  // 或者使用更簡單的方法，保留原始格式
  /*formatContent(content: string): string {
    if (!content) return '';

    // 使用 <pre> 標籤保留原始格式
    return `<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: inherit; font-size: inherit;">${content}</pre>`;
  }*/
}
