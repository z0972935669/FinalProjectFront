import { Component, OnDestroy, OnInit } from '@angular/core';
import { AssetLoaderService } from '../../core/asset-loader.service';
import { HeaderComponent } from '../../components/backend/header/header.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-backend',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet],
  templateUrl: './backend.component.html',
})
export class BackendComponent implements OnInit, OnDestroy {
  private styleEls: HTMLElement[] = [];
  private scriptEls: HTMLElement[] = [];

  constructor(private assets: AssetLoaderService) {}

  async ngOnInit() {
    // 後台專用 CSS
    const styles = ['assets/backend/css/portal.css'];
    for (const href of styles) {
      this.styleEls.push(await this.assets.loadStyle(href));
    }

    // 後台專用 JS（注意順序：popper -> bootstrap）
    const scripts = [
      'assets/backend/plugins/fontawesome/js/all.min.js',
      'assets/backend/plugins/popper.min.js',
      'assets/backend/plugins/bootstrap/js/bootstrap.min.js',
      'assets/backend/js/app.js',
    ];
    this.scriptEls.push(...(await this.assets.loadScriptsInOrder(scripts)));

    document.body.classList.add('theme-backend');
    document.body.classList.remove('theme-frontend');
  }

  ngOnDestroy() {
    this.assets.removeAll([...this.styleEls, ...this.scriptEls]);
    document.body.classList.remove('theme-backend');
  }
}
