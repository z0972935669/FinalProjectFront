import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // 移除 AfterViewChecked
import { CommonModule } from '@angular/common';
import { MemberRoomService } from '../../../services/member/member-room.service';
import { MemberRoomData } from '../../../interfaces/room/room.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-member-room',
  standalone: true,
  imports: [CommonModule],
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

  showPaypalPayment(): void {
    if (this.isPaypalButtonRendered || this.isLoading || !this.hasRoomData || this.RoomOccupancy?.fBillingStatus) return;

    // 清理舊的按鈕容器
    if (this.paypalButtonContainer && this.paypalButtonContainer.nativeElement) {
      this.paypalButtonContainer.nativeElement.innerHTML = '';
    }

    let attempts = 0;
    const maxAttempts = 10;
    const checkPaypal = setInterval(() => {
      if ((window as any).paypal) {
        clearInterval(checkPaypal);
        (window as any).paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { value: (this.RoomTable.fRoomPrice || 0).toFixed(2) }
              }]
            });
          },
          onApprove: (data: any, actions: any) => {
            return actions.order.capture().then((details: any) => {
              this.recordPayment(details.id);
            });
          },
          onError: (err: any) => {
            console.error('PayPal 錯誤:', err);
          }
        }).render('#paypal-button-container').catch((err: any) => {
          console.error('PayPal 按鈕渲染失敗:', err);
        });
        this.isPaypalButtonRendered = true;
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPaypal);
        console.error('PayPal 加載失敗');
      }
      attempts++;
    }, 1000);
  }

  recordPayment(paypalOrderId: string): void {
    const dto = {
      occupancyId: this.RoomOccupancy?.fOccupancyId || 0, // 確保 fOccupancyId 有效
      amount: Math.floor(this.RoomTable.fRoomPrice || 0),
      paypalOrderId: paypalOrderId
    };
    console.log('Sending payment request:', dto);
    this.memberRoomService.recordPayment(dto).subscribe({
      next: (response) => {
        alert('延期繳費成功');
        this.loadMemberRoomData();
      },
      error: (err) => {
        console.error('繳費失敗:', err);
        alert('繳費失敗: ' + (err.error?.message || err.message || '伺服器錯誤'));
      }
    });
  }
}
