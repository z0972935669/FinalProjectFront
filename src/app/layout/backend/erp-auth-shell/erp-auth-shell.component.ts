import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-erp-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './erp-auth-shell.component.html',
  styleUrls: ['./erp-auth-shell.component.scss'] // ← 刪掉任何 './portal.css'
})
export class ErpAuthShellComponent implements OnInit {
  currentYear = new Date().getFullYear();

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.ensurePortalCss();
  }

  private ensurePortalCss(): void {
    const id = 'portal-css';
    if (this.document.getElementById(id)) return; // 已載入就不重複

    const link = this.renderer.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'assets/backend/css/portal.css'; // 放在 src/assets/backend/css/portal.css
    this.renderer.appendChild(this.document.head, link);
  }
}
