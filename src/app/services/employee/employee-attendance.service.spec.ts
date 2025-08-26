import { TestBed } from '@angular/core/testing';

import { EmployeeAttendanceService } from './employee-attendance.service';

describe('EmployeeAttendanceService', () => {
  let service: EmployeeAttendanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeAttendanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
