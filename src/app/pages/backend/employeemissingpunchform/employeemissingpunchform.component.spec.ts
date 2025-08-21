import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeemissingpunchformComponent } from './employeemissingpunchform.component';

describe('EmployeemissingpunchformComponent', () => {
  let component: EmployeemissingpunchformComponent;
  let fixture: ComponentFixture<EmployeemissingpunchformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeemissingpunchformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeemissingpunchformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
