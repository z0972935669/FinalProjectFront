import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home/home.component';
import { ShopListComponent } from './pages/shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './pages/shop/shop-detail/shop-detail.component';
import { CartComponent } from './pages/cart/cart/cart.component';
import { CheckoutComponent } from './pages/cart/checkout/checkout.component';
import { CheckoutsuccessfulComponent } from './pages/cart/checkoutsuccessful/checkoutsuccessful.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'shop', component: ShopListComponent },
  { path: 'shop/:slug', component: ShopDetailComponent }, // 動態路由顯示商品詳細, 等開API的時候要改成shop/:slug
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'checkoutsuccessful', component: CheckoutsuccessfulComponent },
];
