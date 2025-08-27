import { TestBed } from '@angular/core/testing';

import { CheckoutCityService } from './checkout-city.service';

describe('CheckoutCityService', () => {
  let service: CheckoutCityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckoutCityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
