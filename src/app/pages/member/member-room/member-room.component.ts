import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberRoomService } from '../../../services/member/member-room.service';
import { MemberRoomData } from '../../../interfaces/room/room.interface';
import { HttpErrorResponse } from '@angular/common/http';

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
  RoomTable: { fRoomName: string; fRoomAlias: string; fRoomType: boolean | null; fRoomPrice?: number } = { fRoomName: '', fRoomAlias: '', fRoomType: null };
  RoomOccupancy: { fBillingStatus: boolean | undefined } | null = null;
  roomImages: string[] = []; // 後端提供的照片路徑陣列
  isLoading: boolean = true;
  errorMessage: string | null = null;
  hasRoomData: boolean = false;
  staticUrl = 'https://localhost:7124/'; // 後端靜態檔案 URL

  constructor(private memberRoomService: MemberRoomService) { }

  ngOnInit(): void {
    this.loadMemberRoomData();
  }

  loadMemberRoomData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.hasRoomData = false;

    this.memberRoomService.getMemberRoom().subscribe({
      next: (response: MemberRoomData) => {
        this.Member = response.member || { fName: '', fIdNumber: '' };
        this.RoomTable = response.roomTable || { fRoomName: '', fRoomAlias: '', fRoomType: false };
        this.RoomBed = response.roomBed || { fBedCode: '' };
        this.RoomOccupancy = response.roomOccupancy || { fBillingStatus: false };
        this.roomImages = [...new Set(response.roomTable.images || [])]; // 去重
        this.hasRoomData = true;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.hasRoomData = false;
        if (err.status === 404) {
          this.Member = { fName: '', fIdNumber: '' };
          this.RoomTable = { fRoomName: '', fRoomAlias: '', fRoomType: null };
          this.RoomBed = { fBedCode: '' };
          this.RoomOccupancy = { fBillingStatus: undefined };
          this.roomImages = [];
          this.errorMessage = '無法載入資料';
        } else {
          this.errorMessage = '用戶尚未入住';
        }
      }
    });
  }

  // 生成完整圖片 URL，加入緩存檢查
  getImageUrl(imagePath: string): string {
    if (!imagePath || imagePath.trim() === '') {
      return this.staticUrl + 'images/rooms/default-room-image.jpg';
    }
    const fullPath = imagePath.startsWith('rooms/') ? 'images/' + imagePath : 'images/rooms/' + imagePath;
    const cachedUrl = sessionStorage.getItem(fullPath); // 檢查緩存
    if (cachedUrl) return cachedUrl; // 返回緩存 URL
    const url = this.staticUrl + fullPath;
    sessionStorage.setItem(fullPath, url); // 緩存新 URL
    return url;
  }
}
