import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomTableErpComponent } from './room-table-erp.component';

describe('RoomTableErpComponent', () => {
  let component: RoomTableErpComponent;
  let fixture: ComponentFixture<RoomTableErpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomTableErpComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RoomTableErpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
