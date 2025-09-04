import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomVisitreservationErpComponent } from './room-visitreservation-erp.component';

describe('RoomVisitreservationErpComponent', () => {
  let component: RoomVisitreservationErpComponent;
  let fixture: ComponentFixture<RoomVisitreservationErpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomVisitreservationErpComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RoomVisitreservationErpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
