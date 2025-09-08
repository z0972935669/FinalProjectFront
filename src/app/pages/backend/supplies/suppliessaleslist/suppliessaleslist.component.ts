import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Isuppliessales, CreateSalesOrderDto, CreateSalesOrderResponse } from '../../../../interfaces/supplies/isuppliessales';
import { SuppliesSalesService } from '../../../../services/supplies/supplies-sales.service';
import { FormsModule } from '@angular/forms';
import { Isuppliescategory } from '../../../../interfaces/supplies/isuppliescategory';
import { SuppliesCategoryService } from '../../../../services/supplies/supplies-category.service';
import { SuppliesSupplierService } from '../../../../services/supplies/supplies-supplier.service';
import { Isuppliessupplier } from '../../../../interfaces/supplies/isuppliessupplier';
import { SuppliesListService } from '../../../../services/supplies/supplies-list.service';
import { Isupplieslist } from '../../../../interfaces/supplies/isupplieslist';
import { SuppliesDateService } from '../../../../services/supplies/supplies-date.service';
import { Isuppliesdate } from '../../../../interfaces/supplies/isuppliesdate';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import * as signalR from '@microsoft/signalr';


@Component({
  selector: 'app-suppliessaleslist',
  imports: [RouterModule, FormsModule, HttpClientModule],
  standalone: true,
  templateUrl: './suppliessaleslist.component.html',
  styleUrl: './suppliessaleslist.component.scss'
})
export class SuppliessaleslistComponent implements OnInit, OnDestroy {
  suppliesSales: Isuppliessales[] = [];
  categories: Isuppliescategory[] = [];
  suppliers: Isuppliessupplier[] = [];
  filteredSuppliers: Isuppliessupplier[] = []; // 新增單中用類別過濾供應商用
  suppliesProducts: Isupplieslist[] = [];
  filteredProducts: Isupplieslist[] = []; // 新增單中用供應商過濾物品用
  suppliesDate: Isuppliesdate[] = [];
  filteredDate: Isuppliesdate[] = []; // 新增單中用物品過濾有效期限用
  searchKeyword: string = ''; // 查詢關鍵字用

  // 分頁用（不同 tab 各自獨立）
  pagination: any = {
    all: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
    received: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
    undelivered: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
    cancelled: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
  };

  private hubConnection!: signalR.HubConnection;

  constructor(private http: HttpClient,
    private suppliesSalesService: SuppliesSalesService,
    private suppliesCategoryService: SuppliesCategoryService, private suppliesSupplierService: SuppliesSupplierService, private suppliesListService: SuppliesListService, private suppliesDateService: SuppliesDateService) { }

  ngOnInit(): void {

    // 抓銷貨單資料
    this.suppliesSalesService.getSuppliesSalesList().subscribe((data: Isuppliessales[]) => {
      this.suppliesSales = data;
    })
    // 抓類別資料
    this.suppliesCategoryService.getSuppliesCategoryData().subscribe((data: Isuppliescategory[]) => {
      this.categories = data;
    })
    // 抓供應商資料
    this.suppliesSupplierService.getSuppliesSupplierData().subscribe((data: Isuppliessupplier[]) => {
      this.suppliers = data;
      this.filteredSuppliers = data; // 預設顯示全部
    })
    // 抓物料資料
    this.suppliesListService.getSuppliesData().subscribe((data: Isupplieslist[]) => {
      this.suppliesProducts = data;
    });
    // 抓物料時間
    this.suppliesDateService.getSuppliesDateData().subscribe((data: Isuppliesdate[]) => {
      this.suppliesDate = data;
    })
    this.loadSalesOrders('all');
    this.loadSalesOrders('received');
    this.loadSalesOrders('undelivered');
    this.loadSalesOrders('cancelled');

        this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7124/orderHub') // ⚠️ 上 ngrok 要換成 ngrok 網址
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR 已連線'))
      .catch(err => console.error('❌ SignalR 連線失敗:', err));

    this.hubConnection.on('OrderStatusChanged', (orderId: number, status: string) => {
      console.log(`📢 訂單 ${orderId} 狀態更新為 ${status}`);
      this.loadSalesOrders('all');
      this.loadSalesOrders('received');
      this.loadSalesOrders('undelivered');
      this.loadSalesOrders('cancelled');
    });

  }
  ngOnDestroy(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }



  // 抓後端資料（支援分頁）
  loadSalesOrders(status: string = 'all') {
    const p = this.pagination[status];
    this.suppliesSalesService.getSuppliesSalesList(this.searchKeyword, p.currentPage, p.pageSize, status === 'all' ? '' : this.mapStatus(status))
      .subscribe(res => {
        p.data = res.data;
        p.totalCount = res.totalCount;
        p.totalPages = res.totalPages;
      });
  }

  // 將 tab 名稱對應到訂單狀態
  mapStatus(tab: string): string {
    switch (tab) {
      case 'received': return '已到貨';
      case 'undelivered': return '未到貨';
      case 'cancelled': return '已取消';
      default: return '';
    }
  }

  // 查詢關鍵字
  searchSalesOrders(tab: string = 'all') {
    this.pagination[tab].currentPage = 1; // 查詢時回到該 tab 的第一頁
    this.loadSalesOrders(tab);
  }

  // 換頁（指定 tab）
  changePage(tab: string, page: number) {
    const p = this.pagination[tab];
    if (page < 1 || page > p.totalPages) return;
    p.currentPage = page;
    this.loadSalesOrders(tab);
  }
  // 動態頁碼（最多顯示 5 頁）
  getPageNumbers(tab: string): number[] {
    const p = this.pagination[tab];
    const pages: number[] = [];
    let start = Math.max(1, p.currentPage - 2);
    let end = Math.min(p.totalPages, p.currentPage + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(5, p.totalPages);
      } else if (end === p.totalPages) {
        start = Math.max(1, p.totalPages - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }


  newSales: Isuppliessales = {
    suppliesSalesOrderId: 0,

    orderDate: '',

    customerName: '',

    receivedDate: '',

    orderStatus: '',

    suppliesSalesOrderDetailId: 0,

    suppliesProductId: 0,

    quantityOfSales: 0,

    expiryDate: '',

    suppliesProductName: '',

    suppliesCategoryId: 0,

    suppliesCategoryName: '',

    suppliesSupplierId: 0,

    suppliesSupplierName: ''
  }

  salesItems: any[] = [];

  addSalesItem() {
    this.salesItems.push({
      suppliesCategoryId: null,
      suppliesSupplierId: null,
      suppliesProductId: null,
      quantityOfSales: null,
      filteredSuppliers: [],
      filteredProducts: []
    });
  }

  removeSalesItem(index: number) {
    this.salesItems.splice(index, 1);
    // 若全部移除，則初始化 Modal 狀態
    if (this.salesItems.length === 0) {
      this.resetAddSalesModal();
    }
  }

  resetAddSalesModal() {
    // 初始化 Modal 相關狀態
    this.salesItems = [];
    // 可加上其他欄位初始化
    // 例如：this.addSalesModal?.resetForm();
    // 或清空錯誤訊息、選單等
  }

  submitAddSales() {
    const today = new Date();

    // 組合主單資料（符合 SuppliesSalesOrderDto）
    const order: CreateSalesOrderDto = {
      orderDate: today.toISOString(),  // ISO 格式，後端可直接綁到 DateTime?
      customerName: this.newSales.customerName || null,
      receivedDate: today.toISOString(),
      orderStatus: '未到貨',
      details: this.salesItems.map(item => ({
        suppliesProductId: item.suppliesProductId,
        quantityOfSales: item.quantityOfSales,
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString()  // 確保是 ISO 格式
          : null
      }))
    };

    this.suppliesSalesService.addSuppliesSalesList(order).subscribe({
      next: (res: CreateSalesOrderResponse) => {
        this.loadSalesOrders();
        Swal.fire({ title: '新增成功，條碼已生成！', icon: "success" });

        // 顯示條碼
        if (res.qrcodeUrl) {
          window.open(`https://localhost:7124${res.qrcodeUrl}`, '_blank');
        }
      },
      error: err => {
        Swal.fire({ title: '新增失敗', icon: "error" });
      }
    });
    this.resetNewSales();
    this.clearSalesItems();
  }

  resetNewSales() {
    this.newSales = {
      suppliesSalesOrderId: 0,

      orderDate: '',

      customerName: '',

      receivedDate: '',

      orderStatus: '',

      suppliesSalesOrderDetailId: 0,

      suppliesProductId: 0,

      quantityOfSales: 0,

      expiryDate: '',

      suppliesProductName: ''
    }
  }

  onCategoryChangeForItem(index: number) {
    const item = this.salesItems[index];
    // 根據選到的類別過濾供應商
    item.filteredSuppliers = this.suppliers.filter(supplier =>
      supplier.supplierKeyword === this.categories.find(c => c.suppliesCategoryId === item.suppliesCategoryId)?.suppliesCategoryName
    );
    // 清空供應商與物品選擇
    item.suppliesSupplierId = null;
    item.suppliesProductId = null;
    item.filteredProducts = [];
    item.expiryDate = [];
  }

  onSupplierChangeForItem(index: number) {
    const item = this.salesItems[index];
    // 根據選到的供應商過濾物品
    item.filteredProducts = this.suppliesProducts.filter(product =>
      product.supplierId === item.suppliesSupplierId
    );
    // 清空物品選擇
    item.suppliesProductId = null;
    item.expiryDate = [];
  }

  onProductChangeForItem(index: number) {
    const item = this.salesItems[index];
    // 根據選到的物品過濾有效期限
    item.filteredDates = this.suppliesDate.filter(date =>
      date.suppliesProductId === item.suppliesProductId
    );
    // 清空有效期限選擇
    item.expiryDate = null;
  }

  clearSalesItems() {
    this.salesItems = [];
  }

  selectedSalesOrder: Isuppliessales[] = [];
  showSalesDetail(order: Isuppliessales) {
    // 把四個 tab 的資料合併
    let allOrders: Isuppliessales[] = [];
    Object.keys(this.pagination).forEach(tab => {
      allOrders = allOrders.concat(this.pagination[tab].data);
    });

    // 過濾出同一張訂單的所有明細
    let details = allOrders.filter(detail =>
      detail.suppliesSalesOrderId === order.suppliesSalesOrderId
    );

    // 去掉重複的項目（依照 suppliesSalesOrderDetailId 唯一化）
    const uniqueDetailsMap = new Map<number, Isuppliessales>();
    details.forEach(d => {
      uniqueDetailsMap.set(d.suppliesSalesOrderDetailId, d);
    });

    this.selectedSalesOrder = Array.from(uniqueDetailsMap.values());
  }

  // 確認銷貨單在改變狀態後就不能變動
  canUpdateStatus(): boolean {
    if (!this.selectedSalesOrder || this.selectedSalesOrder.length === 0) return false;
    const status = this.selectedSalesOrder[0].orderStatus;
    return status !== '已到貨' && status !== '已取消';
  }

  // 確認與呼叫更新
  confirmUpdateOrderStatus(status: '已取消' | '已到貨') {
    const orderId = this.selectedSalesOrder[0]?.suppliesSalesOrderId;
    if (!orderId) return;

    const message = status === '已取消'
      ? '確定要取消此單嗎？'
      : '確定要將此單標記為已到貨嗎？';

    if (confirm(message)) {
      this.suppliesSalesService.updateOrderStatus(orderId, status).subscribe({
        next: () => {
          // 更新四個 tab 的分頁資料
          Object.keys(this.pagination).forEach(tab => {
            const orders = this.pagination[tab].data;
            const order = orders.find((o: any) => o.suppliesSalesOrderId === orderId);
            if (order) {
              order.orderStatus = status;
            }
          });

          Swal.fire({ title: '更新成功！', icon: "success" });

          // 重新載入確保資料正確
          this.loadSalesOrders('all');
          this.loadSalesOrders('received');
          this.loadSalesOrders('undelivered');
          this.loadSalesOrders('cancelled');
        },
        error: err => {
          console.error(err);
          Swal.fire({ title: '更新失敗', icon: "error" });
        }
      });
    }
  }
}
