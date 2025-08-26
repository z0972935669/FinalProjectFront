import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgZone } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { RoomSwiperService } from '../../../services/room/room-swiper.service';
import { Room } from '../../../interfaces/room/room.interface';

// 確保 Swiper 模組註冊
Swiper.use([Autoplay, Navigation]);

@Component({
  selector: 'app-room-swiper',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-swiper.component.html',
  styleUrl: './room-swiper.component.scss'
})
export class RoomSwiperComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() items: Room[] = [];
  @ViewChild('swiperRef', { static: false }) swiperRef!: ElementRef;
  staticUrl = 'https://localhost:7124/';
  displayedItems: Room[] = [];
  private swiperInstance: Swiper | undefined;

  constructor(
    private roomService: RoomSwiperService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.updateDisplayedItems();
  }

  ngAfterViewInit(): void {
    // 在 DOM 準備好後嘗試初始化 Swiper
    if (this.displayedItems.length > 0 && this.swiperRef) {
      this.initializeSwiper();
      this.checkImages();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && !changes['items'].firstChange) {
      this.updateDisplayedItems();
      // 立即檢查並初始化
      if (this.swiperRef && this.displayedItems.length > 0) {
        this.initializeSwiper();
        this.checkImages();
      }
    }
  }

  private updateDisplayedItems(): void {
    if (this.items.length === 0) {
      console.warn('room-swiper: 輸入 items 為空，使用空陣列或檢查 home API');
      this.displayedItems = [];
    } else {
      // 根據 fRoomAlias 去重，只保留第一個出現的房間
      const uniqueItemsByName = Array.from(
        new Map(
          this.items.map(item => [item.fRoomAlias, item]) // 用 fRoomAlias 作為唯一鍵
        ).values()
      );
      // 取前 10 筆（或根據 uniqueItemsByName 筆數，確保不超過）
      this.displayedItems = uniqueItemsByName.slice(0, 9);
      console.log('displayedItems 更新，內容:', this.displayedItems.map(item => ({ fRoomId: item.fRoomId, fRoomAlias: item.fRoomAlias, image: item.image })));
      console.log('displayedItems 所有名稱:', this.displayedItems.map(item => item.fRoomAlias));
      console.log('displayedItems 第一筆名稱:', this.displayedItems[0]?.fRoomAlias);
      this.displayedItems.forEach((item, index) => {
        let fullUrl = this.staticUrl + 'images/' + item.image; // 補齊 images/rooms/ 前綴
        console.log(`預檢查圖片URL (API) 第 ${index + 1} 筆:`, fullUrl);
        const imgCheck = new Image();
        imgCheck.src = fullUrl;
        imgCheck.onload = () => console.log(`圖片預檢查成功 (API) 第 ${index + 1} 筆:`, fullUrl);
        imgCheck.onerror = (e) => {
          console.error(`圖片預檢查失敗 (API) 第 ${index + 1} 筆:`, fullUrl, e);
          this.handleImageError({ target: { src: fullUrl } } as any); // 手動觸發
        };
      });
    }
  }

  private initializeSwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true); // 銷毀舊實例，清理 DOM
    }
    if (!this.swiperRef || !this.swiperRef.nativeElement || this.displayedItems.length === 0) {
      console.warn('無法初始化 Swiper: swiperRef 或 displayedItems 無效', {
        swiperRef: !!this.swiperRef,
        displayedItemsLength: this.displayedItems.length
      });
      return;
    }
    const swiperElement = this.swiperRef.nativeElement;
    try {
      const slidesPerView = 4; // 固定顯示 4 筆
      const shouldLoop = this.displayedItems.length > slidesPerView; // 只有當 slide 數 > 4 才啟用 loop
      this.swiperInstance = new Swiper(swiperElement, {
        modules: [Navigation, Autoplay],
        loop: shouldLoop, // 動態啟用 loop
        watchOverflow: true, // 自動隱藏導航鍵若無溢出
        observer: true, // 監聽 DOM 變化
        observeParents: true, // 監聽父元素變化
        autoplay: {
          delay: 3000, // 每 3 秒翻頁
          disableOnInteraction: false, // 交互後繼續自動播放
          pauseOnMouseEnter: true, // 滑鼠懸停時暫停
        },
        slidesPerView: slidesPerView, // 固定 4 筆
        slidesPerGroup: 1, // 每次滑動一筆
        spaceBetween: 5, //留白間隔距離
        speed: 1000,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        breakpoints: {
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: slidesPerView }
        }
      });
      // 手動啟動 autoplay
      if (this.swiperInstance && this.swiperInstance.autoplay) {
        this.swiperInstance.autoplay.start();
        console.log('Autoplay 啟動');
      }
      this.cdr.detectChanges(); // 手動觸發變更檢測
      console.log('Swiper 初始化成功，slide 數:', swiperElement.querySelectorAll('.swiper-slide').length);
      console.log('Swiper 渲染資料來源: 使用 API，第一筆名稱:', this.displayedItems[0]?.fRoomAlias);
    } catch (error) {
      console.error('Swiper 初始化失敗:', error);
    }
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('圖片載入失敗 (API):', imgElement.src, ' - 切換至後備圖片');
    imgElement.src = this.staticUrl + 'images/rooms/default-room-image.jpg'; // 匹配後端路徑
    imgElement.onerror = null; // 避免循環
  }

  private checkImages(): void {
    const images = document.querySelectorAll('.room-image');
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement; // 類型斷言
      if (imageElement.src && !imageElement.complete) {
        console.log('檢查圖片:', imageElement.src);
        imageElement.onerror = () => this.handleImageError({ target: imageElement } as any);
        imageElement.src = imageElement.src; // 強制重新載入，觸發 onerror
      }
    });
  }

  navigateToDetail(id: number, event?: Event): void {
    if (event) {
      event.preventDefault(); // 阻止預設行為（避免 Swiper 攔截）
      event.stopPropagation(); // 阻止事件冒泡
    }
    console.log('嘗試導向到 room-detail id:', id);
    this.zone.run(() => {
      this.router.navigate(['/show/room-detail', id]).then(success => {
        console.log('導向結果:', success ? '成功' : '失敗');
        if (success) {
          this.cdr.detectChanges(); // 強制變更檢測
        }
      });
    });
  }
}
