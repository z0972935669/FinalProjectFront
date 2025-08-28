import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesetnewpasswordComponent } from './employeesetnewpassword.component';

describe('EmployeesetnewpasswordComponent', () => {
  let component: EmployeesetnewpasswordComponent;
  let fixture: ComponentFixture<EmployeesetnewpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesetnewpasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesetnewpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
