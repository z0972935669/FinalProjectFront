import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EventListComponent } from '../event-list/event-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-detail',
  imports: [RouterModule, CommonModule, EventListComponent],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent {
  images = [
    'assets/img/event/太極健康班.png',
    'assets/img/fruite-item-6.jpg',
    'assets/img/fruite-item-1.jpg',
    'assets/img/fruite-item-2.jpg',
  ];

  event = {
    id: '3',
    title: '太極體驗課',
    subtitle: '放慢步伐，舒展筋骨與身心。',
    priceText: '$100',
    date: '2025/08/15 10:00',
    organizer: '樂齡中心',
    location: '活動教室',
    contactPersonID: '王小美', // ← 新增
    contactPhone: '0912-345-678', // ← 新增（可改市話）
    duration: '1 小時',
    attendees: 22,
    imageUrl: 'assets/img/event/太極.png',
    states: '招生中',
    descriptionHtml: `
    <h5>課程特色</h5>
    <p>本課程以<strong class="hl">安全、溫和、有效</strong>為核心，結合東方養生與現代運動科學，透過<span class="em">呼吸節奏</span>與<span class="em">核心穩定</span>引導，協助放鬆肩頸、提升平衡與下肢支撐力。</p>

    <h5>適合對象</h5>
    <ul>
      <li>久未運動、想循序恢復體能者</li>
      <li>希望改善<strong class="hl">肩頸僵硬、下背負擔</strong>與睡眠品質者</li>
      <li>追求身心穩定、舒緩壓力的上班族與長輩</li>
    </ul>

    <h5>課程流程（60 分鐘）</h5>
    <ol>
      <li><strong>暖身與呼吸</strong>（10’）：關節活動、胸腔打開</li>
      <li><strong>基礎套路與步伐</strong>（40’）：重心轉換、軸心穩定、平衡練習</li>
      <li><strong>收操放鬆</strong>（10’）：全身伸展、呼吸整合</li>
    </ol>

    <h5>貼心提醒</h5>
    <p>建議穿著輕便服與防滑鞋，攜帶水壺與毛巾。若有慢性病史或術後狀況，<strong class="hl">請先告知老師調整強度</strong>。以「不勉強、不逞強」為原則，在舒適範圍內穩定進步。</p>
  `,
  };
}
