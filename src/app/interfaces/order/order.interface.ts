export interface OrderDetail {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  buyerName: string;
  receiverName: string;
  receiverPhone: string;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryAddress: string;
  invoiceType: string;
  carrierNumber?: string;
  invoiceTitle?: string;
  invoiceTax?: string;
  note?: string;
  totalAmount: number;
  orderDetails: OrderDetail[];
}
