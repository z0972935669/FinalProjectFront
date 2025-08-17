export interface IShopCategory {
  categoryID: number;
  categoryName: string;
}

export interface IShopProductList {
  productID: number;
  productName: string;
  originalPrice?: number;
  salePrice?: number;
  thumbnailPhotoPath?: string;
  categoryID: number;
  categoryName: string;
  slug: string;
}
