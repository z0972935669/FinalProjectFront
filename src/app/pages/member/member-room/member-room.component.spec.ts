import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberRoomComponent } from './member-room.component';

describe('MemberRoomComponent', () => {
  let component: MemberRoomComponent;
  let fixture: ComponentFixture<MemberRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberRoomComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MemberRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
