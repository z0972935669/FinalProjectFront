import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Isuppliespurchasing } from '../../../../interfaces/supplies/isuppliespurchasing';
import { Isuppliescategory } from '../../../../interfaces/supplies/isuppliescategory';
import { Isuppliessupplier } from '../../../../interfaces/supplies/isuppliessupplier';
import { Isupplieslist } from '../../../../interfaces/supplies/isupplieslist';
import { Isuppliesdate } from '../../../../interfaces/supplies/isuppliesdate';
import { SuppliesPurchasingService } from '../../../../services/supplies/supplies-purchasing.service';
import { SuppliesCategoryService } from '../../../../services/supplies/supplies-category.service';
import { SuppliesDateService } from '../../../../services/supplies/supplies-date.service';
import { SuppliesListService } from '../../../../services/supplies/supplies-list.service';
import { SuppliesSupplierService } from '../../../../services/supplies/supplies-supplier.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-suppliespurchasinglist',
  imports: [RouterModule, FormsModule],
  standalone: true,
  templateUrl: './suppliespurchasinglist.component.html',
  styleUrl: './suppliespurchasinglist.component.scss'
})
export class SuppliespurchasinglistComponent {
  suppliesPurchasing: Isuppliespurchasing[] = [];
  categories: Isuppliescategory[] = [];
  suppliers: Isuppliessupplier[] = [];
  filteredSuppliers: Isuppliessupplier[] = []; // 新增單中用類別過濾供應商用
  suppliesProducts: Isupplieslist[] = [];
  filteredProducts: Isupplieslist[] = []; // 新增單中用供應商過濾物品用
  suppliesDate: Isuppliesdate[] = [];
  filteredDate: Isuppliesdate[] = []; // 新增單中用物品過濾有效期限用
  today!: string;
  selectedCategoryId: number | null = null;
  selectedSupplierId: number | null = null;

  searchKeyword: string = '';
  // 分頁
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalCount: number = 0;

  constructor(private suppliesPurchasingService: SuppliesPurchasingService,
    private suppliesCategoryService: SuppliesCategoryService, private suppliesSupplierService: SuppliesSupplierService, private suppliesListService: SuppliesListService, private suppliesDateService: SuppliesDateService, private http: HttpClient) { }

  ngOnInit(): void {
    // 抓銷貨單資料
    this.suppliesPurchasingService.getSuppliesPurchasingList().subscribe((data: Isuppliespurchasing[]) => {
      this.suppliesPurchasing = data;
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
    // 限制手動輸入的有效期限
    const now = new Date();
    this.today = now.toISOString().split('T')[0]; // 格式為 "YYYY-MM-DD"

    this.loadPurchasingOrders();
  }

  // 從後端載入分頁資料
  loadPurchasingOrders(page: number = 1) {
    this.currentPage = page;
    this.suppliesPurchasingService
      .searchPurchasingOrders(this.searchKeyword, this.currentPage, this.pageSize)
      .subscribe(res => {
        this.suppliesPurchasing = res.data;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
      });
  }


  // 查詢
  searchPurchasingOrders() {
    this.loadPurchasingOrders(1);
  }

  // 換頁
  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.loadPurchasingOrders(page);
  }

  // 動態頁碼
  getPageNumbers(): number[] {
    const pages: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, this.currentPage + 2);

    if (end - start < 4) {
      if (start === 1) end = Math.min(5, this.totalPages);
      else if (end === this.totalPages) start = Math.max(1, this.totalPages - 4);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  newPurchasing: Isuppliespurchasing = {
    suppliesPurchasingOrderId: 0,

    suppliesSupplierId: 0,

    arrivalDate: '',

    suppliesPurchasingOrderDetailId: 0,

    suppliesProductId: 0,

    quantityIn: 0,

    expiryDate: '',

    suppliesProductName: '',

    suppliesCategoryId: 0,

    suppliesCategoryName: '',

    suppliesSupplierName: ''
  }

  purchasingItems: any[] = [];

  addPurchasingItem() {
    this.purchasingItems.push({
      suppliesCategoryId: null,
      suppliesSupplierId: null,
      suppliesProductId: null,
      quantityOfPurchasing: null,
      filteredSuppliers: [],
      filteredProducts: [],
      expiryDate: null,
      manualExpiryInput: false
    });
  }

  removePurchasingItem(index: number) {
    this.purchasingItems.splice(index, 1);
    // 若全部移除，則初始化 Modal 狀態
    if (this.purchasingItems.length === 0) {
      this.resetAddPurchasingModal();
    }
  }

  resetAddPurchasingModal() {
    // 初始化 Modal 相關狀態
    this.purchasingItems = [];
  }

  submitAddPurchasing() {
    const today = new Date();

    const order = {
      suppliesSupplierId: this.selectedSupplierId,
      arrivalDate: this.today,
      details: this.purchasingItems.map(item => ({
        suppliesProductId: item.suppliesProductId,
        quantityIn: item.quantityOfPurchasing,
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString().split('T')[0]
          : null
      }))
    };

    this.suppliesPurchasingService.createPurchasingOrder(order).subscribe({
      next: res => {
        this.loadPurchasingOrders();
        Swal.fire({ title: '新增成功', icon: "success" });
      },
      error: err => {
        Swal.fire({ title: '新增失敗', icon: "error" });
      }
    });
    this.resetNewPurchasing();
    this.clearPurchasingItems();
  }

  resetNewPurchasing() {
    this.newPurchasing = {
      suppliesPurchasingOrderId: 0,

      suppliesSupplierId: 0,

      arrivalDate: '',

      suppliesPurchasingOrderDetailId: 0,

      suppliesProductId: 0,

      quantityIn: 0,

      expiryDate: '',

      suppliesProductName: '',

      suppliesCategoryId: 0,

      suppliesCategoryName: '',

      suppliesSupplierName: ''
    }
  }

  onCategoryChangeForOrder() {
    const selectedCategory = this.categories.find(c => c.suppliesCategoryId === this.selectedCategoryId);
    this.filteredSuppliers = this.suppliers.filter(supplier =>
      supplier.supplierKeyword === (selectedCategory ? selectedCategory.suppliesCategoryName : '')
    );
    this.selectedSupplierId = null;
  }

  onSupplierChangeForOrder() {
    console.log(this.selectedSupplierId);
    // 當選擇供應商時，更新所有 item 的可選物品
    this.purchasingItems.forEach(item => {
      item.filteredProducts = this.suppliesProducts.filter(p => p.supplierId === this.selectedSupplierId);
    });
  }

  onProductChangeForItem(index: number) {
    const item = this.purchasingItems[index];
    // 根據選到的物品過濾有效期限
    item.filteredDates = this.suppliesDate.filter(date =>
      date.suppliesProductId === item.suppliesProductId
    );
    // 清空有效期限選擇
    item.expiryDate = null;
    item.manualExpiryInput = false; // 每次換物品時，回到下拉模式
  }

  toggleExpiryInput(index: number) {
    const item = this.purchasingItems[index];
    item.manualExpiryInput = !item.manualExpiryInput;
    item.expiryDate = null; // 切換時清空輸入
  }

  clearPurchasingItems() {
    this.purchasingItems = [];
  }

  selectedPurchasingOrder: Isuppliespurchasing[] = [];
  showPurchasingDetail(order: Isuppliespurchasing) {
    this.selectedPurchasingOrder = this.suppliesPurchasing.filter(detail =>
      detail.suppliesPurchasingOrderId === order.suppliesPurchasingOrderId);
  }

  get uniquePurchasingOrders() {
    const map = new Map();
    this.suppliesPurchasing.forEach(order => {
      if (!map.has(order.suppliesPurchasingOrderId)) {
        map.set(order.suppliesPurchasingOrderId, order);
      }
    });
    return Array.from(map.values());
  }
}
