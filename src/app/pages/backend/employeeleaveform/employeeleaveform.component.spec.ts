import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeleaveformComponent } from './employeeleaveform.component';

describe('EmployeeleaveformComponent', () => {
  let component: EmployeeleaveformComponent;
  let fixture: ComponentFixture<EmployeeleaveformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeleaveformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeleaveformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
