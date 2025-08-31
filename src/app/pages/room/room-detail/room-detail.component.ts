import { Component, OnInit, AfterViewChecked } from '@angular/core'; // 添加 AfterViewChecked
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoomDetailService } from '../../../services/room/room-detail.service';
import { RoomDetail, RoomOccupancy } from '../../../interfaces/room/room.interface';
import { timeout } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-detail.component.html',
  styleUrl: './room-detail.component.scss',
})
export class RoomDetailComponent implements OnInit, AfterViewChecked {
  room: RoomDetail | undefined;
  showModal: boolean = false;
  bookingForm: RoomOccupancy = {
    paymentMethod: 'paypal',
    fBedId: 0,
    fBillingAmount: 0,
    checkInDate: '', // 必填，初始化為空
    contact: '', // 必填，初始化為空
    paypalOrderId: '' // 初始為空字符串
  };
  minCheckInDate: string;
  staticUrl = 'https://localhost:7124/';
  isLoggedIn: boolean = false;
  memberInfo: any = null;
  isAlreadyResiding: boolean = false;
  isPaypalButtonRendered: boolean = false; // 跟踪 PayPal 按鈕是否已渲染

  constructor(private route: ActivatedRoute, private roomService: RoomDetailService) {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);
    this.minCheckInDate = minDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // console.log('路由參數 id:', id);
    this.roomService.getRoomById(id).pipe(timeout(5000)).subscribe({
      next: (response) => {
        // console.log('API 回傳資料:', response);
        this.room = response.data;
        if (this.room?.images) {
          this.room.images = this.room.images.filter(img => img && img.trim() !== '');
        }
      },
      error: (err) => {
        console.error('API 或圖片載入錯誤:', err);
        alert('載入房間資料超時或失敗，請檢查網路或聯繫客服');
      }
    });
    window.scrollTo(0, 0);
  }

  ngAfterViewChecked(): void {
    // 當表單準備好且 PayPal 按鈕尚未渲染時，初始化
    if (this.isFormReady() && !this.isPaypalButtonRendered && this.showModal) {
      this.createPaypalButton();
      this.isPaypalButtonRendered = true; // 標記為已渲染
    }
  }

  openBookingModal(): void {
    this.roomService.getCurrentMember().subscribe({
      next: (response) => {
        this.isLoggedIn = true;
        this.memberInfo = response;
        this.isAlreadyResiding = response.residesInCareHome;
        if (this.isAlreadyResiding) {
          alert('您已經入住中！如需變更，請聯繫客服。');
          return;
        }
        this.bookingForm.name = this.memberInfo.name;
        this.bookingForm.email = this.memberInfo.email;
        this.bookingForm.contact = this.memberInfo.phone || ''; // 確保有值
        this.showModal = true; // 顯示模態框
        const modal = new (window as any).bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
        const modalTitle = document.getElementById('bookingModalLabel') as HTMLHeadingElement;
        if (modalTitle && this.room?.fRoomAlias) {
          modalTitle.textContent = `入住方案: ${this.room.fRoomAlias}`;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoggedIn = false;
        if (err.status === 401) {
          alert('請先登入會員！');
          // 可導向登入頁：this.router.navigate(['/account/login']);
        } else {
          alert('檢查登入狀態失敗，請稍後重試。');
        }
        return;
      }
    });
  }

  closeBookingModal(): void {
    this.showModal = false; // 隱藏模態框
    this.isPaypalButtonRendered = false; // 重置渲染標記
    const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    if (modal) {
      modal.hide();
    }
  }

  isFormReady(): boolean {
    // console.log('檢查表單準備狀態 - contact:'
    //   , this.bookingForm.contact, 'checkInDate:', this.bookingForm.checkInDate);
    return !!this.bookingForm.contact.trim() && !!this.bookingForm.checkInDate.trim();
  }

  createPaypalButton(): void {
    console.log('嘗試創建 PayPal 按鈕...');
    if (!window.paypal || !window.paypal.Buttons) {
      console.error('PayPal SDK 未正確加載，檢查 Client ID 或網路連線');
      alert('PayPal 服務暫時不可用，請確認網路並重試，或聯繫客服。');
      return;
    }

    const maxAttempts = 5;
    let attempts = 0;
    const checkPaypal = setInterval(() => {
      if (window.paypal && window.paypal.Buttons) {
        clearInterval(checkPaypal);
        console.log('PayPal SDK 加載成功，初始化按鈕...');
        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            console.log('創建訂單...');
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: (this.room?.fRoomPrice || 0).toString(),
                  currency_code: 'TWD'
                },
                description: `Room Booking - ${this.room?.fRoomAlias}`
              }]
            });
          },
          onApprove: (data: any, actions: any) => {
            console.log('支付批准，捕獲訂單...', data.orderID);
            return actions.order.capture().then((details: any) => {
              this.bookingForm.paypalOrderId = details.id || '';
              alert(`付款成功！交易 ID: ${this.bookingForm.paypalOrderId}`);
              this.submitBookingToBackend();
            });
          },
          onError: (err: any) => {
            console.error('PayPal 錯誤:', err);
            alert('付款失敗，請重試或聯繫客服。');
          }
        }).render('#paypal-button-container');
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPaypal);
        console.error('PayPal SDK 加載失敗，超過重試次數');
        alert('PayPal 服務加載失敗，請檢查網路或聯繫客服。');
      }
      attempts++;
    }, 1000);
  }

  submitBookingToBackend(): void {
    if (!this.bookingForm.contact || !this.bookingForm.checkInDate) {
      alert('電話和入住時間為必填項！');
      return;
    }

    this.bookingForm.fBedId = this.room?.fBedCount ? 1 : 0;
    this.bookingForm.fBillingAmount = this.room?.fRoomPrice || 0;
    this.bookingForm.paymentMethod = 'paypal';

    this.roomService.submitBooking(this.bookingForm).subscribe({
      next: (response) => {
        alert(`入住預訂成功!\n入住時間為: ${this.bookingForm.checkInDate}\n如有異動請聯繫我們: 0988888888\nID: ${response.occupancyId}`);
        this.closeBookingModal();
      },
      error: (err) => alert('預訂失敗：' + err.message)
    });
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('圖片載入失敗:', imgElement.src, ' - 檢查 CORS 或伺服器狀態');
    imgElement.src = this.staticUrl + 'images/rooms/default-room-image.jpg';
    imgElement.onerror = () => {
      console.warn('第一後備圖片失敗:', imgElement.src);
      imgElement.src = this.staticUrl + 'images/rooms/alternative-default.jpg';
      imgElement.onerror = null;
    };
    setTimeout(() => {
      if (!imgElement.complete) {
        console.warn('後備圖片載入超時:', imgElement.src);
      }
    }, 2000);
  }

  getImageUrl(imagePath: string): string {
    const fileName = imagePath.startsWith('rooms/') ? imagePath.replace('rooms/', '') : imagePath;
    return this.staticUrl + 'images/rooms/' + fileName;
  }
}
