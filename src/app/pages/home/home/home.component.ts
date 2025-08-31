import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiperComponent } from '../../../components/shared/swiper/swiper.component';
import { BannerSwiperComponent } from '../../../components/shared/banner-swiper/banner-swiper.component';
import { RoomSwiperComponent } from '../../room/room-swiper/room-swiper.component';
import { Room } from '../../../interfaces/room/room.interface';
import { RoomSwiperService } from '../../../services/room/room-swiper.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, SwiperComponent, BannerSwiperComponent, RoomSwiperComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  roomItems: Room[] = [];

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
    }
  ];

  constructor(private roomService: RoomSwiperService) { }

  ngOnInit() {
    this.roomService.getRooms().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.data)) {
          this.roomItems = response.data;
        } else {
          this.roomItems = [];
        }
        if (this.roomItems.length === 0) {
          this.roomItems = this.fallbackRoomItems;
        }
      },
      error: (err) => {
        this.roomItems = this.fallbackRoomItems;
      }
    });
  }
}
