import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoomErpService } from './room-erp.service';

describe('RoomErpService', () => {
  let service: RoomErpService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://localhost:7124/api/RoomsErp';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoomErpService]
    });
    service = TestBed.inject(RoomErpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get payment history', () => {
    const mockData = [{ memberId: 1, name: 'Test', billingAmount: 1000, billingDate: '2025-09-05', paymentHistory: [] }];
    service.getPaymentHistory().subscribe(response => {
      expect(response).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${apiUrl}/payment-history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get visit reservations', () => {
    const mockData = { reservations: [] };
    service.getVisitReservations().subscribe(response => {
      expect(response).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${apiUrl}/visit-reservations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should update visit status', () => {
    service.updateVisitStatus(1, '已聯絡').subscribe(response => {
      expect(response).toBeTruthy();
    });
    const req = httpMock.expectOne(`${apiUrl}/visit-reservations/1/status`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should create occupancy', () => {
    const dto = { memberId: 1, roomId: 1, bedId: 1, checkInDate: '2025-09-05', billingAmount: 1000, paymentMethod: '現金' };
    service.createOccupancy(dto).subscribe(response => {
      expect(response).toBeTruthy();
    });
    const req = httpMock.expectOne(`${apiUrl}/occupancy`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should get members', () => {
    const mockData = [{ fMemberId: 1, fName: 'Test' }];
    service.getMembers().subscribe(response => {
      expect(response).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${apiUrl}/members`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get rooms', () => {
    const mockData = [{ fRoomId: 1, fRoomName: 'Room 1' }];
    service.getRooms().subscribe(response => {
      expect(response).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${apiUrl}/rooms`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get beds', () => {
    const mockData = [{ fBedId: 1, fBedCode: 'Bed 1' }];
    service.getBeds(1).subscribe(response => {
      expect(response).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${apiUrl}/rooms/1/beds`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
