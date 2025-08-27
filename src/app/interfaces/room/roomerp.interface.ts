import { RoomDetail } from './room.interface';

export interface RoomTableErp extends RoomDetail {
  fRoomStatus?: string; // 'active' | 'inactive'
  fRoomType?: boolean; // true: 單人房, false: 多人房
  lastUpdated?: string; // 最後更新時間
  fRoomName?: string;   // 新增
  fBedCount?: number;   // 新增
}
