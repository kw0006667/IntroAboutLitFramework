export default {
  id: 16,
  slug: 'chapter-16',
  title: 'Lit 與 Image 處理：動態圖片元件的設計',
  part: 5,
  intro: 'Lazy loading、Intersection Observer、Progressive Image Loading、AVIF/WebP 格式策略、BlurHash 佔位、CDN 圖片轉換，以及 <canvas> 合成圖片的封裝模式。',
  sections: [
    { slug: 'lazy-loading', title: 'Lazy Loading 實作' },
    { slug: 'intersection-observer', title: 'Intersection Observer API' },
    { slug: 'progressive-image', title: 'Progressive Image Loading' },
    { slug: 'responsive-images', title: 'Responsive Images 與 srcset' },
    { slug: 'avif-webp-format', title: 'AVIF/WebP 格式自動選擇與降級策略' },
    { slug: 'image-optimization-pipeline', title: '圖片優化管線：Build Time 到 Runtime' },
    { slug: 'blurhash-lqip', title: 'BlurHash 與 LQIP 佔位策略' },
    { slug: 'canvas-image-composite', title: 'Canvas 圖片合成封裝' },
  ],
  content: `
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

export interface IntersectionControllerOptions extends IntersectionObserverInit {
  /** 進入視口後是否只觸發一次（預設 true） */
  once?: boolean;
}

export class IntersectionController implements ReactiveController {
  private _observer?: IntersectionObserver;
  isIntersecting = false;
  /** 最後一次 entry，用於讀取 intersectionRatio */
  entry?: IntersectionObserverEntry;

  constructor(
    private host: ReactiveControllerHost &amp; Element,
    private options: IntersectionControllerOptions = { threshold: 0.1, once: true }
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._observer = new IntersectionObserver(([entry]) =&gt; {
      this.isIntersecting = entry.isIntersecting;
      this.entry = entry;
      this.host.requestUpdate();

      if (entry.isIntersecting &amp;&amp; this.options.once !== false) {
        this._observer?.unobserve(entry.target);
      }
    }, this.options);
    this._observer.observe(this.host);
  }

  hostDisconnected() {
    this._observer?.disconnect();
  }
}

// 進階用法：threshold 陣列 + rootMargin 預取策略
// threshold: [0, 0.25, 0.5, 0.75, 1] 追蹤不同可見比例
// rootMargin: '200px 0px' 在元素進入視口前 200px 觸發
@customElement('viewport-lazy-image')
class ViewportLazyImage extends LitElement {
  @property() src = '';
  @property() alt = '';

  // 提前 300px 開始預取，threshold 陣列追蹤可見程度
  private _intersection = new IntersectionController(this, {
    threshold: [0, 0.5, 1],
    rootMargin: '300px 0px',
    once: true,
  });

  render() {
    if (!this._intersection.isIntersecting) {
      return html\`&lt;div class="placeholder" style="aspect-ratio: 16/9"&gt;&lt;/div&gt;\`;
    }
    return html\`&lt;img src=\${this.src} alt=\${this.alt} loading="eager"&gt;\`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">rootMargin 預取策略</div>
    <p>
      <code>rootMargin: '300px 0px'</code> 讓 Observer 在圖片距離視口 300px 時就觸發，
      讓網路請求有充裕時間完成，使用者滾動到圖片時已載入完畢。
      針對連線較慢的裝置可調整至 <code>'500px 0px'</code>。
    </p>
  </div>
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

<section id="avif-webp-format">
  <h2>AVIF/WebP 格式自動選擇與降級策略</h2>
  <p>
    次世代圖片格式在壓縮率與品質上顯著優於傳統 JPEG/PNG，
    但各格式的編碼速度、瀏覽器支援度與解碼效能各有取捨，
    資深工程師必須理解如何在 Shadow DOM 中正確實作 <code>&lt;picture&gt;</code> 降級鏈。
  </p>

  <h3>格式比較</h3>
  <div class="callout callout-info">
    <div class="callout-title">AVIF vs WebP vs JPEG 取捨分析</div>
    <ul>
      <li><strong>AVIF</strong>：最佳壓縮率（比 WebP 再小 20-50%），支援 HDR 與寬色域，但編碼速度極慢（建置時間成本高），需 Chrome 85+、Firefox 93+、Safari 16+。</li>
      <li><strong>WebP</strong>：壓縮率比 JPEG 好 25-35%，支援透明通道，編碼速度快，幾乎所有現代瀏覽器支援（IE 除外）。</li>
      <li><strong>JPEG XL</strong>：理論上最優秀，但瀏覽器支援尚不穩定（Chrome 已移除實驗性支援），暫不建議生產環境使用。</li>
      <li><strong>JPEG/PNG</strong>：萬用後備，必須保留。</li>
    </ul>
  </div>

  <h3>Shadow DOM 中的 &lt;picture&gt; 降級鏈</h3>
  <p>
    在 Lit Shadow DOM 中，<code>&lt;picture&gt;</code> 元素及其 <code>&lt;source&gt;</code> 子元素
    的行為與 Light DOM 完全相同——瀏覽器會依序嘗試每個 <code>&lt;source type&gt;</code>，
    找到第一個支援的格式即停止。順序至關重要：<strong>最新格式放最前面</strong>。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// smart-image.ts — 完整格式降級鏈
@customElement('smart-image')
class SmartImage extends LitElement {
  static styles = css\`
    :host { display: block; }
    picture { display: contents; }
    img {
      width: 100%;
      height: 100%;
      object-fit: var(--img-fit, cover);
      display: block;
    }
  \`;

  @property() src = '';           // 基礎路徑（不含副檔名）
  @property() ext = 'jpg';        // 後備格式副檔名
  @property() alt = '';
  @property() sizes = '100vw';
  @property({ type: Array }) widths: number[] = [400, 800, 1200, 1600];
  /** 是否生成 AVIF（build time 較耗時，可按需關閉）*/
  @property({ type: Boolean }) avif = true;

  private _srcset(format: string) {
    return this.widths
      .map(w =&gt; \`\${this.src}-\${w}w.\${format} \${w}w\`)
      .join(', ');
  }

  render() {
    return html\`
      &lt;picture&gt;
        \${this.avif ? html\`
          &lt;source
            type="image/avif"
            srcset=\${this._srcset('avif')}
            sizes=\${this.sizes}
          &gt;
        \` : nothing}
        &lt;source
          type="image/webp"
          srcset=\${this._srcset('webp')}
          sizes=\${this.sizes}
        &gt;
        &lt;img
          src="\${this.src}-800w.\${this.ext}"
          srcset=\${this._srcset(this.ext)}
          sizes=\${this.sizes}
          alt=\${this.alt}
          loading="lazy"
          decoding="async"
          fetchpriority="auto"
        &gt;
      &lt;/picture&gt;
    \`;
  }
}

// 使用範例
// &lt;smart-image
//   src="/images/hero"
//   ext="jpg"
//   alt="首頁英雄圖"
//   sizes="(max-width: 768px) 100vw, 50vw"
//   .widths=\${[400, 800, 1200]}
// &gt;&lt;/smart-image&gt;</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">fetchpriority 屬性的影響</div>
    <p>
      LCP（Largest Contentful Paint）圖片應設定 <code>fetchpriority="high"</code>，
      而非視口外的圖片應使用 <code>fetchpriority="low"</code>。
      錯誤設定會導致瀏覽器頻寬分配失當，影響 Core Web Vitals。
    </p>
  </div>
</section>

<section id="image-optimization-pipeline">
  <h2>圖片優化管線：Build Time 到 Runtime</h2>
  <p>
    生產環境的圖片優化分兩個階段：
    建置時（Build Time）生成多種尺寸與格式，
    執行時（Runtime）透過 CDN URL 參數動態轉換。
    兩者結合才能兼顧靜態資源效能與動態內容彈性。
  </p>

  <h3>Vite 建置時：vite-imagetools</h3>
  <pre data-lang="typescript"><code class="language-typescript">// vite.config.ts
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    imagetools({
      defaultDirectives: (url) =&gt; {
        // 所有圖片預設生成 webp + avif
        if (url.pathname.match(/\.(jpe?g|png)(\?.*)?$/)) {
          return new URLSearchParams({
            format: 'avif;webp;original',
            quality: '80',
          });
        }
        return new URLSearchParams();
      },
    }),
  ],
});

// 在 Lit 元件中使用 import 直接取得優化後 URL
// imagetools 返回包含 src, width, height, format 的物件陣列
import heroSrcset from './hero.jpg?w=400;800;1200&amp;format=avif;webp;jpg&amp;as=srcset';

@customElement('hero-section')
class HeroSection extends LitElement {
  render() {
    // heroSrcset 已是格式化好的 srcset 字串
    return html\`
      &lt;picture&gt;
        &lt;source type="image/avif" srcset=\${heroSrcset.avif}&gt;
        &lt;source type="image/webp" srcset=\${heroSrcset.webp}&gt;
        &lt;img src=\${heroSrcset.jpg} alt="英雄圖" loading="eager" fetchpriority="high"&gt;
      &lt;/picture&gt;
    \`;
  }
}</code></pre>

  <h3>Node.js 建置腳本：Sharp</h3>
  <pre data-lang="typescript"><code class="language-typescript">// scripts/optimize-images.ts
import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const WIDTHS = [400, 800, 1200, 1600, 2400];
const QUALITY = { avif: 65, webp: 80, jpeg: 85 };

async function optimizeImage(inputPath: string, outputDir: string) {
  const name = path.basename(inputPath, path.extname(inputPath));
  const pipeline = sharp(inputPath);
  const metadata = await pipeline.metadata();

  const tasks: Promise&lt;void&gt;[] = [];

  for (const width of WIDTHS) {
    // 不放大超過原始尺寸
    if (metadata.width &amp;&amp; width &gt; metadata.width) continue;

    const resized = pipeline.clone().resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

    // 同時生成三種格式
    tasks.push(
      resized.avif({ quality: QUALITY.avif })
        .toFile(path.join(outputDir, \`\${name}-\${width}w.avif\`))
        .then(() =&gt; {}),
      resized.webp({ quality: QUALITY.webp, effort: 4 })
        .toFile(path.join(outputDir, \`\${name}-\${width}w.webp\`))
        .then(() =&gt; {}),
      resized.jpeg({ quality: QUALITY.jpeg, mozjpeg: true })
        .toFile(path.join(outputDir, \`\${name}-\${width}w.jpg\`))
        .then(() =&gt; {}),
    );
  }

  await Promise.all(tasks);
  console.log(\`✓ \${name}: 生成 \${tasks.length} 個變體\`);
}

// 批次處理所有圖片
const images = await glob('src/assets/images/**/*.{jpg,jpeg,png}');
await Promise.all(images.map(img =&gt; optimizeImage(img, 'public/images')));</code></pre>

  <h3>CDN Runtime 轉換：Cloudinary 與 Imgix</h3>
  <pre data-lang="typescript"><code class="language-typescript">// cdn-image-url.ts — CDN URL 工具函式
export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  fit?: 'fill' | 'scale' | 'crop' | 'pad';
  gravity?: string;
}

export function cloudinaryUrl(
  publicId: string,
  options: CloudinaryOptions = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto', // auto 會根據瀏覽器能力選擇最佳格式
    fit = 'fill',
    gravity = 'auto',
  } = options;

  const transforms: string[] = [
    \`f_\${format}\`,
    \`q_\${quality}\`,
    \`c_\${fit}\`,
    \`g_\${gravity}\`,
    width ? \`w_\${width}\` : '',
    height ? \`h_\${height}\` : '',
    'dpr_auto',
  ].filter(Boolean);

  const transformStr = transforms.join(',');
  return \`https://res.cloudinary.com/YOUR_CLOUD/image/upload/\${transformStr}/\${publicId}\`;
}

export function imgixUrl(
  src: string,
  options: { w?: number; h?: number; auto?: string; q?: number; fit?: string } = {}
): string {
  const params = new URLSearchParams({
    auto: options.auto ?? 'compress,format', // format=auto 自動選擇 AVIF/WebP
    q: String(options.q ?? 80),
    fit: options.fit ?? 'clip',
    ...(options.w ? { w: String(options.w) } : {}),
    ...(options.h ? { h: String(options.h) } : {}),
  });
  return \`\${src}?\${params.toString()}\`;
}

// 在 Lit 元件中使用
@customElement('cdn-image')
class CdnImage extends LitElement {
  @property() publicId = '';
  @property() alt = '';
  @property({ type: Array }) breakpoints = [
    { media: '(max-width: 480px)', width: 480 },
    { media: '(max-width: 768px)', width: 768 },
    { media: '', width: 1200 },
  ];

  render() {
    return html\`
      &lt;picture&gt;
        \${this.breakpoints.map(bp =&gt; html\`
          &lt;source
            media=\${bp.media || nothing}
            srcset=\${cloudinaryUrl(this.publicId, { width: bp.width, format: 'avif' })} 1x,
                    \${cloudinaryUrl(this.publicId, { width: bp.width * 2, format: 'avif' })} 2x
            type="image/avif"
          &gt;
        \`)}
        \${this.breakpoints.map(bp =&gt; html\`
          &lt;source
            media=\${bp.media || nothing}
            srcset=\${cloudinaryUrl(this.publicId, { width: bp.width, format: 'webp' })} 1x,
                    \${cloudinaryUrl(this.publicId, { width: bp.width * 2, format: 'webp' })} 2x
            type="image/webp"
          &gt;
        \`)}
        &lt;img
          src=\${cloudinaryUrl(this.publicId, { width: 800, format: 'jpg' })}
          alt=\${this.alt}
          loading="lazy"
          decoding="async"
        &gt;
      &lt;/picture&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">CDN format=auto 的運作原理</div>
    <p>
      Cloudinary 的 <code>f_auto</code> 和 Imgix 的 <code>auto=format</code>
      透過偵測請求的 <code>Accept</code> Header 來決定回傳格式：
      若 Header 包含 <code>image/avif</code>，回傳 AVIF；
      含 <code>image/webp</code>，回傳 WebP；否則回傳 JPEG。
      這比 <code>&lt;picture&gt;</code> 更簡潔，但失去了客戶端的格式控制權。
    </p>
  </div>
</section>

<section id="blurhash-lqip">
  <h2>BlurHash 與 LQIP 佔位策略</h2>
  <p>
    佔位圖（Placeholder）技術讓使用者在圖片載入前看到內容輪廓，
    顯著提升感知效能。BlurHash 和 LQIP 是兩種主流方案，
    各有適用場景。
  </p>

  <h3>BlurHash 原理與使用</h3>
  <p>
    BlurHash 將圖片的色彩分佈編碼為一個短字串（約 20-30 個字元），
    在客戶端解碼並渲染為模糊預覽。相比 base64 LQIP（約 1-5KB），
    BlurHash 字串僅需約 100 bytes，適合作為 API 回應的一部分。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// build-time: 在 Node.js 生成 BlurHash
// npm install blurhash sharp

import { encode } from 'blurhash';
import sharp from 'sharp';

async function generateBlurHash(imagePath: string): Promise&lt;string&gt; {
  // 縮小到 32x32 再編碼，速度快且足夠
  const { data, info } = await sharp(imagePath)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // componentX: 水平頻率（2-9）
    3  // componentY: 垂直頻率（2-9）
  );
}

// 輸出範例：'LEHV6nWB2yk8pyo0adR*.7kCMdnj'

// -----------------------------------------------------------
// client-side: BlurHash Lit 元件
// npm install blurhash

import { decode } from 'blurhash';

@customElement('blurhash-image')
class BlurHashImage extends LitElement {
  static styles = css\`
    :host { display: block; position: relative; }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transition: opacity 0.4s ease;
    }
    canvas.hidden { opacity: 0; }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    img.loaded { opacity: 1; }
  \`;

  @property() src = '';
  @property() alt = '';
  @property() hash = '';          // BlurHash 字串
  @property({ type: Number }) width = 32;
  @property({ type: Number }) height = 32;

  @state() private _imgLoaded = false;

  @query('canvas') private _canvas!: HTMLCanvasElement;

  firstUpdated() {
    this._drawBlurHash();
  }

  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('hash')) {
      this._drawBlurHash();
    }
  }

  private _drawBlurHash() {
    if (!this.hash || !this._canvas) return;

    // punch: 控制顏色飽和度（1.0 = 正常）
    const pixels = decode(this.hash, this.width, this.height, 1);
    const ctx = this._canvas.getContext('2d')!;
    this._canvas.width = this.width;
    this._canvas.height = this.height;

    const imageData = ctx.createImageData(this.width, this.height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }

  render() {
    return html\`
      &lt;canvas
        class=\${this._imgLoaded ? 'hidden' : ''}
        aria-hidden="true"
      &gt;&lt;/canvas&gt;
      &lt;img
        src=\${this.src}
        alt=\${this.alt}
        class=\${this._imgLoaded ? 'loaded' : ''}
        @load=\${() =&gt; { this._imgLoaded = true; }}
        loading="lazy"
        decoding="async"
      &gt;
    \`;
  }
}</code></pre>

  <h3>LQIP（Low Quality Image Placeholder）技術</h3>
  <p>
    LQIP 直接使用極低解析度的圖片（通常 10-30px 寬），
    搭配 CSS <code>blur()</code> 放大顯示。
    不需要額外的解碼庫，瀏覽器原生支援，適合 SSR 場景直接寫入 HTML。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 建置時生成 LQIP base64
async function generateLQIP(imagePath: string): Promise&lt;string&gt; {
  const buffer = await sharp(imagePath)
    .resize(20, null, { fit: 'inside' })  // 20px 寬
    .webp({ quality: 20 })               // WebP 比 JPEG 更小
    .toBuffer();

  return \`data:image/webp;base64,\${buffer.toString('base64')}\`;
  // 通常 200-500 bytes
}

// SSR 渲染時直接寫入 HTML attribute
// &lt;progressive-image
//   src="/images/hero-1200w.webp"
//   placeholder="data:image/webp;base64,UklGRh4AAABXRUJQVlA4IBIAAAAwAQCd..."
//   alt="英雄圖"
// &gt;&lt;/progressive-image&gt;

// 整合兩種策略的決策邏輯
function choosePlaceholderStrategy(context: {
  isSSR: boolean;
  imageCount: number;
}): 'lqip' | 'blurhash' {
  if (context.isSSR) {
    // SSR：LQIP 可直接嵌入 HTML，不需要 JS 解碼
    return 'lqip';
  }
  if (context.imageCount &gt; 50) {
    // 大量圖片（如相冊）：BlurHash 字串更小，節省頻寬
    return 'blurhash';
  }
  // 一般情況：LQIP 更簡單直觀
  return 'lqip';
}</code></pre>

  <h3>整合所有特性的生產級圖片元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// production-image.ts — 整合 AVIF/WebP、BlurHash、IntersectionObserver
@customElement('production-image')
class ProductionImage extends LitElement {
  static styles = css\`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      background: #f0f2f5;
    }
    canvas.placeholder {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transition: opacity 0.5s;
    }
    canvas.placeholder.hidden { opacity: 0; pointer-events: none; }
    picture { display: contents; }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.5s;
    }
    img.visible { opacity: 1; }
  \`;

  @property() src = '';           // 基礎路徑（無副檔名）
  @property() ext = 'jpg';
  @property() alt = '';
  @property() hash = '';          // BlurHash
  @property() sizes = '100vw';
  @property({ type: Array }) widths: number[] = [400, 800, 1200];
  @property({ type: Boolean }) avif = true;
  /** LCP 圖片使用 high，其餘用 auto */
  @property() fetchpriority: 'high' | 'low' | 'auto' = 'auto';

  @state() private _loaded = false;
  @state() private _inView = false;

  @query('canvas') private _canvas!: HTMLCanvasElement;

  private _io?: IntersectionObserver;

  connectedCallback() {
    super.connectedCallback();
    if (this.fetchpriority === 'high') {
      // LCP 圖片：不需要 IntersectionObserver，直接載入
      this._inView = true;
    } else {
      this._io = new IntersectionObserver(([e]) =&gt; {
        if (e.isIntersecting) {
          this._inView = true;
          this._io?.disconnect();
        }
      }, { rootMargin: '400px 0px' });
    }
  }

  firstUpdated() {
    if (this._io) this._io.observe(this);
    if (this.hash) this._drawBlurHash();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._io?.disconnect();
  }

  private _drawBlurHash() {
    if (!this._canvas || !this.hash) return;
    const { decode } = await import('blurhash');
    const pixels = decode(this.hash, 32, 32, 1);
    this._canvas.width = 32;
    this._canvas.height = 32;
    const ctx = this._canvas.getContext('2d')!;
    const imageData = ctx.createImageData(32, 32);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }

  private _srcset(fmt: string) {
    return this.widths.map(w =&gt; \`\${this.src}-\${w}w.\${fmt} \${w}w\`).join(', ');
  }

  render() {
    return html\`
      &lt;canvas
        class="placeholder \${this._loaded ? 'hidden' : ''}"
        aria-hidden="true"
      &gt;&lt;/canvas&gt;

      \${this._inView ? html\`
        &lt;picture&gt;
          \${this.avif ? html\`
            &lt;source type="image/avif" srcset=\${this._srcset('avif')} sizes=\${this.sizes}&gt;
          \` : nothing}
          &lt;source type="image/webp" srcset=\${this._srcset('webp')} sizes=\${this.sizes}&gt;
          &lt;img
            src="\${this.src}-800w.\${this.ext}"
            srcset=\${this._srcset(this.ext)}
            sizes=\${this.sizes}
            alt=\${this.alt}
            class=\${this._loaded ? 'visible' : ''}
            fetchpriority=\${this.fetchpriority}
            decoding="async"
            @load=\${() =&gt; { this._loaded = true; }}
          &gt;
        &lt;/picture&gt;
      \` : nothing}
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">BlurHash 動態 import</div>
    <p>
      <code>blurhash</code> 函式庫約 6KB（gzip 後），對每個頁面只需載入一次。
      使用動態 <code>import()</code> 確保它不阻塞首屏渲染，
      並讓 Vite 將其分割為獨立 chunk 以利快取。
    </p>
  </div>
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
`,
};
