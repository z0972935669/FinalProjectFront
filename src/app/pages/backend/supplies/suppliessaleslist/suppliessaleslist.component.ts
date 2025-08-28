import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Isuppliessales } from '../../../../interfaces/supplies/isuppliessales';
import { SuppliesSalesService } from '../../../../services/supplies/supplies-sales.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suppliessaleslist',
  imports: [RouterModule, FormsModule],
  standalone: true,
  templateUrl: './suppliessaleslist.component.html',
  styleUrl: './suppliessaleslist.component.scss'
})
export class SuppliessaleslistComponent {
  suppliesSales: Isuppliessales[] = [];

  constructor(private suppliesSalesService: SuppliesSalesService) { }

  ngOnInit(): void {
    this.suppliesSalesService.getSuppliesSalesList().subscribe((data: Isuppliessales[]) => {
      this.suppliesSales = data;
    })
  }

  newSales: Isuppliessales = {
    suppliesSalesOrderId: 0,

    orderDate: new Date(),

    customerName: '',

    receivedDate: new Date(),

    orderStatus: '',

    suppliesSalesOrderDetailId: 0,

    suppliesProductId: 0,

    quantityOfSales: 0,

    expiryDate: new Date(),

    suppliesProductName: ''
  }

  submitAddSales() {

  }

  resetNewSales() {
    this.newSales = {
      suppliesSalesOrderId: 0,

      orderDate: new Date(),

      customerName: '',

      receivedDate: new Date(),

      orderStatus: '',

      suppliesSalesOrderDetailId: 0,

      suppliesProductId: 0,

      quantityOfSales: 0,

      expiryDate: new Date(),

      suppliesProductName: ''
    }
  }
}
