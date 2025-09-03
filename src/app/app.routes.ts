import { Routes } from '@angular/router';
import { Component } from '@angular/core';

// ===== 前台 Layout =====
import { FrontendComponent } from './layout/frontend/frontend.component';

// ===== 前台 Pages =====
import { HomeComponent } from './pages/home/home/home.component';
import { ShopListComponent } from './pages/shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './pages/shop/shop-detail/shop-detail.component';
import { CartComponent } from './pages/cart/cart/cart.component';
import { CheckoutComponent } from './pages/cart/checkout/checkout.component';
import { CheckoutsuccessfulComponent } from './pages/cart/checkoutsuccessful/checkoutsuccessful.component';
import { BoardListComponent } from './pages/community/board-list/board-list.component';
import { PostListComponent } from './pages/community/post-list/post-list.component';
import { PostComponent } from './pages/community/post/post.component';
import { PersonalCommunityComponent } from './pages/community/personal-community/personal-community.component';
import { CreatePostComponent } from './pages/community/create-post/create-post.component';
import { ChatPageComponent } from './pages/community/chat-page/chat-page.component';
import { CustomerServiceComponent } from './pages/community/customer-service/customer-service.component';

import { LoginComponent } from './pages/account/login/login.component';
import { RegisterComponent } from './pages/account/register/register.component';
import { MembermanagementComponent } from './pages/member/membermanagement/membermanagement.component';
import { MemberInfoComponent } from './pages/member/member-info/member-info.component';
import { MemberPasswordComponent } from './pages/member/member-password/member-password.component';
import { MemberOrdersComponent } from './pages/member/member-orders/member-orders.component';
import { MemberEventComponent } from './pages/member/member-event/member-event-list/member-event.component';
import { LoginLogsComponent } from './pages/member/login-logs/login-logs.component';

import { EventDetailComponent } from './pages/event/event-detail/event-detail.component';
import { EventRegistrationComponent } from './pages/event/event-registration/event-registration.component';
import { EventCalendarComponent } from './pages/event/event-calendar/event-calendar.component';
import { EventListComponent } from './pages/event/event-list/event-list.component';
import { MemberRoomComponent } from './pages/member/member-room/member-room.component';
import { RoomListComponent } from './pages/room/room-list/room-list.component';
import { RoomDetailComponent } from './pages/room/room-detail/room-detail.component';
import { RoomSwiperComponent } from './pages/room/room-swiper/room-swiper.component';

// ===== 後台 Layout =====
import { BackendComponent } from './layout/backend/backend.component';
import { ErpAuthShellComponent } from './layout/backend/erp-auth-shell/erp-auth-shell.component';

// ===== 後台 Pages =====
import { MemberlistComponent } from './pages/backend/memberlist/memberlist.component';
import { SupplieslistComponent } from './pages/backend/supplies/supplieslist/supplieslist.component';
import { SuppliespurchasinglistComponent } from './pages/backend/supplies/suppliespurchasinglist/suppliespurchasinglist.component';
import { SuppliessaleslistComponent } from './pages/backend/supplies/suppliessaleslist/suppliessaleslist.component';
import { TransferlistComponent } from './pages/backend/supplies/transferlist/transferlist.component';
import { SuppliessupplierlistComponent } from './pages/backend/supplies/suppliessupplierlist/suppliessupplierlist.component';

import { EquipmentlistComponent } from './pages/backend/equipment/equipmentlist/equipmentlist.component';
import { EquipmentpurchasinglistComponent } from './pages/backend/equipment/equipmentpurchasinglist/equipmentpurchasinglist.component';
import { EquipmentrentlistComponent } from './pages/backend/equipment/equipmentrentlist/equipmentrentlist.component';
import { EquipmentmaintenancelistComponent } from './pages/backend/equipment/equipmentmaintenancelist/equipmentmaintenancelist.component';
import { EquipmentsupplierlistComponent } from './pages/backend/equipment/equipmentsupplierlist/equipmentsupplierlist.component';

import { EmployeelistComponent } from './pages/backend/employeelist/employeelist.component';
import { EmployeelistdetailComponent } from './pages/backend/employeelistdetail/employeelistdetail.component';
import { EmployeelisteditComponent } from './pages/backend/employeelistedit/employeelistedit.component';
import { EmployeeapprovalflowComponent } from './pages/backend/employeeapprovalflow/employeeapprovalflow.component';
import { EmployeeapprovallistComponent } from './pages/backend/employeeapprovallist/employeeapprovallist.component';
import { EmployeeattendanceComponent } from './pages/backend/employeeattendance/employeeattendance.component';
import { EmployeeattendancerecordsComponent } from './pages/backend/employeeattendancerecords/employeeattendancerecords.component';
import { EmployeeleaveformComponent } from './pages/backend/employeeleaveform/employeeleaveform.component';
import { EmployeemissingpunchformComponent } from './pages/backend/employeemissingpunchform/employeemissingpunchform.component';
import { EmployeepasswordresetComponent } from './pages/backend/employeepasswordreset/employeepasswordreset.component';
import { EmployeescheduleComponent } from './pages/backend/employeeschedule/employeeschedule.component';
import { EmployeeRegisterComponent } from './pages/backend/employeeregister/employeeregister.component';
import { EmployeehomeComponent } from './pages/backend/employeehome/employeehome.component';
import { EmployeeLoginComponent } from './pages/backend/employeelogin/employeelogin.component';

// 守衛
import { employeeAuthGuard } from './core/employee-auth.guard';

// 社群管理
import { BoardManagementComponent } from './pages/community/board-management/board-management.component';
// 房間管理
import { RoomTableErpComponent } from './pages/backend/room-table-erp/room-table-erp.component';
import { MemberCalendarComponent } from './pages/member/member-event/member-calendar/member-calendar.component';
import { MemberActivityShellComponent } from './pages/member/member-event/member-activity-shell.component';
import { MemberEventCouponComponent } from './pages/member/member-event/member-event-coupon/member-event-coupon.component';

export const routes: Routes = [
  // 根目錄導向前台
  { path: '', pathMatch: 'full', redirectTo: 'show' },

  // ================= 前台 =================
  {
    path: 'show',
    component: FrontendComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'shop', component: ShopListComponent },
      { path: 'shop/:slug', component: ShopDetailComponent },
      { path: 'cart', component: CartComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'checkoutsuccessful', component: CheckoutsuccessfulComponent },

      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import(
            './pages/account/forgot-password/forgot-password.component'
          ).then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import(
            './pages/account/reset-password/reset-password.component'
          ).then((m) => m.ResetPasswordComponent),
      },

      {
        path: 'member-management',
        component: MembermanagementComponent,
        children: [
          { path: '', redirectTo: 'info', pathMatch: 'full' },
          { path: 'info', component: MemberInfoComponent },
          { path: 'password', component: MemberPasswordComponent },
          { path: 'orders', component: MemberOrdersComponent },
          {
            path: '',
            component: MemberActivityShellComponent,
            children: [
              { path: 'event', component: MemberEventComponent }, // 我的活動
              {
                path: 'member_event_calendar',
                component: MemberCalendarComponent,
              }, // 行事曆（沿用你的底線）
              // 折價卷先做個頁面或 lazy component
              {
                path: 'member_event_coupon',
                component: MemberEventCouponComponent,
              },
            ],
          },
          { path: 'room', component: MemberRoomComponent },
          { path: 'community', component: PersonalCommunityComponent },
          { path: 'login-logs', component: LoginLogsComponent },
        ],
      },

      { path: 'community', component: BoardListComponent },
      { path: 'community/:boardID/posts', component: PostListComponent },
      { path: 'community/:boardID/create', component: CreatePostComponent },
      { path: 'community/:boardID/posts/:postId', component: PostComponent },
      { path: 'customer-service', component: CustomerServiceComponent },
      { path: 'chat', component: ChatPageComponent },

      { path: 'event', component: EventListComponent },
      { path: 'event/calendar', component: EventCalendarComponent },

      { path: 'event/:slug/register', component: EventRegistrationComponent },
      { path: 'event/:slug/:batchId', component: EventDetailComponent },
      // { path: 'event/:slug', component: EventDetailComponent },

      { path: 'room-list', component: RoomListComponent },
      { path: 'room-detail/:id', component: RoomDetailComponent },
      { path: 'room-swiper', component: RoomSwiperComponent },
    ],
  },

  // ================= 後台樹：分公開/受保護 =================
  {
    path: 'erp',
    children: [
      // 公開頁（不經守衛）：掛公開 Layout
      {
        path: '',
        component: ErpAuthShellComponent,
        children: [
          { path: '', redirectTo: 'login', pathMatch: 'full' },
          {
            path: 'login',
            component: EmployeeLoginComponent,
            title: '員工登入',
          },
          {
            path: 'employeeregister',
            component: EmployeeRegisterComponent,
            title: '員工註冊',
          },
          {
            path: 'employeepasswordreset',
            component: EmployeepasswordresetComponent,
            title: '重設密碼',
          },
        ],
      },

      // 受守護：掛後台主 Layout
      {
        path: '',
        component: BackendComponent,
        canActivateChild: [employeeAuthGuard],
        children: [
          { path: '', redirectTo: 'employeehome', pathMatch: 'full' },
          {
            path: 'employeehome',
            component: EmployeehomeComponent,
            title: '員工首頁',
          },

          // 物料管理
          {
            path: 'supplieslist',
            component: SupplieslistComponent,
            title: '物品列表',
          },
          {
            path: 'suppliespurchasinglist',
            component: SuppliespurchasinglistComponent,
            title: '進貨單',
          },
          {
            path: 'suppliessaleslist',
            component: SuppliessaleslistComponent,
            title: '銷貨單',
          },
          {
            path: 'transferlist',
            component: TransferlistComponent,
            title: '轉倉單',
          },
          {
            path: 'suppliessupplierlist',
            component: SuppliessupplierlistComponent,
            title: '供應商列表',
          },

          // 設備
          {
            path: 'equipmentlist',
            component: EquipmentlistComponent,
            title: '設備列表',
          },
          {
            path: 'equipmentpurchasinglist',
            component: EquipmentpurchasinglistComponent,
            title: '購置單',
          },
          {
            path: 'equipmentrentlist',
            component: EquipmentrentlistComponent,
            title: '借出單',
          },
          {
            path: 'equipmentmaintenancelist',
            component: EquipmentmaintenancelistComponent,
            title: '檢修單',
          },
          {
            path: 'equipmentsupplierlist',
            component: EquipmentsupplierlistComponent,
            title: '供應商列表',
          },

          // 員工管理
          {
            path: 'employeelist',
            component: EmployeelistComponent,
            title: '員工列表',
          },
          {
            path: 'employeelistdetail',
            component: EmployeelistdetailComponent,
            title: '詳細資料',
          },
          {
            path: 'employeelistdetail/:id',
            component: EmployeelistdetailComponent,
            title: '詳細資料',
          },
          {
            path: 'employeelistedit',
            component: EmployeelisteditComponent,
            title: '編輯員工',
          },
          {
            path: 'employeelistedit/:id',
            component: EmployeelisteditComponent,
            title: '編輯員工',
          },

          {
            path: 'employeeapprovalflow',
            component: EmployeeapprovalflowComponent,
            title: '員工審核流程',
          },
          {
            path: 'employeeapprovallist',
            component: EmployeeapprovallistComponent,
            title: '員工入職流程',
          },
          {
            path: 'employeeattendance',
            component: EmployeeattendanceComponent,
            title: '員工考勤',
          },
          {
            path: 'employeeattendancerecords',
            component: EmployeeattendancerecordsComponent,
            title: '考勤紀錄',
          },
          {
            path: 'employeeleaveform',
            component: EmployeeleaveformComponent,
            title: '請假表單',
          },
          {
            path: 'employeemissingpunchform',
            component: EmployeemissingpunchformComponent,
            title: '補打卡表單',
          },
          {
            path: 'employeeschedule',
            component: EmployeescheduleComponent,
            title: '排班管理',
          },

          // 社群/房間管理
          {
            path: 'board-management',
            component: BoardManagementComponent,
            title: '看板管理',
          },
          {
            path: 'memberlist',
            component: MemberlistComponent,
            title: '會員列表',
          },
          {
            path: 'room-table-erp',
            component: RoomTableErpComponent,
            title: '房間管理',
          },
        ],
      },
    ],
  },

  // 其它未知路徑都導回前台
  { path: '**', redirectTo: 'show' },
];
