import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiperComponent } from '../../../components/shared/swiper/swiper.component';
import { BannerSwiperComponent } from '../../../components/shared/banner-swiper/banner-swiper.component';
import { RoomSwiperComponent } from '../../room/room-swiper/room-swiper.component';
import { Room } from '../../../interfaces/room/room.interface';
import { RoomSwiperService } from '../../../services/room/room-swiper.service';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
type HomeEventCard = {
  title: string;
  subtitle?: string;
  start: string; // ISO
  end?: string; // ISO
  imageUrl: string;
};
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    SwiperComponent,
    BannerSwiperComponent,
    RoomSwiperComponent,
    DatePipe,
    JsonPipe,
    CommonModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  roomItems: Room[] = [];
  eventItems: Room[] = [];

  private fallbackRoomItems: Room[] = [
    {
      fRoomId: 1,
      fRoomAlias: '松柏單人房',
      fRoomDescription: '舒適單人房，提供寧靜環境。',
      fRoomPrice: 56000,
      image: 'rooms/9375a375-3fbd-4019-9897-ec3e14910866.jpg',
      isAvailable: true,
      availableBeds: 1,
    },
    {
      fRoomId: 2,
      fRoomAlias: '松柏藍單人房',
      fRoomDescription: '藍色調單人房，適合長期居住。',
      fRoomPrice: 56000,
      image: 'rooms/b2550cab-bf91-4eeb-8df2-6094646a6954.jpg',
      isAvailable: true,
      availableBeds: 1,
    },
    {
      fRoomId: 3,
      fRoomAlias: '松柏紅單人房',
      fRoomDescription: '紅色調單人房，溫暖舒適。',
      fRoomPrice: 56000,
      image: 'rooms/6766bfb3-7995-4181-8a0f-874e5631ba94.jpg',
      isAvailable: true,
      availableBeds: 1,
    },
    {
      fRoomId: 4,
      fRoomAlias: '松柏雙人房',
      fRoomDescription: '寬敞雙人房，適合夫妻。',
      fRoomPrice: 56000,
      image: 'rooms/a8ff935a-ba66-4904-815a-c91b9ac715db.jpg',
      isAvailable: true,
      availableBeds: 1,
    },
  ];

  constructor(private roomService: RoomSwiperService) {}

  ngOnInit() {
    this.roomService.getRooms().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.data)) {
          this.roomItems = response.data;
        } else {
          console.error('API 回傳格式錯誤，data 無效:', response);
          this.roomItems = [];
        }
        console.log('API room data:', this.roomItems);
        if (response.message) {
          console.log('API message:', response.message);
        }
        if (this.roomItems.length === 0) {
          console.warn('API 返回空資料，使用後備');
          this.roomItems = this.fallbackRoomItems;
          console.log(
            '使用 fallback，第一筆名稱:',
            this.fallbackRoomItems[0]?.fRoomAlias
          );
        } else {
          console.log('使用 API，第一筆名稱:', this.roomItems[0]?.fRoomAlias);
        }
      },
      error: (err) => {
        console.error('API 錯誤:', err);
        this.roomItems = this.fallbackRoomItems;
        console.log('使用後備 room data:', this.roomItems);
        console.log(
          '使用 fallback，第一筆名稱:',
          this.fallbackRoomItems[0]?.fRoomAlias
        );
      },
    });
  }

  //

  // ✅ 這裡放你要顯示的本月活動資料（之後要串 API 也只要改這裡）
  eventsOfMonth: HomeEventCard[] = [
    {
      title: '公園健走同樂',
      subtitle: '陽光微風中一起走一走。',
      start: '2025-09-01T13:00:00',
      end: '2025-09-01T15:00:00',
      imageUrl: '../../../../assets/img/event/12.png',
    },
    {
      title: '樂齡太極進階班',
      subtitle: '加強穩定度與核心。',
      start: '2025-09-03T09:30:00',
      end: '2025-09-03T11:00:00',
      imageUrl: '../../../../assets/img/event/13.png',
    },
    {
      title: '智慧手機拍照術',
      subtitle: '用手機記錄生活光影。',
      start: '2025-09-03T09:30:00',
      end: '2025-09-03T11:00:00',
      imageUrl: '../../../../assets/img/event/14.png',
    },
    {
      title: '手作多肉盆栽',
      subtitle: '療癒小盆栽帶回家。',
      start: '2025-09-03T09:30:00',
      end: '2025-09-03T11:00:00',
      imageUrl: '../../../../assets/img/event/15.png',
    },
  ];

  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = 'assets/img/event/placeholder.jpg';
  }

  trackByIdx = (i: number) => i;
}
