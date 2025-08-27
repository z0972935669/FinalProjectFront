import { TestBed } from '@angular/core/testing';

import { SuppliesPurchasingService } from './supplies-purchasing.service';

describe('SuppliesPurchasingService', () => {
  let service: SuppliesPurchasingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuppliesPurchasingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
