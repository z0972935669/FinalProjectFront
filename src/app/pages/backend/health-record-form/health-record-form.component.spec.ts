import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthRecordFormComponent } from './health-record-form.component';

describe('HealthRecordFormComponent', () => {
  let component: HealthRecordFormComponent;
  let fixture: ComponentFixture<HealthRecordFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthRecordFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
