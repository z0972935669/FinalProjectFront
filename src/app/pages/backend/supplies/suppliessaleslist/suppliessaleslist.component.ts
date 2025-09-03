import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Isuppliessales } from '../../../../interfaces/supplies/isuppliessales';
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


@Component({
  selector: 'app-suppliessaleslist',
  imports: [RouterModule, FormsModule, HttpClientModule],
  standalone: true,
  templateUrl: './suppliessaleslist.component.html',
  styleUrl: './suppliessaleslist.component.scss'
})
export class SuppliessaleslistComponent {
  suppliesSales: Isuppliessales[] = [];
  categories: Isuppliescategory[] = [];
  suppliers: Isuppliessupplier[] = [];
  filteredSuppliers: Isuppliessupplier[] = []; // 新增單中用類別過濾供應商用
  suppliesProducts: Isupplieslist[] = [];
  filteredProducts: Isupplieslist[] = []; // 新增單中用供應商過濾物品用
  suppliesDate: Isuppliesdate[] = [];
  filteredDate: Isuppliesdate[] = []; // 新增單中用物品過濾有效期限用
  searchKeyword: string = ''; // 查詢關鍵字用

  // 分頁用屬性
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalCount: number = 0;


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
    this.loadSalesOrders();
  }

  // 抓後端資料（支援分頁）
  loadSalesOrders() {
    this.suppliesSalesService.getSuppliesSalesList(this.searchKeyword, this.currentPage, this.pageSize)
      .subscribe(res => {
        this.suppliesSales = res.data;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
      });
  }

  // 查詢關鍵字
  searchSalesOrders() {
    this.currentPage = 1; // 查詢時回到第一頁
    this.loadSalesOrders();
  }

  // 換頁
  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadSalesOrders();
  }

  // 動態頁碼（最多顯示 5 頁）
  getPageNumbers(): number[] {
    const pages: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, this.currentPage + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(5, this.totalPages);
      } else if (end === this.totalPages) {
        start = Math.max(1, this.totalPages - 4);
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
    const order = {
      orderDate: today.toISOString(),  // ISO 格式，後端可直接綁到 DateTime?
      customerName: this.newSales.customerName,
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

    this.http.post('https://localhost:7124/api/SuppliesSalesOrders', order, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: res => {
        this.loadSalesOrders();
        alert('新增成功');
      },
      error: err => {
        alert('新增失敗');
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
    this.selectedSalesOrder = this.suppliesSales.filter(detail =>
      detail.suppliesSalesOrderId === order.suppliesSalesOrderId);
  }

  get uniqueSalesOrders() {
    const map = new Map();
    this.suppliesSales.forEach(order => {
      if (!map.has(order.suppliesSalesOrderId)) {
        map.set(order.suppliesSalesOrderId, order);
      }
    });
    return Array.from(map.values());
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
          // 更新前端資料
          const order = this.uniqueSalesOrders.find(o => o.suppliesSalesOrderId === orderId);
          if (order) {
            order.orderStatus = status;
          }
          alert('更新成功！');
          this.loadSalesOrders();
        },
        error: err => {
          console.error(err);
          alert('更新失敗！');
        }
      });
    }
  }
}
