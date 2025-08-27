import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RoomTableErpService } from '../../../services/room/room-table-erp.service';
import { RoomTableErp } from '../../../interfaces/room/roomerp.interface';

declare var bootstrap: any;

@Component({
  selector: 'app-room-table-erp',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './room-table-erp.component.html',
  styleUrls: ['./room-table-erp.component.scss'],
})
export class RoomTableErpComponent implements OnInit {
  rooms: RoomTableErp[] = [];
  currentRoom: RoomTableErp = this.resetRoom();
  showForm = false;
  isEdit = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  roomModal: any;

  constructor(private roomTableErpService: RoomTableErpService) { }

  ngOnInit(): void {
    this.loadRooms();
    const modalElement = document.getElementById('roomModal');
    if (modalElement) {
      this.roomModal = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
    } else {
      console.error('Modal element with ID "roomModal" not found');
    }
  }

  resetRoom(): RoomTableErp {
    return {
      fRoomId: 0,
      fRoomAlias: '',
      images: [],
      fRoomDescription: '',
      fRoomPrice: 0,
      fBedCount: 0,
      isAvailable: false,
      availableBeds: 0,
      image: '',
      fRoomStatus: 'active',
      fRoomType: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  openModal(): void { this.roomModal.show(); }
  closeModal(): void { this.roomModal.hide(); this.cancelForm(); }

  loadRooms(): void {
    this.roomTableErpService.getRooms().subscribe({
      next: (response) => {
        console.log('API 回應:', response);
        this.rooms = response.data.map((r: RoomTableErp) => ({
          ...r,
          images: r.images || [],
          fRoomStatus: r.fRoomStatus || 'active',
          lastUpdated: r.lastUpdated || new Date().toISOString(),
        }));
      },
      error: (err) => {
        console.error('載入房間失敗:', err.status, err.statusText, err.message); // 顯示詳細錯誤
        this.rooms = []; // 確保顯示空表
      },
    });
  }

  newRoom(): void {
    this.currentRoom = this.resetRoom();
    this.selectedFile = null;
    this.imagePreview = null;
    this.isEdit = false;
    this.showForm = true;
    this.openModal();
  }

  editRoom(room: RoomTableErp): void {
    this.currentRoom = { ...room };
    this.selectedFile = null;
    this.imagePreview = room.images[0] || null;
    this.isEdit = true;
    this.showForm = true;
    this.openModal();
  }

  cancelForm(): void {
    this.showForm = false;
    this.currentRoom = this.resetRoom();
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagePreview = e.target.result; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  submitForm(): void {
    const formData = new FormData();
    formData.append('fRoomAlias', this.currentRoom.fRoomAlias || '');
    formData.append('fRoomDescription', this.currentRoom.fRoomDescription || '');
    formData.append('fRoomPrice', String(this.currentRoom.fRoomPrice || 0));
    formData.append('fBedCount', String(this.currentRoom.fBedCount || 0));
    formData.append('fRoomType', String(this.currentRoom.fRoomType ? 'true' : 'false'));
    formData.append('fRoomStatus', this.currentRoom.fRoomStatus || 'active');

    if (this.selectedFile) {
      formData.append('roomImage', this.selectedFile, this.selectedFile.name);
    }

    if (this.isEdit && this.currentRoom.fRoomId > 0) {
      this.roomTableErpService.updateRoom(this.currentRoom.fRoomId, formData).subscribe({
        next: () => { this.loadRooms(); this.closeModal(); },
        error: (err) => console.error('更新失敗', err),
      });
    } else {
      this.roomTableErpService.createRoom(formData).subscribe({
        next: () => { this.loadRooms(); this.closeModal(); },
        error: (err) => console.error('新增失敗', err),
      });
    }
  }

  toggleRoomStatus(room: RoomTableErp): void {
    const newStatus = room.fRoomStatus === 'active' ? 'inactive' : 'active';
    if (!confirm(`確定要${newStatus === 'active' ? '啟用' : '停用'}這個房間嗎？`)) return;

    this.roomTableErpService.toggleRoomStatus(room.fRoomId, newStatus).subscribe({
      next: () => (room.fRoomStatus = newStatus),
      error: (err) => console.error('狀態切換失敗', err),
    });
  }
}
