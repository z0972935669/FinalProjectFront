import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppliessaleslistComponent } from './suppliessaleslist.component';

describe('SuppliessaleslistComponent', () => {
  let component: SuppliessaleslistComponent;
  let fixture: ComponentFixture<SuppliessaleslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliessaleslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppliessaleslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
