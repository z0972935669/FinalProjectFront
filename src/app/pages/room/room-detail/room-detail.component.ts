import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoomDetailService } from '../../../services/room/room-detail.service';
import { RoomDetail, RoomOccupancy } from '../../../interfaces/room/room.interface';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-detail.component.html',
  styleUrl: './room-detail.component.scss',
})
export class RoomDetailComponent implements OnInit {
  room: RoomDetail | undefined;
  showModal: boolean = false;
  bookingForm: RoomOccupancy = { paymentMethod: 'credit', fBedId: 0, fBillingAmount: 0 };
  minCheckInDate: string;
  staticUrl = 'https://localhost:7124/';

  constructor(private route: ActivatedRoute, private roomService: RoomDetailService) {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);
    this.minCheckInDate = minDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.roomService.getRoomById(id).pipe(
      timeout(5000)
    ).subscribe({
      next: (response) => {
        this.room = response.data;
        if (this.room?.images) {
          this.room.images = this.room.images.filter(img => img && img.trim() !== '');
          this.room.images.forEach(img => {
            const fullUrl = this.staticUrl + 'images/' + img.replace(/\\/g, '/').toLowerCase(); // 修正路徑
            console.log('API 回傳路徑:', img);
            console.log('最終拼接的圖片URL:', fullUrl);
            const imgCheck = new Image();
            imgCheck.src = fullUrl;
            imgCheck.onload = () => console.log('圖片載入成功:', fullUrl);
            imgCheck.onerror = (e) => console.error('預檢查圖片失敗:', fullUrl, '可能因 CORS 或伺服器', e);
          });
        }
      },
      error: (err) => {
        console.error('API 或圖片載入錯誤:', err);
        alert('載入房間資料超時或失敗，請檢查網路或聯繫客服');
      }
    });
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
    this.bookingForm.fBedId = this.room?.fBedCount ? 1 : 0;
    this.bookingForm.fBillingAmount = this.room?.fRoomPrice || 0;
    this.roomService.submitBooking(this.bookingForm).subscribe({
      next: (response) => {
        alert(`付款成功!\n入住時間為: ${this.bookingForm.checkInDate || '未指定'}\n如有異動請聯絡我們:0988888888\nID: ${response.occupancyId}`);
        this.closeBookingModal();
      },
      error: (err) => alert('預訂失敗：' + err.message)
    });
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
