import { TestBed } from '@angular/core/testing';

import { EmployeeMissingpunchService } from './employee-missingpunch.service';

describe('EmployeeMissingpunchService', () => {
  let service: EmployeeMissingpunchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeMissingpunchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
