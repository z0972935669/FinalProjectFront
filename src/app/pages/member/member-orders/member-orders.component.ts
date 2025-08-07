import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  ordernumber: string;

  orderTime: string;
  customerPhone: string;
  deliveryWay: string;
  orderman: string;
  receiver: string;
  payWay: string;
  address: string;
  invoiceTitle: string;
  invoiceWay: string;
  invoiceCarrier: string;
  notes: string;
  orderStatus: string;
  orderItems: OrderItem[];
}

@Component({
  selector: 'app-member-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './member-orders.component.html',
  styleUrls: ['./member-orders.component.scss'],
})
export class MemberOrdersComponent {
  orders = signal<Order[]>([
    {
      ordernumber: 'ORD-20250806-0001',

      orderTime: '2025-06-01T10:00:00',
      customerPhone: '0912345678',
      deliveryWay: '宅配',
      orderman: '張三',
      receiver: '李四',
      payWay: '信用卡',
      address: '台北市中正區忠孝東路一段100號',
      invoiceTitle: '張三公司',
      invoiceWay: '電子發票',
      invoiceCarrier: '/ABCD1234',
      notes: '請儘速送達',
      orderStatus: '處理中',
      orderItems: [
        { productName: '蘋果', quantity: 2, unitPrice: 30 },
        { productName: '香蕉', quantity: 1, unitPrice: 20 }
      ]
    },
    {
      ordernumber: 'ORD-20250806-0002',

      orderTime: '2025-06-01T11:00:00',
      customerPhone: '0987654321',
      deliveryWay: '超商取貨',
      orderman: '春嬌',
      receiver: '志明',
      payWay: '貨到付款',
      address: '台中市西區民生路200號',
      invoiceTitle: '春嬌個人',
      invoiceWay: '紙本發票',
      invoiceCarrier: '',
      notes: '下午送達',
      orderStatus: '已完成',
      orderItems: [
        { productName: '鳳梨', quantity: 3, unitPrice: 50 }
      ]
    },
    {
      ordernumber: 'ORD-20250806-0003',

      orderTime: '2025-06-01T12:00:00',
      customerPhone: '0923456789',
      deliveryWay: '宅配',
      orderman: '王五',
      receiver: '王五',
      payWay: '銀行轉帳',
      address: '高雄市前鎮區中山路300號',
      invoiceTitle: '王五企業',
      invoiceWay: '電子發票',
      invoiceCarrier: '/EFGH5678',
      notes: '無特殊要求',
      orderStatus: '待付款',
      orderItems: [
        { productName: '蘋果', quantity: 1, unitPrice: 30 },
        { productName: '香蕉', quantity: 2, unitPrice: 20 },
        { productName: '葡萄', quantity: 1, unitPrice: 100 }
      ]
    }
  ]);

  keyword = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  constructor(private datePipe: DatePipe) {}

  setKeyword(value: string) {
    this.keyword.set(value);
    this.currentPage.set(1);
  }

  search() {
    this.currentPage.set(1);
  }

  filteredOrders = computed(() => {
    const kw = this.keyword().toLowerCase().trim();
    return this.orders().filter(
      (o) =>
        o.ordernumber.toLowerCase().includes(kw)
    );
  });

  pagedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredOrders().slice(start, start + this.pageSize());
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredOrders().length / this.pageSize())
  );

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers = computed(() => {
    const pages = [];
    for (let i = 0; i < this.totalPages(); i++) {
      pages.push(i + 1);
    }
    return pages;
  });

  // 格式化日期時間為 datetime-local 格式
  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toISOString().slice(0, 16);
  }

  // 計算訂單總金額
  getOrderTotal(order: Order): number {
    return order.orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
}
