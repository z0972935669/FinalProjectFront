declare global {
  interface Window {
    paypal: any; // 兼容 PayPal SDK 的動態類型
  }
}

export interface Room { // home 導覽
  fRoomId: number;
  fRoomAlias: string;
  image: string;
  fRoomDescription: string;
  fRoomPrice?: number; // 可選
  isAvailable: boolean; // 房間查詢
  availableBeds: number; // 剩餘床位數
}

export interface RoomDetail extends Room { // room-detail
  images: string[]; // 多張圖片，適用於詳情頁
  fBedCount?: number; // 新增，從後端 DTO
  isAvailable: boolean; // 房間入住情況 : 可住/不可入住
}

export interface RoomVisitReservation { // 預約
  fName: string;
  fEmail: string;
  fPhoneOrLineId: string;
  fReservationDate: string;
}

export interface RoomOccupancy { // paypal付款入住
  name?: string; // 可選（後端 DTO 無，但前端可收集）
  email?: string; // 可選
  contact: string; // 必填，電話
  paymentMethod: string;
  cardNumber?: string; // 可選，信用卡相關
  cardholder?: string; // 可選
  expiry?: string; // 可選
  cvv?: string; // 可選
  otherPayment?: string; // 可選，其他支付方式
  checkInDate: string; // 必填，入住日期
  fRoomId: number; // 新增: 傳房間 ID (後端選 fBedId)
  fBillingAmount: number; // 必填，從後端 DTO
  paypalOrderId?: string; // PayPal 支付連結 ID，可選
}

// 新增 MemberRoomData 介面，整合 API 回傳數據
export interface MemberRoomData { // member-room 使用
  member: {
    fName: string;
    fIdNumber: string;
  };
  roomTable: {
    fRoomName: string;
    fRoomAlias: string;
    fRoomType: boolean; // true 為單人房，false 為多人房
    fRoomPrice?: number;
    images?: string[]; // 可選，房間照片陣列
  };
  roomBed: {
    fBedCode: string;
  };
  roomOccupancy: {
    fBillingStatus: boolean;
    fOccupancyId?: number; // 添加以匹配後端回傳
  };
  paymentHistory: {
    fPaymentId: number;
    fBillingDate: string;
    fBillingAmount: number;
    fPaymentMethod: string;
    fPaypalOrderId?: string;
    receipt?: {
      fReceiptId: number;
      fReceiptNumber: string;
      fReceiptDate: string;
      fReceiptFilePath?: string;
    };
  }[];
}
