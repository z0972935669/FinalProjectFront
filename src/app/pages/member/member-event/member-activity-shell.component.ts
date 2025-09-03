import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-member-activity-shell',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- 頂層頁籤 -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a
            class="nav-link"
            routerLink="/show/member-management/event"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >我的活動</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            routerLink="/show/member-management/member_event_calendar"
            routerLinkActive="active"
            >行事曆</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            routerLink="/show/member-management/member_event_coupon"
            routerLinkActive="active"
            >折價卷</a
          >
        </li>
      </ul>

      <!-- 內頁會顯示在這裡 -->
      <router-outlet></router-outlet>
    </div>
  `,
})
export class MemberActivityShellComponent {}
