import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppliessupplierlistComponent } from './suppliessupplierlist.component';

describe('SuppliessupplierlistComponent', () => {
  let component: SuppliessupplierlistComponent;
  let fixture: ComponentFixture<SuppliessupplierlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliessupplierlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppliessupplierlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
