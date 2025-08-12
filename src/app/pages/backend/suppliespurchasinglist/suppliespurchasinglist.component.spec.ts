import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppliespurchasinglistComponent } from './suppliespurchasinglist.component';

describe('SuppliespurchasinglistComponent', () => {
  let component: SuppliespurchasinglistComponent;
  let fixture: ComponentFixture<SuppliespurchasinglistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliespurchasinglistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppliespurchasinglistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
