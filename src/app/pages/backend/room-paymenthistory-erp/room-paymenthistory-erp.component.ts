import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomErpService } from '../../../services/room/room-erp.service';
import { PaymentHistoryDto } from '../../../interfaces/room/roomerp.interface';

@Component({
  selector: 'app-room-paymenthistory-erp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-paymenthistory-erp.component.html',
  styleUrl: './room-paymenthistory-erp.component.scss',
})
export class RoomPaymenthistoryErpComponent implements OnInit {
  paymentHistories: PaymentHistoryDto[] = [];
  selectedHistory: PaymentHistoryDto | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private roomErpService: RoomErpService) { }

  ngOnInit(): void {
    this.loadPaymentHistory();
  }

  loadPaymentHistory(): void {
    this.isLoading = true;
    this.roomErpService.getPaymentHistory().subscribe({
      next: (response) => {
        this.paymentHistories = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = '無法載入繳費紀錄';
        this.isLoading = false;
      }
    });
  }

  viewDetails(history: PaymentHistoryDto): void {
    this.selectedHistory = history;
  }
}
