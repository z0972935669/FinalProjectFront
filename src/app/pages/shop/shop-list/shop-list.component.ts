import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../../services/shop/shop-list.service';
import {
  IShopCategory,
  IShopProductList,
} from '../../../interfaces/shop/shop-list';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // ✅ 加入 FormsModule
  templateUrl: './shop-list.component.html',
  styleUrl: './shop-list.component.scss',
})
export class ShopListComponent implements OnInit {
  categoryList: IShopCategory[] = [];
  productList: IShopProductList[] = [];
  loading = true;

  // 分頁參數
  page = 1;
  pageSize = 9;
  totalCount = 0;

  // 篩選
  selectedCategoryId: number = 0; // 0 表示全部

  // 排序
  sortOption: string = 'latest'; // 預設最新

  constructor(private shopService: ShopService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.shopService.getCategories().subscribe({
      next: (result: IShopCategory[]) => {
        // 在最前面加上 "全部"
        this.categoryList = [
          { categoryID: 0, categoryName: '全部' },
          ...result,
        ];
      },
      error: (err: any) => console.error('載入分類失敗', err),
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.shopService
      .getProducts(this.page, this.pageSize, this.selectedCategoryId)
      .subscribe({
        next: (res: { items: IShopProductList[]; totalCount: number }) => {
          let items = res.items;

          // 前端排序
          if (this.sortOption === 'priceAsc') {
            items = [...items].sort(
              (a, b) => (a.salePrice ?? 0) - (b.salePrice ?? 0)
            );
          } else if (this.sortOption === 'priceDesc') {
            items = [...items].sort(
              (a, b) => (b.salePrice ?? 0) - (a.salePrice ?? 0)
            );
          } else if (this.sortOption === 'latest') {
            items = [...items].sort((a, b) => {
              const dateA = new Date(a.createdAt ?? '').getTime();
              const dateB = new Date(b.createdAt ?? '').getTime();
              return dateB - dateA; // 新的在前
            });
          }

          this.productList = items;
          this.totalCount = res.totalCount;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('載入商品失敗', err);
          this.loading = false;
        },
      });
  }

  onCategorySelect(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.page = 1; // 切換分類時回到第一頁
    this.loadProducts();
  }

  onPageChange(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages.length) return;
    this.page = newPage;
    this.loadProducts();
  }

  onSortChange(): void {
    this.loadProducts(); // 重新排序
  }

  get totalPages(): number[] {
    const pages = Math.ceil(this.totalCount / this.pageSize);
    return Array.from({ length: pages }, (_, i) => i + 1);
  }
}
