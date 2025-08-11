import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiperComponent } from '../../../components/shared/swiper/swiper.component';
import { BannerSwiperComponent } from '../../../components/shared/banner-swiper/banner-swiper.component';
import { RoomSwiperComponent } from '../../room/room-swiper/room-swiper.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, SwiperComponent, BannerSwiperComponent, RoomSwiperComponent],
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
  room = [
    {
      fRoomId: 1,
      fRoomAlias: '松竹紅單人房',
      image: 'assets/img/room/n1.jpg',
      fRoomDescription: '典雅紅色調設計，溫暖的居住氛圍。',
      fRoomPrice: 56000,
    },
    {
      fRoomId: 2,
      fRoomAlias: '松竹籃單人房',
      image: '/assets/img/room/n1bule.jpg',
      fRoomDescription: '清新藍色調設計，融入現代化設施。',
      fRoomPrice: 56000,
    },
    {
      fRoomId: 3,
      fRoomAlias: '松竹秋單人房',
      image: '/assets/img/room/n1red.jpg',
      fRoomDescription: '秋季暖色設計，搭配溫馨燈光。',
      fRoomPrice: 56000,
    },
    {
      fRoomId: 4,
      fRoomAlias: '夏雨雙人房',
      image: '/assets/img/room/n2.jpg',
      fRoomDescription: '寬敞明亮的雙人房，溫馨布置搭配。',
      fRoomPrice: 42000,
    },
    {
      fRoomId: 5,
      fRoomAlias: '夏雨奢華雙人房',
      image: '/assets/img/room/n2pro.jpg',
      fRoomDescription: '精緻裝潢，寬敞空間。',
      fRoomPrice: 49000,
    },
    {
      fRoomId: 6,
      fRoomAlias: '夏雨綠雙人房',
      image: '/assets/img/room/n2up.jpg',
      fRoomDescription: '自然綠色調設計，寬敞明亮。',
      fRoomPrice: 42000,
    },
    {
      fRoomId: 7,
      fRoomAlias: '秋康四人房',
      image: '/assets/img/room/n4.jpg',
      fRoomDescription: '豪華四人套房，設施齊全。',
      fRoomPrice: 38000,
    },
    {
      fRoomId: 8,
      fRoomAlias: '明星六人房',
      image: '/assets/img/room/n6.jpg',
      fRoomDescription: '寬敞六人房，現代化設計。',
      fRoomPrice: 32000,
    },
    {
      fRoomId: 9,
      fRoomAlias: '明星奢華六人房',
      image: '/assets/img/room/n6pro.jpg',
      fRoomDescription: '專為多人入住設計。',
      fRoomPrice: 36000,
    },
  ];
  ngOnInit() {
    console.log('room data:', this.room);  // 檢查 room 是否有值
  }
}
