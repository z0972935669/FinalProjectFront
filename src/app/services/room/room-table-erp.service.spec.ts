import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoomTableErpService } from './room-table-erp.service';
import { RoomTableErp } from '../../interfaces/room/roomerp.interface';

describe('RoomTableErpService', () => {
  let service: RoomTableErpService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://localhost:7124/api/RoomsErp';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoomTableErpService]
    });
    service = TestBed.inject(RoomTableErpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch rooms from API', () => {
    const mockRooms: RoomTableErp[] = [
      {
        fRoomId: 1,
        fRoomName: 'Room 1',
        fRoomAlias: 'R1',
        images: ['/rooms/image1.jpg'],
        fRoomDescription: 'Test description',
        fRoomPrice: 1000,
        fBedCount: 2,
        isAvailable: true,
        availableBeds: 2,
        image: '/rooms/image1.jpg',
        fRoomStatus: 'active',
        fRoomType: false,
        lastUpdated: new Date().toISOString(),
        occupiedInfo: [],
        showFullDescription: false
      }
    ];

    service.getRooms().subscribe(response => {
      expect(response.data.length).toBe(1);
      expect(response.data).toEqual(mockRooms);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockRooms });
  });

  it('should create a room', () => {
    const formData = new FormData();
    formData.append('fRoomName', 'Room 1');

    service.createRoom(formData).subscribe(response => {
      expect(response.message).toBe('房間新增成功');
      expect(response.roomId).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ message: '房間新增成功', roomId: 1 });
  });

  it('should update a room', () => {
    const formData = new FormData();
    formData.append('fRoomName', 'Updated Room');

    service.updateRoom(1, formData).subscribe(response => {
      expect(response.message).toBe('房間更新成功');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: '房間更新成功' });
  });

  it('should delete a room', () => {
    service.deleteRoom(1).subscribe(response => {
      expect(response.message).toBe('房間刪除成功');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: '房間刪除成功' });
  });

  it('should toggle room status', () => {
    service.toggleRoomStatus(1, 'vacant').subscribe(response => {
      expect(response.message).toBe('狀態更新成功');
    });

    const req = httpMock.expectOne(`${apiUrl}/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe('"vacant"');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({ message: '狀態更新成功' });
  });

  it('should handle error when fetching rooms fails', () => {
    service.getRooms().subscribe({
      error: (error) => {
        expect(error.message).toBe('無法獲取房間列表，請稍後重試');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  it('should handle error when toggling room status fails', () => {
    service.toggleRoomStatus(1, 'vacant').subscribe({
      error: (error) => {
        expect(error.message).toBe('無法切換房間狀態，請稍後重試');
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1/status`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

});
