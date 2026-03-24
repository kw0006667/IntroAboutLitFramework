const t={id:17,slug:"chapter-17",title:"Canvas 深度整合：在 Lit Component 中管理 2D 繪圖生命週期",part:5,intro:"如何在 Shadow DOM 中正確操作 <canvas>，處理 resize、HiDPI 縮放，並將 Canvas 的命令式 API 與 Lit 的宣告式更新週期安全整合。",sections:[{slug:"canvas-in-shadow-dom",title:"Shadow DOM 中的 Canvas"},{slug:"resize-handling",title:"Resize 事件與 ResizeObserver"},{slug:"hidpi-scaling",title:"HiDPI / Retina 縮放處理"},{slug:"animation-loop",title:"requestAnimationFrame 動畫迴圈"},{slug:"declarative-canvas",title:"宣告式更新與命令式 Canvas 整合"}],content:`
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
`};export{t as default};
