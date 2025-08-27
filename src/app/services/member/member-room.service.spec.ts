import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberRoomComponent } from '../../pages/member/member-room/member-room.component';
import { MemberRoomService } from '../../services/member/member-room.service';
import { of } from 'rxjs';

describe('MemberRoomComponent', () => {
  let component: MemberRoomComponent;
  let fixture: ComponentFixture<MemberRoomComponent>;
  let service: jasmine.SpyObj<MemberRoomService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MemberRoomService', ['getMemberRoom']);
    spy.getMemberRoom.and.returnValue(of({
      member: { fName: '王大爺', fIdNumber: 'A12*****89' },
      roomTable: { fRoomName: 'A101', fRoomAlias: '松竹紅單人房', fRoomType: true, fRoomPrice: 56000 },
      roomBed: { fBedCode: 'A' },
      roomOccupancy: { fBillingStatus: true }
    }));

    await TestBed.configureTestingModule({
      imports: [MemberRoomComponent],
      providers: [{ provide: MemberRoomService, useValue: spy }]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load member room data on init', () => {
    expect(component.Member.fName).toBe('王大爺');
    expect(component.RoomTable.fRoomAlias).toBe('松竹紅單人房');
  });
});
