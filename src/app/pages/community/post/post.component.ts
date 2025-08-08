import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent {
  // 假文章資料
  post = {
    title: '歡迎來到安養院討論區',
    author: '管理員',
    createdAt: new Date(),
    content:
      '這裡是大家可以分享生活、交流心情的地方。如果有任何問題也歡迎提出！',
    likes: 12,
  };

  // 新留言內容
  newComment: string = '';

  // 假留言 + 回覆資料
  comments = [
    {
      name: '小明',
      avatar: 'https://i.pravatar.cc/40?u=xiaoming',
      content: '這裡好溫馨！希望大家多多發言～',
      createdAt: new Date(),
      likes: 3,
      replies: [
        {
          name: '小美',
          avatar: 'https://i.pravatar.cc/40?u=xiaomei',
          content: '真的！感覺像一家人一樣 ❤️',
          createdAt: new Date(),
          likes: 2,
        },
        {
          name: '阿華',
          avatar: 'https://i.pravatar.cc/40?u=ahua',
          content: '我也覺得～',
          createdAt: new Date(),
          likes: 1,
        }
      ]
    },
    {
      name: '小美',
      avatar: 'https://i.pravatar.cc/40?u=xiaomei',
      content: '我也來報到～一起加油喔 😊',
      createdAt: new Date(),
      likes: 5,
      replies: [
        {
          name: '小明',
          avatar: 'https://i.pravatar.cc/40?u=xiaoming',
          content: '歡迎歡迎～',
          createdAt: new Date(),
          likes: 0,
        }
      ]
    }
  ];

  // 新增留言
  submitComment(): void {
    if (!this.newComment.trim()) return;
    this.comments.unshift({
      name: '訪客',
      avatar: 'https://i.pravatar.cc/40?u=guest' + Math.random(),
      content: this.newComment,
      createdAt: new Date(),
      likes: 0,
      replies: []
    });
    this.newComment = '';
  }
}
