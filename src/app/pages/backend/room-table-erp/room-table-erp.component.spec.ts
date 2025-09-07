import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomTableErpComponent } from './room-table-erp.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('RoomTableErpComponent', () => {
  let component: RoomTableErpComponent;
  let fixture: ComponentFixture<RoomTableErpComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomTableErpComponent, HttpClientTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RoomTableErpComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate required fields', () => {
    component.currentRoom.fRoomName = '';
    component.currentRoom.fRoomAlias = '';
    component.currentRoom.fRoomPrice = -1;
    component.saveRoom();
    expect(component.errorMessage).toBe('請檢查必填欄位或輸入格式');
    expect(component.roomForm?.form.touched).toBeTrue();
  });

  it('should allow saving with valid form data', () => {
    component.currentRoom.fRoomName = 'Room 1';
    component.currentRoom.fRoomAlias = 'R1';
    component.currentRoom.fRoomPrice = 1000;
    component.currentRoom.fBedCount = 2;
    component.roomForm?.form.controls['fRoomName'].setValue('Room 1');
    component.roomForm?.form.controls['fRoomAlias'].setValue('R1');
    component.roomForm?.form.controls['fRoomPrice'].setValue(1000);
    component.roomForm?.form.controls['fBedCount'].setValue(2);
    component.saveRoom();

    const req = httpMock.expectOne('https://localhost:7124/api/RoomsErp');
    expect(req.request.method).toBe('POST');
    req.flush({ message: '房間新增成功', roomId: 1 });

    expect(component.errorMessage).toBeNull();
  });
  it('should delete a room successfully', () => {
    component.deleteRoom(1);
    const req = httpMock.expectOne('https://localhost:7124/api/RoomsErp/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: '房間刪除成功' });
    expect(component.errorMessage).toBeNull();
  });

  it('should handle delete error', () => {
    component.deleteRoom(1);
    const req = httpMock.expectOne('https://localhost:7124/api/RoomsErp/1');
    expect(req.request.method).toBe('DELETE');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    expect(component.errorMessage).toBe('無法刪除房間，請稍後重試');
  });
});
