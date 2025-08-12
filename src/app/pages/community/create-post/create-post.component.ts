import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

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

  constructor(private router: Router, private route: ActivatedRoute) {
    this.boardID = this.route.snapshot.paramMap.get('boardID');
  }

  // 上傳附件檔案
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

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        // 非圖片檔案不讀取內容，只顯示檔名和大小
        this.previewFiles.push({
          url: '',
          name: file.name,
          size: Math.round(file.size / 1024),
          isImage: false,
        });
      }
    }

    // 重設 input 方便重複上傳同一檔案
    event.target.value = '';
  }

  // 移除附件檔案
  removeFile(index: number) {
    this.attachments.splice(index, 1);
    this.previewFiles.splice(index, 1);
  }

  submitPost() {
    if (!this.title.trim() || !this.content.trim()) {
      alert('請填寫標題與內容');
      return;
    }

    // 模擬表單資料
    const postData = new FormData();
    postData.append('title', this.title);
    postData.append('content', this.content);

    this.attachments.forEach((file) => {
      postData.append('attachments', file, file.name);
    });

    console.log('送出文章資料:', postData);

    // 這裡改成呼叫 API 發文
    // this.http.post('/api/posts', postData).subscribe(...)

    // 發文完成後返回文章列表
    this.goBackToBoard();
  }

  goBackToBoard() {
    if (this.boardID) {
      this.router.navigate(['show/community', this.boardID, 'posts']);
    } else {
      this.router.navigate(['show/community']);
    }
  }
}
