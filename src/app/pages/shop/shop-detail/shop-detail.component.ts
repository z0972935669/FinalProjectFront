import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { QuantityComponent } from '../../../components/shared/quantity/quantity.component';

// ✅ Swiper 原生 JS 模組匯入（Swiper 11）
import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, QuantityComponent],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss'],
})
export class ShopDetailComponent implements AfterViewInit {
  slug = '';
  count1 = 1;

  images = [
    'assets/img/fruite-item-5.jpg',
    'assets/img/fruite-item-6.jpg',
    'assets/img/fruite-item-1.jpg',
    'assets/img/fruite-item-2.jpg',
  ];

  constructor(private route: ActivatedRoute) {
    this.slug = this.route.snapshot.params['slug'];
  }

  ngAfterViewInit(): void {
    const thumbsSwiper = new Swiper('.swiper-thumbs', {
      slidesPerView: 4,
      spaceBetween: 10,
      watchSlidesProgress: true,
    });

    new Swiper('.swiper-main', {
      spaceBetween: 10,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      thumbs: {
        swiper: thumbsSwiper,
      },
    });
  }
}
