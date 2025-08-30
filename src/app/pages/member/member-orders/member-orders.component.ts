import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  MemberService,
  MemberInfo,
} from '../../../services/member/member.service';

// ===== 後端 DTO 對應（查詢用） =====
interface OrderListItemDto {
  orderId: number;
  orderNo: string;
  orderTime: string; // ISO string from API
  totalAmount: number;
  status: string;
}

interface OrderDetailViewDto {
  detailId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderViewDto {
  orderId: number;
  orderNo: string;
  orderTime: string;

  buyerName?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;

  paymentMethod?: string | null;
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;

  invoiceTitle?: string | null;
  invoiceTax?: string | null;
  invoiceInMethod?: string | null;
  carrierNumber?: string | null;

  note?: string | null;
  status?: string | null;
  totalAmount: number;

  details: OrderDetailViewDto[];
}

interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
}

@Component({
  selector: 'app-member-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [DatePipe],
  templateUrl: './member-orders.component.html',
  styleUrls: ['./member-orders.component.scss'],
})
export class MemberOrdersComponent {
  private http = inject(HttpClient);
  private memberSvc = inject(MemberService);
  private apiBase = 'https://localhost:7124/api/ShopOrders';

  // 使用者輸入
  keyword = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  // 使用者資訊
  memberId = signal<number | null>(null);
  loadError = signal<string | null>(null);

  // 清單（伺服器分頁）
  orders = signal<OrderListItemDto[]>([]);
  totalPages = signal(0);
  totalCount = signal(0);
  isLoadingList = signal(false);

  // 明細快取（以 orderNo 為 key）
  detailsMap = signal<Record<string, OrderViewDto | undefined>>({});
  isLoadingDetail = signal<string | null>(null); // 存現在載入中的 orderNo

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    // 取得登入會員
    this.memberSvc.getMemberInfo().subscribe({
      next: (me: MemberInfo) => {
        this.memberId.set(me.memberId);
        this.fetchOrders(); // 取得清單
      },
      error: (err) => {
        console.error('無法取得登入者資料', err);
        this.loadError.set('請先登入後再檢視訂單');
      },
    });
  }

  paymentMethodMap: Record<string, string> = {
    Credit: '信用卡',
    ATM: 'ATM 轉帳',
    CVS: '超商代碼繳費',
    COD: '貨到付款',
  };

  // 安全轉換，如果資料庫有奇怪的值，就直接顯示原本的字串
  translatePaymentMethod(method: string | null | undefined): string {
    if (!method) return '';
    return this.paymentMethodMap[method] ?? method;
  }

  // 配送方式對照表
  deliveryMethodMap: Record<string, string> = {
    CVS_711_COD: '7-11 取貨付款',
    CVS_FAMI_COD: '全家 取貨付款',
    HOME_BlackCat_COD: '黑貓宅急便 貨到付款',

    CVS_711: '7-11 超商取貨',
    CVS_FAMI: '全家 超商取貨',
    CVS_OK: 'OK 超商取貨',
    CVS_HILIFE: '萊爾富 超商取貨',
    HOME_BlackCat: '黑貓宅急便',
  };

  // 安全轉換（查不到就顯示原值）
  // 配送方式中文：依付款方式區分
  private deliveryLabelMap: {
    nonCOD: Record<string, string>;
    COD: Record<string, string>;
  } = {
    nonCOD: {
      CVS_711: '7-11 超商取貨',
      CVS_FAMI: '全家 超商取貨',
      CVS_OK: 'OK 超商取貨',
      CVS_HILIFE: '萊爾富 超商取貨',
      HOME_BlackCat: '黑貓宅急便',
    },
    COD: {
      CVS_711_COD: '7-11 取貨付款',
      CVS_FAMI_COD: '全家 取貨付款',
      HOME_BlackCat_COD: '黑貓宅急便 貨到付款',
    },
  };

  // 轉中文（可只給 deliveryMethod，也可同時給 paymentMethod 讓它更精準）
  translateDeliveryMethod(
    method: string | null | undefined,
    paymentMethod?: string | null | undefined
  ): string {
    if (!method) return '';
    const isCOD =
      (paymentMethod ?? '').toUpperCase() === 'COD' || method.endsWith('_COD');

    const map = isCOD
      ? this.deliveryLabelMap.COD
      : this.deliveryLabelMap.nonCOD;

    // 先用挑到的表；若沒對應，再嘗試另一表；最後回傳原字串
    return (
      map[method] ??
      this.deliveryLabelMap.COD[method] ??
      this.deliveryLabelMap.nonCOD[method] ??
      method
    );
  }

  // 查詢清單（伺服器分頁＋關鍵字）
  fetchOrders(): void {
    const mid = this.memberId();
    if (!mid) return;

    this.isLoadingList.set(true);
    const params = new URLSearchParams({
      page: this.currentPage().toString(),
      pageSize: this.pageSize().toString(),
    });
    const kw = this.keyword().trim();
    if (kw) params.set('keyword', kw);

    this.http
      .get<PagedResult<OrderListItemDto>>(
        `${this.apiBase}/member/${mid}?${params.toString()}`
      )
      .subscribe({
        next: (res) => {
          this.orders.set(res.items ?? []);
          this.totalPages.set(res.totalPages ?? 0);
          this.totalCount.set(res.totalCount ?? 0);
          this.isLoadingList.set(false);
        },
        error: (err) => {
          console.error('載入訂單清單失敗', err);
          this.isLoadingList.set(false);
          this.loadError.set('載入訂單清單失敗');
        },
      });
  }

  // 變更關鍵字
  setKeyword(value: string) {
    this.keyword.set(value);
    this.currentPage.set(1);
    this.fetchOrders();
  }

  // 查詢按鈕
  search() {
    this.currentPage.set(1);
    this.fetchOrders();
  }

  // 換頁
  setPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.fetchOrders();
  }

  // 產生頁碼陣列
  getPageNumbers = computed(() => {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) pages.push(i);
    return pages;
  });

  // 打開 Modal 前載入明細（若尚未載入）
  openModal(order: OrderListItemDto) {
    if (!this.memberId()) return;
    const key = order.orderNo;
    const cache = this.detailsMap()[key];
    if (cache) return; // 已載入

    this.isLoadingDetail.set(key);
    this.http
      .get<OrderViewDto>(
        `${this.apiBase}/member/${this.memberId()}/${order.orderId}`
      )
      .subscribe({
        next: (res) => {
          this.detailsMap.set({ ...this.detailsMap(), [key]: res });
          this.isLoadingDetail.set(null);
        },
        error: (err) => {
          console.error('載入訂單明細失敗', err);
          this.isLoadingDetail.set(null);
        },
      });
  }

  // 取得 modal 要用的明細資料
  getDetail(orderNo: string): OrderViewDto | undefined {
    return this.detailsMap()[orderNo];
  }

  // 前端顯示用：格式化成 datetime-local
  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toISOString().slice(0, 16);
  }

  // ===== 小計 / 運費 / 總金額（和 cart/checkout 一樣的思路） =====

  /** 訂單明細小計合計 */
  subtotalOf(detail?: OrderViewDto): number {
    if (!detail) return 0;
    let sum = 0;
    for (const item of detail.details) sum += item.subtotal;
    return sum;
  }

  /**
   * 運費：用總金額 - 小計推算（最低 0）
   * 若未來你要固定 60，這裡可改：return 60;
   */
  shippingOf(detail?: OrderViewDto): number {
    if (!detail) return 0;
    const subtotal = this.subtotalOf(detail);
    const total = detail.totalAmount ?? 0;
    return Math.max(0, total - subtotal);
  }

  /** 總金額：小計 + 運費（理論上等於 detail.totalAmount） */
  totalOf(detail?: OrderViewDto): number {
    if (!detail) return 0;
    return this.subtotalOf(detail) + this.shippingOf(detail);
  }

  // 舊方法（可保留給相容的模板呼叫）
  getOrderTotal(detail?: OrderViewDto): number {
    return this.subtotalOf(detail);
  }
}
