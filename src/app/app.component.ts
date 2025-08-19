import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = '安養院'; //專案名稱
  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const root = document.documentElement;
        // 強制把 scroll-behavior 設成 auto
        root.style.setProperty('scroll-behavior', 'auto', 'important');
        window.scrollTo(0, 0); // 立即跳到頂部，無動畫
      }
    });
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const isBackend = this.router.url.startsWith('/erp');
        document.body.classList.toggle('theme-backend', isBackend);
        document.body.classList.toggle('theme-frontend', !isBackend);
      });
  }
}
