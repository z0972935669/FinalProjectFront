import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplieslistComponent } from './supplieslist.component';

describe('SupplieslistComponent', () => {
  let component: SupplieslistComponent;
  let fixture: ComponentFixture<SupplieslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplieslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplieslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
