import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Room {
  fRoomId: number;
  fRoomAlias: string;
  images: string[];
  fRoomDescription: string;
  fRoomPrice: number;
}

interface RoomOccupancy {
  name: string;
  email: string;
  contact: string;
  paymentMethod: string;
  cardNumber?: string;
  cardholder?: string;
  expiry?: string;
  cvv?: string;
  otherPayment?: string;
  checkInDate?: string;
}
@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-detail.component.html',
  styleUrl: './room-detail.component.scss',
})
export class RoomDetailComponent implements OnInit {
  room: Room | undefined;
  showModal: boolean = false;
  bookingForm: RoomOccupancy = { name: '', email: '', contact: '', paymentMethod: 'credit' };
  minCheckInDate: string;
  private rooms: Room[] = [
    {
      fRoomId: 1,
      fRoomAlias: '松竹紅單人房',
      images: ['/assets/img/room/n1.jpg', '/assets/img/room/n1.jpg', '/assets/img/room/n1.jpg'],
      fRoomDescription: '典雅的紅色調設計，營造溫暖舒適的居住氛圍，配備高品質床鋪、人體工學傢俱與現代化設施，專為喜愛寧靜的長者打造私人休憩空間。提供全天候專業照護與貼心服務，讓您享受安心的獨居生活，感受家的溫暖與尊貴體驗。',
      fRoomPrice: 56000,
    },
    {
      fRoomId: 2,
      fRoomAlias: '松竹籃單人房',
      images: ['/assets/img/room/n1bule.jpg', '/assets/img/room/n1bule.jpg', '/assets/img/room/n1bule.jpg'],
      fRoomDescription: '清新藍色調設計，融入現代化設施與人體工學傢俱，打造舒適安靜的居住環境。專為追求放鬆生活的長者設計，提供全天候專業照護與貼心服務，讓您在寧靜的私人空間中享受高品質生活，感受清新與舒適的完美結合。',
      fRoomPrice: 56000,
    },
    {
      fRoomId: 3,
      fRoomAlias: '松竹秋單人房',
      images: ['/assets/img/room/n1red.jpg', '/assets/img/room/n1red.jpg', '/assets/img/room/n1red.jpg'],
      fRoomDescription: '秋季暖色設計，搭配溫馨燈光與高品質傢俱，營造舒適雅致的私人空間。專為追求高雅生活的長者打造，提供全天候專業醫療與貼心照護服務，讓您在寧靜環境中享受尊貴生活，感受溫暖與細緻關懷的完美融合。',
      fRoomPrice: 56000,
    },
    {
      fRoomId: 4,
      fRoomAlias: '夏雨雙人房',
      images: ['/assets/img/room/n2.jpg', '/assets/img/room/n2.jpg', '/assets/img/room/n2.jpg'],
      fRoomDescription: '寬敞明亮的雙人房，溫馨布置搭配實用設施，適合親友共享溫暖時光。配備舒適床鋪與現代化設備，提供全天候專業照護與貼心服務，讓您與摯愛在輕鬆愉悅的環境中享受高品質生活，創造難忘的共同回憶。',
      fRoomPrice: 42000,
    },
    {
      fRoomId: 5,
      fRoomAlias: '夏雨奢華雙人房',
      images: ['/assets/img/room/n2pro.jpg', '/assets/img/room/n2pro.jpg', '/assets/img/room/n2pro.jpg'],
      fRoomDescription: '精緻裝潢與高級傢俱，寬敞空間搭配頂級設施，打造尊貴雙人入住體驗。專為追求奢華生活的住戶設計，提供全天候專業照護與貼心服務，讓您與摯友在豪華舒適的環境中享受無與倫比的尊貴生活與細緻關懷。',
      fRoomPrice: 49000,
    },
    {
      fRoomId: 6,
      fRoomAlias: '夏雨綠雙人房',
      images: ['/assets/img/room/n2up.jpg', '/assets/img/room/n2up.jpg', '/assets/img/room/n2up.jpg'],
      fRoomDescription: '自然綠色調設計，寬敞明亮，配備現代化設施與舒適傢俱，帶來活力與放鬆兼得的雙人居住環境。提供全天候專業照護，讓您與親友在清新舒適的空間中享受高品質生活，感受自然與關懷的完美融合。',
      fRoomPrice: 42000,
    },
    {
      fRoomId: 7,
      fRoomAlias: '秋康四人房',
      images: ['/assets/img/room/n4.jpg', '/assets/img/room/n4.jpg', '/assets/img/room/n4.jpg'],
      fRoomDescription: '豪華四人套房，設施齊全，寬敞空間搭配高級傢俱，適合家庭或朋友共享尊榮生活。提供全天候專業照護與貼心服務，讓您與摯愛在舒適環境中享受高品質生活，創造溫馨團聚時光，感受家的溫暖與關懷。',
      fRoomPrice: 38000,
    },
    {
      fRoomId: 8,
      fRoomAlias: '明星六人房',
      images: ['/assets/img/room/n6.jpg', '/assets/img/room/n6.jpg', '/assets/img/room/n6.jpg'],
      fRoomDescription: '寬敞六人房，現代化設計，配備實用設施與舒適空間，適合團體入住，享受熱鬧與舒適兼得的時光。提供全天候專業照護與貼家居家服務，讓您與朋友在輕鬆愉快的環境中共享美好生活，創造難忘的團聚回憶。',
      fRoomPrice: 32000,
    },
    {
      fRoomId: 9,
      fRoomAlias: '明星奢華六人房',
      images: ['/assets/img/room/n6pro.jpg', '/assets/img/room/n6pro.jpg', '/assets/img/room/n6pro.jpg'],
      fRoomDescription: '頂級設施與奢華空間，專為多人入住設計，配備高級傢俱與現代化設備，提供無與倫比的尊貴享受。全天候專業照護與貼心服務，讓您與團體在豪華舒適的環境中共享高品質生活，創造難忘的團聚與尊榮體驗。',
      fRoomPrice: 36000,
    },
  ];

  constructor(private route: ActivatedRoute) {

    const today = new Date('2025-08-09');
    today.setDate(today.getDate() + 15);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 1);
    this.minCheckInDate = minDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Room ID:', id);
    this.room = this.rooms.find((r) => r.fRoomId === id);
    console.log('Selected Room:', this.room);
    window.scrollTo(0, 0);
  }

  openBookingModal(): void {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
  }

  closeBookingModal(): void {
    const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    if (modal) {
      modal.hide();
    }
  }

  submitBooking(): void {
    console.log('預定資料:', this.bookingForm);
    const checkInDate = this.bookingForm.checkInDate || '未指定';
    alert(`付款成功!\n入住時間為: ${checkInDate}\n如有異動請聯絡我們:0988888888`);
    this.closeBookingModal();
  }

  togglePaymentFields(): void {
    if (this.bookingForm.paymentMethod === 'credit') {
      this.bookingForm.otherPayment = '';
    } else if (this.bookingForm.paymentMethod === 'other') {
      this.bookingForm.cardNumber = '';
      this.bookingForm.cardholder = '';
      this.bookingForm.expiry = '';
      this.bookingForm.cvv = '';
    }
  }

  handleImageError(event: Event): void {
    console.error('圖片加載失敗:', (event.target as HTMLImageElement).src);
  }
}
