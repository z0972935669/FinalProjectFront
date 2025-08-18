import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentrentlistComponent } from './equipmentrentlist.component';

describe('EquipmentrentlistComponent', () => {
  let component: EquipmentrentlistComponent;
  let fixture: ComponentFixture<EquipmentrentlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentrentlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentrentlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
