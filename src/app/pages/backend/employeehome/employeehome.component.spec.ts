import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeehomeComponent } from './employeehome.component';

describe('EmployeehomeComponent', () => {
  let component: EmployeehomeComponent;
  let fixture: ComponentFixture<EmployeehomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeehomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeehomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
