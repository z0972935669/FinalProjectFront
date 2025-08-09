// =======================================
// 動態載入資源服務
// =======================================
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AssetLoaderService {
  private renderer: Renderer2;

  /** 僅記錄由本服務動態新增的節點，方便卸載 */
  private created = new Set<HTMLElement>();

  /** 以「我們提供的路徑字串」做 key，避免瀏覽器轉成絕對網址造成比對不一致 */
  private loaded = new Map<string, HTMLElement>(); // key: 'style:assets/...' | 'script:assets/...'

  constructor(factory: RendererFactory2) {
    this.renderer = factory.createRenderer(null, null);
  }

  /** 動態載入 CSS；以 href 去重複 */
  loadStyle(href: string): Promise<HTMLLinkElement> {
    const key = `style:${href}`;
    const exist = this.loaded.get(key) as HTMLLinkElement | undefined;
    if (exist) return Promise.resolve(exist);

    return new Promise((resolve, reject) => {
      const el = this.renderer.createElement('link') as HTMLLinkElement;
      el.rel = 'stylesheet';
      el.href = href;
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Style load failed: ${href}`));

      // 存 key（用 data- 屬性避免 TS 對 dataset 的型別問題）
      this.renderer.setAttribute(el, 'data-asset-key', key);

      this.renderer.appendChild(document.head, el);
      this.created.add(el);
      this.loaded.set(key, el);
    });
  }

  /** 動態載入 JS；以 src 去重複 */
  loadScript(src: string): Promise<HTMLScriptElement> {
    const key = `script:${src}`;
    const exist = this.loaded.get(key) as HTMLScriptElement | undefined;
    if (exist) return Promise.resolve(exist);

    return new Promise((resolve, reject) => {
      const el = this.renderer.createElement('script') as HTMLScriptElement;
      el.type = 'text/javascript';
      el.src = src; // 使用我們傳入的相對路徑
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Script load failed: ${src}`));

      this.renderer.setAttribute(el, 'data-asset-key', key);

      this.renderer.appendChild(document.body, el);
      this.created.add(el);
      this.loaded.set(key, el);
    });
  }

  /** 依序載入多個 JS，確保相依順序（例如 jQuery -> plugin） */
  async loadScriptsInOrder(srcs: string[]): Promise<HTMLScriptElement[]> {
    const result: HTMLScriptElement[] = [];
    for (const s of srcs) {
      const el = await this.loadScript(s);
      result.push(el);
    }
    return result;
  }

  /** 批次卸載（僅會移除本服務動態加上的節點） */
  removeAll(els: HTMLElement[]) {
    for (const el of els) {
      if (!this.created.has(el)) continue;

      const parent = el.tagName === 'LINK' ? document.head : document.body;
      this.renderer.removeChild(parent, el);
      this.created.delete(el);

      const key = el.getAttribute('data-asset-key');
      if (key) this.loaded.delete(key);
    }
  }

  /**（可選）卸載目前所有由本服務新增的節點 */
  clearAll() {
    this.removeAll(Array.from(this.created));
  }
}
