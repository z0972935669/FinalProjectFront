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
  roomTypeFilter: string = ''; // 房間類型篩選
  showAvailableOnly: boolean = false; // 僅顯示可入住的空位房間
  sortFilter: string = ''; // 排序方式

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
        console.log('API 回應完整資料:', response.data);
        this.rooms = response.data
          .filter(room => room.image && room.image.trim() !== '')
          .map(room => ({
            fRoomId: room.fRoomId, // 映射後端的大寫到前端的小寫
            fRoomAlias: room.fRoomAlias,
            image: room.image,
            fRoomDescription: room.fRoomDescription,
            fRoomPrice: room.fRoomPrice,
            isAvailable: room.isAvailable, // 映射後端 IsAvailable 到前端 isAvailable
            availableBeds: room.availableBeds // 映射後端 AvailableBeds 到前端 availableBeds
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

  // 應用所有篩選條件
  applyFilters(): void {
    let tempRooms = this.rooms.filter(room => {
      const matchesKeyword = this.searchKeyword.trim() === '' ||
        room.fRoomAlias.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        (room.fRoomPrice?.toString() || '').includes(this.searchKeyword);

      const matchesPrice = this.priceFilter === '' ||
        (this.priceFilter === '40000' && room.fRoomPrice! < 40000) ||
        (this.priceFilter === '45000' && room.fRoomPrice! >= 40000 && room.fRoomPrice! <= 50000) ||
        (this.priceFilter === '50000' && room.fRoomPrice! > 50000);

      const matchesRoomType = this.roomTypeFilter === '' ||
        (this.roomTypeFilter === 'single' && room.fRoomAlias.includes('單人')) ||
        (this.roomTypeFilter === 'double' && room.fRoomAlias.includes('雙人')) ||
        (this.roomTypeFilter === 'four' && room.fRoomAlias.includes('四人')) ||
        (this.roomTypeFilter === 'six' && room.fRoomAlias.includes('六人'));

      const matchesAvailability = !this.showAvailableOnly || room.availableBeds > 0;

      return matchesKeyword && matchesPrice && matchesRoomType && matchesAvailability;
    });

    // 應用排序
    if (this.sortFilter === 'highToLow') {
      tempRooms.sort((a, b) => (b.fRoomPrice ?? 0) - (a.fRoomPrice ?? 0));
    } else if (this.sortFilter === 'lowToHigh') {
      tempRooms.sort((a, b) => (a.fRoomPrice ?? 0) - (b.fRoomPrice ?? 0));
    }

    this.filteredRooms = tempRooms;
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

  // 處理房間類型篩選變化
  onRoomTypeChange(event: Event): void {
    this.roomTypeFilter = (event.target as HTMLSelectElement).value;
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
    const fileName = imagePath.startsWith('rooms/') ? imagePath.replace('rooms/', '') : imagePath;
    return this.staticUrl + 'images/rooms/' + fileName;
  }
}
