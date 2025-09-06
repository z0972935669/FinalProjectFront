import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomErpService } from '../../../services/room/room-erp.service';
import { RoomOccupancyDto } from '../../../interfaces/room/roomerp.interface'; // 更新為 RoomOccupancyDto
import { NgxSonnerToaster, toast } from 'ngx-sonner'; // 導入 toast

@Component({
  selector: 'app-room-occupancy',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSonnerToaster],
  templateUrl: './room-occupancy-erp.component.html',
  styleUrl: './room-occupancy-erp.component.scss',
})
export class RoomOccupancyComponent implements OnInit {
  members: any[] = [];
  rooms: any[] = [];
  beds: any[] = [];
  selectedMemberId: number | null = null;
  selectedRoomId: number | null = null;
  selectedBedId: number | null = null;
  checkInDate: string = '';
  billingAmount: number = 0;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private roomErpService: RoomErpService) { }

  ngOnInit(): void {
    this.loadMembers();
    this.loadRooms();
  }

  loadMembers(): void {
    this.roomErpService.getMembers().subscribe({
      next: (response) => {
        this.members = response;
      },
      error: (err) => {
        this.errorMessage = '無法載入會員列表';
      }
    });
  }

  loadRooms(): void {
    this.roomErpService.getRooms().subscribe({
      next: (response) => {
        this.rooms = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = '無法載入房間列表';
        this.isLoading = false;
      }
    });
  }

  onRoomChange(): void {
    if (this.selectedRoomId) {
      this.roomErpService.getBeds(this.selectedRoomId).subscribe({
        next: (response) => {
          this.beds = response;
          this.billingAmount = this.rooms.find(r => r.fRoomId === this.selectedRoomId)?.fRoomPrice || 0;
        },
        error: (err) => {
          alert('無法載入床位列表');
        }
      });
    } else {
      this.beds = [];
      this.billingAmount = 0;
    }
  }

  submitOccupancy(): void {
    if (!this.selectedMemberId || !this.selectedRoomId || !this.selectedBedId || !this.checkInDate) {
      toast('請填寫所有必填欄位');
      return;
    }

    if (confirm('現場收款了嗎?')) {
      if (confirm('確認已收款?')) {
        const dto: RoomOccupancyDto = {
          FMemberId: this.selectedMemberId,
          FRoomId: this.selectedRoomId,
          FBedId: this.selectedBedId,
          FCheckInDate: new Date(this.checkInDate),
          FBillingAmount: this.billingAmount,
          FPaymentMethod: '現金',
          FPaypalOrderId: null
        };

        this.roomErpService.createOccupancy(dto).subscribe({
          next: (response) => {
            toast('入住辦理成功');
            this.resetForm();
          },
          error: (err) => {
            toast.error('入住辦理失敗: ' + err.message);
          }
        });
      }
    }
  }

  resetForm(): void {
    this.selectedMemberId = null;
    this.selectedRoomId = null;
    this.selectedBedId = null;
    this.checkInDate = '';
    this.billingAmount = 0;
  }
}
