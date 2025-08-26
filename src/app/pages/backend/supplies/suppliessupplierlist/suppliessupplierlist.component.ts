import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Isuppliessupplier } from '../../../../interfaces/supplies/isuppliessupplier';
import { SuppliesSupplierService } from '../../../../services/supplies/supplies-supplier.service';
import { NgClass } from '@angular/common';
import { Isuppliescategory } from '../../../../interfaces/supplies/isuppliescategory';
import { SuppliesCategoryService } from '../../../../services/supplies/supplies-category.service';

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
        // 新增成功後可重新載入列表或顯示訊息
        this.suppliesSupplierService.getSuppliesSupplierData().subscribe((data: Isuppliessupplier[]) => {
          this.suppliesSuppliers = data;
          alert('新增成功')
        });
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
        // 修改成功後可重新載入列表或顯示訊息
        this.suppliesSupplierService.getSuppliesSupplierData().subscribe((data: Isuppliessupplier[]) => {
          this.suppliesSuppliers = data;
          alert('修改成功')
        });
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
    console.log(supplier);
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
