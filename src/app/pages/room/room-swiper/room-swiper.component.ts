import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

@Component({
  selector: 'app-room-swiper',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-swiper.component.html',
  styleUrl: './room-swiper.component.scss'
})
export class RoomSwiperComponent {
  @Input() items: any[] = [];

  @ViewChild('swiperRef', { static: false }) swiperRef!: ElementRef;

  ngAfterViewInit(): void {
    if (!this.swiperRef) return;

    new Swiper(this.swiperRef.nativeElement, {
      modules: [Navigation, Autoplay],
      loop: true,
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
      }
    });
  }
}
