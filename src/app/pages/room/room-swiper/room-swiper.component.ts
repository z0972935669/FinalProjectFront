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
    if (this.displayedItems.length > 0 && this.swiperRef) {
      this.initializeSwiper();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && !changes['items'].firstChange) {
      this.updateDisplayedItems();
      if (this.swiperRef && this.displayedItems.length > 0) {
        this.initializeSwiper();
      }
    }
  }

  private updateDisplayedItems(): void {
    if (this.items.length === 0) {
      this.displayedItems = [];
      return;
    }

    // 根據 fRoomAlias 去重，只保留第一個出現的房間
    const uniqueItemsByName = Array.from(
      new Map(
        this.items.map(item => [item.fRoomAlias, item])
      ).values()
    );
    // 取前 9 筆
    this.displayedItems = uniqueItemsByName.slice(0, 9);
  }

  private initializeSwiper(): void {
    if (!this.swiperRef || !this.swiperRef.nativeElement || this.displayedItems.length === 0) {
      return;
    }
    const swiperElement = this.swiperRef.nativeElement;
    try {
      const slidesPerView = 4;
      // 僅當 slide 數量大於 slidesPerView 且至少有 5 筆時啟用 loop
      const shouldLoop = this.displayedItems.length >= 5 && this.displayedItems.length > slidesPerView;
      this.swiperInstance = new Swiper(swiperElement, {
        modules: [Navigation, Autoplay],
        loop: shouldLoop,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        slidesPerView: slidesPerView,
        slidesPerGroup: 1,
        spaceBetween: 5,
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
      if (this.swiperInstance && this.swiperInstance.autoplay) {
        this.swiperInstance.autoplay.start();
      }
      this.cdr.detectChanges();
    } catch (error) {
    }
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement.closest('.swiper-slide-duplicate')) {
      return;
    }
    imgElement.src = this.staticUrl + 'images/rooms/default-room-image.jpg';
    imgElement.onerror = null;
  }

  navigateToDetail(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.zone.run(() => {
      this.router.navigate(['/show/room-detail', id]).then(success => {
        if (success) {
          this.cdr.detectChanges();
        }
      });
    });
  }
}
