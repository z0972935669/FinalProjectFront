import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home/home.component';
import { ShopListComponent } from './pages/shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './pages/shop/shop-detail/shop-detail.component';
import { CartComponent } from './pages/cart/cart/cart.component';
import { CheckoutComponent } from './pages/cart/checkout/checkout.component';
import { CheckoutsuccessfulComponent } from './pages/cart/checkoutsuccessful/checkoutsuccessful.component';
import { BoardListComponent } from './pages//community/board-list/board-list.component';
import { PostListComponent } from './pages/community/post-list/post-list.component';
import { PostComponent } from './pages/community/post/post.component';

import { LoginComponent } from './pages/account/login/login.component';
import { RegisterComponent } from './pages/account/register/register.component';
import { MembermanagementComponent } from './pages/member/membermanagement/membermanagement.component';
import { MemberInfoComponent } from './pages/member/member-info/member-info.component';
import { MemberPasswordComponent } from './pages/member/member-password/member-password.component';
import { MemberOrdersComponent } from './pages/member/member-orders/member-orders.component';
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'shop', component: ShopListComponent },
  { path: 'shop/:slug', component: ShopDetailComponent }, // 動態路由顯示商品詳細, 等開API的時候要改成shop/:slug
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'checkoutsuccessful', component: CheckoutsuccessfulComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'member-management',
    component: MembermanagementComponent,
    children: [
      { path: '', redirectTo: 'info', pathMatch: 'full' },
      { path: 'info', component: MemberInfoComponent },
      { path: 'password', component: MemberPasswordComponent },
      { path: 'orders', component: MemberOrdersComponent },
    ],
  },
  { path: 'community', component: BoardListComponent },
  { path: 'community/:boardID/posts', component: PostListComponent },
  { path: 'community/:boardID/posts/:postId', component: PostComponent },
];
