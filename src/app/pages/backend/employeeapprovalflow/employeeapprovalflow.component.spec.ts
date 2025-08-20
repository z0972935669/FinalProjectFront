import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeapprovalflowComponent } from './employeeapprovalflow.component';

describe('EmployeeapprovalflowComponent', () => {
  let component: EmployeeapprovalflowComponent;
  let fixture: ComponentFixture<EmployeeapprovalflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeapprovalflowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeapprovalflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
