import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RoomTableErpService } from '../../../services/room/room-table-erp.service';
import { RoomTableErp } from '../../../interfaces/room/roomerp.interface';
import { signal, computed } from '@angular/core';

declare var bootstrap: any;

@Component({
  selector: 'app-room-table-erp',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './room-table-erp.component.html',
  styleUrls: ['./room-table-erp.component.scss'],
})
export class RoomTableErpComponent implements OnInit {
  rooms = signal<RoomTableErp[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  keyword = signal<string>('');
  statusSel = signal<'all' | 'active' | 'vacant'>('all');
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  originalImages: string[] = [];
  roomModal: any;
  descriptionModal: any;
  occupancyModal: any;
  errorMessage: string | null = null;
  baseUrl = 'https://localhost:7124/';
  currentRoom: RoomTableErp = this.resetRoom();
  isEdit = false;
  selectedOccupancies: number[] = [];

  constructor(private roomTableErpService: RoomTableErpService) { }

  ngOnInit(): void {
    this.loadRooms();
    const modalElement = document.getElementById('roomModal');
    if (modalElement) {
      this.roomModal = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
    } else {
      console.error('Modal element with ID "roomModal" not found');
    }
    const descModalElement = document.getElementById('descriptionModal');
    if (descModalElement) {
      this.descriptionModal = new bootstrap.Modal(descModalElement);
    }
    const occModalElement = document.getElementById('occupancyModal');
    if (occModalElement) {
      this.occupancyModal = new bootstrap.Modal(occModalElement);
    }
  }

  filteredRooms = computed(() => {
    const list = this.rooms();
    const kw = this.keyword().trim().toLowerCase();
    const status = this.statusSel();

    return list.filter(room => {
      if (status !== 'all' && room.fRoomStatus !== status) return false;

      if (!kw) return true;
      const name = (room.fRoomName ?? '').toLowerCase();
      const alias = (room.fRoomAlias ?? '').toLowerCase();
      const desc = (room.fRoomDescription ?? '').toLowerCase();
      const price = room.fRoomPrice?.toString() ?? '';
      const bedCount = room.fBedCount?.toString() ?? '';
      const type = room.fRoomType ? '多人房' : '單人房';
      const roomStatus = room.fRoomStatus === 'active' ? '上架' : '下架';

      return name.includes(kw) || alias.includes(kw) || desc.includes(kw) || price.includes(kw) ||
        bedCount.includes(kw) || type.includes(kw) || roomStatus.includes(kw);
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredRooms().length / this.pageSize()));

  pageRooms = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredRooms().slice(start, start + this.pageSize());
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  resetRoom(): RoomTableErp {
    return {
      fRoomId: 0,
      fRoomName: '',
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
      occupiedInfo: [],
      showFullDescription: false,
    };
  }

  openModal(): void {
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.originalImages = [];
    this.roomModal.show();
  }

  closeModal(): void {
    this.roomModal.hide();
    this.currentRoom = this.resetRoom();
    this.isEdit = false;
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.originalImages = [];
  }

  loadRooms(): void {
    this.loading.set(true);
    this.roomTableErpService.getRooms().subscribe({
      next: (response) => {
        this.rooms.set(response.data.map(room => ({
          ...room,
          showFullDescription: false,
          images: Array.isArray(room.images) ? room.images : [], // 確保 images 是陣列
        })));
        console.log('Loaded rooms:', response.data.map(r => ({ id: r.fRoomId, images: r.images }))); // 日誌
        this.loading.set(false);
      },
      error: (err) => {
        console.error('載入房間失敗', err);
        this.error.set(err.error?.message || '無法載入房間列表，請稍後重試');
        this.loading.set(false);
      }
    });
  }

  editRoom(room: RoomTableErp): void {
    this.currentRoom = { ...room };
    this.isEdit = true;
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.originalImages = [...(room.images || [])];
    console.log('Edit room images:', this.originalImages); // 日誌
    this.roomModal.show();
  }

  saveRoom(): void {
    if (!this.currentRoom.fRoomName || !this.currentRoom.fRoomAlias || !this.currentRoom.fRoomDescription || this.currentRoom.fRoomPrice <= 0 || this.currentRoom.fBedCount <= 0) {
      this.errorMessage = '請填寫所有必填欄位，且價格與床位數必須大於 0';
      return;
    }

    const formData = new FormData();
    formData.append('fRoomName', this.currentRoom.fRoomName || '');
    formData.append('fRoomAlias', this.currentRoom.fRoomAlias || '');
    formData.append('fRoomDescription', this.currentRoom.fRoomDescription || '');
    formData.append('fRoomPrice', String(this.currentRoom.fRoomPrice || 0));
    formData.append('fBedCount', String(this.currentRoom.fBedCount || 0));
    formData.append('fRoomType', String(this.currentRoom.fRoomType));
    formData.append('fRoomStatus', this.currentRoom.fRoomStatus.trim());

    // 僅傳送 existingImages 如果不為空
    if (this.originalImages.length > 0) {
      formData.append('existingImages', JSON.stringify(this.originalImages));
      console.log('Sending existingImages:', this.originalImages); // 日誌
    } else {
      console.log('No existing images to send');
    }

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('roomImages', file, file.name);
      });
    }

    if (this.isEdit && this.currentRoom.fRoomId > 0) {
      this.roomTableErpService.updateRoom(this.currentRoom.fRoomId, formData).subscribe({
        next: () => {
          this.loadRooms();
          this.closeModal();
        },
        error: (err) => {
          console.error('更新失敗', err);
          this.errorMessage = err.error?.message || '更新房間失敗，請檢查輸入數據';
        }
      });
    } else {
      this.roomTableErpService.createRoom(formData).subscribe({
        next: () => {
          this.loadRooms();
          this.closeModal();
        },
        error: (err) => {
          console.error('新增失敗', err);
          this.errorMessage = err.error?.message || '新增房間失敗，請檢查輸入數據';
        }
      });
    }
  }

  deleteRoom(roomId: number): void {
    if (!confirm('確定要刪除此房間嗎？')) return;
    this.roomTableErpService.deleteRoom(roomId).subscribe({
      next: () => {
        this.loadRooms();
      },
      error: (err) => {
        console.error('刪除失敗', err);
        this.errorMessage = err.error?.message || '刪除房間失敗，請稍後重試';
      }
    });
  }

  toggleRoomStatus(room: RoomTableErp): void {
    const newStatus = room.fRoomStatus === 'active' ? 'vacant' : 'active';
    if (!confirm(`確定要${newStatus === 'active' ? '上架' : '下架'}這個房間嗎？`)) return;

    this.roomTableErpService.toggleRoomStatus(room.fRoomId, newStatus).subscribe({
      next: () => {
        room.fRoomStatus = newStatus;
        this.loadRooms();
      },
      error: (err) => console.error('狀態切換失敗', err)
    });
  }

  openDescriptionModal(room: RoomTableErp): void {
    this.currentRoom = { ...room };
    this.descriptionModal.show();
  }

  closeDescriptionModal(): void {
    this.descriptionModal.hide();
    this.currentRoom = this.resetRoom();
  }

  openOccupancyModal(room: RoomTableErp): void {
    this.currentRoom = { ...room };
    this.selectedOccupancies = [];
    this.occupancyModal.show();
  }

  closeOccupancyModal(): void {
    this.occupancyModal.hide();
    this.currentRoom = this.resetRoom();
    this.selectedOccupancies = [];
  }

  toggleOccupancySelection(id: number): void {
    const index = this.selectedOccupancies.indexOf(id);
    if (index !== -1) {
      this.selectedOccupancies.splice(index, 1);
    } else {
      this.selectedOccupancies.push(id);
    }
  }

  checkout(): void {
    if (this.selectedOccupancies.length === 0) {
      alert('請至少選擇一項入住資訊');
      return;
    }

    if (!confirm('確定要為選中的入住記錄辦理離院嗎？')) return;

    this.roomTableErpService.checkoutOccupancies(this.selectedOccupancies).subscribe({
      next: () => {
        alert('離院成功');
        this.loadRooms();
        this.closeOccupancyModal();
      },
      error: (err) => {
        console.error('離院失敗', err);
        this.errorMessage = err.error?.message || '離院失敗，請檢查輸入數據';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.imagePreviews = [];
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            this.imagePreviews.push(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
      input.value = ''; // 清空檔案輸入框
    }
  }

  removeImage(preview: string): void {
    const index = this.imagePreviews.indexOf(preview);
    if (index !== -1) {
      this.imagePreviews.splice(index, 1);
      this.selectedFiles.splice(index, 1);
    }
  }

  removeExistingImage(image: string): void {
    const index = this.originalImages.indexOf(image);
    if (index !== -1) {
      this.originalImages.splice(index, 1);
    }
  }

  getImageUrl(imagePath: string): string {
    const fileName = imagePath.split('/').pop() || imagePath;
    return this.baseUrl + 'images/rooms/' + fileName;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('圖片載入失敗:', imgElement.src);
    imgElement.src = this.baseUrl + 'images/rooms/default-room-image.jpg';
    imgElement.onerror = () => {
      console.warn('第一後備圖片失敗:', imgElement.src);
      imgElement.src = this.baseUrl + 'images/rooms/alternative-default.jpg';
      imgElement.onerror = null;
    };
    setTimeout(() => {
      if (!imgElement.complete) {
        console.warn('後備圖片載入超時:', imgElement.src);
      }
    }, 2000);
  }
}
