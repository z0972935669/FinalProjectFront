import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

interface Post {
  id: string;
  boardId: string;
  title: string;
  excerpt: string;
  createdAt: string;
  likes: number;
  replies: number;
  bookmarks: number;
}

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss'],
})
export class PostListComponent implements OnInit {
  boardID!: string;
  posts: any[] = [];
  searchKeyword: string = '';
  filteredPosts: any[] = [];

  allPosts: Post[] = [
    {
      id: 'p1',
      boardId: '1',
      title: '第一篇文章',
      excerpt: '文章摘要...',
      createdAt: '2025-08-01',
      likes: 12,
      replies: 5,
      bookmarks: 8,
    },
    {
      id: 'p2',
      boardId: '1',
      title: '第二篇文章',
      excerpt: '文章摘要...',
      createdAt: '2025-08-02',
      likes: 20,
      replies: 7,
      bookmarks: 10,
    },
    {
      id: 'p3',
      boardId: '2',
      title: '退休族旅遊攻略',
      excerpt: '一起出發去旅行...',
      createdAt: '2025-08-03',
      likes: 8,
      replies: 2,
      bookmarks: 4,
    },
    {
      id: 'p4',
      boardId: '3',
      title: '親子共讀推薦書單',
      excerpt: '這些繪本很適合孩子...',
      createdAt: '2025-08-04',
      likes: 15,
      replies: 3,
      bookmarks: 6,
    },
    {
      id: 'p5',
      boardId: '4',
      title: '那些年我們追的電視劇',
      excerpt: '懷念經典連續劇與綜藝節目...',
      createdAt: '2025-08-05',
      likes: 30,
      replies: 12,
      bookmarks: 14,
    },
    {
      id: 'p6',
      boardId: '5',
      title: '健康養生粥食譜分享',
      excerpt: '一碗營養又暖心的早餐...',
      createdAt: '2025-08-05',
      likes: 25,
      replies: 6,
      bookmarks: 9,
    },
    {
      id: 'p7',
      boardId: '6',
      title: '手機怎麼加好友？一步步教你',
      excerpt: '適合初學者的手機操作教學...',
      createdAt: '2025-08-06',
      likes: 40,
      replies: 18,
      bookmarks: 21,
    },
    {
      id: 'p8',
      boardId: '7',
      title: '陽台小花園打造心得',
      excerpt: '從零開始種出自己的療癒天地...',
      createdAt: '2025-08-06',
      likes: 22,
      replies: 9,
      bookmarks: 11,
    },
    {
      id: 'p9',
      boardId: '8',
      title: '每日簡易復健操（附圖解）',
      excerpt: '幫助活動筋骨與平衡訓練...',
      createdAt: '2025-08-07',
      likes: 35,
      replies: 14,
      bookmarks: 17,
    },
    {
      id: 'p10',
      boardId: '2',
      title: '長者旅遊注意事項',
      excerpt: '旅途中有哪些照護小技巧...',
      createdAt: '2025-08-07',
      likes: 10,
      replies: 3,
      bookmarks: 5,
    },
    {
      id: 'p11',
      boardId: '3',
      title: '祖孫互動的小遊戲',
      excerpt: '適合祖孫一起玩的簡單遊戲介紹...',
      createdAt: '2025-08-07',
      likes: 18,
      replies: 4,
      bookmarks: 8,
    },
    {
      id: 'p12',
      boardId: '6',
      title: 'LINE 群組怎麼使用？',
      excerpt: '幫你搞懂群組建立與發訊息...',
      createdAt: '2025-08-07',
      likes: 28,
      replies: 10,
      bookmarks: 13,
    },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  goToPost(postId: string) {
    const boardID = this.route.snapshot.paramMap.get('boardID');
    this.router.navigate(['/community', boardID, 'posts', postId]);
  }
  ngOnInit() {
    this.boardID = this.route.snapshot.paramMap.get('boardID') || '';
    // 篩選出該看板的文章
    this.posts = this.allPosts.filter((post) => post.boardId === this.boardID);
    this.filteredPosts = this.posts;
  }

  onSearchChange() {
    const keyword = this.searchKeyword.trim().toLowerCase();
    if (!keyword) {
      this.filteredPosts = this.posts;
    } else {
      this.filteredPosts = this.posts.filter(
        (post) =>
          post.title.toLowerCase().includes(keyword) ||
          post.excerpt.toLowerCase().includes(keyword)
      );
    }
  }

  navigateToCreatePost() {
    this.router.navigate(['/show/community/create']); // 根據你的 route 修改
  }

  get boardName(): string {
    const boardNames: { [key: string]: string } = {
      '1': '健康養生',
      '2': '退休生活',
      '3': '親子家庭',
      '4': '懷舊時光',
      '5': '美食與料理',
      '6': '銀髮學習',
      '7': '手作與園藝',
      '8': '運動與復健',
    };
    return boardNames[this.boardID] || '未知看板';
  }
}
