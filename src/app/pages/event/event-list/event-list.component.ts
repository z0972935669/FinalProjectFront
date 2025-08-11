import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface EventItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  priceText: string;
  date: string; // 舉辦日期與時間
  organizer: string;
  location: string;
  duration: string;
  attendees: number;
  states: string;
}

@Component({
  standalone: true,
  selector: 'app-event-list',
  imports: [RouterModule, CommonModule],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
})
export class EventListComponent {
  events: EventItem[] = [
    {
      id: '1',
      title: '經典老歌音樂會',
      subtitle: '歲月如歌，經典再現，一起唱回最美的年代！',
      priceText: '免費',
      date: '2025/08/13 13:00',
      organizer: '希望老人中心',
      location: '中庭廣場',
      duration: '2 小時',
      attendees: 30,
      imageUrl: 'assets/img/event/老歌01.png',
      states: '招生中',
    },
    {
      id: '2',
      title: '長輩手機班',
      subtitle: '一步一步帶你玩手機與 LINE。',
      priceText: '免費',
      date: '2025/08/14 09:30',
      organizer: '社區發展協會',
      location: 'B 棟 201',
      duration: '90 分鐘',
      attendees: 18,
      imageUrl: 'assets/img/event/手機02.png',
      states: '即將額滿',
    },
    {
      id: '3',
      title: '太極體驗課',
      subtitle: '放慢步伐，舒展筋骨與身心。',
      priceText: '$100',
      date: '2025/08/15 10:00',
      organizer: '樂齡中心',
      location: '活動教室',
      duration: '1 小時',
      attendees: 22,
      imageUrl: 'assets/img/event/太極健康班.png',
      states: '招生中',
    },
    {
      id: '4',
      title: '懷舊電影夜',
      subtitle: '一起回味經典黑白片。',
      priceText: '免費',
      date: '2025/08/16 18:30',
      organizer: '松齡協會',
      location: '小劇場',
      duration: '2.5 小時',
      attendees: 54,
      imageUrl: 'assets/img/event/電影04.png',
      states: '招生中',
    },
    {
      id: '5',
      title: '健康飲食講座',
      subtitle: '營養師教你吃得剛剛好。',
      priceText: '免費',
      date: '2025/08/17 14:00',
      organizer: '衛教團隊',
      location: '多功能廳',
      duration: '75 分鐘',
      attendees: 40,
      imageUrl: 'assets/img/event/經典老歌.jpg',
      states: '招生中',
    },
    {
      id: '6',
      title: '樂齡瑜珈',
      subtitle: '柔和伸展，友善關節。',
      priceText: '$150',
      date: '2025/08/18 10:30',
      organizer: '身心工坊',
      location: '瑜珈室',
      duration: '1 小時',
      attendees: 16,
      imageUrl: 'assets/img/event/006.jpg',
      states: '招生中',
    },
    {
      id: '7',
      title: '手作香包',
      subtitle: '動手做療癒香氛小物。',
      priceText: '$80（含材料）',
      date: '2025/08/19 09:00',
      organizer: '手作社',
      location: '教室 A',
      duration: '1.5 小時',
      attendees: 12,
      imageUrl: 'assets/img/event/007.jpg',
      states: '招生中',
    },
    {
      id: '8',
      title: '銀髮合唱團徵選',
      subtitle: '喜歡唱歌的你別錯過！',
      priceText: '免費',
      date: '2025/08/20 15:00',
      organizer: '合唱團',
      location: '音樂教室',
      duration: '2 小時',
      attendees: 28,
      imageUrl: 'assets/img/event/008.jpg',
      states: '招生中',
    },
  ];

  constructor(private router: Router) {}

  goDetail(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }

  selectedCategory = '所有活動';

  setCategory(cat: string) {
    this.selectedCategory = cat;
    // TODO: 這裡可接你的事件篩選邏輯
  }
}
