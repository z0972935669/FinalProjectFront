import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoomDetailService } from './room-detail.service';
import { RoomDetail, RoomOccupancy } from '../../interfaces/room/room.interface';

describe('RoomDetailService', () => {
  let service: RoomDetailService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://localhost:7124/api/Rooms';
  const memberApiUrl = 'https://localhost:7124/api/Member';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoomDetailService]
    });
    service = TestBed.inject(RoomDetailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get room by id', () => {
    const mockRoom: RoomDetail = {
      fRoomId: 1,
      fRoomAlias: 'Room 1',
      images: ['/rooms/image1.jpg'],
      fRoomDescription: 'Test description',
      fRoomPrice: 1000,
      fBedCount: 2,
      isAvailable: true,
      availableBeds: 2
    };

    service.getRoomById(1).subscribe(response => {
      expect(response.data).toEqual(mockRoom);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: '成功獲取房間詳情', data: mockRoom });
  });

  it('should get current member', () => {
    const mockMember = {
      fMemberId: 1,
      fName: 'Test User',
      fEmail: 'test@example.com',
      fPhone: '1234567890',
      fResidesInCareHomeStatus: false
    };

    service.getCurrentMember().subscribe(response => {
      expect(response).toEqual(mockMember);
    });

    const req = httpMock.expectOne(`${memberApiUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMember);
  });

  it('should submit booking and update member status', () => {
    const booking: RoomOccupancy = {
      fRoomId: 1,
      checkInDate: '2025-09-05',
      fBillingAmount: 1000,
      paymentMethod: 'paypal',
      contact: '1234567890',
      paypalOrderId: 'PAYPAL123'
    };

    service.submitBooking(booking).subscribe(response => {
      expect(response.message).toBe('預訂提交成功');
      expect(response.occupancyId).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      FRoomId: 1,
      FCheckInDate: new Date('2025-09-05').toISOString(),
      FBillingAmount: 1000,
      FPaymentMethod: 'paypal',
      FPaypalOrderId: 'PAYPAL123'
    });
    req.flush({ message: '預訂提交成功', occupancyId: 1 });
  });

  it('should handle booking error', () => {
    const booking: RoomOccupancy = {
      fRoomId: 1,
      checkInDate: '2025-09-05',
      fBillingAmount: 1000,
      paymentMethod: 'paypal',
      contact: '1234567890',
      paypalOrderId: 'PAYPAL123'
    };

    service.submitBooking(booking).subscribe({
      error: (err) => {
        expect(err.message).toBe('預訂失敗，請檢查輸入或聯繫客服');
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/bookings`);
    expect(req.request.method).toBe('POST');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
