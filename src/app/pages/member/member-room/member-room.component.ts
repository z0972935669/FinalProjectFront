import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberRoomService } from '../../../services/member/member-room.service';
import { MemberRoomData } from '../../../interfaces/room/room.interface';

@Component({
  selector: 'app-member-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-room.component.html',
  styleUrl: './member-room.component.scss',
})
export class MemberRoomComponent implements OnInit {
  Member: { fName: string; fIdNumber: string } = { fName: '', fIdNumber: '' };
  RoomBed: { fBedCode: string } = { fBedCode: '' };
  RoomTable: { fRoomName: string; fRoomAlias: string; fRoomType: boolean; fRoomPrice?: number } = { fRoomName: '', fRoomAlias: '', fRoomType: false };
  RoomOccupancy: { fBillingStatus: boolean } = { fBillingStatus: false };
  roomImages: string[] = []; // 後端提供的照片路徑陣列
  isLoading: boolean = true;
  errorMessage: string | null = null;
  staticUrl = 'https://localhost:7124/'; // 後端靜態檔案 URL

  constructor(private memberRoomService: MemberRoomService) { }

  ngOnInit(): void {
    this.loadMemberRoomData();
  }

  loadMemberRoomData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.memberRoomService.getMemberRoom().subscribe({
      next: (response: MemberRoomData) => {
        this.Member = response.member || { fName: '', fIdNumber: '' };
        this.RoomTable = response.roomTable || { fRoomName: '', fRoomAlias: '', fRoomType: false };
        this.RoomBed = response.roomBed || { fBedCode: '' };
        this.RoomOccupancy = response.roomOccupancy || { fBillingStatus: false };
        this.roomImages = response.roomTable.images || []; // 從 roomTable.images 獲取路徑
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || '加載資料失敗，請稍後重試';
        this.isLoading = false;
      }
    });
  }

  // 生成完整圖片 URL
  getImageUrl(imagePath: string): string {
    if (!imagePath || imagePath.trim() === '') {
      return this.staticUrl + 'images/rooms/default-room-image.jpg'; // 默認圖片
    }
    // 確保路徑以 "images/rooms/" 開頭
    const fullPath = imagePath.startsWith('rooms/') ? 'images/' + imagePath : 'images/rooms/' + imagePath;
    return this.staticUrl + fullPath;
  }
}
