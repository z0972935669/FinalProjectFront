// src/app/services/room/room-swiper.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoomSwiperService } from './room-swiper.service';
import { Room } from '../../interfaces/room/room.interface';

describe('RoomSwiperService', () => {
  let service: RoomSwiperService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoomSwiperService]
    });
    service = TestBed.inject(RoomSwiperService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // 確保沒有未處理的請求
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve rooms from the API via GET', () => {
    const dummyResponse = {
      message: '成功獲取房間列表',
      data: [
        {
          fRoomId: 1,
          fRoomAlias: '測試房間',
          image: 'assets/img/test.jpg',
          fRoomDescription: '測試描述',
          fRoomPrice: 50000,
          isAvailable: true
        }
      ] as Room[]
    };

    service.getRooms().subscribe(response => {
      expect(response.data.length).toBe(1);
      expect(response.data[0].fRoomAlias).toBe('測試房間');
      expect(response.message).toBe('成功獲取房間列表');
    });

    const req = httpMock.expectOne(service['apiUrl']); // apiUrl 是 private，需用 ['apiUrl'] 存取，或在測試中 mock
    expect(req.request.method).toBe('GET');
    req.flush(dummyResponse); // 模擬 API 回應
  });

  it('should handle HTTP errors', () => {
    const errorMessage = 'API 錯誤';

    service.getRooms().subscribe({
      next: () => fail('應該拋出錯誤'),
      error: (error) => expect(error.message).toContain('Http failure response')
    });

    const req = httpMock.expectOne(service['apiUrl']);
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});
