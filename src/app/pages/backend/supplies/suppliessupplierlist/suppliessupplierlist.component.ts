import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Isuppliessupplier } from '../../../../interfaces/supplies/isuppliessupplier';
import { SuppliesSupplierService } from '../../../../services/supplies/supplies-supplier.service';
import { NgClass } from '@angular/common';
import { Isuppliescategory } from '../../../../interfaces/supplies/isuppliescategory';
import { SuppliesCategoryService } from '../../../../services/supplies/supplies-category.service';

type TabKey = 'all' | 'continued' | 'cancelled';
@Component({
  selector: 'app-suppliessupplierlist',
  imports: [RouterModule, FormsModule, NgClass],
  standalone: true,
  templateUrl: './suppliessupplierlist.component.html',
  styleUrl: './suppliessupplierlist.component.scss'
})
export class SuppliessupplierlistComponent {
  suppliesSuppliers: Isuppliessupplier[] = [];
  categories: Isuppliescategory[] = [];

  searchKeyword: string = '';
  pagination: Record<TabKey, {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    data: Isuppliessupplier[];
  }> = {
      all: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
      continued: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
      cancelled: { currentPage: 1, pageSize: 10, totalPages: 0, totalCount: 0, data: [] },
    };

  constructor(private suppliesSupplierService: SuppliesSupplierService, private suppliesCategoryService: SuppliesCategoryService) { }

  ngOnInit(): void {
    // 抓供應商資料
    this.suppliesSupplierService.getSuppliesSupplierData().subscribe((data: Isuppliessupplier[]) => {
      this.suppliesSuppliers = data;
    })
    // 抓類別資料
    this.suppliesCategoryService.getSuppliesCategoryData().subscribe((data: Isuppliescategory[]) => {
      this.categories = data;
    })
    // 抓分頁資料
    this.loadSuppliers('all');
    this.loadSuppliers('continued');
    this.loadSuppliers('cancelled');
  }

  // 將 tab 名稱對應到 continued 參數
  private tabToContinued(tab: 'all' | 'continued' | 'cancelled'): '' | 'true' | 'false' {
    if (tab === 'continued') return 'true';
    if (tab === 'cancelled') return 'false';
    return '';
  }


  // 讀取指定 tab 的分頁資料（後端分頁＋過濾）
  loadSuppliers(tab: 'all' | 'continued' | 'cancelled') {
    const p = this.pagination[tab];
    const continued = this.tabToContinued(tab);

    this.suppliesSupplierService
      .searchSuppliers(this.searchKeyword, p.currentPage, p.pageSize, continued)
      .subscribe(res => {
        p.data = res.data;
        p.totalCount = res.totalCount;
        p.totalPages = res.totalPages;
      });
  }


  // 查詢：三個分頁都回到第 1 頁並重抓
  searchAllTabs() {
    (Object.keys(this.pagination) as Array<'all' | 'continued' | 'cancelled'>).forEach(tab => {
      this.pagination[tab].currentPage = 1;
      this.loadSuppliers(tab);
    });
  }

  // 換頁（指定 tab）
  changePage(tab: 'all' | 'continued' | 'cancelled', page: number) {
    const p = this.pagination[tab];
    if (page < 1 || (p.totalPages && page > p.totalPages)) return;
    p.currentPage = page;
    this.loadSuppliers(tab);
  }

  // 動態頁碼（最多顯示 5 個）
  getPageNumbers(tab: 'all' | 'continued' | 'cancelled'): number[] {
    const p = this.pagination[tab];
    const pages: number[] = [];
    if (!p.totalPages || p.totalPages < 1) return pages;

    let start = Math.max(1, p.currentPage - 2);
    let end = Math.min(p.totalPages, p.currentPage + 2);

    if (end - start < 4) {
      if (start === 1) end = Math.min(5, p.totalPages);
      else if (end === p.totalPages) start = Math.max(1, p.totalPages - 4);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }


  newSupplier: Isuppliessupplier = {
    suppliesSupplierId: 0,
    suppliesSupplierName: '',
    suppliesSupplierGui: '',
    contactPerson: '',
    contactNumber: '',
    address: '',
    supplierKeyword: '',
    continued: true
  }

  onCategoryChange(event: any) {
    const selected = this.categories.find(c => c.suppliesCategoryName === this.newSupplier.supplierKeyword);
    this.newSupplier.supplierKeyword = selected ? selected.suppliesCategoryName : '';
  }

  //新增供應商
  submitAddSupplier() {
    this.suppliesSupplierService.addSuppliesSupplier(this.newSupplier).subscribe({
      next: (res) => {
        alert('新增成功')
        this.resetNewSupplier();
        // 新增後重載三個 tab，確保分頁正確
        this.searchAllTabs();
      },
      error: (err) => {
        // 錯誤處理
        alert('新增失敗');
      }
    });
    // 清空輸入欄位
    this.resetNewSupplier();
  }
  // 修改供應商
  submitEditSupplier() {
    this.suppliesSupplierService.editSuppliesSupplier(this.newSupplier).subscribe({
      next: (res) => {
        alert('修改成功')
        this.resetNewSupplier();
        this.searchAllTabs();
      },
      error: (err) => {
        // 錯誤處理
        alert('修改失敗');
      }
    });
    // 清空輸入欄位
    this.resetNewSupplier();
  }

  editSupplier(supplier: Isuppliessupplier) {
    // 複製物品資料到 newSupplier
    this.newSupplier = { ...supplier };
  }

  resetNewSupplier() {
    this.newSupplier = {
      suppliesSupplierId: 0,
      suppliesSupplierName: '',
      suppliesSupplierGui: '',
      contactPerson: '',
      contactNumber: '',
      address: '',
      supplierKeyword: '',
      continued: true
    }
  }
}
