import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { RoomSwiperService } from '../../../services/room/room-swiper.service';
import { Room } from '../../../interfaces/room/room.interface';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-room-swiper',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-swiper.component.html',
  styleUrl: './room-swiper.component.scss'
})
export class RoomSwiperComponent implements OnInit, OnChanges {
  @Input() items: Room[] = [];
  @ViewChild('swiperRef', { static: false }) swiperRef!: ElementRef;
  staticUrl = 'https://localhost:7124/';
  displayedItems: Room[] = [];
  private swiperInstance: Swiper | undefined;

  constructor(private roomService: RoomSwiperService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.updateDisplayedItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && !changes['items'].firstChange) {
      this.updateDisplayedItems();
      setTimeout(() => this.initializeSwiper(), 0); // 延遲初始化，避免閃爍
    }
  }

  private updateDisplayedItems(): void {
    if (this.items.length === 0) {
      console.warn('room-swiper: 輸入 items 為空，使用空陣列或檢查 home API');
      this.displayedItems = [];
    } else {
      this.displayedItems = this.items.slice(0, 4);
      console.log('displayedItems 更新，內容:', this.displayedItems.map(item => item.fRoomAlias)); // 顯示所有名稱
      console.log('displayedItems 第一筆名稱:', this.displayedItems[0]?.fRoomAlias);
      console.log('displayedItems 來源確認: 使用 API 資料 (length:', this.items.length, ')');
      this.displayedItems.forEach((item, index) => {
        let fullUrl = this.staticUrl + 'images/rooms/' + item.image; // 直接使用 item.image
        console.log(`預檢查圖片URL (API) 第 ${index + 1} 筆:`, fullUrl);
        const imgCheck = new Image();
        imgCheck.src = fullUrl;
        imgCheck.onload = () => console.log(`圖片預檢查成功 (API) 第 ${index + 1} 筆:`, fullUrl);
        imgCheck.onerror = (e) => console.error(`圖片預檢查失敗 (API) 第 ${index + 1} 筆:`, fullUrl, e);
      });
    }
  }

  private initializeSwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy();
    }
    if (!this.swiperRef || this.displayedItems.length === 0) {
      console.warn('無法初始化 Swiper: swiperRef 或 displayedItems 無效');
      return;
    }
    const swiperElement = this.swiperRef.nativeElement;
    try {
      this.swiperInstance = new Swiper(swiperElement, {
        modules: [Navigation, Autoplay],
        loop: false,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        slidesPerView: 4,
        spaceBetween: 20,
        speed: 1000,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        breakpoints: {
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 4 }
        }
      });
      console.log('Swiper 初始化成功，slide 數:', swiperElement.querySelectorAll('.swiper-slide').length);
      console.log('Swiper 渲染資料來源: 使用 API，第一筆名稱:', this.displayedItems[0]?.fRoomAlias);
    } catch (error) {
      console.error('Swiper 初始化失敗:', error);
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('圖片載入失敗 (API):', imgElement.src, ' - 檢查 CORS 或伺服器狀態');
    imgElement.src = this.staticUrl + 'images/rooms/default-room-image.jpg';
    imgElement.onerror = null;
    setTimeout(() => {
      if (!imgElement.complete) {
        console.warn('後備圖片載入超時:', imgElement.src);
        imgElement.src = this.staticUrl + 'images/rooms/alternative-default.jpg';
      }
    }, 2000);
  }
}
