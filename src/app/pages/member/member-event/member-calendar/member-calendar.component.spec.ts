import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberCalendarComponent } from './member-calendar.component';

describe('MemberCalendarComponent', () => {
  let component: MemberCalendarComponent;
  let fixture: ComponentFixture<MemberCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
