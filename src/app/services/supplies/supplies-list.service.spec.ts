import { TestBed } from '@angular/core/testing';

import { SuppliesListService } from './supplies-list.service';

describe('SuppliesListService', () => {
  let service: SuppliesListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuppliesListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
