import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentmaintenancelistComponent } from './equipmentmaintenancelist.component';

describe('EquipmentmaintenancelistComponent', () => {
  let component: EquipmentmaintenancelistComponent;
  let fixture: ComponentFixture<EquipmentmaintenancelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentmaintenancelistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentmaintenancelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
