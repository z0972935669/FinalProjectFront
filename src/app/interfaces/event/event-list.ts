export interface EventList {
  //batchID 一律使用這個大小寫
  //  batchId?: number | string; //api的
  /* ========== 前端顯示用型別 ========== */

  id: string;
  eventSlug: string;
  batchID: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  priceText: string;
  eventDateTimeStart: string; // 舉辦日期與時間
  organizer: string;
  location: string;
  duration: string;
  attendees: number;
  states: string;
  categoryID: number;
  detailLink?: any[];
}

export interface EventDetailVM {
  id: string;
  eventSlug: string;
  batchID: string;
  title: string;
  subtitle: string;
  priceText: string;
  date: string; // 顯示用時間字串
  organizer: string;
  location: string;
  contactPersonId: string;
  contactPersonName: string;
  contactPhone: string;
  duration: string;
  attendees: number;
  imageUrl: string;
  states: string;
  description: string;
}

// 活動報名畫面用的 ViewModel
export interface EventRegistrationVM {
  batchID: string;
  /** 活動標題 */
  title: string;

  /** 報名紀錄主鍵（RegistrationID） */
  registrationID: number;
  /** 報名編號（對外顯示碼） */
  registrationNum: string;
  //活動時間
  date: string;

  /** 會員 ID（MemberID） */
  memberId: number;
  memberName: string;
  memberPhone: string;
  /** 應付金額（AmountDue） */
  amountDue: number;

  /** 報名時間（ISO 字串，RegistrationDateTime） */
  registrationDateTime: string;

  /** 狀態碼（ */
  currentStatus: number;

  /** 內部備註（InternalRemarks） */
  internalRemarks?: string | null;
  eventSlug: string;
}

//回傳給api的model
export interface RegistrationCreateDto {
  eventBatchId: number;
  memberId: number;
  amountDue: number | null;
  registrationDateTime: string; // e.g. "2025-08-17T10:00:00"
  currentStatus: number;
  internalRemarks?: string | null;
  payment?: PaymentDto;
}

export interface PaymentDto {
  paymentMethod: string; // 付款方式
  paymentItem?: string; // 繳費項目名稱（例如：活動報名費）
  paymentAmount: number; // 繳費金額（通常與 amountDue 相等）
  invoiceType: string; // 發票形式
  invoiceTitle?: string | null; // 發票抬頭（可空）
  taxId?: string | null; // 統編（可空）
  eInvoiceCarrier?: string | null; // 電子發票載具（選「電子發票」時可帶）
  transactionId?: string | null; // 金流交易編號（若有）
}

// export interface EventDetail {
//   /* ========== 前端顯示用型別 ========== */

//   id: string;
//   imageUrl: string;
//   title: string;
//   subtitle: string;
//   priceText: string;
//   eventDateTimeStart: string; // 舉辦日期與時間
//   organizer: string;
//   location: string;
//   duration: string;
//   attendees: number;
//   states: string;
//   categoryID: number;
// }

/* ========== 後端回傳 DTO（請依你的 API 調整） ========== */
export interface EventBatchDto {
  batchID: number;
  eventID: number;
  eventDateTimeStart: string;
  eventDateTimeEnd?: string | null;
  quota?: number | null;
  canonicalPath?: string; // 例："classic-old-songs-concert-1/b/101"
}
//傳送給api 報名資料
export interface EventTemplateDto {
  eventID: number;
  eventSlug?: string;
  eventName: string;
  subtitle?: string | null;
  categoryID: number;
  status: number;
  organizer?: string | null;
  eventLocation?: string | null;
  quota?: number | null;
  amount?: number | null;
  durationMinutes?: number | null;
  coverImageUrl?: string | null;
  eventBatches?: EventBatchDto[];
  batches?: EventBatchDto[];
  description?: string | null;
  contactPersonId?: string | null;
  contactPersonName?: string | null;
  contactPhone?: string | null;
  canonicalPath?: string;

  couponRuleId?: number | null; //票卷id
  discountAmount?: number | null; //折扣後金額
}
//api回應的 報名資料
export interface RegistrationResDto {
  registrationId: number;
  registrationNum: string;
  linePay?: { paymentUrl?: string };
}

//
export interface RegistrationListDto {
  registrationId: number;
  registrationNum: string;
  eventBatchId: number;
  memberId: number;
  amountDue: number | null;
  registrationDateTime: string;
  currentStatus: number;
  internalRemarks: string | null;
  EventName: string;
  EventDateTimeStart: string;
  EventLocation: string;
}
//我的活動
export interface MyRegistrationDto {
  registrationId: number;
  registrationNum: string;
  eventBatchId: number;
  memberId: number;
  amountDue: number;
  registrationDateTime: string; // ISO
  currentStatus: number; // 1=有效(報名成功/待參加)  0取消報名
  internalRemarks: string | null;
  eventName: string;
  eventDateTimeStart: string;
  eventDateTimeEnd: string;
  eventLocation: string;
}
//開窗帶入coupon
export interface EventCouponDto {
  ruleId: number;
  ruleName: string;
  amount: number;
  status: number | string;
  validFrom: string;
  validTo: string;
  isUsed: number | string;
}

//取消報名 給予後端的資訊
export interface CancelRegistrationReq {
  memberId: number;
  eventBatchId: number;
  reason?: string; // 可選（前端填寫取消原因）
}
//取消活動 後端回復的資訊
export interface CancelRegistrationRes {
  message: string;
  registrationId: number;
  registrationNum: string;
  currentStatus: number; // 後端會回 0
}
