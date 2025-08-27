import { TestBed } from '@angular/core/testing';

import { SuppliesSalesService } from './supplies-sales.service';

describe('SuppliesSalesService', () => {
  let service: SuppliesSalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuppliesSalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
