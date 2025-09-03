import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberEventCouponComponent } from './member-event-coupon.component';

describe('MemberEventCouponComponent', () => {
  let component: MemberEventCouponComponent;
  let fixture: ComponentFixture<MemberEventCouponComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberEventCouponComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberEventCouponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
