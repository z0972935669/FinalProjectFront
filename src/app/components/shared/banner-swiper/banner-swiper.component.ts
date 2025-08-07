import { Component, AfterViewInit } from '@angular/core';
declare const Swiper: any; // 引入 swiper js 全域物件

@Component({
  selector: 'app-banner-swiper',
  templateUrl: './banner-swiper.component.html',
  styleUrls: ['./banner-swiper.component.scss']
})
export class BannerSwiperComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    new Swiper('#swiper1', {
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 800,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      }
    });
  }

}
