import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-personal-community',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-community.component.html',
  styleUrl: './personal-community.component.scss',
})
export class PersonalCommunityComponent {
  // 假的使用者資料
  userProfile = {
    memberId: 1,
    displayName: '王大爺',
    profileBio: '喜歡分享生活與觀察世界 🌏',
    profilePictureUrl: 'https://i.pravatar.cc/150?u=xiaoming',
    lastUpdatedAt: new Date(),
    followers: 120,
    isFollowing: false,
  };

  // 假的使用者文章
  userPosts = [
    {
      id: 'p1',
      title: '第一篇文章',
      content: '這是我在安養院的第一篇文章，很開心認識大家！',
      createdAt: new Date('2025-08-01'),
    },
    {
      id: 'p2',
      title: '關於今天的心得',
      content: '今天和朋友一起散步，感覺心情很放鬆 😌',
      createdAt: new Date('2025-08-05'),
    },
  ];

  // 切換追蹤狀態
  toggleFollow() {
    this.userProfile.isFollowing = !this.userProfile.isFollowing;
    this.userProfile.followers += this.userProfile.isFollowing ? 1 : -1;
  }
}
