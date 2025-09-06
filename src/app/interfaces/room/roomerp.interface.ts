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
export interface PaymentHistoryDto {
  paymentId: number;
  occupancyId: number;
  memberId: number;
  name: string;
  phone: string;
  email: string;
  residesInCareHomeStatus: boolean | null;
  billingStatus: boolean;
  billingAmount: number;
  billingDate: string;
  paymentMethod: string;
  billingStatusText: string;
  paypalOrderId: string;
  checkInDate: string;
  checkOutDate: string;
  paymentHistory: PaymentHistory[];
  dueDate?: string; // 添加此行
}

export interface PaymentHistory {
  fPaymentId: number;
  fOccupancyId: number;
  fBillingAmount: number;
  fBillingDate: string;
  fPaymentMethod: string;
  fBillingStatus: boolean;
  fPaypalOrderId: string;
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
