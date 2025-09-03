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
    fOccupancyId: number; // 新增: 用於離院功能
    fCheckInDate: string; // 新增: 入住時間
  }[];
  showFullDescription: boolean;
}
