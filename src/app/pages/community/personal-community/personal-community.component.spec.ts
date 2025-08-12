import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalCommunityComponent } from './personal-community.component';

describe('PersonalCommunityComponent', () => {
  let component: PersonalCommunityComponent;
  let fixture: ComponentFixture<PersonalCommunityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalCommunityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalCommunityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
