import { TestBed } from '@angular/core/testing';

import { SuppliesSupplierService } from './supplies-supplier.service';

describe('SuppliesSupplierService', () => {
  let service: SuppliesSupplierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuppliesSupplierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
