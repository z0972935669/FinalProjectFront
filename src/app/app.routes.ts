import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home/home.component';
import { ShopListComponent } from './pages/shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './pages/shop/shop-detail/shop-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'shop', component: ShopListComponent },
  { path: 'shop/:slug', component: ShopDetailComponent }, // 動態路由顯示商品詳細, 等開API的時候要改成shop/:slug
];
