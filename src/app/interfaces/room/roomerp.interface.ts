export interface RoomTableErp {
  fRoomId: number;
  fRoomName: string;
  fRoomAlias: string;
  images: string[];
  fRoomDescription: string;
  fRoomPrice: number;
  fBedCount: number;
  isAvailable: boolean;
  availableBeds: number;
  image: string;
  fRoomStatus: string;
  fRoomType: boolean;
  lastUpdated: string;
  occupiedInfo: {
    memberName: string;
    phone: string;
    bedCode: string;
    fOccupancyId: number;
    fCheckInDate: string;
    fCheckOutDate?: string; // 可選欄位，表示可能為 null
  }[];
  showFullDescription: boolean;
}
export interface PaymentHistory {
  FPaymentId: number;
  FOccupancyId: number;
  FBillingAmount: number;
  FBillingDate: Date; // 改為 Date，匹配後端 DateTime
  FPaymentMethod: string;
  FBillingStatus: boolean;
  FPaypalOrderId: string;
}

export interface PaymentHistoryDto {
  MemberId: number;
  Name: string;
  BillingAmount: number;
  BillingDate: string;
  PaymentHistory: PaymentHistory[]; // 確認屬性名稱為 PaymentHistory
}

export interface VisitReservation {
  fReservationId: number;
  fName: string;
  fEmail: string;
  fPhoneOrLineId: string;
  fReservationDate: string;
  fCreatedAt: string;
  fStatus: boolean; // 改為 boolean，匹配後端返回的 false/true
}

export interface RoomVisitReservationDto {
  reservations: VisitReservation[];
}

export interface RoomOccupancyDto {
  FMemberId: number;
  FRoomId: number;
  FOccupancyId?: number;
  FBedId: number;
  FCheckInDate: Date;
  FBillingAmount: number;
  FPaymentMethod: string;
  FPaypalOrderId: string | null; // 允許 null
}
