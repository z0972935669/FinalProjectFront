import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeattendancerecordsComponent } from './employeeattendancerecords.component';

describe('EmployeeattendancerecordsComponent', () => {
  let component: EmployeeattendancerecordsComponent;
  let fixture: ComponentFixture<EmployeeattendancerecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeattendancerecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeattendancerecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
