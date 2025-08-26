import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Isuppliessales } from '../../../../interfaces/supplies/isuppliessales';
import { SuppliesSalesService } from '../../../../services/supplies/supplies-sales.service';

@Component({
  selector: 'app-suppliessaleslist',
  imports: [RouterModule],
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


}
