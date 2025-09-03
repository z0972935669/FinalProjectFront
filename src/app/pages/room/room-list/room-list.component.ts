import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoomListService } from '../../../services/room/room-list.service';
import { Room, RoomVisitReservation } from '../../../interfaces/room/room.interface';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = []; // 用於存儲篩選後的房間
  RoomVisitReservation: RoomVisitReservation = { fName: '', fEmail: '', fPhoneOrLineId: '', fReservationDate: '' };
  minDate: string;
  staticUrl = 'https://localhost:7124/'; // 基於後端根路徑
  searchKeyword: string = ''; // 搜尋關鍵字
  priceFilter: string = ''; // 價格篩選
  showAvailableOnly: boolean = false; // 僅顯示可入住的空位房間
  sortFilter: string = ''; // 排序方式

  // === 分頁設定 ===
  pageSize = 9; // 每頁顯示 3 筆
  currentPage = 1;

  constructor(private roomService: RoomListService) {
    const today = new Date();
    const fifteenDaysLater = new Date(today);
    fifteenDaysLater.setDate(today.getDate() + 15);
    this.minDate = fifteenDaysLater.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  // 載入房間資料
  loadRooms(): void {
    this.roomService.getRooms().pipe(
      timeout(5000)
    ).subscribe({
      next: (response) => {
        this.rooms = response.data
          .filter(room => room.image && room.image.trim() !== '')
          .map(room => ({
            fRoomId: room.fRoomId,
            fRoomAlias: room.fRoomAlias,
            image: room.image,
            fRoomDescription: room.fRoomDescription,
            fRoomPrice: room.fRoomPrice,
            isAvailable: room.isAvailable,
            availableBeds: room.availableBeds
          }) as Room);
        this.filteredRooms = [...this.rooms]; // 初始化 filteredRooms
        this.applyFilters(); // 應用初始篩選
      },
      error: (err) => {
        console.error('API 或圖片載入錯誤:', err);
        this.rooms = [];
        this.filteredRooms = [];
        alert('載入房間列表超時或失敗，請檢查網路或聯繫客服');
      }
    });
  }

  // 應用篩選
  applyFilters(): void {
    let tempRooms = [...this.rooms];

    // 關鍵字搜尋
    if (this.searchKeyword) {
      const keyword = this.searchKeyword.toLowerCase();
      tempRooms = tempRooms.filter(room =>
        (room.fRoomAlias?.toLowerCase().includes(keyword) ?? false) ||
        (room.fRoomDescription?.toLowerCase().includes(keyword) ?? false)
      );
    }

    // 價格篩選
    if (this.priceFilter) {
      tempRooms = tempRooms.filter(room => {
        const price = room.fRoomPrice ?? 0;
        if (this.priceFilter === '40000') return price < 40000;
        if (this.priceFilter === '45000') return price >= 40000 && price <= 50000;
        if (this.priceFilter === '50000') return price > 50000;
        return true; // 無篩選時不過濾
      });
    }

    // 僅顯示可用房間
    if (this.showAvailableOnly) {
      tempRooms = tempRooms.filter(room => room.isAvailable && (room.availableBeds ?? 0) > 0);
    }

    // 排序
    if (this.sortFilter === 'highToLow') {
      tempRooms.sort((a, b) => (b.fRoomPrice ?? 0) - (a.fRoomPrice ?? 0));
    } else if (this.sortFilter === 'lowToHigh') {
      tempRooms.sort((a, b) => (a.fRoomPrice ?? 0) - (b.fRoomPrice ?? 0));
    }

    this.filteredRooms = tempRooms;
    this.currentPage = 1; // 篩選後重置到第一頁
  }

  // 處理搜尋關鍵字變化
  onSearchChange(event: Event): void {
    this.searchKeyword = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  // 處理價格篩選變化
  onPriceChange(event: Event): void {
    this.priceFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  // 處理可用性勾選變化
  onAvailabilityChange(event: Event): void {
    this.showAvailableOnly = (event.target as HTMLInputElement).checked;
    this.applyFilters();
  }

  // 處理排序變化
  onSortChange(event: Event): void {
    this.sortFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onSubmit(reservation: RoomVisitReservation) {
    if (reservation.fName && reservation.fEmail && reservation.fPhoneOrLineId && reservation.fReservationDate) {
      this.roomService.submitReservation(reservation).subscribe({
        next: (response) => {
          alert(`預約成功！ID: ${response.data}`);
          this.resetForm();
        },
        error: (err) => {
          console.error('完整錯誤:', err);
          alert('預約失敗：' + (err.error?.message || err.message));
        }
      });
    } else {
      alert('請填寫所有必填欄位！');
    }
  }

  resetForm() {
    this.RoomVisitReservation = { fName: '', fEmail: '', fPhoneOrLineId: '', fReservationDate: '' };
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('圖片載入失敗:', imgElement.src, ' - 檢查 CORS 或伺服器狀態');
    imgElement.src = this.staticUrl + 'images/rooms/default-room-image.jpg';
    imgElement.onerror = () => {
      console.warn('第一後備圖片失敗:', imgElement.src);
      imgElement.src = this.staticUrl + 'images/rooms/alternative-default.jpg';
      imgElement.onerror = null;
    };
    setTimeout(() => {
      if (!imgElement.complete) {
        console.warn('後備圖片載入超時:', imgElement.src);
      }
    }, 2000);
  }

  getImageUrl(imagePath: string): string {
    const fileName = imagePath.split('/').pop() || imagePath; // 修正: 只取檔名，避免重複路徑
    return this.staticUrl + 'images/rooms/' + fileName;
  }

  // === 分頁設定 ===
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRooms.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pageRooms(): Room[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRooms.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  // trackBy（效能用，可選）
  trackById(_: number, room: Room) {
    return room.fRoomId;
  }
}
