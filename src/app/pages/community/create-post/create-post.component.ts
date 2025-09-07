import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PostService } from '../../../services/community/post.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
})
export class CreatePostComponent {
  title: string = '';
  content: string = '';
  previewFiles: Array<{
    url: string;
    name: string;
    size: number;
    isImage: boolean;
  }> = [];
  attachments: File[] = [];
  boardID: string | null = null;
  sanitizedContent: SafeHtml = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private postService: PostService,
    private sanitizer: DomSanitizer
  ) {
    this.boardID = this.route.snapshot.paramMap.get('boardID');
  }

  // 上傳附件
  onFileSelected(event: any) {
    const files: FileList = event?.target?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        // 處理檔案預覽
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewFiles.push({
            url: e.target?.result as string,
            name: file.name,
            size: file.size,
            isImage: file.type.startsWith('image/'),
          });
        };
        reader.readAsDataURL(file);
        this.attachments.push(file);
      }
    }
    event.target.value = '';
  }

  // 移除附件
  removeFile(index: number) {
    if (this.attachments && index >= 0 && index < this.attachments.length) {
      this.attachments.splice(index, 1);
      this.previewFiles.splice(index, 1);
    }
  }

  // 解析內容並生成卡片
  processContent(content: string): SafeHtml {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let processedContent = content.replace(urlRegex, (url) => {
      let videoId = null;
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('/').pop()?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('/embed/')[1]?.split('?')[0];
      }

      if (videoId) {
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
        return `
          <div class="link-card" data-videoid="${videoId}" onclick="window.playVideo(this)">
            <img src="${thumbnailUrl}" alt="YouTube Thumbnail" class="card-thumbnail" onerror="this.style.display='none'">
            <div class="card-content">
              <h5 class="card-title">Watch on YouTube</h5>
              <p class="card-url">${url}</p>
            </div>
          </div>
        `;
      }
      // 其他連結的通用卡片
      return `
        <div class="link-card">
          <div class="card-content">
            <h5 class="card-title">External Link</h5>
            <p class="card-url"><a href="${url}" target="_blank">${url}</a></p>
          </div>
        </div>
      `;
    });

    // 新增：處理換行符號
    processedContent = processedContent.replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(processedContent);
  }

  // 新增：全域播放函數
  playVideo = (element: HTMLElement) => {
    const videoId = element.getAttribute('data-videoid');
    if (videoId) {
      // console.log('Playing video:', videoId);  // 新增：日誌檢查
      element.innerHTML = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
    }
  };

  // 在ngOnInit中定義全域函數
  ngOnInit() {
    (window as any).playVideo = this.playVideo;
  }

  // 即時更新預覽
  updatePreview() {
    this.sanitizedContent = this.processContent(this.content);
  }

  // 發文
  submitPost() {
    // 檢查標題與內容
    if (!this.title.trim() || !this.content.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '請填寫完整',
        text: '標題和內容不能為空',
        confirmButtonText: '確定'
      });
      return;
    }

    // 取得 JWT
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: '未登入',
        text: '請先登入',
        confirmButtonText: '確定'
      }).then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    let memberID: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      memberID = payload.MemberId;
    } catch (err) {
      localStorage.removeItem('jwtToken');
      this.router.navigate(['/login']);
      return;
    }

    // 檢查 boardID
    const boardID = this.boardID || '';
    if (!boardID) {
      return;
    }

    // 建立 FormData
    const postData = new FormData();
    postData.append('memberID', memberID);
    postData.append('boardID', boardID);
    postData.append('title', this.title);
    postData.append('content', this.content);

    // 添加附件
    for (let i = 0; i < this.attachments.length; i++) {
      postData.append('attachments', this.attachments[i]);
    }

    // 發送請求
    this.postService.createPost(postData).subscribe({
      next: (res: any) => {
        if (res) {
          Swal.fire({
            icon: 'success',
            title: '發佈成功',
            text: '文章已成功發佈',
            confirmButtonText: '確定'
          }).then(() => {
            this.router.navigate(['/show/community', this.boardID, 'posts']);
          });
        }
      },
      error: (err: any) => {
        console.error('發文失敗', err);
        Swal.fire({
          icon: 'error',
          title: '發佈失敗',
          text: '請稍後再試',
          confirmButtonText: '確定'
        });
      },
    });
  }

  // 回到文章列表
  goBackToBoard() {
    if (this.boardID) {
      this.router.navigate(['/show/community', this.boardID, 'posts']);
    }
  }
}
