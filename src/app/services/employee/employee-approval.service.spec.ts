import { TestBed } from '@angular/core/testing';

import { EmployeeApprovalService } from './employee-approval.service';

describe('EmployeeApprovalService', () => {
  let service: EmployeeApprovalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeApprovalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
