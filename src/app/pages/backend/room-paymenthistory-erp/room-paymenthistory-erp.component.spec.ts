import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomPaymenthistoryErpComponent } from './room-paymenthistory-erp.component';

describe('RoomPaymenthistoryErpComponent', () => {
  let component: RoomPaymenthistoryErpComponent;
  let fixture: ComponentFixture<RoomPaymenthistoryErpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomPaymenthistoryErpComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RoomPaymenthistoryErpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
