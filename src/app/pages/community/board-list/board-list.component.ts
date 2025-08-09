import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-board-list',
  imports: [CommonModule],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.scss',
})
export class BoardListComponent {
  boards = [
    {
      id: '1',
      name: '健康養生',
      description: '分享健康知識與生活方式，關注長者身心健康',
      coverImageUrl: '/assets/img/component/1.png',
      postCount: 342,
    },
    {
      id: '2',
      name: '退休生活',
      description: '退休規劃、旅遊與理財經驗交流',
      coverImageUrl: '/assets/img/component/2.png',
      postCount: 128,
    },
    {
      id: '3',
      name: '親子家庭',
      description: '家庭關係與親子互動分享',
      coverImageUrl: '/assets/img/component/3.png',
      postCount: 215,
    },
    {
      id: '4',
      name: '懷舊時光',
      description: '回憶年少時光，分享老照片與過往故事',
      coverImageUrl: '/assets/img/component/4.png',
      postCount: 98,
    },
    {
      id: '5',
      name: '美食與料理',
      description: '家常菜、養生食譜、長輩分享拿手好菜',
      coverImageUrl: '/assets/img/component/5.png',
      postCount: 174,
    },
    {
      id: '6',
      name: '銀髮學習',
      description: '長者學習新知，如手機操作、數位技能等',
      coverImageUrl: '/assets/img/component/6.png',
      postCount: 67,
    },
    {
      id: '7',
      name: '手作與園藝',
      description: '喜歡動手做的小物、園藝種植與心得交流',
      coverImageUrl: '/assets/img/component/7.png',
      postCount: 89,
    },
    {
      id: '8',
      name: '運動與復健',
      description: '銀髮運動、簡易復健操與身體保健技巧分享',
      coverImageUrl: '/assets/img/component/8.png',
      postCount: 123,
    },
  ];

  constructor(private router: Router) {}

  goToBoardPosts(boardID: string) {
    this.router.navigate(['/show/community', boardID, 'posts']);
  }
}
