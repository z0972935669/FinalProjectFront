import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeelistdetailComponent } from './employeelistdetail.component';

describe('EmployeelistdetailComponent', () => {
  let component: EmployeelistdetailComponent;
  let fixture: ComponentFixture<EmployeelistdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeelistdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeelistdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
