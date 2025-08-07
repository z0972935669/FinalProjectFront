import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiperComponent } from '../../../components/shared/swiper/swiper.component';
import { BannerSwiperComponent } from '../../../components/shared/banner-swiper/banner-swiper.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, SwiperComponent, BannerSwiperComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  vegetableItems = [
    {
      img: 'assets/img/vegetable-item-1.jpg',
      title: 'Parsley',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-5.jpg',
      title: 'Carrot',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-6.jpg',
      title: 'Carrot',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-4.jpg',
      title: 'Carrot',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-1.jpg',
      title: 'Parsley',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-6.jpg',
      title: 'Carrot',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-5.jpg',
      title: 'Carrot',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
    {
      img: 'assets/img/vegetable-item-4.jpg',
      title: 'Carrot',
      description: 'Lorem ipsum dolor sit amet...',
      category: 'Vegetable',
      price: 100,
    },
  ];
}
