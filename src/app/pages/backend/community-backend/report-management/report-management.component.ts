import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PostService,
  ReportListItem,
  ReportDetailDto,
  HandleReportRequest,
} from '../../../../services/community/post.service';
import Swal from 'sweetalert2';
import { toast } from 'ngx-sonner';
import { HttpParams } from '@angular/common/http'; // 新增匯入

@Component({
  selector: 'app-report-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-management.component.html',
  styleUrls: ['./report-management.component.scss'],
})
export class ReportManagementComponent implements OnInit {
  reports: ReportListItem[] = [];
  selectedReport: ReportDetailDto | null = null;
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  total: number = 0;
  totalPages: number = 0;

  // 篩選參數
  status: string = '';
  contentType: string = '';
  reporterMemberId: string = '';
  targetMemberId: string = '';
  reasonType: string = '';
  fromDate: string = '';
  toDate: string = '';

  // 新增：下拉選單的值
  selectedAction: string = '';

  // 新增：提交狀態
  isSubmitting: boolean = false;

  // 新增：選中的文章
  selectedPost: any = null;
  // 新增：選中的回覆
  selectedReplies: any[] = [];
  // 新增：載入狀態
  isLoadingContent: boolean = false;
  // 新增：預覽附件 URL
  previewAttachmentUrl: string | null = null;

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  // 載入檢舉列表
  loadReports(): void {
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.pageSize.toString());

    if (this.status) params = params.set('status', this.status);
    if (this.contentType) params = params.set('contentType', this.contentType);
    if (this.reporterMemberId)
      params = params.set('reporterMemberId', this.reporterMemberId);
    if (this.targetMemberId)
      params = params.set('targetMemberId', this.targetMemberId);
    if (this.reasonType) params = params.set('reasonType', this.reasonType);
    if (this.fromDate) params = params.set('fromDate', this.fromDate);
    if (this.toDate) params = params.set('toDate', this.toDate);

    this.postService.getReports(params).subscribe({
      next: (data) => {
        this.reports = data.items;
        this.total = data.total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
      },
      error: (err: any) => {
        console.error('載入檢舉失敗:', err);
        toast.error('載入檢舉失敗，請重試', { position: 'top-right' });
      },
    });
  }

  // 搜尋和篩選
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  // 查看詳情
  viewReport(reportId: number): void {
    this.postService.getReportById(reportId).subscribe({
      next: (data) => {
        this.selectedReport = data;
        this.selectedAction = data.reportStatus;

        // 查詢被檢舉內容
        if (data.reportedContentType === 'Post' && data.postId) {
          this.postService.getPostById(data.postId).subscribe({
            next: (post) => {
              if (this.selectedReport) {
                this.selectedReport.reportedContent = post.content;
                this.selectedReport.targetMemberName = post.author; // 從文章取得作者姓名
              }
            },
            error: (err) => {
              console.error('載入文章失敗:', err);
              if (this.selectedReport) {
                this.selectedReport.reportedContent = '載入失敗';
                this.selectedReport.targetMemberName = '未知';
              }
            },
          });
        } else if (data.reportedContentType === 'Reply' && data.replyId) {
          this.postService.getReplyById(data.replyId).subscribe({
            next: (reply) => {
              if (this.selectedReport) {
                this.selectedReport.reportedContent = reply.content;
                this.selectedReport.targetMemberName =
                  reply.memberName || '未知'; // 從回覆取得會員姓名
              }
            },
            error: (err) => {
              console.error('載入回覆失敗:', err);
              if (this.selectedReport) {
                this.selectedReport.reportedContent = '載入失敗';
                this.selectedReport.targetMemberName = '未知';
              }
            },
          });
        }

        this.showReportDetailModal();
      },
      error: (err: any) => {
        console.error('載入檢舉詳情失敗:', err);
        toast.error('載入檢舉詳情失敗，請重試', { position: 'top-right' });
      },
    });
  }

  // 修改：處理提交（更新 ReportStatus）
  submitAction(): void {
    if (!this.selectedReport || !this.selectedAction || this.isSubmitting)
      return;

    this.isSubmitting = true; // 防止重複提交

    const request: HandleReportRequest = {
      newStatus: this.selectedAction,
      employeeId: 1, // 假設員工 ID，實際應從登入資訊取得
      result: '', // 可以添加備註輸入
    };

    this.postService
      .handleReport(this.selectedReport.reportId, request)
      .subscribe({
        next: () => {
          this.loadReports();
          toast.success('狀態已更新', { position: 'top-right' });
          this.selectedReport = null;
          this.selectedAction = '';
          this.hideReportDetailModal(); // 關閉模態框
          this.isSubmitting = false;
        },
        error: (err: any) => {
          console.error('更新狀態失敗:', err);
          toast.error('更新狀態失敗，請重試', { position: 'top-right' });
          this.isSubmitting = false;
        },
      });
  }

  // 修改：查看相關內容（載入到模態框）
  viewContent(): void {
    if (!this.selectedReport || this.isLoadingContent) return;  // 新增：防止重複載入

    this.isLoadingContent = true;
    this.selectedPost = null;
    this.selectedReplies = [];

    if (this.selectedReport.postId) {
      this.postService.getPostById(this.selectedReport.postId).subscribe({
        next: (post) => {
          this.selectedPost = post;
          this.selectedReplies = post.comments || [];
          this.isLoadingContent = false;
          this.showContentModal();
        },
        error: (err) => {
          console.error('載入文章失敗:', err);
          toast.error('載入文章失敗', { position: 'top-right' });
          this.isLoadingContent = false;
        },
      });
    } else if (this.selectedReport.replyId) {
      this.postService.getReplyById(this.selectedReport.replyId).subscribe({
        next: (reply) => {
          if (reply.postId) {
            this.postService.getPostById(reply.postId).subscribe({
              next: (post) => {
                this.selectedPost = post;
                this.selectedReplies = post.comments || [];
                this.isLoadingContent = false;
                this.showContentModal();
              },
              error: (err) => {
                console.error('載入文章失敗:', err);
                toast.error('載入文章失敗', { position: 'top-right' });
                this.isLoadingContent = false;
              },
            });
          } else {
            toast.error('回覆資料中無效的文章 ID', { position: 'top-right' });
            this.isLoadingContent = false;
          }
        },
        error: (err) => {
          console.error('載入回覆失敗:', err);
          toast.error('載入回覆失敗', { position: 'top-right' });
          this.isLoadingContent = false;
        },
      });
    } else {
      toast.error('無效的文章或回覆 ID', { position: 'top-right' });
      this.isLoadingContent = false;
    }
  }

  // 修改：顯示內容模態框
  private showContentModal(): void {
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      // 檢查是否已有 backdrop，避免重複添加
      if (!document.querySelector('.modal-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
    }
  }

  // 修改：隱藏內容模態框
  public hideContentModal(): void {
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      // 移除所有 backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => document.body.removeChild(backdrop));
    }
    this.selectedPost = null;
    this.selectedReplies = [];
  }

  // 修改：刪除文章（從模態框）
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
            this.viewContent();  // 刷新內容
          },
          error: (err) => {
            toast.error('刪除失敗', { position: 'top-right' });
          }
        });
      }
    });
  }

  // 新增：恢復文章
  restorePost(): void {
    if (!this.selectedPost) return;
    Swal.fire({
      title: '確認恢復文章',
      text: '確定要恢復這篇文章嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '恢復',
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService.updatePostStatus(this.selectedPost.postId, 'Active').subscribe({
          next: () => {
            toast.success('文章已恢復', { position: 'top-right' });
            this.viewContent();  // 刷新內容
          },
          error: (err) => {
            toast.error('恢復失敗', { position: 'top-right' });
          }
        });
      }
    });
  }

  // 新增：刪除回覆（從模態框）
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
            this.viewContent();  // 刷新內容
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
            this.viewContent();  // 刷新內容
          },
          error: (err) => {
            toast.error('恢復失敗', { position: 'top-right' });
          }
        });
      }
    });
  }

  // 分頁方法
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReports();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadReports();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadReports();
    }
  }

  // 取得頁碼陣列
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // 顯示詳情模態框
  private showReportDetailModal(): void {
    const modal = document.getElementById('reportDetailModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      // 添加背景遮罩
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // 新增：隱藏模態框的方法（用於取消按鈕）
  public hideReportDetailModal(): void {
    const modal = document.getElementById('reportDetailModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      // 移除背景遮罩
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        document.body.removeChild(backdrop);
      }
    }
  }

  // 修改：取消按鈕的點擊事件
  // 在 HTML 中，將取消按鈕的 (click) 改為 (click)="hideReportDetailModal()"
  // 例如：<button type="button" class="btn btn-secondary" (click)="hideReportDetailModal()">取消</button>

  // 添加 onSearchChange 方法
  onSearchChange() {
    // 實現搜尋邏輯，例如根據 searchTerm 過濾 reports
    this.filterReports();
  }

  // 如果需要，可以添加 filterReports 方法來統一處理過濾
  private filterReports() {
    // 根據 status, contentType, reasonType, fromDate, toDate, searchTerm 等過濾 reports
    // 例如：
    // this.reports = this.originalReports.filter(report => {
    //   // 過濾條件
    // });
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

  // 修改 formatContent 方法，處理 undefined 值
  formatContent(content: string | undefined | null): string {
    if (!content) return '';

    // 將換行符轉換為 <br> 標籤，並處理連續空格
    return content
      .replace(/\n/g, '<br>')  // 將 \n 轉換為 <br>
      .replace(/\r/g, '')      // 移除 \r
      .replace(/\s{2,}/g, (match) => '&nbsp;'.repeat(match.length)); // 處理連續空格
  }

  // 或者使用更簡單的方法，保留原始格式
  // formatContent(content: string | undefined | null): string {
  //   if (!content) return '';

  //   // 使用 <pre> 標籤保留原始格式
  //   return `<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: inherit; font-size: inherit;">${content}</pre>`;
  // }
}
