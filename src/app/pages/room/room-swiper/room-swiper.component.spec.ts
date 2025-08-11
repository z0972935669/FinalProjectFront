import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomSwiperComponent } from './room-swiper.component';

describe('RoomSwiperComponent', () => {
  let component: RoomSwiperComponent;
  let fixture: ComponentFixture<RoomSwiperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomSwiperComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RoomSwiperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
