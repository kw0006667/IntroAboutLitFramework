const e={id:16,slug:"chapter-16",title:"Lit 與 Image 處理：動態圖片元件的設計",part:5,intro:"Lazy loading、Intersection Observer、Progressive Image Loading、以及 <canvas> 合成圖片的封裝模式。",sections:[{slug:"lazy-loading",title:"Lazy Loading 實作"},{slug:"intersection-observer",title:"Intersection Observer API"},{slug:"progressive-image",title:"Progressive Image Loading"},{slug:"responsive-images",title:"Responsive Images 與 srcset"},{slug:"canvas-image-composite",title:"Canvas 圖片合成封裝"}],content:`
<section id="lazy-loading">
  <h2>Lazy Loading 實作</h2>
  <p>
    圖片 Lazy Loading 是提升頁面效能的重要技術。
    現代瀏覽器支援原生 <code>loading="lazy"</code>，
    但 Web Components 可以提供更豐富的功能：
    載入動畫、錯誤處理、placeholder 設計。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('lazy-image')
class LazyImage extends LitElement {
  static styles = css\`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }

    img.loading { opacity: 0; }
    img.loaded { opacity: 1; }
    img.error { opacity: 0; }

    .placeholder {
      position: absolute;
      inset: 0;
      background: var(--placeholder-bg, #f0f2f5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-state {
      position: absolute;
      inset: 0;
      background: #ffeaea;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c62828;
      font-size: 0.875rem;
    }

    .shimmer {
      background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  \`;

  @property() src = '';
  @property() alt = '';
  @property({ type: Number }) width?: number;
  @property({ type: Number }) height?: number;

  @state() private _loadState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';

  private _handleLoad() {
    this._loadState = 'loaded';
  }

  private _handleError() {
    this._loadState = 'error';
  }

  render() {
    return html\`
      \${this._loadState !== 'loaded' ? html\`
        &lt;div class="placeholder \${this._loadState === 'loading' ? 'shimmer' : ''}"&gt;
          \${this._loadState === 'idle' ? '🖼' : ''}
        &lt;/div&gt;
      \` : ''}

      \${this._loadState === 'error' ? html\`
        &lt;div class="error-state"&gt;圖片載入失敗&lt;/div&gt;
      \` : ''}

      &lt;img
        src=\${this.src}
        alt=\${this.alt}
        loading="lazy"
        width=\${this.width ?? nothing}
        height=\${this.height ?? nothing}
        class=\${this._loadState}
        @load=\${this._handleLoad}
        @error=\${this._handleError}
        @loadstart=\${() =&gt; { this._loadState = 'loading'; }}
      &gt;
    \`;
  }
}</code></pre>
</section>

<section id="intersection-observer">
  <h2>Intersection Observer API</h2>
  <p>
    Intersection Observer 讓你精確控制圖片在進入可視區域時才載入，
    比 <code>loading="lazy"</code> 提供更多控制。
    用 Reactive Controller 封裝，讓多個元件可以復用這個邏輯。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// intersection-observer-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class IntersectionController implements ReactiveController {
  private _observer?: IntersectionObserver;
  isIntersecting = false;

  constructor(
    private host: ReactiveControllerHost &amp; Element,
    private options: IntersectionObserverInit = { threshold: 0.1 }
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._observer = new IntersectionObserver(([entry]) =&gt; {
      this.isIntersecting = entry.isIntersecting;
      this.host.requestUpdate();

      // 如果只需要觸發一次，進入後停止觀察
      if (entry.isIntersecting) {
        this._observer?.unobserve(entry.target);
      }
    }, this.options);
    this._observer.observe(this.host);
  }

  hostDisconnected() {
    this._observer?.disconnect();
  }
}

// 在元件中使用 Controller
@customElement('viewport-lazy-image')
class ViewportLazyImage extends LitElement {
  @property() src = '';
  @property() alt = '';

  private _intersection = new IntersectionController(this, {
    threshold: 0,
    rootMargin: '200px', // 提前 200px 開始載入
  });

  render() {
    if (!this._intersection.isIntersecting) {
      // 不在視口中：只渲染 placeholder
      return html\`&lt;div class="placeholder" style="aspect-ratio: 16/9"&gt;&lt;/div&gt;\`;
    }

    // 進入視口：載入實際圖片
    return html\`&lt;img src=\${this.src} alt=\${this.alt} loading="eager"&gt;\`;
  }
}</code></pre>
</section>

<section id="progressive-image">
  <h2>Progressive Image Loading</h2>
  <p>
    漸進式圖片載入模式：先顯示模糊的低解析度版本（LQIP），
    再逐漸過渡到高解析度版本，提供更好的視覺體驗。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('progressive-image')
class ProgressiveImage extends LitElement {
  static styles = css\`
    :host { display: block; position: relative; overflow: hidden; }

    .img-low {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(20px);
      transform: scale(1.05); /* 隱藏 blur 邊緣 */
      transition: opacity 0.3s;
    }

    .img-high {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    .img-high.loaded { opacity: 1; }
    .img-low.fade-out { opacity: 0; }
  \`;

  @property() src = '';          // 高解析度 URL
  @property() placeholder = '';  // 低解析度 URL（或 base64 LQIP）
  @property() alt = '';

  @state() private _highLoaded = false;

  render() {
    return html\`
      &lt;img
        class="img-low \${this._highLoaded ? 'fade-out' : ''}"
        src=\${this.placeholder}
        alt=""
        aria-hidden="true"
      &gt;
      &lt;img
        class="img-high \${this._highLoaded ? 'loaded' : ''}"
        src=\${this.src}
        alt=\${this.alt}
        @load=\${() =&gt; { this._highLoaded = true; }}
      &gt;
    \`;
  }
}

// 使用：提供 LQIP（低解析度佔位圖）
// 通常 LQIP 是 ~20px 的縮圖，用 base64 內嵌
html\`
  &lt;progressive-image
    src="/images/hero-2400x1600.webp"
    placeholder="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
    alt="英雄圖片"
  &gt;&lt;/progressive-image&gt;
\`</code></pre>
</section>

<section id="responsive-images">
  <h2>Responsive Images 與 srcset</h2>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('responsive-image')
class ResponsiveImage extends LitElement {
  @property() src = '';
  @property() alt = '';
  @property({ type: Array }) sizes: { width: number; url: string }[] = [];

  get _srcset() {
    return this.sizes
      .map(({ width, url }) =&gt; \`\${url} \${width}w\`)
      .join(', ');
  }

  get _sizesAttr() {
    // 響應式 sizes 屬性：告訴瀏覽器不同視口下圖片的顯示尺寸
    return [
      '(max-width: 480px) 100vw',
      '(max-width: 768px) 50vw',
      '33vw',
    ].join(', ');
  }

  render() {
    return html\`
      &lt;picture&gt;
        &lt;!-- WebP 格式（現代瀏覽器）--&gt;
        &lt;source
          type="image/webp"
          srcset=\${this._srcset.replace(/\\.jpg/g, '.webp')}
          sizes=\${this._sizesAttr}
        &gt;
        &lt;!-- JPEG 後備格式 --&gt;
        &lt;img
          src=\${this.src}
          srcset=\${this._srcset}
          sizes=\${this._sizesAttr}
          alt=\${this.alt}
          loading="lazy"
          decoding="async"
        &gt;
      &lt;/picture&gt;
    \`;
  }
}</code></pre>
</section>

<section id="canvas-image-composite">
  <h2>Canvas 圖片合成封裝</h2>
  <p>
    在社群媒體分享卡、證書生成、圖片濾鏡等場景，
    需要在 <code>&lt;canvas&gt;</code> 上合成圖片。
    Lit 讓這個操作有清晰的生命週期管理。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('image-compositor')
class ImageCompositor extends LitElement {
  static styles = css\`
    canvas {
      max-width: 100%;
      display: block;
    }
  \`;

  @property() backgroundSrc = '';
  @property() overlayText = '';
  @property() textColor = 'white';

  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;

  firstUpdated() {
    this._ctx = this._canvas.getContext('2d')!;
    this._render();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('backgroundSrc') ||
        changedProps.has('overlayText') ||
        changedProps.has('textColor')) {
      this._render();
    }
  }

  private async _render() {
    if (!this._ctx) return;

    const canvas = this._canvas;
    canvas.width = 1200;
    canvas.height = 630;

    // 載入背景圖片
    const bg = await this._loadImage(this.backgroundSrc);
    this._ctx.drawImage(bg, 0, 0, 1200, 630);

    // 繪製半透明遮罩
    this._ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this._ctx.fillRect(0, 0, 1200, 630);

    // 繪製文字
    this._ctx.fillStyle = this.textColor;
    this._ctx.font = 'bold 48px system-ui, sans-serif';
    this._ctx.textAlign = 'center';
    this._ctx.fillText(this.overlayText, 600, 315);
  }

  private _loadImage(src: string): Promise&lt;HTMLImageElement&gt; {
    return new Promise((resolve, reject) =&gt; {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () =&gt; resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async download(filename = 'image.png') {
    const blob = await new Promise&lt;Blob&gt;((resolve) =&gt;
      this._canvas.toBlob((b) =&gt; resolve(b!), 'image/png')
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  render() {
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>
`};export{e as default};
