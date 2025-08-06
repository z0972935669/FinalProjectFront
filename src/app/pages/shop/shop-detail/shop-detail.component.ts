import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-shop-detail',
  imports: [],
  standalone: true,
  template: `<h1>商品詳情頁：{{ slug }}</h1>`,
  templateUrl: './shop-detail.component.html',
  styleUrl: './shop-detail.component.scss',
})
export class ShopDetailComponent {
  slug = '';

  constructor(private route: ActivatedRoute) {
    this.slug = this.route.snapshot.params['slug'];
  }
}
