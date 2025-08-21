// src/app/interfaces/room/room.interface.ts
export interface Room {
  fRoomId: number;
  fRoomAlias: string;
  image: string;
  fRoomDescription: string;
  fRoomPrice?: number; // 可選
}

export interface RoomDetail extends Room {
  images: string[]; // 多張圖片，適用於詳情頁
  fBedCount?: number; // 新增，從後端 DTO
  isAvailable: boolean;//房間入住情況 : 可住/不可入住(最好之後對照床位剩餘量)
}

export interface RoomVisitReservation {
  fName: string;
  fEmail: string;
  fPhoneOrLineId: string;
  fReservationDate: string;
}

export interface RoomOccupancy {
  name?: string; // 可選（後端 DTO 無，但前端可收集）
  email?: string; // 可選
  contact?: string; // 可選
  paymentMethod: string;
  cardNumber?: string; // 可選，信用卡相關
  cardholder?: string; // 可選
  expiry?: string; // 可選
  cvv?: string; // 可選
  otherPayment?: string; // 可選，其他支付方式
  checkInDate?: string; // 入住日期，從後端 DTO 的 FCheckInDate
  fBedId: number; // 必填，從後端 DTO
  fBillingAmount: number; // 必填，從後端 DTO
}
