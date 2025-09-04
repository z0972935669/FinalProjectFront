import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomErpService } from '../../../services/room/room-erp.service';
import { VisitReservation } from '../../../interfaces/room/roomerp.interface';

@Component({
  selector: 'app-room-visitreservation-erp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-visitreservation-erp.component.html',
  styleUrl: './room-visitreservation-erp.component.scss',
})
export class RoomVisitreservationErpComponent implements OnInit {
  visitReservations: VisitReservation[] | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

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

  updateStatus(reservationId: number, status: number): void {
    this.roomErpService.updateVisitStatus(reservationId, status).subscribe({
      next: (response) => {
        alert('狀態更新成功');
        this.loadVisitReservations(); // 重新載入列表
        // 未來實裝第三方信箱通知
        // e.g., this.roomErpService.sendEmailNotification(reservationId);
      },
      error: (err) => {
        alert('狀態更新失敗');
      }
    });
  }
}
