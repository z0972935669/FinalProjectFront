import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoomListService } from '../../../services/room/room-list.service';
import { Room, RoomVisitReservation } from '../../../interfaces/room/room.interface';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  RoomVisitReservation: RoomVisitReservation = { fName: '', fEmail: '', fPhoneOrLineId: '', fReservationDate: '' };
  minDate: string;
  staticUrl = 'https://localhost:7124/'; // 基於後端根路徑

  constructor(private roomService: RoomListService) {
    const today = new Date();
    const fifteenDaysLater = new Date(today);
    fifteenDaysLater.setDate(today.getDate() + 15);
    this.minDate = fifteenDaysLater.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.roomService.getRooms().pipe(
      timeout(5000)
    ).subscribe({
      next: (response) => {
        this.rooms = response.data.filter(room => room.image && room.image.trim() !== '');
        this.rooms.forEach(room => {
          const fullUrl = this.staticUrl + 'images/' + room.image.replace(/\\/g, '/').toLowerCase(); // 修正路徑
          console.log('API 回傳路徑:', room.image);
          console.log('最終拼接的圖片URL:', fullUrl);
          const img = new Image();
          img.src = fullUrl;
          img.onload = () => console.log('圖片載入成功:', fullUrl);
          img.onerror = (e) => console.error('預檢查圖片失敗:', fullUrl, '可能因 CORS 或伺服器', e);
        });
      },
      error: (err) => {
        console.error('API 或圖片載入錯誤:', err);
        this.rooms = [];
        alert('載入房間列表超時或失敗，請檢查網路或聯繫客服');
      }
    });
  }

  onSubmit(reservation: RoomVisitReservation) {
    if (reservation.fName && reservation.fEmail && reservation.fPhoneOrLineId && reservation.fReservationDate) {
      this.roomService.submitReservation(reservation).subscribe({
        next: (response) => {
          alert(`預約成功！ID: ${response.data}`);
          this.resetForm();
        },
        error: (err) => {
          console.error('完整錯誤:', err);
          alert('預約失敗：' + (err.error?.message || err.message));
        }
      });
    } else {
      alert('請填寫所有必填欄位！');
    }
  }

  resetForm() {
    this.RoomVisitReservation = { fName: '', fEmail: '', fPhoneOrLineId: '', fReservationDate: '' };
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('圖片載入失敗:', imgElement.src, ' - 檢查 CORS 或伺服器狀態');
    imgElement.src = this.staticUrl + 'images/assets/default-room-image.jpg'; // 修正後備路徑
    imgElement.onerror = null;
    setTimeout(() => {
      if (!imgElement.complete) {
        console.warn('後備圖片載入超時:', imgElement.src);
        imgElement.src = this.staticUrl + 'images/assets/alternative-default.jpg'; // 第二備用
      }
    }, 2000);
  }
}
