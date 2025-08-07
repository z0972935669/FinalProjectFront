import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerSwiperComponent } from './banner-swiper.component';

describe('BannerSwiperComponent', () => {
  let component: BannerSwiperComponent;
  let fixture: ComponentFixture<BannerSwiperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerSwiperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerSwiperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
