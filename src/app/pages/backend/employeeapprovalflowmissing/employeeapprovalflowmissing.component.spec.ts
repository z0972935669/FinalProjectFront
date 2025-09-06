import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeapprovalflowmissingComponent } from './employeeapprovalflowmissing.component';

describe('EmployeeapprovalflowmissingComponent', () => {
  let component: EmployeeapprovalflowmissingComponent;
  let fixture: ComponentFixture<EmployeeapprovalflowmissingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeapprovalflowmissingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeapprovalflowmissingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
