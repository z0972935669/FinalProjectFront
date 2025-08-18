import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentsupplierlistComponent } from './equipmentsupplierlist.component';

describe('EquipmentsupplierlistComponent', () => {
  let component: EquipmentsupplierlistComponent;
  let fixture: ComponentFixture<EquipmentsupplierlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentsupplierlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentsupplierlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
