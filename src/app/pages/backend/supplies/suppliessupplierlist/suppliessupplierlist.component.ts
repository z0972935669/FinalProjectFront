import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Isuppliessupplier } from '../../../../interfaces/supplies/isuppliessupplier';
import { SuppliesSupplierService } from '../../../../services/supplies/supplies-supplier.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-suppliessupplierlist',
  imports: [RouterModule, FormsModule, NgClass],
  standalone: true,
  templateUrl: './suppliessupplierlist.component.html',
  styleUrl: './suppliessupplierlist.component.scss'
})
export class SuppliessupplierlistComponent {
  suppliesSuppliers: Isuppliessupplier[] = []

  constructor(private suppliesSupplierService: SuppliesSupplierService) { }

  ngOnInit(): void {
    // 抓供應商資料
    this.suppliesSupplierService.getSuppliesSupplierData().subscribe((data: Isuppliessupplier[]) => {
      this.suppliesSuppliers = data;
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
}
