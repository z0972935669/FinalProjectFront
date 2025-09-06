import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomErpService } from '../../../services/room/room-erp.service';
import { VisitReservation } from '../../../interfaces/room/roomerp.interface';
import { FormsModule } from '@angular/forms';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-room-visitreservation-erp',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSonnerToaster],
  templateUrl: './room-visitreservation-erp.component.html',
  styleUrl: './room-visitreservation-erp.component.scss',
})
export class RoomVisitreservationErpComponent implements OnInit {
  visitReservations: VisitReservation[] | null = null;
  selectedReservations: number[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  newDate: string = '';

  constructor(private roomErpService: RoomErpService) { }

  ngOnInit(): void {
    this.loadVisitReservations();
  }

  loadVisitReservations(): void {
    this.isLoading = true;
    this.roomErpService.getVisitReservations().subscribe({
      next: (response) => {
        this.visitReservations = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = '無法載入預約參訪列表';
        this.isLoading = false;
      }
    });
  }

  toggleSelection(reservationId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedReservations.push(reservationId);
    } else {
      this.selectedReservations = this.selectedReservations.filter(id => id !== reservationId);
    }
  }

  openEditModal(): void {
    if (this.selectedReservations.length === 0) {
      toast('請至少選擇一個預約記錄');
      return;
    }
    this.showBatchEditPopup();
  }

  showBatchEditPopup(): void {
    Swal.fire({
      title: '批量修改預約日期',
      html: `
        <input type="date" id="swal-input-date" class="swal2-input" value="${this.newDate || ''}">
      `,
      showCancelButton: true,
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      reverseButtons: true,
      focusCancel: true,
      preConfirm: () => {
        const newDate = (document.getElementById('swal-input-date') as HTMLInputElement).value;
        if (!newDate) {
          Swal.showValidationMessage('請選擇日期');
          return false;
        }
        this.newDate = newDate;
        return true;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmEdit();
      }
    });
  }

  confirmEdit(): void {
    if (!this.newDate) {
      toast('請選擇日期');
      return;
    }

    const dto = {
      reservationIds: this.selectedReservations,
      newDate: new Date(this.newDate)
    };

    this.roomErpService.batchUpdateDate(dto).subscribe({
      next: (response) => {
        toast('批量更新成功');
        this.loadVisitReservations();
        this.selectedReservations = [];
        this.newDate = '';
      },
      error: (err) => {
        toast.error('批量更新失敗: ' + err.message);
      }
    });
  }

  batchContact(): void {
    if (this.selectedReservations.length === 0) {
      toast('請至少選擇一個預約記錄');
      return;
    }

    const dto = {
      reservationIds: this.selectedReservations,
      newStatus: true // 設為已聯絡
    };

    this.roomErpService.batchUpdateContactStatus(dto).subscribe({
      next: (response) => {
        toast('批量聯絡更新成功');
        this.loadVisitReservations();
        this.selectedReservations = [];
      },
      error: (err) => {
        toast.error('批量聯絡更新失敗: ' + err.message);
      }
    });
  }

  batchDelete(): void {
    if (this.selectedReservations.length === 0) {
      toast('請至少選擇一個預約記錄');
      return;
    }

    Swal.fire({
      title: '確認刪除',
      text: '確定要刪除選定的預約記錄？此操作無法復原！',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        const dto = {
          reservationIds: this.selectedReservations
        };

        this.roomErpService.batchDeleteReservations(dto).subscribe({
          next: (response) => {
            toast('批量刪除成功');
            this.loadVisitReservations();
            this.selectedReservations = [];
          },
          error: (err) => {
            toast.error('批量刪除失敗: ' + err.message);
          }
        });
      }
    });
  }

  updateStatus(reservationId: number, status: number): void {
    this.roomErpService.updateVisitStatus(reservationId, status).subscribe({
      next: (response) => {
        toast('狀態更新成功');
        this.loadVisitReservations();
      },
      error: (err) => {
        toast.error('狀態更新失敗');
      }
    });
  }
}
