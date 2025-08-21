import { TestBed } from '@angular/core/testing';

import { SuppliesCategoryService } from './supplies-category.service';

describe('SuppliesCategoryService', () => {
  let service: SuppliesCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuppliesCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
