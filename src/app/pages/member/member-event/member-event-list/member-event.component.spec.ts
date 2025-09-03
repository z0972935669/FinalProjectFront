import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberEventComponent } from './member-event.component';

describe('MemberEventComponent', () => {
  let component: MemberEventComponent;
  let fixture: ComponentFixture<MemberEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
