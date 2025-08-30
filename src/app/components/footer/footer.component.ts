import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  showGoTop = false;

  // 如果實際滾動的是 window，就用這個
  @HostListener('window:scroll')
  onWindowScroll() {
    this.showGoTop = (window.pageYOffset || document.documentElement.scrollTop) > 300;
  }

  goTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
