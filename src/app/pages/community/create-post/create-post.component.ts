import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PostService } from '../../../services/community/post.service';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private postService: PostService
  ) {
    this.boardID = this.route.snapshot.paramMap.get('boardID');
  }

  // 上傳附件
  onFileSelected(event: any) {
    const files: FileList = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.attachments.push(file);

      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.previewFiles.push({
          url: isImage ? e.target.result : '',
          name: file.name,
          size: Math.round(file.size / 1024),
          isImage,
        });
      };

      if (isImage) reader.readAsDataURL(file);
      else
        this.previewFiles.push({
          url: '',
          name: file.name,
          size: Math.round(file.size / 1024),
          isImage: false,
        });
    }

    event.target.value = '';
  }

  // 移除附件
  removeFile(index: number) {
    this.attachments.splice(index, 1);
    this.previewFiles.splice(index, 1);
  }

  // 發文
  submitPost() {
    // 檢查標題與內容
    if (!this.title.trim() || !this.content.trim()) {
      alert('請填寫標題與內容');
      return;
    }

    // 取得 JWT
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      alert('請先登入會員');
      return;
    }

    let memberID: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() > payload.exp * 1000) throw new Error('expired');

      // 注意 payload 屬性名稱要和後端一致
      memberID = payload.MemberId;
      if (!memberID) throw new Error('無法取得會員 ID');
    } catch (err) {
      alert('登入資訊錯誤，請重新登入');
      localStorage.removeItem('jwtToken');
      return;
    }

    // 檢查 boardID
    const boardID = this.boardID || '';
    if (!boardID) {
      alert('無法取得看板資訊');
      return;
    }

    // 建立 FormData
    const postData = new FormData();
    postData.append('memberID', memberID.toString());
    postData.append('boardID', boardID.toString());
    postData.append('title', this.title);
    postData.append('content', this.content);

    // 加入附件
    this.attachments.forEach((file) => {
      postData.append('attachments', file, file.name);
    });

    // 呼叫後端 API
    this.postService.createPost(postData).subscribe({
      next: (res) => {
        alert('文章新增成功');
        this.goBackToBoard();
      },
      error: (err) => {
        console.error('發文失敗', err);
        if (err.status === 400) {
          alert('發文失敗：請確認標題、內容或看板資訊是否完整');
        } else {
          alert('發文失敗，請稍後再試');
        }
      },
    });
  }

  // 回到文章列表
  goBackToBoard() {
    if (this.boardID) {
      this.router.navigate(['show/community', this.boardID, 'posts']);
    } else {
      this.router.navigate(['show/community']);
    }
  }
}
