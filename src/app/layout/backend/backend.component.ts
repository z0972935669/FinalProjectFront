import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/backend/header/header.component'; // ← 路徑依你專案調整

@Component({
  selector: 'app-backend',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],  // ← 加上 HeaderComponent
  templateUrl: './backend.component.html',
  styleUrls: ['./backend.component.scss']
})
export class BackendComponent implements OnInit {
  sidepanelOpen = true;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void { this.ensurePortalCss(); }

  toggleSidepanel(open?: boolean) {
    this.sidepanelOpen = (typeof open === 'boolean') ? open : !this.sidepanelOpen;
  }

  private ensurePortalCss(): void {
    const id = 'portal-css';
    if (this.document.getElementById(id)) return;
    const link = this.renderer.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'assets/backend/css/portal.css';
    this.renderer.appendChild(this.document.head, link);
  }
}
