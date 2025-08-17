import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { QuantityComponent } from '../../../components/shared/quantity/quantity.component';
import { ShopService } from '../../../services/shop/shop-list.service';
import { IShopProductDetail } from '../../../interfaces/shop/shop-detail';
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
  product?: IShopProductDetail;

  constructor(private route: ActivatedRoute, private shopService: ShopService) {
    this.slug = this.route.snapshot.params['slug'];
  }

  ngOnInit(): void {
    this.shopService.getProductDetail(this.slug).subscribe({
      next: (res) => {
        this.product = res;
        this.initSwiper();
      },
      error: (err) => console.error('載入商品詳細失敗', err),
    });
  }

  ngAfterViewInit(): void {
    // Swiper 初始化會在資料回來後呼叫 initSwiper
  }

  private initSwiper() {
    setTimeout(() => {
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
    });
  }
}
