export interface Isuppliessales {
  suppliesSalesOrderId: number,

  orderDate?: string,

  customerName?: string,

  receivedDate?: string,

  orderStatus?: string,

  suppliesSalesOrderDetailId: number,

  suppliesProductId?: number,

  quantityOfSales?: number,

  expiryDate?: string,

  suppliesProductName?: string

  suppliesCategoryId?: number,

  suppliesCategoryName?: string,

  suppliesSupplierId?: number,

  suppliesSupplierName?: string
}

export interface CreateSalesOrderDetailDto {
  suppliesProductId: number;
  quantityOfSales: number;
  expiryDate: string | null;
}

export interface CreateSalesOrderDto {
  orderDate: string | null;
  customerName: string | null;
  receivedDate: string | null;
  orderStatus: string | null;
  details: CreateSalesOrderDetailDto[];
}

export interface CreateSalesOrderResponse {
  message: string;
  orderId: number;
  qrcodeUrl: string;
}
