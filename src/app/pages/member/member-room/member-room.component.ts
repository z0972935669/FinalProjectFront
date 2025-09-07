import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // 移除 AfterViewChecked
import { CommonModule } from '@angular/common';
import { MemberRoomService } from '../../../services/member/member-room.service';
import { MemberRoomData } from '../../../interfaces/room/room.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSonnerToaster, toast } from 'ngx-sonner'; // 導入 toast
import Swal from 'sweetalert2';//sweetalert2彈窗


@Component({
  selector: 'app-member-room',
  standalone: true,
  imports: [CommonModule, NgxSonnerToaster],
  templateUrl: './member-room.component.html',
  styleUrl: './member-room.component.scss',
})
export class MemberRoomComponent implements OnInit {
  @ViewChild('paypalButtonContainer', { static: false }) paypalButtonContainer!: ElementRef;

  Member: { fName: string; fIdNumber: string } = { fName: '', fIdNumber: '' };
  RoomBed: { fBedCode: string } = { fBedCode: '' };
  RoomTable: { fRoomName: string; fRoomAlias: string; fRoomType: boolean | null; fRoomPrice?: number } = { fRoomName: '', fRoomAlias: '', fRoomType: null };
  RoomOccupancy: { fBillingStatus: boolean | undefined; fOccupancyId?: number } | null = null;
  roomImages: string[] = [];
  lastBillingDate: Date | null = null;
  nextBillingDate: Date | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  hasRoomData: boolean = false;
  staticUrl = 'https://localhost:7124/';
  isPaypalButtonRendered: boolean = false;

  constructor(private memberRoomService: MemberRoomService) { }

  ngOnInit(): void {
    this.loadMemberRoomData();
  }

  loadMemberRoomData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.hasRoomData = false;

    this.memberRoomService.getMemberRoom().subscribe({
      next: (response: MemberRoomData) => {
        this.Member = response.member || { fName: '', fIdNumber: '' };
        this.RoomTable = response.roomTable || { fRoomName: '', fRoomAlias: '', fRoomType: false };
        this.RoomBed = response.roomBed || { fBedCode: '' };
        this.RoomOccupancy = response.roomOccupancy || { fBillingStatus: false };
        this.roomImages = [...new Set(response.roomTable.images || [])];
        if (response.paymentHistory && response.paymentHistory.length > 0) {
          const latestPayment = response.paymentHistory[0];
          this.lastBillingDate = new Date(latestPayment.fBillingDate);
          this.nextBillingDate = new Date(this.lastBillingDate);
          this.nextBillingDate.setDate(this.nextBillingDate.getDate() + 30);
        }
        this.hasRoomData = true;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.hasRoomData = false;
        if (err.status === 404) {
          this.Member = { fName: '', fIdNumber: '' };
          this.RoomTable = { fRoomName: '', fRoomAlias: '', fRoomType: null };
          this.RoomBed = { fBedCode: '' };
          this.RoomOccupancy = { fBillingStatus: undefined };
          this.roomImages = [];
          this.errorMessage = '無法載入資料';
        } else {
          this.errorMessage = '用戶尚未入住';
        }
      }
    });
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath || imagePath.trim() === '') {
      return this.staticUrl + 'images/rooms/default-room-image.jpg';
    }
    const fullPath = imagePath.startsWith('rooms/') ? 'images/' + imagePath : 'images/rooms/' + imagePath;
    const cachedUrl = sessionStorage.getItem(fullPath);
    if (cachedUrl) return cachedUrl;
    const url = this.staticUrl + fullPath;
    sessionStorage.setItem(fullPath, url);
    return url;
  }

  showPaymentPopup(): void {
    if (this.isLoading || !this.hasRoomData || this.RoomOccupancy?.fBillingStatus || !this.RoomTable.fRoomPrice) return;

    Swal.fire({
      title: '線上繳費',
      html: `
        <div id="paypal-button-container" style="margin: 0 auto; width: 300px;"></div>
      `,
      showCancelButton: true,
      cancelButtonText: '取消支付',
      showConfirmButton: false, // 移除確認按鈕
      didOpen: () => {
        this.renderPaypalButton();
      },
      preConfirm: () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(true), 100); // 確保 PayPal 按鈕準備好
        });
      },
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        toast('支付已取消');
      }
    });
  }

  renderPaypalButton(): void {
    if (!this.RoomOccupancy?.fOccupancyId || !this.RoomTable.fRoomPrice || this.isPaypalButtonRendered) return;

    const paypalButtonContainer = document.getElementById('paypal-button-container');
    if (!paypalButtonContainer) return;

    paypalButtonContainer.innerHTML = ''; // 清理舊內容

    (window as any).paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        const price = this.RoomTable.fRoomPrice || 0; // 預設值 0，若無價格
        return actions.order.create({
          purchase_units: [{
            amount: { value: price.toFixed(2) }
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          this.recordPayment(details.id);
          Swal.fire({
            icon: 'success',
            title: '下單成功',
            text: '支付完成！',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(() => {
            this.loadMemberRoomData(); // 重新加載數據
          });
        });
      },
      onError: (err: any) => {
        console.error('PayPal 錯誤:', err);
        toast.error('支付失敗，請稍後再試');
      }
    }).render('#paypal-button-container').then(() => {
      this.isPaypalButtonRendered = true;
    }).catch((err: any) => {
      console.error('PayPal 按鈕渲染失敗:', err);
      toast.error('支付介面加載失敗');
    });
  }
  recordPayment(paypalOrderId: string): void {
    const dto = {
      occupancyId: this.RoomOccupancy?.fOccupancyId || 0, // 確保 fOccupancyId 有效
      amount: Math.floor(this.RoomTable.fRoomPrice || 0),
      paypalOrderId: paypalOrderId
    };
    // console.log('Sending payment request:', dto);
    this.memberRoomService.recordPayment(dto).subscribe({
      next: (response) => {
        toast('延期繳費成功');
        this.loadMemberRoomData();
      },
      error: (err) => {
        console.error('繳費失敗:', err);
        toast.error('繳費失敗: ' + (err.error?.message || err.message || '伺服器錯誤'));
      }
    });
  }
}
