import { Component, OnDestroy, OnInit } from '@angular/core';
import { AssetLoaderService } from '../../core/asset-loader.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatFloatingComponent } from '../../pages/community/chat-floating/chat-floating.component';

@Component({
  selector: 'app-frontend',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterOutlet, CommonModule, ChatFloatingComponent],
  templateUrl: './frontend.component.html',
})
export class FrontendComponent implements OnInit, OnDestroy {
  private styleEls: HTMLElement[] = [];
  private scriptEls: HTMLElement[] = [];

  chatVisible = false; // 控制聊天視窗顯示

  constructor(private assets: AssetLoaderService) {}

  async ngOnInit() {
    // 前台專用 CSS
    const styles = [
      'assets/lib/owlcarousel/assets/owl.carousel.min.css',
      'assets/lib/lightbox/css/lightbox.min.css',
      'assets/css/bootstrap.min.css',
      'assets/css/style.css',
      // 如果你把 swiper css 複製到 assets/vendor，放進來即可：
      'assets/vendor/swiper/swiper-bundle.min.css',
    ];
    for (const href of styles) {
      this.styleEls.push(await this.assets.loadStyle(href));
    }

    // 前台專用 JS（注意相依順序）
    const scripts = [
      // 若有 jQuery：'assets/vendor/jquery/jquery.min.js',
      'assets/lib/easing/easing.min.js',
      'assets/lib/waypoints/waypoints.min.js',
      'assets/lib/lightbox/js/lightbox.min.js',
      'assets/lib/owlcarousel/owl.carousel.min.js',
      'assets/js/main.js',
      'assets/js/app.js',
    ];
    this.scriptEls.push(...(await this.assets.loadScriptsInOrder(scripts)));

    document.body.classList.add('theme-frontend');
    document.body.classList.remove('theme-backend');
  }

  ngOnDestroy() {
    this.assets.removeAll([...this.styleEls, ...this.scriptEls]);
    document.body.classList.remove('theme-frontend');
  }

  // 切換聊天室
  toggleChat() {
    this.chatVisible = !this.chatVisible;
  }
}
