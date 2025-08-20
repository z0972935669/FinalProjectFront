import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeapprovallistComponent } from './employeeapprovallist.component';

describe('EmployeeapprovallistComponent', () => {
  let component: EmployeeapprovallistComponent;
  let fixture: ComponentFixture<EmployeeapprovallistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeapprovallistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeapprovallistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
