import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeforgotpasswordComponent } from './employeeforgotpassword.component';

describe('EmployeeforgotpasswordComponent', () => {
  let component: EmployeeforgotpasswordComponent;
  let fixture: ComponentFixture<EmployeeforgotpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeforgotpasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeforgotpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
