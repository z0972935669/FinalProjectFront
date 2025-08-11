import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface Room {
  fRoomId: number;
  fRoomAlias: string;
  image: string;
  fRoomDescription: string;
}
interface RoomVisitReservation {
  fName: string;
  fEmail: string;
  fPhoneOrLineId: string;
  fReservationDate: string;
}

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [
    { fRoomId: 1, fRoomAlias: '松竹紅單人房', image: 'assets/img/room/n1.jpg', fRoomDescription: '典雅紅色調設計，營造溫暖氛圍，專為喜愛寧靜的長者打造私人休憩空間。' },
    { fRoomId: 2, fRoomAlias: '松竹籃單人房', image: 'assets/img/room/n1bule.jpg', fRoomDescription: '清新藍色調，搭配現代化設施，提供舒適與寧靜兼具的獨居體驗。' },
    { fRoomId: 3, fRoomAlias: '松竹秋單人房', image: 'assets/img/room/n1red.jpg', fRoomDescription: '秋季暖色設計，溫馨舒適，適合追求高品質生活的獨居長者。' },
    { fRoomId: 4, fRoomAlias: '夏雨雙人房', image: 'assets/img/room/n2.jpg', fRoomDescription: '寬敞明亮的雙人房，溫馨布置，適合親友共享的溫暖時光。' },
    { fRoomId: 5, fRoomAlias: '夏雨奢華雙人房', image: 'assets/img/room/n2pro.jpg', fRoomDescription: '高級傢俱與精緻裝潢，打造尊貴雙人入住體驗，享受奢華生活。' },
    { fRoomId: 6, fRoomAlias: '夏雨綠雙人房', image: 'assets/img/room/n2up.jpg', fRoomDescription: '自然綠色調，空間寬敞，帶來舒適與活力的雙人居住環境。' },
    { fRoomId: 7, fRoomAlias: '秋康四人房', image: 'assets/img/room/n4.jpg', fRoomDescription: '豪華四人套房，設施齊全，適合家庭或朋友共享尊榮生活。' },
    { fRoomId: 8, fRoomAlias: '明星六人房', image: 'assets/img/room/n6.jpg', fRoomDescription: '寬敞六人房，現代化設計，適合團體入住，享受熱鬧與舒適兼得的時光。' },
    { fRoomId: 9, fRoomAlias: '明星奢華六人房', image: 'assets/img/room/n6pro.jpg', fRoomDescription: '頂級設施與奢華空間，專為多人入住設計，體驗無與倫比的尊貴享受。' },
  ];
  RoomVisitReservation: RoomVisitReservation = {
    fName: '',
    fEmail: '',
    fPhoneOrLineId: '',
    fReservationDate: ''
  };

  minDate: string;

  constructor() {
    const today = new Date();
    const fifteenDaysLater = new Date(today);
    fifteenDaysLater.setDate(today.getDate() + 15); // 2025-08-24
    this.minDate = fifteenDaysLater.toISOString().split('T')[0]; // 設置最小日期為2025-08-24
  }

  ngOnInit(): void { }

  onSubmit(RoomVisitReservation: RoomVisitReservation) {
    if (RoomVisitReservation.fName && RoomVisitReservation.fEmail && RoomVisitReservation.fPhoneOrLineId && RoomVisitReservation.fReservationDate) {
      const confirmation = confirm(
        `確認預約資訊：\n\n姓名: ${RoomVisitReservation.fName}\n電子郵件: ${RoomVisitReservation.fEmail}\n電話/LINE ID: ${RoomVisitReservation.fPhoneOrLineId}\n預約日期: ${RoomVisitReservation.fReservationDate}\n\n是否確認？`
      );
      if (confirmation) {
        console.log('預約提交成功', RoomVisitReservation);
        // 這裡可以添加後端提交邏輯
        alert('預約成功！');
        this.resetForm();
      }
    } else {
      alert('請填寫所有必填欄位！');
    }
  }

  resetForm() {
    this.RoomVisitReservation = { fName: '', fEmail: '', fPhoneOrLineId: '', fReservationDate: '' };
  }
}
