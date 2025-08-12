import { Component } from '@angular/core';
import { Routes } from '@angular/router';
// 前台
import { FrontendComponent } from './layout/frontend/frontend.component';
import { HomeComponent } from './pages/home/home/home.component';
import { ShopListComponent } from './pages/shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './pages/shop/shop-detail/shop-detail.component';
import { CartComponent } from './pages/cart/cart/cart.component';
import { CheckoutComponent } from './pages/cart/checkout/checkout.component';
import { CheckoutsuccessfulComponent } from './pages/cart/checkoutsuccessful/checkoutsuccessful.component';
import { BoardListComponent } from './pages//community/board-list/board-list.component';
import { PostListComponent } from './pages/community/post-list/post-list.component';
import { PostComponent } from './pages/community/post/post.component';
import { PersonalCommunityComponent } from './pages/community/personal-community/personal-community.component';
import { CreatePostComponent } from './pages/community/create-post/create-post.component';

import { LoginComponent } from './pages/account/login/login.component';
import { RegisterComponent } from './pages/account/register/register.component';
import { MembermanagementComponent } from './pages/member/membermanagement/membermanagement.component';
import { MemberInfoComponent } from './pages/member/member-info/member-info.component';
import { MemberPasswordComponent } from './pages/member/member-password/member-password.component';
import { MemberOrdersComponent } from './pages/member/member-orders/member-orders.component';
import { OrdersComponent } from './pages/backend/orders/orders.component';
import { MemberEventComponent } from './pages/member/member-event/member-event.component';
// 後台
import { BackendComponent } from './layout/backend/backend.component';
import { SupplieslistComponent } from './pages/backend/supplieslist/supplieslist.component'
import { EventListComponent } from './pages/event/event-list/event-list.component';
import { EventDetailComponent } from './pages/event/event-detail/event-detail.component';
import { EventRegistrationComponent } from './pages/event/event-registration/event-registration.component';
import { MemberRoomComponent } from './pages/member/member-room/member-room.component';
import { RoomListComponent } from './pages/room/room-list/room-list.component';
import { RoomDetailComponent } from './pages/room/room-detail/room-detail.component';
import { RoomSwiperComponent } from './pages/room/room-swiper/room-swiper.component';

import { EmployeelistComponent } from './pages/backend/employeelist/employeelist.component';
import { EmployeelistdetailComponent } from './pages/backend/employeelistdetail/employeelistdetail.component';
import { EmployeelisteditComponent } from './pages/backend/employeelistedit/employeelistedit.component';
export const routes: Routes = [
  // 根目錄自動轉到 /show 或 /show/home
  { path: '', pathMatch: 'full', redirectTo: 'show' },
  // 若想直接到首頁就寫：redirectTo: 'show/home'
  {
    // 前台
    path: 'show',
    component: FrontendComponent,
    children: [
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
          { path: 'event', component: MemberEventComponent },
          { path: 'room', component: MemberRoomComponent },
          { path: 'comments', component: PersonalCommunityComponent },
        ],
      },
      { path: 'community', component: BoardListComponent },
      { path: 'community/:boardID/posts', component: PostListComponent },
      { path: 'community/:boardID/create', component: CreatePostComponent },
      { path: 'community/:boardID/posts/:postId', component: PostComponent },

      { path: 'event', component: EventListComponent },
      { path: 'event/:slug', component: EventDetailComponent },
      { path: 'event/:slug/register', component: EventRegistrationComponent },
      { path: 'room-list', component: RoomListComponent },
      { path: 'room-detail/:id', component: RoomDetailComponent },
      { path: 'room-swiper', component: RoomSwiperComponent },
    ],
  },
  {
    // 後台
    path: 'erp',
    component: BackendComponent,
    children: [
      // 沒有 backend 的 home，建議改成 orders
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      { path: 'orders', component: OrdersComponent },
      { path: 'supplieslist', component: SupplieslistComponent },
      { path: 'employeelist', component: EmployeelistComponent, title: '員工列表' },
      { path: 'employeelistdetail', component: EmployeelistdetailComponent, title: '詳細資料' },
      { path: 'employeelistedit', component: EmployeelisteditComponent, title: '編輯員工' },

      // 其他後台頁面可以在這裡添加
    ],
  },
  // 其它未知路徑都導回前台（可選）
  // **: 萬用路由 => 沒有上面的路徑全都導回show
  { path: '**', redirectTo: 'show' },
];
