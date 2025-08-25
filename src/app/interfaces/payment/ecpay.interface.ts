export interface ECPayRequest {
  MerchantTradeNo: string;   // 訂單編號
  TotalAmount: number;       // 總金額
  ItemName: string;          // 商品名稱 (多商品用 # 分隔)
  ChoosePayment?: string;    // 付款方式 (Credit / ATM / CVS / COD)
}
