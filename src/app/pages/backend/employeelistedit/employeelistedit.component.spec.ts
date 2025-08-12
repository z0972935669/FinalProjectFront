import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeelisteditComponent } from './employeelistedit.component';

describe('EmployeelisteditComponent', () => {
  let component: EmployeelisteditComponent;
  let fixture: ComponentFixture<EmployeelisteditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeelisteditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeelisteditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
