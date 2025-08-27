import { TestBed } from '@angular/core/testing';

import { RoomTableErpService } from './room-table-erp.service';

describe('RoomTableErpService', () => {
  let service: RoomTableErpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomTableErpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
