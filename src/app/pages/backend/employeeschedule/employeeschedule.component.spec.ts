import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeescheduleComponent } from './employeeschedule.component';

describe('EmployeescheduleComponent', () => {
  let component: EmployeescheduleComponent;
  let fixture: ComponentFixture<EmployeescheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeescheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeescheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
