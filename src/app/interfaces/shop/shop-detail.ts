export interface IShopProductDetail {
  productID: number;
  productName: string;
  slug: string;
  originalPrice: number;
  salePrice: number;
  summary?: string;
  content?: string;
  quantity?: number;
  stock?: number;
  largePhotoPath?: string;
  galleryLargePaths: string[];
  galleryThumbPaths: string[];
  categoryID: number;
  categoryName: string;
}
