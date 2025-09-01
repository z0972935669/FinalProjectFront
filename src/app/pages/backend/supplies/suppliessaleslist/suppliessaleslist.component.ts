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

  // onCategoryChange(event: any) {
  //   const selected = this.categories.find(c => c.suppliesCategoryId === this.newSales.suppliesCategoryId);
  //   this.newSales.suppliesCategoryName = selected ? selected.suppliesCategoryName : '';

  //   // 根據選到的類別過濾供應商
  //   this.filteredSuppliers = this.suppliers.filter(supplier =>
  //     supplier.supplierKeyword === this.newSales.suppliesCategoryName
  //   );
  //   // 若沒有對應供應商則清空選擇
  //   this.newSales.suppliesSupplierId = 0;
  //   this.newSales.suppliesSupplierName = '';
  //   // 清空物品選擇
  //   this.filteredProducts = [];
  //   this.newSales.suppliesProductId = 0;
  //   this.newSales.suppliesProductName = '';
  // }

  // onSupplierChange(event: any) {
  //   const selected = this.suppliers.find(s => s.suppliesSupplierId === this.newSales.suppliesSupplierId);
  //   this.newSales.suppliesSupplierName = selected ? selected.suppliesSupplierName : '';

  //   // 根據選到的供應商過濾物品
  //   this.filteredProducts = this.suppliesProducts.filter(supplies =>
  //     supplies.supplierId === this.newSales.suppliesSupplierId
  //   );
  //   // 若沒有對應物品則清空選擇
  //   this.newSales.suppliesProductId = 0;
  //   this.newSales.suppliesProductName = '';
  // }

  // onSuppliesChange(event: any) {
  //   const selected = this.suppliesProducts.find(s => s.suppliesProductID === this.newSales.suppliesProductId);
  //   this.newSales.suppliesProductName = selected ? selected.suppliesProductName : '';
  // }
  // submitAddSales() {
  //   const today = new Date();
  //   // 組合主單資料
  //   const order = {
  //     suppliesSalesOrderId: 0,
  //     suppliesSalesOrderDetailId: 0,
  //     orderDate: today.toISOString().split('T')[0],
  //     customerName: this.newSales.customerName,
  //     receivedDate: today.toISOString().split('T')[0],
  //     orderStatus: '已到貨',
  //     details: this.salesItems.map(item => ({
  //       suppliesProductId: item.suppliesProductId,
  //       quantityOfSales: item.quantityOfSales,
  //       expiryDate: item.expiryDate,
  //       suppliesProductName: item.suppliesProductName,
  //       suppliesCategoryId: item.suppliesCategoryId,
  //       suppliesCategoryName: item.suppliesCategoryName,
  //       suppliesSupplierId: item.suppliesSupplierId,
  //       suppliesSupplierName: item.suppliesSupplierName
  //     }))
  //   };

  //   this.suppliesSalesService.addSuppliesSalesList(order).subscribe({
  //     next: (res) => {
  //       this.suppliesSalesService.getSuppliesSalesList().subscribe((data: Isuppliessales[]) => {
  //         this.suppliesSales = data;
  //         alert('新增成功');
  //       });
  //     },
  //     error: (err) => {
  //       alert('新增失敗');
  //     }
  //   });
  //   this.resetNewSales();
  //   this.clearSalesItems();
  // }
  submitAddSales() {
    const today = new Date();

    // 組合主單資料（符合 SuppliesSalesOrderDto）
    const order = {
      orderDate: today.toISOString(),  // ISO 格式，後端可直接綁到 DateTime?
      customerName: this.newSales.customerName,
      receivedDate: today.toISOString(),
      orderStatus: '已到貨',
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
        this.suppliesSalesService.getSuppliesSalesList().subscribe((data: Isuppliessales[]) => {
          this.suppliesSales = data;
          alert('新增成功');
        });
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
}
