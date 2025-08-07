import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutsuccessfulComponent } from './checkoutsuccessful.component';

describe('CheckoutsuccessfulComponent', () => {
  let component: CheckoutsuccessfulComponent;
  let fixture: ComponentFixture<CheckoutsuccessfulComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutsuccessfulComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutsuccessfulComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
