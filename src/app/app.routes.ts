import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home/home.component';
import { ShopListComponent } from './pages/shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './pages/shop/shop-detail/shop-detail.component';
import { BoardListComponent } from './pages//community/board-list/board-list.component';
import { PostListComponent } from './pages/community/post-list/post-list.component';
import { PostComponent } from './pages/community/post/post.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'shop', component: ShopListComponent },
  { path: 'shop/:slug', component: ShopDetailComponent }, // 動態路由顯示商品詳細, 等開API的時候要改成shop/:slug
  { path: 'community', component: BoardListComponent },
  { path: 'community/:boardID/posts', component: PostListComponent },
  { path: 'community/:boardID/posts/:postId', component: PostComponent },
];
