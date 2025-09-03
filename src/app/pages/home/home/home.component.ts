import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiperComponent } from '../../../components/shared/swiper/swiper.component';
import { BannerSwiperComponent } from '../../../components/shared/banner-swiper/banner-swiper.component';
import { RoomSwiperComponent } from '../../room/room-swiper/room-swiper.component';
import { Room } from '../../../interfaces/room/room.interface';
import { IShopProductList } from '../../../interfaces/shop/shop-list';
import { RoomSwiperService } from '../../../services/room/room-swiper.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
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
  imports: [RouterModule, SwiperComponent, BannerSwiperComponent, RoomSwiperComponent, HttpClientModule, CurrencyPipe, DatePipe, JsonPipe, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  roomItems: Room[] = [];
  productList: IShopProductList[] = [];
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

  constructor(private roomService: RoomSwiperService, private http: HttpClient) { }

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

    this.loadHotProducts();
  }

  private loadHotProducts(): void {
    // 依你慣用的後端固定埠（你之前說用 7124）
    const baseUrl = 'https://localhost:7124';
    const url = `${baseUrl}/api/ShopProducts/list?page=1&pageSize=4`;
    this.http.get<{ items: IShopProductList[]; totalCount: number }>(url).subscribe({
      next: (res) => {
        this.productList = Array.isArray(res?.items) ? res.items : [];
        console.log('Hot products:', this.productList);
      },
      error: (err) => {
        console.error('載入熱銷商品失敗：', err);
        this.productList = []; // 留給前端顯示「目前沒有商品」
      }
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
