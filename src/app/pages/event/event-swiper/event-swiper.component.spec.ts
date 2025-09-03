import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSwiperComponent } from './event-swiper.component';

describe('EventSwiperComponent', () => {
  let component: EventSwiperComponent;
  let fixture: ComponentFixture<EventSwiperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSwiperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSwiperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
