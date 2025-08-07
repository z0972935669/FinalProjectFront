import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuantityComponent } from '../../../components/shared/quantity/quantity.component';

@Component({
  selector: 'app-cart',
  imports: [RouterModule, QuantityComponent],
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  count1 = 1;
  count2 = 1;
  count3 = 1;
}
