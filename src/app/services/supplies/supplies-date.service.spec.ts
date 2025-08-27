import { TestBed } from '@angular/core/testing';

import { SuppliesDateService } from './supplies-date.service';

describe('SuppliesDateService', () => {
  let service: SuppliesDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuppliesDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
