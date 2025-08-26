export interface ECPayRequest {
  MerchantTradeNo: string;
  TotalAmount: number;
  ItemName: string;
  ChoosePayment: string;
  ClientBackURL?: string;
  MerchantTradeDate?: string;
  TradeDesc?: string;
  ReturnURL?: string;
  PaymentType?: string;
  EncryptType?: number;
  CheckMacValue?: string;
}
