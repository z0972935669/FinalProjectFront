import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

interface Reply {
  name: string;
  avatar: string;
  content: string;
  rawContent?: string;
  createdAt: Date;
  likes: number;
  subReplies?: Reply[];
  floorTag?: string;
  parentFloorTag?: string;
}

interface Comment {
  name: string;
  avatar: string;
  content: string;
  rawContent?: string;
  createdAt: Date;
  likes: number;
  replies?: Reply[];
  showAllReplies?: boolean;
  floorTag?: string;
}

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterModule],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent {
  boardID: string | null = null;
  postId: string | null = null;
  post: any;
  newComment: string = '';

  comments: Comment[] = [];
  flatComments: (Comment | Reply)[] = []; // 攤平成一維留言陣列

  allPosts: any[] = [
    {
      id: 'p1',
      title: '歡迎來到安養院討論區',
      author: '管理員',
      createdAt: new Date('2025-08-01T10:00:00'),
      content:
        '這裡是大家可以分享生活、交流心情的地方。如果有任何問題也歡迎提出！',
      likes: 12,
      comments: [
        {
          name: '小明',
          avatar: 'https://i.pravatar.cc/40?u=xiaoming',
          content: '這裡好溫馨！希望大家多多發言～',
          rawContent: '這裡好溫馨！希望大家多多發言～',
          createdAt: new Date('2025-08-02T09:00:00'),
          likes: 3,
          replies: [
            {
              name: '小美',
              avatar: 'https://i.pravatar.cc/40?u=xiaomei',
              content: '真的！感覺像一家人一樣 ❤️',
              rawContent: '真的！感覺像一家人一樣 ❤️',
              createdAt: new Date('2025-08-02T10:30:00'),
              likes: 2,
              subReplies: [
                {
                  name: '阿華',
                  avatar: 'https://i.pravatar.cc/40?u=ahua',
                  content: '我也覺得～',
                  rawContent: '我也覺得～',
                  createdAt: new Date('2025-08-02T11:00:00'),
                  likes: 1,
                },
                {
                  name: '小剛',
                  avatar: 'https://i.pravatar.cc/40?u=xiaogang',
                  content: '第一次來就覺得很溫暖',
                  rawContent: '第一次來就覺得很溫暖',
                  createdAt: new Date('2025-08-02T11:15:00'),
                  likes: 0,
                },
              ],
            },
            {
              name: '小張',
              avatar: 'https://i.pravatar.cc/40?u=xiaozhang',
              content: '大家加油，讓這裡更熱鬧！',
              rawContent: '大家加油，讓這裡更熱鬧！',
              createdAt: new Date('2025-08-02T12:00:00'),
              likes: 1,
            },
          ],
        },
        {
          name: '老李',
          avatar: 'https://i.pravatar.cc/40?u=laoli',
          content: '想問一下附近有沒有好吃的餐廳推薦？',
          rawContent: '想問一下附近有沒有好吃的餐廳推薦？',
          createdAt: new Date('2025-08-03T08:30:00'),
          likes: 5,
          replies: [
            {
              name: '小王',
              avatar: 'https://i.pravatar.cc/40?u=xiaowang',
              content: '我推薦那家港式飲茶，味道很棒！',
              rawContent: '我推薦那家港式飲茶，味道很棒！',
              createdAt: new Date('2025-08-03T09:00:00'),
              likes: 3,
            },
            {
              name: '阿芳',
              avatar: 'https://i.pravatar.cc/40?u=afang',
              content: '附近的新開火鍋店也不錯，氣氛很好。',
              rawContent: '附近的新開火鍋店也不錯，氣氛很好。',
              createdAt: new Date('2025-08-03T09:30:00'),
              likes: 2,
            },
          ],
        },
      ],
    },
    {
      id: 'p2',
      title: '活動通知：下週健康講座',
      author: '管理員',
      createdAt: new Date('2025-08-05T14:00:00'),
      content:
        '提醒大家，下週三下午兩點有健康講座，主題是「老年飲食與營養」，歡迎踴躍參加！',
      likes: 8,
      comments: [
        {
          name: '小芳',
          avatar: 'https://i.pravatar.cc/40?u=xiaofang',
          content: '謝謝通知，我會來參加。',
          rawContent: '謝謝通知，我會來參加。',
          createdAt: new Date('2025-08-06T07:50:00'),
          likes: 1,
          replies: [],
        },
        {
          name: '阿強',
          avatar: 'https://i.pravatar.cc/40?u=aqiang',
          content: '講座地點是在哪裡呢？',
          rawContent: '講座地點是在哪裡呢？',
          createdAt: new Date('2025-08-06T08:30:00'),
          likes: 0,
          replies: [
            {
              name: '管理員',
              avatar: 'https://i.pravatar.cc/40?u=admin',
              content: '地點在一樓多功能廳，謝謝你的提問。',
              rawContent: '地點在一樓多功能廳，謝謝你的提問。',
              createdAt: new Date('2025-08-06T08:45:00'),
              likes: 0,
            },
          ],
        },
      ],
    },
  ];

  constructor(private route: ActivatedRoute, private location: Location) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.postId = params.get('postId');
      this.boardID = params.get('boardID');
      this.loadPost();
    });
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
    return this.boardID && boardNames[this.boardID]
      ? boardNames[this.boardID]
      : '未知看板';
  }

  loadPost(): void {
    const found = this.allPosts.find((p) => p.id === this.postId);
    if (found) {
      this.post = found;
      this.comments = found.comments || [];
      this.assignFloorTagsAndFlatten();
    } else {
      this.post = {
        title: '找不到這篇文章',
        author: '',
        createdAt: new Date(),
        content: '請確認網址是否正確。',
        likes: 0,
      };
      this.comments = [];
      this.flatComments = [];
    }
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    const comment: Comment = {
      name: '訪客',
      avatar: 'https://i.pravatar.cc/40?u=guest' + Math.random(),
      content: this.newComment,
      createdAt: new Date(),
      likes: 0,
      replies: [],
      showAllReplies: false,
      floorTag: '',
    };
    this.comments.unshift(comment);
    this.assignFloorTagsAndFlatten();
    this.newComment = '';
  }

  // 分配樓層標籤，並攤平成一維陣列 flatComments
  assignFloorTagsAndFlatten(): void {
    this.flatComments = [];
    this.comments.forEach((comment, cIndex) => {
      comment.floorTag = `B${cIndex + 1}`;
      this.flatComments.push(comment);

      if (!comment.replies) return;

      let replyCount = 0;

      for (let i = 0; i < comment.replies.length; i++) {
        const reply = comment.replies[i];
        replyCount++;

        reply.floorTag = `${comment.floorTag}-${replyCount}`;
        const replyToFloorTag = reply.parentFloorTag || comment.floorTag;

        reply.content = `${replyToFloorTag} ${
          reply.rawContent || reply.content
        }`;
        this.flatComments.push(reply);

        if (reply.subReplies && reply.subReplies.length > 0) {
          const subRepliesToInsert: Reply[] = [];

          reply.subReplies.forEach((subReply) => {
            replyCount++;
            subReply.floorTag = `${comment.floorTag}-${replyCount}`;
            subReply.content = `${reply.floorTag} ${
              subReply.rawContent || subReply.content
            }`;
            subReply.parentFloorTag = reply.floorTag;

            subRepliesToInsert.push(subReply);
            this.flatComments.push(subReply);
          });

          reply.subReplies = [];
          comment.replies.splice(i + 1, 0, ...subRepliesToInsert);
          i += subRepliesToInsert.length;
        }
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  // 新增記錄哪些主留言回覆是展開的
  expandedCommentsReplies: { [floorTag: string]: boolean } = {};

  toggleReplies(comment: Comment): void {
    comment.showAllReplies = !comment.showAllReplies;
  }

  isRepliesExpanded(comment: Comment): boolean {
    return this.expandedCommentsReplies[comment.floorTag || ''] || false;
  }

  getVisibleReplies(comment: Comment): Reply[] {
    if (!comment.replies) return [];
    return this.isRepliesExpanded(comment)
      ? comment.replies
      : comment.replies.slice(0, 1);
  }
}
