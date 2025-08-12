import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentpurchasinglistComponent } from './equipmentpurchasinglist.component';

describe('EquipmentpurchasinglistComponent', () => {
  let component: EquipmentpurchasinglistComponent;
  let fixture: ComponentFixture<EquipmentpurchasinglistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentpurchasinglistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentpurchasinglistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
