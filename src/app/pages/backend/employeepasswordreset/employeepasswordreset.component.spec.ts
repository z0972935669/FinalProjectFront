import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeepasswordresetComponent } from './employeepasswordreset.component';

describe('EmployeepasswordresetComponent', () => {
  let component: EmployeepasswordresetComponent;
  let fixture: ComponentFixture<EmployeepasswordresetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeepasswordresetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeepasswordresetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
