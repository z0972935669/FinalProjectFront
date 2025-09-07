import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomErpService } from '../../../services/room/room-erp.service';
import { PaymentHistoryDto, PaymentHistory } from '../../../interfaces/room/roomerp.interface';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2'; // 引入 SweetAlert2
import { FormsModule } from '@angular/forms'; // 導入 FormsModule

@Component({
  selector: 'app-room-paymenthistory-erp',
  standalone: true,
  imports: [CommonModule, NgxSonnerToaster, FormsModule],
  templateUrl: './room-paymenthistory-erp.component.html',
  styleUrl: './room-paymenthistory-erp.component.scss',
})
export class RoomPaymenthistoryErpComponent implements OnInit {
  paymentHistories: PaymentHistoryDto[] = [];
  filteredPaymentHistories: PaymentHistoryDto[] = [];
  selectedHistory: PaymentHistoryDto | null = null;
  orderDetails: PaymentHistory[] = [];
  showOrderDetails: boolean = false;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  filterOption: string = '全部';

  constructor(private roomErpService: RoomErpService) { }

  ngOnInit(): void {
    this.loadPaymentHistory();
  }

  loadPaymentHistory(): void {
    this.isLoading = true;
    this.roomErpService.getPaymentHistory().subscribe({
      next: (response) => {
        console.log('接收到的繳費紀錄數據:', response);
        this.paymentHistories = response.map(history => ({
          ...history,
          dueDate: this.calculateDueDate(history.billingDate) // 計算本次繳費時間
        } as PaymentHistoryDto));
        this.applyFilter();
        this.isLoading = false;
        if (response.length === 0) {
          toast.info('無繳費紀錄數據');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = `無法載入繳費紀錄: ${err.message || '未知錯誤'} (Status: ${err.status})`;
        toast.error(this.errorMessage);
        this.isLoading = false;
      },
    });
  }

  viewDetails(history: PaymentHistoryDto): void {
    this.selectedHistory = history;
  }

  viewOrderDetails(occupancyId: number): void {
    const history = this.filteredPaymentHistories.find(h => h.occupancyId === occupancyId);
    if (!history) {
      toast.error('無法找到該入住記錄');
      return;
    }

    Swal.fire({
      title: '訂單明細',
      html: this.generateOrderDetailsTable(history),
      icon: 'info',
      confirmButtonText: '關閉',
      showCloseButton: true,
      customClass: { popup: 'animated fadeInDown' }
    }).then((result) => {
      if (result.isConfirmed) this.showOrderDetails = false;
    });

    console.log(`billingStatus for occupancyId ${occupancyId}:`, history.billingStatus);
  }

  applyFilter(): void {
    if (this.filterOption === '全部') {
      this.filteredPaymentHistories = [...this.paymentHistories];
    } else if (this.filterOption === '付款') {
      this.filteredPaymentHistories = this.paymentHistories.filter(h => h.billingStatus === true);
    } else if (this.filterOption === '未付款') {
      this.filteredPaymentHistories = this.paymentHistories.filter(h => h.billingStatus === false);
    }
  }

  notifyPaymentReminder(occupancyId: number): void {
    const history = this.filteredPaymentHistories.find(h => h.occupancyId === occupancyId);
    if (!history) {
      toast.error('無法找到該入住記錄');
      return;
    }

    Swal.fire({
      title: '確認催繳',
      text: '確認要催繳？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      customClass: { popup: 'animated fadeInDown' }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success(`已發送催繳通知給入住編號 ${occupancyId}`);
        console.log(`Sent payment reminder for occupancyId ${occupancyId}`);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        toast.info('已取消催繳通知');
      }
    });
  }

  // 計算本次繳費時間（加 30 天，使用本地時間）
  private calculateDueDate(billingDate: string): string {
    if (!billingDate || billingDate === '無') return '無';
    const date = new Date(billingDate);
    date.setDate(date.getDate() + 30); // 加 30 天
    return date.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }); // 使用 CST 本地時間
  }

  // 檢查是否超過繳費時間
  public isOverdue(dueDate: string | undefined): boolean { // 接受 string | undefined
    if (!dueDate || dueDate === '無') return false; // 如果無效或為 '無'，返回 false
    const due = new Date(dueDate);
    const now = new Date(); // 當前本地時間
    return now > due; // 如果當前時間超過繳費時間，返回 true
  }

  // 生成訂單明細表格的 HTML
  private generateOrderDetailsTable(history: PaymentHistoryDto): string {
    let tableHtml = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>支付編號</th>
            <th>金額</th>
            <th>繳費日期</th>
            <th>付款方式</th>
            <th>付款狀態</th>
            <th>Paypal訂單ID</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (history.paymentHistory && history.paymentHistory.length > 0) {
      history.paymentHistory.forEach(detail => {
        tableHtml += `
          <tr>
            <td>${detail.fPaymentId || 'N/A'}</td>
            <td>${detail.fBillingAmount || 'N/A'}</td>
            <td>${detail.fBillingDate ? new Date(detail.fBillingDate).toLocaleDateString() : '無'}</td>
            <td>${detail.fPaymentMethod || '未知'}</td>
            <td>${detail.fBillingStatus ? '已付款' : '未付款'}</td>
            <td>${detail.fPaypalOrderId || '無'}</td>
          </tr>
        `;
      });
    } else {
      tableHtml += `
        <tr>
          <td colspan="6">無訂單明細記錄</td>
        </tr>
      `;
    }

    tableHtml += `
        </tbody>
      </table>
      <p><strong>入住編號:</strong> ${history.occupancyId}</p>
      <p><strong>整體付款狀態:</strong> ${history.billingStatus ? '已付款' : '未付款'}</p>
    `;

    return tableHtml;
  }
}
