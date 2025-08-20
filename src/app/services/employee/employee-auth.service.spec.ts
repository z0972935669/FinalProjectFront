import { TestBed } from '@angular/core/testing';

import { EmployeeAuthService } from './employee-auth.service';

describe('EmployeeAuthService', () => {
  let service: EmployeeAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
