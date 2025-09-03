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
      filteredProducts: []
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
    // 可加上其他欄位初始化
    // 例如：this.addpurchasingModal?.resetForm();
    // 或清空錯誤訊息、選單等
  }

  // onCategoryChange(event: any) {
  //   const selected = this.categories.find(c => c.suppliesCategoryId === this.newPurchasing.suppliesCategoryId);
  //   this.newPurchasing.suppliesCategoryName = selected ? selected.suppliesCategoryName : '';

  //   // 根據選到的類別過濾供應商
  //   this.filteredSuppliers = this.suppliers.filter(supplier =>
  //     supplier.supplierKeyword === this.newPurchasing.suppliesCategoryName
  //   );
  //   // 若沒有對應供應商則清空選擇
  //   this.newPurchasing.suppliesSupplierId = 0;
  //   this.newPurchasing.suppliesSupplierName = '';
  //   // 清空物品選擇
  //   this.filteredProducts = [];
  //   this.newPurchasing.suppliesProductId = 0;
  //   this.newPurchasing.suppliesProductName = '';
  // }

  // onSupplierChange(event: any) {
  //   console.log("選到的供應商 ID:", this.newPurchasing.suppliesSupplierId);
  //   const selected = this.suppliers.find(s => s.suppliesSupplierId === this.newPurchasing.suppliesSupplierId);
  //   this.newPurchasing.suppliesSupplierName = selected ? selected.suppliesSupplierName : '';

  //   // 根據選到的供應商過濾物品
  //   this.filteredProducts = this.suppliesProducts.filter(supplies =>
  //     supplies.supplierId === this.newPurchasing.suppliesSupplierId
  //   );
  //   // 若沒有對應物品則清空選擇
  //   this.newPurchasing.suppliesProductId = 0;
  //   this.newPurchasing.suppliesProductName = '';
  // }

  // onSuppliesChange(event: any) {
  //   const selected = this.suppliesProducts.find(s => s.suppliesProductID === this.newPurchasing.suppliesProductId);
  //   this.newPurchasing.suppliesProductName = selected ? selected.suppliesProductName : '';
  // }
  submitAddPurchasing() {
    const today = new Date();

    // 組合主單資料（符合 SuppliesPurchasingOrderDto）
    // const order = {
    //   suppliesSupplierId: this.purchasingItems[0].suppliesSupplierId,
    //   arrivalDate: this.today, // 或今天日期
    //   details: this.purchasingItems.map(item => ({
    //     suppliesProductId: item.suppliesProductId,
    //     quantityIn: item.quantityOfPurchasing,   // 改成 quantityIn
    //     expiryDate: item.expiryDate
    //       ? new Date(item.expiryDate).toISOString().split('T')[0] // 後端 DateOnly，送 yyyy-MM-dd
    //       : null
    //   }))
    // };
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

    console.log("送出的 order 物件：", order);

    this.http.post('https://localhost:7124/api/SuppliesPurchasing/CreatePurchasingOrder', order, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: res => {
        this.suppliesPurchasingService.getSuppliesPurchasingList().subscribe((data: Isuppliespurchasing[]) => {
          this.suppliesPurchasing = data;
          alert('新增成功');
        });
      },
      error: err => {
        alert('新增失敗');
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

  // onCategoryChangeForItem(index: number) {
  //   const item = this.purchasingItems[index];
  //   // 根據選到的類別過濾供應商
  //   item.filteredSuppliers = this.suppliers.filter(supplier =>
  //     supplier.supplierKeyword === this.categories.find(c => c.suppliesCategoryId === item.suppliesCategoryId)?.suppliesCategoryName
  //   );
  //   // 清空供應商與物品選擇
  //   item.suppliesSupplierId = null;
  //   item.suppliesProductId = null;
  //   item.filteredProducts = [];
  //   item.expiryDate = [];
  // }

  // onSupplierChangeForItem(index: number) {
  //   console.log("選到的供應商 ID:", this.newPurchasing.suppliesSupplierId);
  //   const item = this.purchasingItems[index];
  //   // 根據選到的供應商過濾物品
  //   item.filteredProducts = this.suppliesProducts.filter(product =>
  //     product.supplierId === item.suppliesSupplierId
  //   );
  //   // 清空物品選擇
  //   item.suppliesProductId = null;
  //   item.expiryDate = [];
  // }
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
