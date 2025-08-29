import {
  Component,
  AfterViewInit,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { QuantityComponent } from '../../../components/shared/quantity/quantity.component';
import { ShopService } from '../../../services/shop/shop-list.service';
import { IShopProductDetail } from '../../../interfaces/shop/shop-detail';
import { IShopProductList } from '../../../interfaces/shop/shop-list';
import {
  MemberInfo,
  MemberService,
} from '../../../services/member/member.service';
import { CartService } from '../../../services/cart/cart.service';
import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, QuantityComponent, NgxSonnerToaster],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss'],
})
export class ShopDetailComponent implements AfterViewInit, AfterViewChecked {
  slug = '';
  count1 = 1;
  product?: IShopProductDetail;
  related: IShopProductList[] = [];

  private relatedSwiperInitialized = false;

  // swiper 實例保存
  private mainSwiper?: Swiper;
  private thumbsSwiper?: Swiper;

  get inStock(): boolean {
    return (this.product?.stock ?? 0) > 0;
  }

  // 購物車既有數量
  private get existInCart(): number {
    if (!this.product) return 0;
    return (
      this.cartService
        .getCart()
        .find((c) => c.productId === this.product!.productID)?.quantity ?? 0
    );
  }

  // 庫存扣掉購物車既有數量後，最多還能再加多少
  get maxCanAdd(): number {
    if (!this.product) return 0;
    const stock = Number(this.product.stock ?? 0);
    const exist = Number(this.existInCart);
    return Math.max(0, stock - exist);
  }

  // 是否超過可加入上限（用於模板與 addToCart 雙重保險)
  get isOverStock(): boolean {
    const qty = Number(this.count1 || 0);
    return qty > this.maxCanAdd;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shopService: ShopService,
    private memberSvc: MemberService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {
    this.slug = this.route.snapshot.params['slug'];
  }

  ngOnInit(): void {
    this.loadProduct(this.slug);

    // 當 slug 改變時，重新載入
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug') ?? '';
      if (this.slug) {
        this.loadProduct(this.slug);
      }
    });
  }

  ngAfterViewInit(): void {}

  ngAfterViewChecked(): void {
    if (this.related.length && !this.relatedSwiperInitialized) {
      this.initRelatedSwiper();
      this.relatedSwiperInitialized = true;
    }
  }

  // 初始化主要 Swiper（大圖 + 小圖）
  private initSwiper() {
    // 銷毀舊的
    if (this.mainSwiper) {
      this.mainSwiper.destroy(true, true);
      this.mainSwiper = undefined;
    }
    if (this.thumbsSwiper) {
      this.thumbsSwiper.destroy(true, true);
      this.thumbsSwiper = undefined;
    }

    setTimeout(() => {
      this.thumbsSwiper = new Swiper('.swiper-thumbs', {
        slidesPerView: 4,
        spaceBetween: 10,
        watchSlidesProgress: true,
      });

      this.mainSwiper = new Swiper('.swiper-main', {
        spaceBetween: 10,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        thumbs: { swiper: this.thumbsSwiper },
      });
    });
  }

  private loadProduct(slug: string) {
    this.shopService.getProductDetail(slug).subscribe({
      next: (res) => {
        this.product = res;

        // 先讓 Angular 重新渲染畫面
        this.cdr.detectChanges();

        // 再初始化 Swiper
        this.initSwiper();

        // 載入相關商品
        this.loadRelated(slug);
      },
      error: (err) => console.error('載入商品詳細失敗', err),
    });
  }

  private loadRelated(slug: string) {
    this.shopService.getRelatedProducts(slug, 8).subscribe({
      next: (items) => {
        this.related = items ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('載入相關商品失敗', err),
    });
  }

  private initRelatedSwiper() {
    new Swiper('.related-swiper', {
      slidesPerView: 4,
      spaceBetween: 20,
      navigation: { nextEl: '.related-next', prevEl: '.related-prev' },
      breakpoints: {
        320: { slidesPerView: 1, spaceBetween: 10 },
        576: { slidesPerView: 2, spaceBetween: 15 },
        768: { slidesPerView: 3, spaceBetween: 15 },
        992: { slidesPerView: 4, spaceBetween: 20 },
      },
    });
  }

  // 數量變更：超過庫存立即用 toast 提示
  onQtyChange(newQty: number) {
    this.count1 = newQty;
    if (this.isOverStock) {
      toast.warning('超過庫存', {
        description: `最多可再加 ${this.maxCanAdd} 件（庫存 ${this.product?.stock}，購物車已有 ${this.existInCart} 件）。`,
      });
    }
  }

  addToCart() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/show/login']);
      return;
    }
    if (!this.product || !this.inStock) return;

    // 超過庫存就擋下來並提示
    if (this.isOverStock) {
      toast.error('超過庫存，無法加入', {
        description: `庫存 ${this.product.stock} 件，購物車已有 ${this.existInCart} 件，最多可再加 ${this.maxCanAdd} 件。`,
      });
      return;
    }

    const image =
      this.product.largePhotoPath ||
      this.product.galleryThumbPaths?.[0] ||
      this.product.galleryLargePaths?.[0] ||
      '';

    // 多帶 stock 進購物車
    this.cartService.add({
      productId: this.product.productID,
      name: this.product.productName,
      price: this.product.salePrice!,
      quantity: this.count1,
      image,
      stock: this.product.stock ?? 0,
    } as any);

    toast.success('已加入購物車', {
      description: `${this.product.productName} × ${this.count1}`,
      duration: 2500,
      action: {
        label: '查看購物車',
        onClick: () => this.router.navigate(['/show/cart']),
      },
    });
  }
}
