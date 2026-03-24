export default {
  id: 20,
  slug: 'chapter-20',
  title: 'Web Workers 與 OffscreenCanvas：將運算移出主執行緒',
  part: 5,
  intro: '如何將繁重的 Canvas / GPU 運算移至 Worker，透過 OffscreenCanvas 與 Lit 元件通訊，保持 UI 執行緒的流暢度。',
  sections: [
    { slug: 'why-workers', title: '為何需要 Web Workers？' },
    { slug: 'worker-communication', title: 'Worker 通訊設計模式' },
    { slug: 'offscreen-canvas', title: 'OffscreenCanvas 轉移' },
    { slug: 'lit-worker-integration', title: 'Lit 與 Worker 的整合模式' },
    { slug: 'performance-gains', title: '效能提升實測' },
  ],
  content: `
<section id="why-workers">
  <h2>為何需要 Web Workers？</h2>
  <p>
    JavaScript 是單執行緒語言。主執行緒負責：
  </p>
  <ul>
    <li>解析和執行 JavaScript</li>
    <li>處理使用者輸入（點擊、鍵盤、觸控）</li>
    <li>執行 Layout、Paint、Composite（渲染管線）</li>
    <li>執行 Lit 的響應式更新和 DOM 操作</li>
  </ul>
  <p>
    當你在主執行緒上執行繁重計算（影像處理、資料解析、物理模擬）時，
    所有其他工作都被阻塞。使用者會感受到頁面卡頓、輸入延遲。
  </p>

  <h3>黃金法則</h3>
  <div class="callout callout-tip">
    <div class="callout-title">主執行緒只做 UI</div>
    <p>
      任何需要超過 <strong>16ms</strong> 的計算（60fps = 每幀 16.67ms）都應該移到 Worker。
      主執行緒應該只負責：響應使用者輸入、更新 DOM、協調 Worker 任務。
    </p>
  </div>

  <h3>適合移到 Worker 的任務</h3>
  <ul>
    <li>大型 JSON 資料解析（&gt;1MB 的 JSON.parse）</li>
    <li>影像像素處理（濾鏡、壓縮）</li>
    <li>3D 場景的 CPU 端計算（骨骼動畫、碰撞偵測）</li>
    <li>音頻處理</li>
    <li>密碼學操作（雜湊、加密）</li>
    <li>機器學習推理（TensorFlow.js WASM 後端）</li>
  </ul>
</section>

<section id="worker-communication">
  <h2>Worker 通訊設計模式</h2>
  <p>
    主執行緒與 Worker 透過 <code>postMessage</code> 和 <code>onmessage</code> 通訊。
    良好的訊息協議設計讓程式碼更易維護。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// worker-protocol.ts — 共享的訊息型別定義
export type WorkerRequest =
  | { type: 'PROCESS_IMAGE'; payload: { imageData: ImageData; filterType: string } }
  | { type: 'PARSE_DATA'; payload: { raw: string } }
  | { type: 'CANCEL'; payload: { requestId: string } };

export type WorkerResponse =
  | { type: 'IMAGE_PROCESSED'; payload: { result: ImageData }; requestId: string }
  | { type: 'DATA_PARSED'; payload: { data: unknown[] }; requestId: string }
  | { type: 'PROGRESS'; payload: { progress: number }; requestId: string }
  | { type: 'ERROR'; payload: { message: string }; requestId: string };

// image-worker.ts — Worker 端程式碼
/// &lt;reference lib="webworker" /&gt;
import type { WorkerRequest, WorkerResponse } from './worker-protocol.js';

self.onmessage = (event: MessageEvent&lt;WorkerRequest&gt;) =&gt; {
  const { type, payload } = event.data;

  if (type === 'PROCESS_IMAGE') {
    const requestId = Math.random().toString(36).slice(2);

    try {
      const result = applyFilter(payload.imageData, payload.filterType);

      // 使用 Transferable Objects 傳遞大型資料（零拷貝！）
      const response: WorkerResponse = {
        type: 'IMAGE_PROCESSED',
        payload: { result },
        requestId,
      };
      self.postMessage(response, [result.data.buffer]);
    } catch (err) {
      const errorResponse: WorkerResponse = {
        type: 'ERROR',
        payload: { message: String(err) },
        requestId,
      };
      self.postMessage(errorResponse);
    }
  }
};

function applyFilter(imageData: ImageData, filterType: string): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  // 在 Worker 中執行耗時的像素操作
  for (let i = 0; i &lt; data.length; i += 4) {
    if (filterType === 'grayscale') {
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      data[i] = data[i+1] = data[i+2] = avg;
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}</code></pre>
</section>

<section id="offscreen-canvas">
  <h2>OffscreenCanvas 轉移</h2>
  <p>
    <code>OffscreenCanvas</code> 允許你將 <code>&lt;canvas&gt;</code> 的控制權
    轉移（transfer）到 Worker，讓繪製完全在 Worker 中進行，
    主執行緒完全不參與繪製操作。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// main-thread（Lit 元件）
@customElement('offscreen-render')
class OffscreenRender extends LitElement {
  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _worker?: Worker;

  firstUpdated() {
    // 建立 Worker
    this._worker = new Worker(
      new URL('./render-worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 將 canvas 控制權轉移給 Worker
    const offscreen = this._canvas.transferControlToOffscreen();

    // 使用 transfer 陣列確保零拷貝轉移
    this._worker.postMessage(
      { type: 'INIT', canvas: offscreen },
      [offscreen] // Transferable
    );

    this._worker.onmessage = (e) =&gt; {
      if (e.data.type === 'FRAME_RENDERED') {
        // Worker 完成一幀渲染
      }
    };
  }

  private _updateParams(params: RenderParams) {
    // 發送更新指令給 Worker（不傳 canvas，只傳參數）
    this._worker?.postMessage({ type: 'UPDATE_PARAMS', params });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._worker?.postMessage({ type: 'STOP' });
    this._worker?.terminate();
  }

  render() {
    // Canvas 一旦轉移給 Worker，主執行緒不再控制它
    // 只負責渲染控制 UI
    return html\`
      &lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;
      &lt;div class="controls"&gt;
        &lt;button @click=\${() =&gt; this._updateParams({ quality: 'high' })}&gt;
          高品質
        &lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// render-worker.ts — Worker 端
/// &lt;reference lib="webworker" /&gt;

let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;
let rafId: number;
let running = false;

self.onmessage = (e: MessageEvent) =&gt; {
  switch (e.data.type) {
    case 'INIT':
      canvas = e.data.canvas; // 接收 OffscreenCanvas
      ctx = canvas.getContext('2d')!;
      running = true;
      animate(0);
      break;

    case 'UPDATE_PARAMS':
      // 更新渲染參數
      break;

    case 'STOP':
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      break;
  }
};

function animate(timestamp: number) {
  if (!running) return;

  // 在 Worker 中執行繪製（不阻塞主執行緒）
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ... 複雜的繪製邏輯
  ctx.fillStyle = \`hsl(\${timestamp / 10 % 360}, 70%, 50%)\`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  rafId = requestAnimationFrame(animate);
}</code></pre>
</section>

<section id="lit-worker-integration">
  <h2>Lit 與 Worker 的整合模式</h2>
  <p>
    建立一個可復用的 Worker Reactive Controller，封裝 Worker 的生命週期。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// worker-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class WorkerController&lt;TRequest, TResponse&gt; implements ReactiveController {
  private _worker?: Worker;
  lastResult?: TResponse;
  isProcessing = false;
  error?: string;

  constructor(
    private host: ReactiveControllerHost,
    private workerUrl: URL
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._worker = new Worker(this.workerUrl, { type: 'module' });
    this._worker.onmessage = (e: MessageEvent&lt;TResponse&gt;) =&gt; {
      this.isProcessing = false;
      this.lastResult = e.data;
      this.host.requestUpdate();
    };
    this._worker.onerror = (e) =&gt; {
      this.isProcessing = false;
      this.error = e.message;
      this.host.requestUpdate();
    };
  }

  send(message: TRequest, transfer: Transferable[] = []) {
    this.isProcessing = true;
    this.error = undefined;
    this._worker?.postMessage(message, transfer);
    this.host.requestUpdate();
  }

  hostDisconnected() {
    this._worker?.terminate();
  }
}

// 使用範例
@customElement('image-processor')
class ImageProcessor extends LitElement {
  private _worker = new WorkerController&lt;ProcessRequest, ProcessResponse&gt;(
    this,
    new URL('./image-worker.ts', import.meta.url)
  );

  private async _processImage(file: File) {
    const bitmap = await createImageBitmap(file);
    this._worker.send(
      { type: 'PROCESS', bitmap },
      [bitmap] // 轉移 ImageBitmap 所有權（零拷貝）
    );
  }

  render() {
    return html\`
      &lt;input type="file" accept="image/*"
        @change=\${(e: Event) =&gt; {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) this._processImage(file);
        }}&gt;

      \${this._worker.isProcessing
        ? html\`&lt;div class="spinner"&gt;GPU 處理中...&lt;/div&gt;\`
        : this._worker.lastResult
          ? html\`&lt;img src=\${this._worker.lastResult.dataUrl}&gt;\`
          : html\`&lt;div class="placeholder"&gt;選擇圖片&lt;/div&gt;\`
      }
    \`;
  }
}</code></pre>
</section>

<section id="performance-gains">
  <h2>效能提升實測</h2>

  <h3>典型場景的效能比較</h3>
  <table>
    <thead>
      <tr>
        <th>場景</th>
        <th>主執行緒（阻塞）</th>
        <th>Worker（非阻塞）</th>
        <th>主執行緒 FPS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>4K 圖片高斯模糊</td>
        <td>~800ms</td>
        <td>~800ms（Worker 中）</td>
        <td>Worker 版：維持 60fps；主執行緒版：凍結 800ms</td>
      </tr>
      <tr>
        <td>100萬粒子物理模擬</td>
        <td>~200ms/frame</td>
        <td>~200ms/frame（Worker 中）</td>
        <td>Worker 版：UI 仍然可以互動；主執行緒版：&lt;5fps</td>
      </tr>
      <tr>
        <td>50MB JSON 解析</td>
        <td>~3000ms</td>
        <td>~3000ms（Worker 中）</td>
        <td>Worker 版：頁面保持響應；主執行緒版：頁面卡死</td>
      </tr>
    </tbody>
  </table>

  <h3>Transferable Objects 的零拷貝效能</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 不使用 Transfer：拷貝 4MB 圖片資料（耗時 ~50ms）
worker.postMessage({ imageData: largeImageData });

// 使用 Transfer：轉移 ArrayBuffer 所有權（耗時 &lt;1ms）
worker.postMessage(
  { imageData: largeImageData },
  [largeImageData.data.buffer] // 轉移 ArrayBuffer，不拷貝
);
// 注意：轉移後，主執行緒無法再使用 largeImageData.data</code></pre>

  <h3>何時不應使用 Worker</h3>
  <ul>
    <li><strong>任務太輕量</strong>：Worker 通訊本身有開銷（~0.5ms）。小於 5ms 的任務不值得放到 Worker</li>
    <li><strong>需要直接操作 DOM</strong>：Worker 不能存取 DOM</li>
    <li><strong>需要 Shared Mutable State</strong>：Worker 間的共享狀態需要 SharedArrayBuffer 和 Atomics，複雜度高</li>
  </ul>
</section>
`,
};
