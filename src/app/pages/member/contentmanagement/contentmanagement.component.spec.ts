import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentmanagementComponent } from './contentmanagement.component';

describe('ContentmanagementComponent', () => {
  let component: ContentmanagementComponent;
  let fixture: ComponentFixture<ContentmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentmanagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
