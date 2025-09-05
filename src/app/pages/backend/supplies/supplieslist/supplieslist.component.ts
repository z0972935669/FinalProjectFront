import { distinctUntilChanged } from 'rxjs';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SuppliesListService } from '../../../../services/supplies/supplies-list.service';
import { Isupplieslist } from '../../../../interfaces/supplies/isupplieslist';
import { FormsModule } from '@angular/forms';
import { Isuppliessupplier } from '../../../../interfaces/supplies/isuppliessupplier';
import { SuppliesSupplierService } from '../../../../services/supplies/supplies-supplier.service';
import { Isuppliescategory } from '../../../../interfaces/supplies/isuppliescategory';
import { SuppliesCategoryService } from '../../../../services/supplies/supplies-category.service';
import { Isuppliesdate } from '../../../../interfaces/supplies/isuppliesdate';
import { SuppliesDateService } from '../../../../services/supplies/supplies-date.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-supplieslist',
  imports: [RouterModule, FormsModule],
  standalone: true,
  templateUrl: './supplieslist.component.html',
  styleUrl: './supplieslist.component.scss'
})
export class SupplieslistComponent {
  suppliesProducts: Isupplieslist[] = [];
  suppliesDate: Isuppliesdate[] = [];
  suppliers: Isuppliessupplier[] = [];
  categories: Isuppliescategory[] = [];

  // 查詢關鍵字
  searchKeyword: string = '';

  // 分頁參數
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalCount: number = 0;

  constructor(private suppliesListService: SuppliesListService, private suppliesSupplierService: SuppliesSupplierService, private suppliesCategoryService: SuppliesCategoryService, private suppliesDateService: SuppliesDateService, private router: Router) { }

  ngOnInit(): void {
    // 抓物料資料
    this.suppliesListService.getSuppliesData().subscribe((data: Isupplieslist[]) => {
      this.suppliesProducts = data; // 初始顯示全部
    });
    // 抓供應商資料
    this.suppliesSupplierService.getSuppliesSupplierData().subscribe((data: Isuppliessupplier[]) => {
      this.suppliers = data;
    })
    // 抓類別資料
    this.suppliesCategoryService.getSuppliesCategoryData().subscribe((data: Isuppliescategory[]) => {
      this.categories = data;
    })
    // 抓物料時間
    this.suppliesDateService.getSuppliesDateData().subscribe((data: Isuppliesdate[]) => {
      this.suppliesDate = data;
    })

    this.loadProducts();
  }

  // 從後端載入分頁資料
  loadProducts(page: number = 1) {
    this.currentPage = page;
    this.suppliesListService.searchProducts(this.searchKeyword, this.currentPage, this.pageSize)
      .subscribe(res => {
        this.suppliesProducts = res.data;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
      });
  }

  // 查詢
  searchProducts() {
    this.loadProducts(1); // 查詢時回到第一頁
  }

  // 換頁
  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.loadProducts(page);
  }

  // 動態頁碼
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

  // 新增品項
  newProduct: Isupplieslist = {
    suppliesProductID: 0,
    suppliesProductName: '',
    quantityPerUnit: '',
    unitsInStock: 0,
    pricePerUnit: 0,
    supplierId: 0,
    suppliesSupplierName: '',
    suppliesCategoryId: 0,
    suppliesCategoryName: '',
    exist: true
  };

  onSupplierChange(event: any) {
    const selected = this.suppliers.find(s => s.suppliesSupplierId === this.newProduct.supplierId);
    this.newProduct.suppliesSupplierName = selected ? selected.suppliesSupplierName : '';
  }

  onCategoryChange(event: any) {
    const selected = this.categories.find(c => c.suppliesCategoryId === this.newProduct.suppliesCategoryId);
    this.newProduct.suppliesCategoryName = selected ? selected.suppliesCategoryName : '';
  }
  // 新增品項
  submitAddProduct() {
    this.suppliesListService.addSuppliesProduct(this.newProduct).subscribe({
      next: (res) => {
        Swal.fire({ title: '新增成功', icon: "success" })
        // 新增成功後可重新載入列表或顯示訊息
        this.loadProducts(this.currentPage);
        this.resetNewProduct();
      },
      error: (err) => {
        // 錯誤處理
        Swal.fire({ title: '新增失敗', icon: "error" });
      }

    });
    // 清空輸入欄位
    this.resetNewProduct();
  }
  // 修改品項
  submitEditProduct() {
    this.suppliesListService.editSuppliesProduct(this.newProduct).subscribe({
      next: (res) => {
        Swal.fire({ title: '新增成功', icon: "success" })
        // 修改成功後可重新載入列表或顯示訊息
        this.loadProducts(this.currentPage);
        this.resetNewProduct();
      },
      error: (err) => {
        // 錯誤處理
        Swal.fire({ title: '新增失敗', icon: "error" });
      }
    });
    // 清空輸入欄位
    this.resetNewProduct();
  }

  editProduct(product: Isupplieslist) {
    // 複製物品資料到 newProduct
    this.newProduct = { ...product };
  }

  resetNewProduct() {
    this.newProduct = {
      suppliesProductID: 0,
      suppliesProductName: '',
      quantityPerUnit: '',
      unitsInStock: 0,
      pricePerUnit: 0,
      supplierId: 0,
      suppliesSupplierName: '',
      suppliesCategoryId: 0,
      suppliesCategoryName: '',
      exist: true
    };
  }

  // 時間對應表
  selectedProductDates: Isuppliesdate[] = [];

  showProductDate(product: Isupplieslist) {
    // 根據 suppliesProductID 過濾出對應的時間資料
    this.selectedProductDates = this.suppliesDate.filter(date => date.suppliesProductId === product.suppliesProductID);
  }
}
