export default {
  id: 17,
  slug: 'chapter-17',
  title: 'Canvas 深度整合：在 Lit Component 中管理 2D 繪圖生命週期',
  part: 5,
  intro: '如何在 Shadow DOM 中正確操作 <canvas>，處理 resize、HiDPI 縮放，並將 Canvas 的命令式 API 與 Lit 的宣告式更新週期安全整合，包含 CanvasController、Hit Testing、無障礙設計與 D3.js 整合。',
  sections: [
    { slug: 'canvas-in-shadow-dom', title: 'Shadow DOM 中的 Canvas' },
    { slug: 'resize-handling', title: 'Resize 事件與 ResizeObserver' },
    { slug: 'hidpi-scaling', title: 'HiDPI / Retina 縮放處理' },
    { slug: 'animation-loop', title: 'requestAnimationFrame 動畫迴圈' },
    { slug: 'declarative-canvas', title: '宣告式更新與命令式 Canvas 整合' },
    { slug: 'canvas-controller', title: 'CanvasController：封裝繪圖邏輯的 Reactive Controller' },
    { slug: 'canvas-hit-testing', title: 'Canvas Hit Testing 與互動設計' },
    { slug: 'canvas-a11y', title: 'Canvas 無障礙：提供替代文本與 ARIA' },
  ],
  content: `
<section id="canvas-in-shadow-dom">
  <h2>Shadow DOM 中的 Canvas</h2>
  <p>
    在 Lit 元件中使用 <code>&lt;canvas&gt;</code> 是完全支援的，
    但需要注意幾個關鍵點：Canvas API 是命令式的，
    而 Lit 是宣告式的——這兩者需要在生命週期中正確協調。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('canvas-component')
class CanvasComponent extends LitElement {
  static styles = css\`
    :host {
      display: block;
      width: 100%;
    }
    canvas {
      display: block;
      width: 100%;
      height: auto;
    }
  \`;

  // 使用 @query 安全地取得 canvas 參考
  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;

  // firstUpdated：canvas 已在 Shadow DOM 中，可以初始化
  firstUpdated() {
    this._ctx = this._canvas.getContext('2d')!;
    this._initCanvas();
    this._draw();
  }

  private _initCanvas() {
    // 設定 canvas 實際像素尺寸（考慮 devicePixelRatio）
    const dpr = window.devicePixelRatio || 1;
    const rect = this._canvas.getBoundingClientRect();
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    this._ctx.scale(dpr, dpr);
  }

  private _draw() {
    const { width, height } = this._canvas.getBoundingClientRect();
    this._ctx.clearRect(0, 0, width, height);

    // 繪製圓形
    this._ctx.beginPath();
    this._ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    this._ctx.fillStyle = '#FF6D00';
    this._ctx.fill();
  }

  render() {
    // Canvas 元素本身不改變，只初始化一次
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="resize-handling">
  <h2>Resize 事件與 ResizeObserver</h2>
  <p>
    Canvas 元素的尺寸需要根據容器大小動態調整。
    <code>ResizeObserver</code> 是現代瀏覽器提供的精確尺寸監測工具，
    比 <code>window.resize</code> 更準確（可以監測單個元素的尺寸變化）。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// resize-controller.ts — 可復用的 ResizeObserver Controller
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class ResizeController implements ReactiveController {
  private _observer?: ResizeObserver;
  width = 0;
  height = 0;

  constructor(private host: ReactiveControllerHost &amp; Element) {
    host.addController(this);
  }

  hostConnected() {
    this._observer = new ResizeObserver((entries) =&gt; {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      if (this.width !== width || this.height !== height) {
        this.width = width;
        this.height = height;
        this.host.requestUpdate();
      }
    });
    this._observer.observe(this.host);
  }

  hostDisconnected() {
    this._observer?.disconnect();
  }
}

// 在 Canvas 元件中使用
@customElement('responsive-canvas')
class ResponsiveCanvas extends LitElement {
  static styles = css\`
    :host { display: block; width: 100%; }
    canvas { display: block; }
  \`;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;
  private _size = new ResizeController(this);

  firstUpdated() {
    this._ctx = this._canvas.getContext('2d')!;
    this._updateCanvasSize();
    this._draw();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    // ResizeController 觸發 requestUpdate，這裡響應尺寸變化
    this._updateCanvasSize();
    this._draw();
  }

  private _updateCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = this._size;

    this._canvas.width = width * dpr;
    this._canvas.height = height * dpr;
    this._canvas.style.width = \`\${width}px\`;
    this._canvas.style.height = \`\${height}px\`;

    this._ctx.scale(dpr, dpr);
  }

  private _draw() {
    if (!this._ctx) return;
    const { width, height } = this._size;
    this._ctx.clearRect(0, 0, width, height);

    // 使用最新的尺寸繪製
    this._ctx.fillStyle = '#FF6D00';
    this._ctx.fillRect(0, 0, width, 4); // 頂部橘色線條
  }

  render() {
    return html\`&lt;canvas style="height: \${this._size.width * 0.5625}px"&gt;&lt;/canvas&gt;\`;
    // 16:9 比例
  }
}</code></pre>
</section>

<section id="hidpi-scaling">
  <h2>HiDPI / Retina 縮放處理</h2>
  <p>
    Retina 和其他高密度顯示器的 <code>window.devicePixelRatio</code> 大於 1（通常是 2 或 3）。
    如果不處理，canvas 繪製的內容在高 DPI 螢幕上會模糊。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { scaledWidth: number; scaledHeight: number } {
  const dpr = window.devicePixelRatio || 1;

  // 設定 canvas 的實際像素解析度（乘以 DPR）
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  // 設定 CSS 顯示尺寸（不變）
  canvas.style.width = \`\${width}px\`;
  canvas.style.height = \`\${height}px\`;

  // 重置並縮放 context（之後的繪製座標使用 CSS 尺寸）
  ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置 transform
  ctx.scale(dpr, dpr);

  return { scaledWidth: width, scaledHeight: height };
}

// 使用範例
@customElement('sharp-canvas')
class SharpCanvas extends LitElement {
  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!;
    const ctx = canvas.getContext('2d')!;
    const { scaledWidth, scaledHeight } = setupHiDPICanvas(canvas, ctx, 400, 300);

    // 用 CSS 座標繪製（400x300），不用擔心 DPR
    ctx.font = '24px system-ui';
    ctx.fillText('清晰文字', scaledWidth / 2, scaledHeight / 2);
  }

  render() {
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>

  <h3>動態 DPR 變化</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 監測 DPR 變化（使用者移動視窗到不同 DPI 的螢幕）
private _watchDPR() {
  const mqString = \`(resolution: \${window.devicePixelRatio}dppx)\`;
  const media = window.matchMedia(mqString);

  media.addEventListener('change', () =&gt; {
    this._updateCanvasSize();
    this._draw();
    this._watchDPR(); // 重新監測
  }, { once: true });
}</code></pre>
</section>

<section id="animation-loop">
  <h2>requestAnimationFrame 動畫迴圈</h2>
  <p>
    動畫需要 <code>requestAnimationFrame</code>（rAF）驅動的持續更新迴圈。
    關鍵挑戰：在元件卸載時正確停止動畫，避免記憶體洩漏。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('animated-canvas')
class AnimatedCanvas extends LitElement {
  @property({ type: Boolean }) playing = true;

  private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;
  private _rafId?: number;
  private _startTime?: number;

  firstUpdated() {
    this._canvas = this.shadowRoot!.querySelector('canvas')!;
    this._ctx = this._canvas.getContext('2d')!;
    setupHiDPICanvas(this._canvas, this._ctx, 400, 300);

    if (this.playing) this._startAnimation();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('playing')) {
      if (this.playing) {
        this._startAnimation();
      } else {
        this._stopAnimation();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAnimation(); // 元件卸載時停止動畫
  }

  private _startAnimation() {
    if (this._rafId) return; // 已在播放
    const animate = (timestamp: number) =&gt; {
      if (!this._startTime) this._startTime = timestamp;
      const elapsed = timestamp - this._startTime;

      this._drawFrame(elapsed);

      if (this.playing) {
        this._rafId = requestAnimationFrame(animate);
      }
    };
    this._rafId = requestAnimationFrame(animate);
  }

  private _stopAnimation() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
      this._startTime = undefined;
    }
  }

  private _drawFrame(elapsed: number) {
    const { width, height } = this._canvas.getBoundingClientRect();
    this._ctx.clearRect(0, 0, width, height);

    // 以 60fps 計算動畫進度
    const angle = (elapsed / 1000) * Math.PI * 2 * 0.5; // 每 2 秒轉一圈

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.3;

    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    this._ctx.beginPath();
    this._ctx.arc(x, y, 20, 0, Math.PI * 2);
    this._ctx.fillStyle = '#FF6D00';
    this._ctx.fill();
  }

  render() {
    return html\`
      &lt;canvas&gt;&lt;/canvas&gt;
      &lt;button @click=\${() =&gt; { this.playing = !this.playing; }}&gt;
        \${this.playing ? '暫停' : '播放'}
      &lt;/button&gt;
    \`;
  }
}</code></pre>
</section>

<section id="declarative-canvas">
  <h2>宣告式更新與命令式 Canvas 整合</h2>
  <p>
    Lit 的宣告式更新（<code>@property</code> 改變 → <code>render()</code>）
    與 Canvas 的命令式 API（<code>ctx.fillRect()</code>）可以安全整合的原則：
  </p>

  <ul>
    <li>
      <strong>Lit 的宣告式部分</strong>：管理 <code>&lt;canvas&gt;</code> 元素本身的 DOM 結構、
      控制按鈕、資訊顯示等
    </li>
    <li>
      <strong>Canvas 的命令式部分</strong>：在 <code>updated()</code> 或
      <code>firstUpdated()</code> 中，響應屬性變化觸發重繪
    </li>
  </ul>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('data-chart')
class DataChart extends LitElement {
  @property({ type: Array }) data: number[] = [];
  @property({ type: String }) color = '#FF6D00';
  @property({ type: String }) label = 'Chart';

  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;

  firstUpdated() {
    this._ctx = this._canvas.getContext('2d')!;
    setupHiDPICanvas(this._canvas, this._ctx, 600, 200);
    this._drawChart(); // 初始繪製
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    // 只有相關屬性改變時才重繪
    if (changedProps.has('data') || changedProps.has('color')) {
      this._drawChart();
    }
  }

  private _drawChart() {
    if (!this._ctx || !this.data.length) return;
    const { width, height } = this._canvas.getBoundingClientRect();
    this._ctx.clearRect(0, 0, width, height);

    const max = Math.max(...this.data);
    const barWidth = width / this.data.length - 2;

    this.data.forEach((value, i) =&gt; {
      const barHeight = (value / max) * (height - 20);
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      this._ctx!.fillStyle = this.color;
      this._ctx!.fillRect(x, y, barWidth, barHeight);
    });
  }

  render() {
    // Lit 管理 DOM 結構，Canvas API 管理像素
    return html\`
      &lt;figure&gt;
        &lt;figcaption&gt;\${this.label}&lt;/figcaption&gt;
        &lt;canvas&gt;&lt;/canvas&gt;
      &lt;/figure&gt;
    \`;
  }
}</code></pre>
</section>

<section id="canvas-controller">
  <h2>CanvasController：封裝繪圖邏輯的 Reactive Controller</h2>
  <p>
    將 Canvas 的初始化、HiDPI 縮放、ResizeObserver、動畫迴圈等樣板程式碼
    封裝進一個可複用的 <code>CanvasController</code>，
    讓元件只需專注於業務繪圖邏輯。
    這是在多個 Canvas 元件專案中消除重複程式碼的關鍵架構模式。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// canvas-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export interface CanvasControllerOptions {
  /** 是否啟動 rAF 動畫迴圈（預設 false） */
  animated?: boolean;
  /** 是否監測容器尺寸變化（預設 true） */
  responsive?: boolean;
  /** Context 類型（預設 '2d'） */
  contextType?: '2d' | 'webgl2' | 'webgl' | 'bitmaprenderer';
}

export type DrawCallback = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number
) =&gt; void;

export class CanvasController implements ReactiveController {
  private _canvas?: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;
  private _resizeObserver?: ResizeObserver;
  private _rafId?: number;
  private _startTime?: number;
  private _drawCallback?: DrawCallback;

  /** 目前的邏輯尺寸（CSS 像素，已除以 DPR） */
  width = 0;
  height = 0;
  /** 累計動畫時間（ms） */
  elapsed = 0;
  /** 是否正在播放動畫 */
  playing = false;

  constructor(
    private host: ReactiveControllerHost &amp; Element,
    private options: CanvasControllerOptions = {}
  ) {
    host.addController(this);
  }

  hostConnected() {
    // ResizeObserver 在 hostConnected 時設定，等待 canvas 掛載
  }

  hostDisconnected() {
    this.stopAnimation();
    this._resizeObserver?.disconnect();
    this._canvas = undefined;
    this._ctx = undefined;
  }

  /**
   * 在 firstUpdated 後呼叫，傳入 canvas 元素與繪製 callback
   */
  init(canvas: HTMLCanvasElement, drawCallback: DrawCallback) {
    this._canvas = canvas;
    this._drawCallback = drawCallback;
    this._ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    this._setupHiDPI();

    if (this.options.responsive !== false) {
      this._resizeObserver = new ResizeObserver(() =&gt; {
        this._setupHiDPI();
        this._redraw();
        this.host.requestUpdate();
      });
      this._resizeObserver.observe(this.host);
    }

    if (this.options.animated) {
      this.startAnimation();
    } else {
      this._redraw();
    }
  }

  private _setupHiDPI() {
    if (!this._canvas || !this._ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this._canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this._canvas.width = Math.round(rect.width * dpr);
    this._canvas.height = Math.round(rect.height * dpr);
    this._canvas.style.width = \`\${rect.width}px\`;
    this._canvas.style.height = \`\${rect.height}px\`;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private _redraw() {
    if (!this._ctx || !this._drawCallback) return;
    this._ctx.clearRect(0, 0, this.width, this.height);
    this._drawCallback(this._ctx, this.width, this.height, this.elapsed);
  }

  /** 手動觸發重繪（非動畫模式下使用） */
  redraw() {
    this._redraw();
  }

  startAnimation() {
    if (this._rafId) return;
    this.playing = true;
    const loop = (ts: number) =&gt; {
      if (!this._startTime) this._startTime = ts;
      this.elapsed = ts - this._startTime;
      this._redraw();
      if (this.playing) this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stopAnimation() {
    this.playing = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
  }

  get ctx(): CanvasRenderingContext2D | undefined {
    return this._ctx;
  }
}

// -----------------------------------------------------------
// 使用 CanvasController 的元件：大幅簡化程式碼

@customElement('bar-chart-v2')
class BarChartV2 extends LitElement {
  static styles = css\`
    :host { display: block; width: 100%; aspect-ratio: 16/9; }
    canvas { display: block; width: 100%; height: 100%; }
  \`;

  @property({ type: Array }) data: { label: string; value: number }[] = [];
  @property() color = '#FF6D00';

  // Controller 封裝所有樣板邏輯
  private _canvas = new CanvasController(this, { responsive: true });

  firstUpdated() {
    const el = this.shadowRoot!.querySelector('canvas')!;
    this._canvas.init(el, (ctx, w, h) =&gt; this._draw(ctx, w, h));
  }

  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('data') || changed.has('color')) {
      this._canvas.redraw();
    }
  }

  private _draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.data.length) return;
    const max = Math.max(...this.data.map(d =&gt; d.value));
    const barW = w / this.data.length - 4;
    const pad = 20;

    this.data.forEach((d, i) =&gt; {
      const barH = ((d.value / max) * (h - pad - 30));
      const x = i * (barW + 4) + 2;
      const y = h - pad - barH;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, h - 4);
    });
  }

  render() {
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>

  <h3>整合 D3.js 計算（Canvas 渲染）</h3>
  <p>
    D3.js 的強項在於資料轉換、比例尺（Scale）、座標軸生成等計算邏輯，
    而非 DOM 操作。在高效能場景下，可以用 D3 負責計算，Canvas 負責渲染，
    避免大量 SVG DOM 節點的效能瓶頸。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// npm install d3-scale d3-array d3-axis
import { scaleLinear, scaleBand } from 'd3-scale';
import { max } from 'd3-array';

@customElement('d3-canvas-chart')
class D3CanvasChart extends LitElement {
  static styles = css\`
    :host { display: block; width: 100%; }
    canvas { display: block; width: 100%; height: 400px; }
  \`;

  @property({ type: Array }) data: { name: string; value: number }[] = [];

  private _canvasCtrl = new CanvasController(this, { responsive: true });

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!;
    this._canvasCtrl.init(canvas, (ctx, w, h) =&gt; this._draw(ctx, w, h));
  }

  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('data')) this._canvasCtrl.redraw();
  }

  private _draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;

    // D3 計算比例尺（純計算，不操作 DOM）
    const xScale = scaleBand()
      .domain(this.data.map(d =&gt; d.name))
      .range([0, innerW])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, max(this.data, d =&gt; d.value) ?? 0])
      .nice()
      .range([innerH, 0]);

    // Canvas 渲染（儲存/恢復狀態避免污染）
    ctx.save();
    ctx.translate(margin.left, margin.top);

    // 繪製格線
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    yScale.ticks(5).forEach(tick =&gt; {
      const y = yScale(tick);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(innerW, y);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(String(tick), -8, y + 4);
    });

    // 繪製長條
    this.data.forEach(d =&gt; {
      const x = xScale(d.name)!;
      const y = yScale(d.value);
      const bw = xScale.bandwidth();
      const bh = innerH - y;

      ctx.fillStyle = '#FF6D00';
      ctx.beginPath();
      ctx.roundRect(x, y, bw, bh, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(d.name, x + bw / 2, innerH + 20);
    });

    ctx.restore();
  }

  render() {
    return html\`&lt;canvas role="img" aria-label="長條圖：\${this.data.map(d =&gt; \`\${d.name} \${d.value}\`).join('、')}"&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>

  <h3>像素操作：getImageData / putImageData</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 圖片濾鏡範例：灰階轉換
@customElement('image-filter-canvas')
class ImageFilterCanvas extends LitElement {
  @property() src = '';
  @property() filter: 'none' | 'grayscale' | 'sepia' | 'invert' = 'none';

  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;
  private _originalData?: ImageData;

  async firstUpdated() {
    this._ctx = this._canvas.getContext('2d', { willReadFrequently: true })!;
    await this._loadImage();
  }

  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('filter') &amp;&amp; this._originalData) {
      this._applyFilter();
    }
  }

  private async _loadImage() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise&lt;void&gt;((res, rej) =&gt; {
      img.onload = () =&gt; res();
      img.onerror = rej;
      img.src = this.src;
    });

    this._canvas.width = img.naturalWidth;
    this._canvas.height = img.naturalHeight;
    this._ctx!.drawImage(img, 0, 0);

    // 儲存原始像素資料
    this._originalData = this._ctx!.getImageData(
      0, 0, img.naturalWidth, img.naturalHeight
    );
    this._applyFilter();
  }

  private _applyFilter() {
    if (!this._ctx || !this._originalData) return;

    // 複製一份，避免修改原始資料
    const output = new ImageData(
      new Uint8ClampedArray(this._originalData.data),
      this._originalData.width,
      this._originalData.height
    );
    const d = output.data;

    for (let i = 0; i &lt; d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];

      if (this.filter === 'grayscale') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        d[i] = d[i + 1] = d[i + 2] = gray;
      } else if (this.filter === 'sepia') {
        d[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (this.filter === 'invert') {
        d[i] = 255 - r;
        d[i + 1] = 255 - g;
        d[i + 2] = 255 - b;
      }
      // alpha (d[i+3]) 不動
    }

    this._ctx.putImageData(output, 0, 0);
  }

  render() {
    return html\`
      &lt;canvas&gt;&lt;/canvas&gt;
      &lt;div class="controls"&gt;
        \${(['none', 'grayscale', 'sepia', 'invert'] as const).map(f =&gt; html\`
          &lt;button
            class=\${this.filter === f ? 'active' : ''}
            @click=\${() =&gt; { this.filter = f; }}
          &gt;\${f}&lt;/button&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">willReadFrequently 效能提示</div>
    <p>
      當需要頻繁呼叫 <code>getImageData()</code> 時（如即時濾鏡），
      在取得 context 時傳入 <code>{ willReadFrequently: true }</code>，
      瀏覽器會將 canvas 資料保留在 CPU 記憶體中而非 GPU，
      避免反覆的 GPU→CPU 資料搬移，顯著提升讀取效能。
    </p>
  </div>
</section>

<section id="canvas-hit-testing">
  <h2>Canvas Hit Testing 與互動設計</h2>
  <p>
    Canvas 沒有 DOM 元素，無法直接使用 <code>addEventListener</code> 監聽個別圖形。
    需要實作 <em>Hit Testing</em>：將滑鼠/觸控座標轉換到 Canvas 邏輯空間，
    再判斷座標落在哪個繪圖圖形上。
  </p>

  <h3>座標轉換：getBoundingClientRect + devicePixelRatio</h3>
  <pre data-lang="typescript"><code class="language-typescript">/**
 * 將視窗事件座標轉換為 Canvas 邏輯座標（已考慮 DPR 與 CSS 縮放）
 */
function getCanvasPoint(
  event: MouseEvent | Touch,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  // getBoundingClientRect 返回 CSS 像素，直接對應繪圖座標（已透過 ctx.scale 處理 DPR）
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}</code></pre>

  <h3>isPointInPath / isPointInStroke 精確 Hit Testing</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 可互動的圓餅圖（點擊 slice 高亮）
interface PieSlice {
  label: string;
  value: number;
  startAngle: number;
  endAngle: number;
  color: string;
  path: Path2D;
}

@customElement('interactive-pie')
class InteractivePie extends LitElement {
  static styles = css\`
    :host { display: block; width: 300px; height: 300px; }
    canvas { cursor: pointer; }
  \`;

  @property({ type: Array }) data: { label: string; value: number; color: string }[] = [];
  @state() private _hoveredIndex = -1;
  @state() private _selectedIndex = -1;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;
  private _slices: PieSlice[] = [];
  private _canvasCtrl = new CanvasController(this);

  firstUpdated() {
    this._ctx = this._canvas.getContext('2d')!;
    this._canvasCtrl.init(this._canvas, (ctx, w, h) =&gt; this._draw(ctx, w, h));
  }

  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('data') || changed.has('_hoveredIndex') || changed.has('_selectedIndex')) {
      this._buildSlices();
      this._canvasCtrl.redraw();
    }
  }

  private _buildSlices() {
    const total = this.data.reduce((s, d) =&gt; s + d.value, 0);
    let angle = -Math.PI / 2; // 從 12 點鐘方向開始
    const cx = this._canvasCtrl.width / 2;
    const cy = this._canvasCtrl.height / 2;
    const r = Math.min(cx, cy) * 0.8;

    this._slices = this.data.map((d, i) =&gt; {
      const startAngle = angle;
      const endAngle = angle + (d.value / total) * Math.PI * 2;
      angle = endAngle;

      // 每個 slice 建立獨立的 Path2D 供 hit testing 使用
      const path = new Path2D();
      path.moveTo(cx, cy);
      path.arc(cx, cy, r, startAngle, endAngle);
      path.closePath();

      return { ...d, startAngle, endAngle, path };
    });
  }

  private _draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;

    this._slices.forEach((slice, i) =&gt; {
      const isHovered = i === this._hoveredIndex;
      const isSelected = i === this._selectedIndex;

      ctx.save();

      // 選中或懸停時，往外偏移 slice
      if (isHovered || isSelected) {
        const midAngle = (slice.startAngle + slice.endAngle) / 2;
        const offset = isSelected ? 12 : 6;
        ctx.translate(
          Math.cos(midAngle) * offset,
          Math.sin(midAngle) * offset
        );
      }

      ctx.fillStyle = slice.color;
      ctx.fill(slice.path);

      ctx.strokeStyle = isSelected ? '#333' : 'white';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke(slice.path);

      // 文字標籤
      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      const r = Math.min(cx, cy) * 0.8;
      const labelR = r * 0.65;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;

      ctx.fillStyle = 'white';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slice.label, lx, ly);

      ctx.restore();
    });
  }

  // 統一處理 Mouse 與 Touch 的 Hit Testing
  private _hitTest(clientX: number, clientY: number): number {
    if (!this._ctx) return -1;
    const { x, y } = getCanvasPoint({ clientX, clientY } as MouseEvent, this._canvas);

    for (let i = 0; i &lt; this._slices.length; i++) {
      // isPointInPath 使用 Path2D，不需要重建路徑
      if (this._ctx.isPointInPath(this._slices[i].path, x, y)) {
        return i;
      }
    }
    return -1;
  }

  private _onMouseMove(e: MouseEvent) {
    const idx = this._hitTest(e.clientX, e.clientY);
    if (idx !== this._hoveredIndex) {
      this._hoveredIndex = idx;
      this._canvas.style.cursor = idx &gt;= 0 ? 'pointer' : 'default';
    }
  }

  private _onClick(e: MouseEvent) {
    const idx = this._hitTest(e.clientX, e.clientY);
    this._selectedIndex = idx === this._selectedIndex ? -1 : idx;

    if (idx &gt;= 0) {
      this.dispatchEvent(new CustomEvent('slice-select', {
        detail: { index: idx, data: this.data[idx] },
        bubbles: true,
        composed: true,
      }));
    }
  }

  // Touch 支援
  private _onTouchStart(e: TouchEvent) {
    e.preventDefault(); // 避免觸發 scroll
    const touch = e.touches[0];
    const idx = this._hitTest(touch.clientX, touch.clientY);
    this._selectedIndex = idx === this._selectedIndex ? -1 : idx;
  }

  render() {
    return html\`
      &lt;canvas
        @mousemove=\${this._onMouseMove}
        @click=\${this._onClick}
        @touchstart=\${this._onTouchStart}
        @mouseleave=\${() =&gt; { this._hoveredIndex = -1; }}
      &gt;&lt;/canvas&gt;
    \`;
  }
}</code></pre>

  <h3>Pinch-to-Zoom Canvas（Touch 縮放）</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('zoomable-canvas')
class ZoomableCanvas extends LitElement {
  private _scale = 1;
  private _offsetX = 0;
  private _offsetY = 0;
  private _lastPinchDist = 0;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;

  firstUpdated() {
    this._ctx = this._canvas.getContext('2d')!;
    this._draw();
  }

  private _onTouchMove(e: TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch-to-zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY
      );

      if (this._lastPinchDist &gt; 0) {
        const ratio = dist / this._lastPinchDist;
        // 以兩指中心為縮放原點
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const rect = this._canvas.getBoundingClientRect();
        const cx = midX - rect.left;
        const cy = midY - rect.top;

        this._offsetX = cx - (cx - this._offsetX) * ratio;
        this._offsetY = cy - (cy - this._offsetY) * ratio;
        this._scale = Math.max(0.5, Math.min(10, this._scale * ratio));
      }
      this._lastPinchDist = dist;

    } else if (e.touches.length === 1) {
      // Pan
      // （單指移動邏輯省略）
    }

    this._draw();
  }

  private _onTouchEnd() {
    this._lastPinchDist = 0;
  }

  private _draw() {
    if (!this._ctx) return;
    const { width, height } = this._canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = width / dpr;
    const h = height / dpr;

    this._ctx.clearRect(0, 0, w, h);
    this._ctx.save();
    this._ctx.translate(this._offsetX, this._offsetY);
    this._ctx.scale(this._scale, this._scale);

    // 繪製縮放內容（以原始座標繪製，transform 處理縮放）
    this._ctx.fillStyle = '#FF6D00';
    this._ctx.fillRect(50, 50, 200, 150);
    this._ctx.font = '20px system-ui';
    this._ctx.fillStyle = '#333';
    this._ctx.fillText('可縮放內容', 60, 90);

    this._ctx.restore();
  }

  render() {
    return html\`
      &lt;canvas
        style="touch-action: none; width: 100%; height: 400px;"
        @touchmove=\${this._onTouchMove}
        @touchend=\${this._onTouchEnd}
      &gt;&lt;/canvas&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">touch-action: none 的必要性</div>
    <p>
      在 touch 事件中呼叫 <code>e.preventDefault()</code> 需要搭配 CSS
      <code>touch-action: none</code>，否則在 Chrome 等瀏覽器中，
      由於 Passive Event Listener 優化，<code>preventDefault()</code> 會被忽略，
      導致頁面在使用 Pinch-to-zoom 時也同時縮放視口。
    </p>
  </div>
</section>

<section id="canvas-a11y">
  <h2>Canvas 無障礙：提供替代文本與 ARIA</h2>
  <p>
    Canvas 是一塊不透明的像素緩衝區，螢幕閱讀器無法解讀其內容。
    為無障礙使用者提供等效體驗是工程師的責任，而非可選項。
    有幾種層次的策略可以搭配使用。
  </p>

  <h3>策略一：Fallback Content（最低要求）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// canvas 標籤內的 fallback content 在 canvas 不支援或 JS 未載入時顯示
// 同時作為 AT（輔助技術）的替代文本入口
render() {
  return html\`
    &lt;canvas
      role="img"
      aria-label="\${this.chartTitle}：\${this._getAccessibleSummary()}"
    &gt;
      &lt;!-- Fallback：表格形式的資料（螢幕閱讀器可讀） --&gt;
      &lt;table&gt;
        &lt;caption&gt;\${this.chartTitle}&lt;/caption&gt;
        &lt;thead&gt;
          &lt;tr&gt;&lt;th&gt;類別&lt;/th&gt;&lt;th&gt;數值&lt;/th&gt;&lt;/tr&gt;
        &lt;/thead&gt;
        &lt;tbody&gt;
          \${this.data.map(d =&gt; html\`
            &lt;tr&gt;
              &lt;td&gt;\${d.label}&lt;/td&gt;
              &lt;td&gt;\${d.value}&lt;/td&gt;
            &lt;/tr&gt;
          \`)}
        &lt;/tbody&gt;
      &lt;/table&gt;
    &lt;/canvas&gt;
  \`;
}

private _getAccessibleSummary(): string {
  if (!this.data.length) return '暫無資料';
  const max = this.data.reduce((a, b) =&gt; a.value &gt; b.value ? a : b);
  const sum = this.data.reduce((s, d) =&gt; s + d.value, 0);
  return \`共 \${this.data.length} 項，最高為 \${max.label}（\${max.value}），合計 \${sum}\`;
}</code></pre>

  <h3>策略二：ARIA Live Region 動態更新</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('accessible-chart')
class AccessibleChart extends LitElement {
  static styles = css\`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  \`;

  @property({ type: Array }) data: { label: string; value: number }[] = [];
  @property() title = '';
  @state() private _announcement = '';

  // 互動時更新螢幕閱讀器的宣告
  private _onSliceHover(index: number) {
    if (index &gt;= 0) {
      const d = this.data[index];
      const total = this.data.reduce((s, x) =&gt; s + x.value, 0);
      const pct = ((d.value / total) * 100).toFixed(1);
      this._announcement = \`\${d.label}：\${d.value}（佔 \${pct}%）\`;
    } else {
      this._announcement = '';
    }
  }

  render() {
    return html\`
      &lt;!-- 螢幕閱讀器宣告區域 --&gt;
      &lt;div
        class="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      &gt;
        \${this._announcement}
      &lt;/div&gt;

      &lt;canvas
        role="img"
        aria-label="\${this.title}"
        tabindex="0"
        @keydown=\${this._onKeyDown}
      &gt;
        &lt;!-- Fallback 資料表 --&gt;
      &lt;/canvas&gt;

      &lt;!-- 圖表說明（視覺使用者與 AT 共用） --&gt;
      &lt;details class="chart-data"&gt;
        &lt;summary&gt;查看圖表資料&lt;/summary&gt;
        &lt;ul&gt;
          \${this.data.map(d =&gt; html\`&lt;li&gt;\${d.label}: \${d.value}&lt;/li&gt;\`)}
        &lt;/ul&gt;
      &lt;/details&gt;
    \`;
  }

  // 鍵盤導覽支援
  private _focusedIndex = 0;

  private _onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      this._focusedIndex = (this._focusedIndex + 1) % this.data.length;
      this._onSliceHover(this._focusedIndex);
      this._redrawWithFocus(this._focusedIndex);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this._focusedIndex = (this._focusedIndex - 1 + this.data.length) % this.data.length;
      this._onSliceHover(this._focusedIndex);
      this._redrawWithFocus(this._focusedIndex);
    }
  }

  private _redrawWithFocus(_index: number) {
    // 觸發重繪，高亮鍵盤焦點的 slice
    this.requestUpdate();
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">ARIA 最佳實踐</div>
    <ul>
      <li>靜態圖表：<code>role="img"</code> + <code>aria-label</code> 摘要</li>
      <li>互動圖表：<code>aria-live="polite"</code> 宣告懸停資訊 + <code>tabindex="0"</code> 鍵盤可達</li>
      <li>資料表：提供 <code>&lt;details&gt;</code> 折疊的資料表格，讓使用者可選擇存取原始資料</li>
      <li>動畫：提供 <code>prefers-reduced-motion</code> 媒體查詢停止動畫</li>
    </ul>
  </div>
</section>
`,
};
