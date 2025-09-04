import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomOccupancyComponent } from './room-occupancy-erp.component';

describe('RoomOccupancyComponent', () => {
  let component: RoomOccupancyComponent;
  let fixture: ComponentFixture<RoomOccupancyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomOccupancyComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RoomOccupancyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
