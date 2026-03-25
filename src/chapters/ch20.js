export default {
  id: 20,
  slug: 'chapter-20',
  title: 'Web Workers 與 OffscreenCanvas：將運算移出主執行緒',
  part: 5,
  intro: '如何將繁重的 Canvas / GPU 運算移至 Worker，透過 OffscreenCanvas 與 Lit 元件通訊，保持 UI 執行緒的流暢度。深入探討 Comlink RPC、Worker Pool 模式、SharedArrayBuffer 零拷貝共享，以及 WebAssembly + Worker + Lit 的三角整合。',
  sections: [
    { slug: 'why-workers', title: '為何需要 Web Workers？' },
    { slug: 'worker-communication', title: 'Worker 通訊設計模式' },
    { slug: 'comlink-integration', title: 'Comlink：讓 Worker 通訊更簡潔' },
    { slug: 'offscreen-canvas', title: 'OffscreenCanvas 轉移' },
    { slug: 'worker-pool', title: 'Worker Pool 模式：任務調度與負載均衡' },
    { slug: 'shared-array-buffer', title: 'SharedArrayBuffer：零拷貝資料共享' },
    { slug: 'wasm-worker', title: 'WebAssembly + Worker + Lit 的三角整合' },
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
  <p>
    對資深工程師而言，理解「為何 16ms 是警戒線」至關重要：
    現代顯示器以 60Hz 重新整理，意味著瀏覽器每 16.67ms 必須完成一幀的工作。
    如果主執行緒被 JavaScript 佔用超過這個時間，瀏覽器會跳過渲染，
    使用者感受到的就是「掉幀（Frame Drop）」或「卡頓（Jank）」。
    Chrome DevTools Performance 面板中的紅色長條（Long Task）就是這種情況。
  </p>

  <h3>黃金法則</h3>
  <div class="callout callout-tip">
    <div class="callout-title">主執行緒只做 UI</div>
    <p>
      任何需要超過 <strong>5ms</strong>（更保守的標準，為渲染流水線留出餘量）的計算都應考慮移到 Worker。
      主執行緒應該只負責：響應使用者輸入、更新 DOM、協調 Worker 任務。
      記住：5ms 的 JavaScript 執行 + 11ms 的 Layout/Paint = 16ms 的幀時間預算。
    </p>
  </div>

  <h3>適合移到 Worker 的任務</h3>
  <ul>
    <li>大型 JSON 資料解析（&gt;1MB 的 JSON.parse，通常需要 50–500ms）</li>
    <li>影像像素處理（濾鏡、壓縮、格式轉換）</li>
    <li>3D 場景的 CPU 端計算（骨骼動畫、碰撞偵測、AI 路徑規劃）</li>
    <li>音頻處理（波形分析、FFT）</li>
    <li>密碼學操作（雜湊、加密，即使使用 SubtleCrypto 非同步 API）</li>
    <li>機器學習推理（TensorFlow.js WASM 後端，ONNX Runtime Web）</li>
    <li>大型資料集的統計計算（排序、過濾 &gt;10 萬筆資料）</li>
    <li>WebAssembly 模組初始化（.wasm 編譯可能需要數百毫秒）</li>
  </ul>
</section>

<section id="worker-communication">
  <h2>Worker 通訊設計模式</h2>
  <p>
    主執行緒與 Worker 透過 <code>postMessage</code> 和 <code>onmessage</code> 通訊。
    良好的訊息協議設計讓程式碼更易維護，並且可以正確處理並發請求和取消操作。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// worker-protocol.ts — 共享的訊息型別定義
// 使用 Discriminated Union 確保型別安全
export type WorkerRequest =
  | { type: 'PROCESS_IMAGE'; requestId: string; payload: { imageData: ImageData; filterType: string } }
  | { type: 'PARSE_DATA'; requestId: string; payload: { raw: string } }
  | { type: 'CANCEL'; payload: { requestId: string } };

export type WorkerResponse =
  | { type: 'IMAGE_PROCESSED'; payload: { result: ImageData }; requestId: string }
  | { type: 'DATA_PARSED'; payload: { data: unknown[] }; requestId: string }
  | { type: 'PROGRESS'; payload: { progress: number }; requestId: string }
  | { type: 'ERROR'; payload: { message: string }; requestId: string };

// image-worker.ts — Worker 端程式碼（完整版）
/// &lt;reference lib="webworker" /&gt;
import type { WorkerRequest, WorkerResponse } from './worker-protocol.js';

// 追蹤進行中的請求（用於取消）
const activeRequests = new Set&lt;string&gt;();

self.onmessage = async (event: MessageEvent&lt;WorkerRequest&gt;) =&gt; {
  const { type } = event.data;

  if (type === 'CANCEL') {
    activeRequests.delete(event.data.payload.requestId);
    return;
  }

  const { requestId } = event.data;
  activeRequests.add(requestId);

  try {
    if (type === 'PROCESS_IMAGE') {
      const { imageData, filterType } = event.data.payload;

      // 模擬進度報告（實際應在迴圈中報告）
      const sendProgress = (progress: number) =&gt; {
        if (!activeRequests.has(requestId)) return; // 已取消
        const response: WorkerResponse = { type: 'PROGRESS', payload: { progress }, requestId };
        self.postMessage(response);
      };

      sendProgress(0);
      const result = await applyFilterWithProgress(imageData, filterType, sendProgress);

      if (!activeRequests.has(requestId)) return; // 已取消

      const response: WorkerResponse = { type: 'IMAGE_PROCESSED', payload: { result }, requestId };
      // 使用 Transferable：轉移 ArrayBuffer 所有權，避免拷貝
      self.postMessage(response, [result.data.buffer]);
    }
  } catch (err) {
    const errorResponse: WorkerResponse = {
      type: 'ERROR',
      payload: { message: String(err) },
      requestId,
    };
    self.postMessage(errorResponse);
  } finally {
    activeRequests.delete(requestId);
  }
};

async function applyFilterWithProgress(
  imageData: ImageData,
  filterType: string,
  onProgress: (p: number) => void
): Promise&lt;ImageData&gt; {
  const data = new Uint8ClampedArray(imageData.data);
  const chunkSize = 10000; // 每次處理 10000 個像素，允許「讓出」執行時間
  const totalPixels = data.length / 4;

  for (let i = 0; i &lt; data.length; i += chunkSize * 4) {
    const end = Math.min(i + chunkSize * 4, data.length);
    for (let j = i; j &lt; end; j += 4) {
      if (filterType === 'grayscale') {
        const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
        data[j] = data[j + 1] = data[j + 2] = avg;
      } else if (filterType === 'invert') {
        data[j] = 255 - data[j];
        data[j + 1] = 255 - data[j + 1];
        data[j + 2] = 255 - data[j + 2];
      }
    }
    // 使用 scheduler.yield() 讓出執行（如果可用），允許其他訊息被處理
    if ('scheduler' in globalThis &amp;&amp; 'yield' in (globalThis as any).scheduler) {
      await (globalThis as any).scheduler.yield();
    }
    onProgress((i / data.length) * 100);
  }

  return new ImageData(data, imageData.width, imageData.height);
}</code></pre>
</section>

<section id="comlink-integration">
  <h2>Comlink：讓 Worker 通訊更簡潔</h2>
  <p>
    <code>postMessage</code>/<code>onmessage</code> 的手動協議設計繁瑣且容易出錯。
    Google 開發的 <a href="https://github.com/GoogleChromeLabs/comlink">Comlink</a> 函式庫
    透過 ES Proxy 讓 Worker 通訊看起來像本地函數呼叫（RPC 風格），
    大幅減少樣板程式碼，並自動處理 Promise 包裝。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// npm install comlink

// ===== 不使用 Comlink（繁瑣） =====
// main-thread.ts
const worker = new Worker('./worker.js');
const requestId = crypto.randomUUID();
const pending = new Map&lt;string, { resolve: Function; reject: Function }&gt;();

worker.onmessage = (e) =&gt; {
  const { requestId, type, result, error } = e.data;
  const deferred = pending.get(requestId);
  if (deferred) {
    type === 'error' ? deferred.reject(error) : deferred.resolve(result);
    pending.delete(requestId);
  }
};

function processImage(imageData: ImageData): Promise&lt;ImageData&gt; {
  return new Promise((resolve, reject) =&gt; {
    const id = crypto.randomUUID();
    pending.set(id, { resolve, reject });
    worker.postMessage({ type: 'PROCESS', requestId: id, imageData });
  });
}

// ===== 使用 Comlink（簡潔） =====
// image-worker.ts（Worker 端）
import * as Comlink from 'comlink';

// 定義 Worker 暴露的 API 介面
export interface ImageWorkerAPI {
  processImage(imageData: ImageData, filter: string): Promise&lt;ImageData&gt;;
  generateThumbnail(imageData: ImageData, maxSize: number): Promise&lt;ImageBitmap&gt;;
  getWorkerInfo(): { id: number; memoryUsage: number };
}

const api: ImageWorkerAPI = {
  async processImage(imageData: ImageData, filter: string): Promise&lt;ImageData&gt; {
    const data = new Uint8ClampedArray(imageData.data);
    for (let i = 0; i &lt; data.length; i += 4) {
      if (filter === 'grayscale') {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
    }
    return new ImageData(data, imageData.width, imageData.height);
  },

  async generateThumbnail(imageData: ImageData, maxSize: number): Promise&lt;ImageBitmap&gt; {
    const scale = Math.min(maxSize / imageData.width, maxSize / imageData.height);
    const canvas = new OffscreenCanvas(
      Math.floor(imageData.width * scale),
      Math.floor(imageData.height * scale)
    );
    const ctx = canvas.getContext('2d')!;
    const source = await createImageBitmap(imageData);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.transferToImageBitmap();
  },

  getWorkerInfo() {
    return {
      id: self.name ? parseInt(self.name) : 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize ?? 0,
    };
  },
};

// 暴露 API（這一行讓 Comlink 接管 onmessage）
Comlink.expose(api);

// ===== main-thread.ts（使用 Comlink） =====
import * as Comlink from 'comlink';
import type { ImageWorkerAPI } from './image-worker.js';

const worker = new Worker(new URL('./image-worker.ts', import.meta.url), { type: 'module' });
// wrap() 回傳一個 Proxy，呼叫 API 就像呼叫本地函數
const imageApi = Comlink.wrap&lt;ImageWorkerAPI&gt;(worker);

// 使用起來就像呼叫本地函數！Comlink 自動處理序列化與回應
const result = await imageApi.processImage(someImageData, 'grayscale');
// 使用 Comlink.transfer 傳遞 Transferable Objects
const result2 = await imageApi.processImage(
  Comlink.transfer(largeImageData, [largeImageData.data.buffer]),
  'invert'
);

// ===== Comlink + Lit Controller =====
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class ComlinkWorkerController&lt;T extends object&gt; implements ReactiveController {
  private _worker?: Worker;
  proxy?: Comlink.Remote&lt;T&gt;;
  isReady = false;

  constructor(
    private host: ReactiveControllerHost,
    private workerUrl: URL
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._worker = new Worker(this.workerUrl, { type: 'module' });
    this.proxy = Comlink.wrap&lt;T&gt;(this._worker);
    this.isReady = true;
    this.host.requestUpdate();
  }

  hostDisconnected() {
    // 釋放 Proxy 並終止 Worker
    this.proxy?.[Comlink.releaseProxy]();
    this._worker?.terminate();
    this.isReady = false;
  }
}

// 在 Lit 元件中使用 Comlink Controller
@customElement('image-processor-comlink')
class ImageProcessorComlink extends LitElement {
  private _worker = new ComlinkWorkerController&lt;ImageWorkerAPI&gt;(
    this,
    new URL('./image-worker.ts', import.meta.url)
  );

  @state() private _processing = false;
  @state() private _resultUrl?: string;

  private async _handleFile(file: File) {
    if (!this._worker.proxy) return;
    this._processing = true;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      const imageData = canvas.getContext('2d')!.getImageData(0, 0, bitmap.width, bitmap.height);

      // 像呼叫本地函數一樣！
      const processed = await this._worker.proxy.processImage(imageData, 'grayscale');

      // 顯示結果
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = processed.width;
      resultCanvas.height = processed.height;
      resultCanvas.getContext('2d')!.putImageData(processed, 0, 0);
      this._resultUrl = resultCanvas.toDataURL();
    } finally {
      this._processing = false;
    }
  }

  render() {
    return html\`
      &lt;input type="file" accept="image/*"
        @change=\${(e: Event) =&gt; {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) this._handleFile(f);
        }}&gt;
      \${this._processing ? html\`&lt;div&gt;處理中...&lt;/div&gt;\` : ''}
      \${this._resultUrl ? html\`&lt;img src=\${this._resultUrl}&gt;\` : ''}
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Comlink 的限制</div>
    <p>
      Comlink 使用 Proxy 和 postMessage 序列化，有一些限制：
      函數參數必須可序列化（不能傳遞 DOM 節點、EventEmitter 等）；
      回傳值也必須可序列化（或使用 <code>Comlink.transfer</code> 傳遞 Transferable）；
      每次呼叫都有 postMessage 往返的延遲（約 0.1–1ms），
      對高頻率呼叫（每幀 60 次）應改用 SharedArrayBuffer 直接通訊。
    </p>
  </div>
</section>

<section id="offscreen-canvas">
  <h2>OffscreenCanvas 轉移</h2>
  <p>
    <code>OffscreenCanvas</code> 允許你將 <code>&lt;canvas&gt;</code> 的控制權
    轉移（transfer）到 Worker，讓繪製完全在 Worker 中進行，
    主執行緒完全不參與繪製操作。這對動畫渲染特別有價值：
    即使主執行緒被 JavaScript 佔用，動畫仍會繼續順暢播放。
  </p>

  <div class="callout callout-warning">
    <div class="callout-title">Canvas 控制權轉移是不可逆的</div>
    <p>
      一旦呼叫 <code>canvas.transferControlToOffscreen()</code>，
      主執行緒就永久失去對該 canvas 的控制權。
      你無法再呼叫 <code>getContext()</code>，也無法讀取像素值。
      確保這是你真正想要的設計。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">// main-thread（Lit 元件）
import { LitElement, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

@customElement('offscreen-render')
class OffscreenRender extends LitElement {
  @query('canvas') private _canvas!: HTMLCanvasElement;
  @state() private _fps = 0;
  private _worker?: Worker;
  private _transferred = false;

  firstUpdated() {
    this._initWorker();
  }

  private _initWorker() {
    this._worker = new Worker(
      new URL('./render-worker.ts', import.meta.url),
      { type: 'module', name: 'render-worker' }
    );

    // 監聽 Worker 回傳的效能資訊
    this._worker.onmessage = (e) =&gt; {
      if (e.data.type === 'PERF_UPDATE') {
        this._fps = e.data.fps;
        // 觸發 Lit 更新以顯示 FPS（但不影響 Canvas 渲染！）
      }
    };

    this._worker.onerror = (e) =&gt; {
      console.error('[RenderWorker] 錯誤：', e.message);
    };

    // 將 canvas 控制權轉移給 Worker
    const offscreen = this._canvas.transferControlToOffscreen();
    this._transferred = true;

    // transfer 陣列必須包含 offscreen，否則是深拷貝（無法轉移）
    this._worker.postMessage(
      {
        type: 'INIT',
        canvas: offscreen,
        devicePixelRatio: window.devicePixelRatio,
      },
      [offscreen] // Transferable
    );
  }

  private _updateParams(params: RenderParams) {
    this._worker?.postMessage({ type: 'UPDATE_PARAMS', params });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._worker?.postMessage({ type: 'STOP' });
    // 給 Worker 100ms 清理，然後強制終止
    setTimeout(() =&gt; this._worker?.terminate(), 100);
  }

  render() {
    return html\`
      &lt;div class="container"&gt;
        &lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;
        &lt;div class="overlay"&gt;
          &lt;span class="fps"&gt;\${this._fps} FPS（Worker 渲染）&lt;/span&gt;
          &lt;div class="controls"&gt;
            &lt;button @click=\${() =&gt; this._updateParams({ quality: 'high' })}&gt;高品質&lt;/button&gt;
            &lt;button @click=\${() =&gt; this._updateParams({ quality: 'low' })}&gt;低品質&lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}

interface RenderParams {
  quality: 'high' | 'low';
}

// render-worker.ts — Worker 端完整實作
/// &lt;reference lib="webworker" /&gt;

let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D | GPUCanvasContext;
let rafId: number;
let running = false;
let params: RenderParams = { quality: 'high' };
let frameCount = 0;
let lastFpsTime = 0;

self.onmessage = (e: MessageEvent) =&gt; {
  switch (e.data.type) {
    case 'INIT':
      canvas = e.data.canvas;
      // 根據需求選擇 2D 或 WebGPU context
      ctx = canvas.getContext('2d')!;
      running = true;
      lastFpsTime = performance.now();
      animate(0);
      break;

    case 'UPDATE_PARAMS':
      params = { ...params, ...e.data.params };
      break;

    case 'STOP':
      running = false;
      cancelAnimationFrame(rafId);
      break;
  }
};

function animate(timestamp: number) {
  if (!running) return;

  // 在 Worker 中執行繪製（完全不阻塞主執行緒）
  const c = ctx as OffscreenCanvasRenderingContext2D;
  c.clearRect(0, 0, canvas.width, canvas.height);

  // 根據品質選擇不同的繪製方式
  if (params.quality === 'high') {
    drawHighQuality(c, timestamp);
  } else {
    drawLowQuality(c, timestamp);
  }

  // 計算 FPS 並回報給主執行緒（每秒一次）
  frameCount++;
  if (timestamp - lastFpsTime &gt; 1000) {
    const fps = Math.round(frameCount * 1000 / (timestamp - lastFpsTime));
    self.postMessage({ type: 'PERF_UPDATE', fps });
    frameCount = 0;
    lastFpsTime = timestamp;
  }

  rafId = requestAnimationFrame(animate);
}

function drawHighQuality(ctx: OffscreenCanvasRenderingContext2D, t: number) {
  // 複雜的高品質繪製邏輯（可以耗時，不影響 UI）
  ctx.fillStyle = \`hsl(\${t / 10 % 360}, 70%, 50%)\`;
  ctx.beginPath();
  for (let i = 0; i &lt; 1000; i++) {
    const x = (Math.sin(t / 1000 + i) + 1) * canvas.width / 2;
    const y = (Math.cos(t / 1000 + i * 0.7) + 1) * canvas.height / 2;
    ctx.arc(x, y, 2, 0, Math.PI * 2);
  }
  ctx.fill();
}

function drawLowQuality(ctx: OffscreenCanvasRenderingContext2D, t: number) {
  ctx.fillStyle = \`hsl(\${t / 10 % 360}, 70%, 50%)\`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}</code></pre>
</section>

<section id="worker-pool">
  <h2>Worker Pool 模式：任務調度與負載均衡</h2>
  <p>
    對於需要並行處理多個任務的場景（如批次影像處理、大型資料集分析），
    Worker Pool 模式讓你建立固定數量的 Worker，並將任務均勻分配給它們，
    避免建立過多 Worker 導致記憶體耗盡，同時最大化 CPU 多核利用率。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// worker-pool.ts — 完整的 Worker Pool 實作
import * as Comlink from 'comlink';

interface PendingTask&lt;T&gt; {
  resolve: (value: T) =&gt; void;
  reject: (reason: unknown) =&gt; void;
  fn: (worker: Comlink.Remote&lt;any&gt;) =&gt; Promise&lt;T&gt;;
}

export class WorkerPool&lt;TWorkerAPI extends object&gt; {
  private _workers: Worker[] = [];
  private _proxies: Comlink.Remote&lt;TWorkerAPI&gt;[] = [];
  private _busyWorkers: Set&lt;number&gt; = new Set();
  private _taskQueue: PendingTask&lt;any&gt;[] = [];
  private _terminated = false;

  constructor(
    private workerUrl: URL,
    private poolSize: number = navigator.hardwareConcurrency ?? 4
  ) {}

  async initialize(): Promise&lt;void&gt; {
    // 建立 Worker Pool（不超過 CPU 核心數）
    const actualSize = Math.min(this.poolSize, navigator.hardwareConcurrency ?? 4);
    console.log(\`[WorkerPool] 建立 \${actualSize} 個 Worker（硬體支援 \${navigator.hardwareConcurrency} 核心）\`);

    const initPromises = Array.from({ length: actualSize }, async (_, i) =&gt; {
      const worker = new Worker(this.workerUrl, {
        type: 'module',
        name: \`pool-worker-\${i}\`,
      });
      const proxy = Comlink.wrap&lt;TWorkerAPI&gt;(worker);
      this._workers.push(worker);
      this._proxies.push(proxy);
    });

    await Promise.all(initPromises);
  }

  /**
   * 提交任務到 Pool
   * @param fn 接收 Worker Proxy 並返回 Promise 的函數
   * @returns 任務完成後的 Promise
   */
  execute&lt;T&gt;(fn: (worker: Comlink.Remote&lt;TWorkerAPI&gt;) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
    if (this._terminated) {
      return Promise.reject(new Error('WorkerPool 已終止'));
    }

    return new Promise&lt;T&gt;((resolve, reject) =&gt; {
      const task: PendingTask&lt;T&gt; = { resolve, reject, fn };
      this._taskQueue.push(task);
      this._drainQueue();
    });
  }

  /**
   * 批次執行任務（自動分配到所有 Worker）
   */
  async executeBatch&lt;TInput, TOutput&gt;(
    items: TInput[],
    fn: (worker: Comlink.Remote&lt;TWorkerAPI&gt;, item: TInput, index: number) =&gt; Promise&lt;TOutput&gt;
  ): Promise&lt;TOutput[]&gt; {
    return Promise.all(
      items.map((item, index) =&gt;
        this.execute(worker =&gt; fn(worker, item, index))
      )
    );
  }

  /**
   * 批次執行，但限制並發數（避免同時提交過多任務到佇列）
   */
  async executeBatchLimited&lt;TInput, TOutput&gt;(
    items: TInput[],
    fn: (worker: Comlink.Remote&lt;TWorkerAPI&gt;, item: TInput) =&gt; Promise&lt;TOutput&gt;,
    concurrency = this._workers.length
  ): Promise&lt;TOutput[]&gt; {
    const results: TOutput[] = new Array(items.length);
    let index = 0;

    const runNext = async (): Promise&lt;void&gt; =&gt; {
      while (index &lt; items.length) {
        const currentIndex = index++;
        results[currentIndex] = await this.execute(
          worker =&gt; fn(worker, items[currentIndex])
        );
        await runNext(); // 遞迴確保持續消費
      }
    };

    // 啟動 concurrency 個並發消費者
    await Promise.all(Array.from({ length: concurrency }, runNext));
    return results;
  }

  private _drainQueue() {
    // 找出空閒的 Worker
    for (let i = 0; i &lt; this._workers.length; i++) {
      if (this._busyWorkers.has(i)) continue;
      if (this._taskQueue.length === 0) break;

      const task = this._taskQueue.shift()!;
      this._busyWorkers.add(i);

      task.fn(this._proxies[i])
        .then(result =&gt; {
          task.resolve(result);
        })
        .catch(err =&gt; {
          task.reject(err);
        })
        .finally(() =&gt; {
          this._busyWorkers.delete(i);
          // Worker 完成後繼續處理佇列
          this._drainQueue();
        });
    }
  }

  /**
   * 取得 Pool 狀態
   */
  get status() {
    return {
      total: this._workers.length,
      busy: this._busyWorkers.size,
      idle: this._workers.length - this._busyWorkers.size,
      queued: this._taskQueue.length,
    };
  }

  terminate() {
    this._terminated = true;
    // 拒絕所有等待中的任務
    for (const task of this._taskQueue) {
      task.reject(new Error('WorkerPool 已終止'));
    }
    this._taskQueue.length = 0;
    // 釋放 Proxy 並終止 Worker
    for (let i = 0; i &lt; this._proxies.length; i++) {
      this._proxies[i][Comlink.releaseProxy]();
      this._workers[i].terminate();
    }
  }
}

// ===== 在 Lit 元件中使用 Worker Pool =====
import type { ImageWorkerAPI } from './image-worker.js';

@customElement('batch-image-processor')
class BatchImageProcessor extends LitElement {
  @state() private _progress = 0;
  @state() private _results: string[] = [];
  private _pool?: WorkerPool&lt;ImageWorkerAPI&gt;;

  async connectedCallback() {
    super.connectedCallback();
    this._pool = new WorkerPool&lt;ImageWorkerAPI&gt;(
      new URL('./image-worker.ts', import.meta.url),
      4 // 最多 4 個 Worker
    );
    await this._pool.initialize();
  }

  private async _processFiles(files: FileList) {
    if (!this._pool) return;
    this._progress = 0;
    this._results = [];

    const fileArray = Array.from(files);
    let completed = 0;

    // 批次處理所有圖片（自動分配給空閒 Worker）
    const results = await this._pool.executeBatch(
      fileArray,
      async (worker, file) =&gt; {
        const bitmap = await createImageBitmap(file);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        const imageData = canvas.getContext('2d')!.getImageData(0, 0, bitmap.width, bitmap.height);

        const result = await worker.processImage(imageData, 'grayscale');

        // 更新進度
        completed++;
        this._progress = Math.round(completed / fileArray.length * 100);
        this.requestUpdate();

        // 轉換回 data URL
        const resultCanvas = new OffscreenCanvas(result.width, result.height);
        resultCanvas.getContext('2d')!.putImageData(result, 0, 0);
        return resultCanvas.convertToBlob().then(blob =&gt; URL.createObjectURL(blob));
      }
    );

    this._results = results;
    console.log('Pool 狀態：', this._pool.status);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._pool?.terminate();
  }

  render() {
    return html\`
      &lt;input type="file" multiple accept="image/*"
        @change=\${(e: Event) =&gt; {
          const files = (e.target as HTMLInputElement).files;
          if (files) this._processFiles(files);
        }}&gt;
      \${this._progress &gt; 0 &amp;&amp; this._progress &lt; 100
        ? html\`&lt;progress value=\${this._progress} max="100"&gt;\${this._progress}%&lt;/progress&gt;\`
        : ''
      }
      &lt;div class="results"&gt;
        \${this._results.map(url =&gt; html\`&lt;img src=\${url} width="150"&gt;\`)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="shared-array-buffer">
  <h2>SharedArrayBuffer：零拷貝資料共享</h2>
  <p>
    <code>SharedArrayBuffer</code> 讓多個 Worker 和主執行緒共享同一塊記憶體，
    完全避免序列化/反序列化的開銷。這對需要高頻率交換大量資料的場景
    （如即時音頻處理、物理引擎、遊戲狀態同步）至關重要。
  </p>

  <div class="callout callout-warning">
    <div class="callout-title">SharedArrayBuffer 的安全要求：COOP/COEP Headers</div>
    <p>
      由於 Spectre 漏洞，<code>SharedArrayBuffer</code> 需要頁面設定跨來源隔離（Cross-Origin Isolation）。
      伺服器必須回傳以下 HTTP Headers：
    </p>
    <pre data-lang="typescript"><code class="language-typescript">// 伺服器設定（以 Express.js 為例）
app.use((req, res, next) =&gt; {
  // Cross-Origin-Opener-Policy：防止跨視窗共享
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Cross-Origin-Embedder-Policy：確保所有子資源都同意共享
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// 驗證是否已啟用跨來源隔離
if (crossOriginIsolated) {
  console.log('SharedArrayBuffer 可用');
  // typeof SharedArrayBuffer === 'function'
} else {
  console.warn('跨來源隔離未啟用，SharedArrayBuffer 不可用');
}</code></pre>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">// shared-state.ts — 使用 SharedArrayBuffer 的高效能狀態共享

// 模擬一個物理引擎場景：主執行緒讀取粒子位置，Worker 持續更新
interface ParticleState {
  x: Float32Array;      // 粒子 X 坐標
  y: Float32Array;      // 粒子 Y 坐標
  vx: Float32Array;     // X 速度
  vy: Float32Array;     // Y 速度
  flags: Int32Array;    // 控制旗標（使用 Atomics 操作）
}

const PARTICLE_COUNT = 100000;

// 在主執行緒建立共享記憶體
const sharedBuffer = new SharedArrayBuffer(
  PARTICLE_COUNT * 4 * 4 + // x, y, vx, vy（4 個 Float32 per particle）
  4 * 4 // flags（4 個 Int32）
);

const state: ParticleState = {
  x: new Float32Array(sharedBuffer, 0, PARTICLE_COUNT),
  y: new Float32Array(sharedBuffer, PARTICLE_COUNT * 4, PARTICLE_COUNT),
  vx: new Float32Array(sharedBuffer, PARTICLE_COUNT * 8, PARTICLE_COUNT),
  vy: new Float32Array(sharedBuffer, PARTICLE_COUNT * 12, PARTICLE_COUNT),
  // flags[0] = 控制 Worker 的旗標（0=繼續, 1=暫停, 2=停止）
  flags: new Int32Array(sharedBuffer, PARTICLE_COUNT * 16, 4),
};

// 初始化粒子
for (let i = 0; i &lt; PARTICLE_COUNT; i++) {
  state.x[i] = Math.random() * 800;
  state.y[i] = Math.random() * 600;
  state.vx[i] = (Math.random() - 0.5) * 100;
  state.vy[i] = (Math.random() - 0.5) * 100;
}

// 將 SharedArrayBuffer 傳遞給 Worker（不需要 transfer，可以共享）
const physicsWorker = new Worker('./physics-worker.js');
physicsWorker.postMessage({ type: 'INIT', buffer: sharedBuffer });

// ===== Atomics.wait/notify 同步 =====
// physics-worker.ts（物理 Worker）
/// &lt;reference lib="webworker" /&gt;

let state: ParticleState;

self.onmessage = (e) =&gt; {
  if (e.data.type === 'INIT') {
    const buffer = e.data.buffer as SharedArrayBuffer;
    state = {
      x: new Float32Array(buffer, 0, PARTICLE_COUNT),
      y: new Float32Array(buffer, PARTICLE_COUNT * 4, PARTICLE_COUNT),
      vx: new Float32Array(buffer, PARTICLE_COUNT * 8, PARTICLE_COUNT),
      vy: new Float32Array(buffer, PARTICLE_COUNT * 12, PARTICLE_COUNT),
      flags: new Int32Array(buffer, PARTICLE_COUNT * 16, 4),
    };
    runPhysics();
  }
};

function runPhysics() {
  const DT = 1 / 60;

  while (true) {
    // 檢查控制旗標
    const flag = Atomics.load(state.flags, 0);
    if (flag === 2) break; // 停止信號

    if (flag === 1) {
      // 暫停：等待通知（比 busy-wait 節省 CPU）
      Atomics.wait(state.flags, 0, 1);
      continue;
    }

    // 更新所有粒子（直接操作共享記憶體！）
    for (let i = 0; i &lt; PARTICLE_COUNT; i++) {
      state.vy[i] += 200 * DT; // 重力
      state.x[i] += state.vx[i] * DT;
      state.y[i] += state.vy[i] * DT;

      // 邊界碰撞
      if (state.x[i] &lt; 0 || state.x[i] &gt; 800) state.vx[i] *= -0.8;
      if (state.y[i] &gt; 600) { state.y[i] = 600; state.vy[i] *= -0.6; }
    }

    // 通知主執行緒資料已更新
    Atomics.notify(state.flags, 1, 1);

    // 簡單的幀率控制（實際應使用 requestAnimationFrame 在 Worker 中）
    // 注意：Atomics.wait 不能在主執行緒中呼叫（會拋出錯誤）
  }
}

// ===== 在 Lit 元件中使用 SharedArrayBuffer =====
@customElement('shared-buffer-demo')
class SharedBufferDemo extends LitElement {
  private _physicsWorker?: Worker;
  private _state?: ParticleState;
  private _rafId?: number;

  @query('canvas') private _canvas!: HTMLCanvasElement;

  async firstUpdated() {
    if (!crossOriginIsolated) {
      console.error('需要設定 COOP/COEP Headers 才能使用 SharedArrayBuffer');
      return;
    }

    // 建立共享記憶體和 Worker
    // ...

    // 主執行緒：每幀讀取共享記憶體並渲染（零拷貝！）
    const render = () =&gt; {
      const ctx = this._canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 800, 600);
      ctx.fillStyle = 'rgba(0, 100, 255, 0.5)';
      for (let i = 0; i &lt; PARTICLE_COUNT; i++) {
        ctx.fillRect(this._state!.x[i], this._state!.y[i], 2, 2);
      }
      this._rafId = requestAnimationFrame(render);
    };
    this._rafId = requestAnimationFrame(render);
  }

  render() {
    if (!crossOriginIsolated) {
      return html\`
        &lt;div class="callout callout-warning"&gt;
          需要設定 COOP/COEP HTTP Headers 才能使用 SharedArrayBuffer。
        &lt;/div&gt;
      \`;
    }
    return html\`&lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="wasm-worker">
  <h2>WebAssembly + Worker + Lit 的三角整合</h2>
  <p>
    WebAssembly（WASM）讓 C/C++/Rust 程式碼在瀏覽器中執行，接近原生效能。
    將 WASM 模組放在 Worker 中執行，可以避免 WASM 初始化（編譯 .wasm 位元組碼）
    阻塞主執行緒，同時讓計算密集的 WASM 函數在獨立執行緒中運行。
  </p>

  <h3>整合架構</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 整合架構：
// Lit 元件（主執行緒 UI）
//   ↕ Comlink RPC
// WASM Worker（執行 Rust/C++ 編譯的 WASM 模組）
//   ↕ wasm-bindgen（Rust）或 Emscripten（C++）
// WebAssembly 模組（高效能核心邏輯）

// ===== Rust + wasm-bindgen 示例 =====
// src/lib.rs（Rust 側）
// #[wasm_bindgen]
// pub fn process_image_data(data: &mut [u8], width: u32, height: u32) {
//     for i in (0..data.len()).step_by(4) {
//         let avg = (data[i] as u32 + data[i+1] as u32 + data[i+2] as u32) / 3;
//         data[i] = avg as u8;
//         data[i+1] = avg as u8;
//         data[i+2] = avg as u8;
//     }
// }

// ===== wasm-worker.ts =====
/// &lt;reference lib="webworker" /&gt;
import * as Comlink from 'comlink';

// 動態 import WASM 模組（在 Worker 中初始化，不阻塞主執行緒）
let wasmModule: typeof import('../pkg/image_processor.js') | null = null;

async function initWasm() {
  if (wasmModule) return wasmModule;
  // wasm-pack 生成的 JS bindings
  const module = await import('../pkg/image_processor.js');
  await module.default(); // 初始化 WASM（可能需要 100-500ms）
  wasmModule = module;
  return module;
}

// Worker API
const api = {
  async isReady(): Promise&lt;boolean&gt; {
    try {
      await initWasm();
      return true;
    } catch {
      return false;
    }
  },

  async processImageGrayscale(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Promise&lt;Uint8ClampedArray&gt; {
    const wasm = await initWasm();
    // 建立 WASM 記憶體中的資料副本
    const wasmData = new Uint8Array(data);
    // 呼叫 Rust 函數（接近原生速度！）
    wasm.process_image_data(wasmData, width, height);
    return new Uint8ClampedArray(wasmData.buffer);
  },

  async runHeavyComputation(input: Float64Array): Promise&lt;Float64Array&gt; {
    const wasm = await initWasm();
    // 例如：快速傅立葉變換（FFT），Rust 實作速度是 JS 的 10-50x
    return wasm.fft(input);
  },
};

Comlink.expose(api);

// ===== wasm-lit-controller.ts =====
import { ReactiveController, ReactiveControllerHost } from 'lit';
import * as Comlink from 'comlink';

export class WasmWorkerController implements ReactiveController {
  private _worker?: Worker;
  proxy?: Comlink.Remote&lt;typeof api&gt;;
  isReady = false;
  error?: string;

  constructor(private host: ReactiveControllerHost) {
    host.addController(this);
  }

  async hostConnected() {
    try {
      this._worker = new Worker(
        new URL('./wasm-worker.ts', import.meta.url),
        { type: 'module', name: 'wasm-worker' }
      );
      this.proxy = Comlink.wrap&lt;typeof api&gt;(this._worker);

      // 等待 WASM 初始化完成
      this.isReady = await this.proxy.isReady();
      if (!this.isReady) {
        this.error = 'WASM 模組載入失敗';
      }
    } catch (e) {
      this.error = String(e);
    }
    this.host.requestUpdate();
  }

  hostDisconnected() {
    this.proxy?.[Comlink.releaseProxy]();
    this._worker?.terminate();
  }
}

// ===== 在 Lit 元件中使用 =====
@customElement('wasm-image-processor')
class WasmImageProcessor extends LitElement {
  private _wasm = new WasmWorkerController(this);
  @state() private _processing = false;
  @state() private _timing = '';

  private async _process(file: File) {
    if (!this._wasm.proxy) return;
    this._processing = true;

    const start = performance.now();
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    // 在 WASM Worker 中執行（不阻塞主執行緒！）
    const result = await this._wasm.proxy.processImageGrayscale(
      Comlink.transfer(
        imageData.data,
        [imageData.data.buffer]
      ),
      imageData.width,
      imageData.height
    );

    const elapsed = performance.now() - start;
    this._timing = \`處理完成（\${imageData.width}x\${imageData.height}，耗時 \${elapsed.toFixed(1)}ms）\`;
    this._processing = false;
  }

  render() {
    if (this._wasm.error) {
      return html\`&lt;div class="error"&gt;WASM 初始化失敗：\${this._wasm.error}&lt;/div&gt;\`;
    }
    return html\`
      \${!this._wasm.isReady
        ? html\`&lt;div&gt;載入 WebAssembly 模組中...&lt;/div&gt;\`
        : html\`
          &lt;input type="file" accept="image/*"
            @change=\${(e: Event) =&gt; {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) this._process(f);
            }}&gt;
          \${this._processing ? html\`&lt;div&gt;WASM 處理中...&lt;/div&gt;\` : ''}
          \${this._timing ? html\`&lt;p&gt;\${this._timing}&lt;/p&gt;\` : ''}
        \`
      }
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">WASM 效能的真實情況</div>
    <p>
      WASM 不總是比 JavaScript 快。對於簡單的整數運算，現代 JS 引擎（V8）
      經過 JIT 編譯後速度相近。WASM 的優勢在於：
      <strong>可預測的效能</strong>（無 JIT 去最佳化風險）、
      <strong>記憶體密集計算</strong>（直接操作線性記憶體，無 GC 暫停）、
      以及可直接移植的 <strong>現有 C/C++/Rust 程式庫</strong>
      （如 OpenCV、libjpeg-turbo、TensorFlow C++ Runtime）。
      對影像處理、音頻編解碼、密碼學等場景，Rust + wasm-bindgen 可達到 JS 的 5–20x 速度。
    </p>
  </div>
</section>

<section id="lit-worker-integration">
  <h2>Lit 與 Worker 的整合模式</h2>
  <p>
    建立一個通用的 Worker Reactive Controller，封裝 Worker 的完整生命週期，
    包括錯誤處理、請求追蹤和取消機制。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// worker-controller.ts — 通用 Worker Controller
import { ReactiveController, ReactiveControllerHost } from 'lit';

interface WorkerTask&lt;TResponse&gt; {
  resolve: (value: TResponse) =&gt; void;
  reject: (reason: unknown) =&gt; void;
  timeoutId?: ReturnType&lt;typeof setTimeout&gt;;
}

export class WorkerController&lt;TRequest extends { requestId: string }, TResponse extends { requestId: string }&gt;
  implements ReactiveController {
  private _worker?: Worker;
  private _pending = new Map&lt;string, WorkerTask&lt;TResponse&gt;&gt;();
  lastResult?: TResponse;
  isProcessing = false;
  error?: string;

  constructor(
    private host: ReactiveControllerHost,
    private workerUrl: URL,
    private options: {
      timeout?: number; // 請求逾時（毫秒）
      onProgress?: (requestId: string, progress: number) =&gt; void;
    } = {}
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._worker = new Worker(this.workerUrl, { type: 'module' });

    this._worker.onmessage = (e: MessageEvent&lt;TResponse&amp; { type?: 'PROGRESS'; progress?: number }&gt;) =&gt; {
      const data = e.data;

      // 處理進度更新
      if ((data as any).type === 'PROGRESS') {
        this.options.onProgress?.(data.requestId, (data as any).progress);
        return;
      }

      const task = this._pending.get(data.requestId);
      if (!task) return;

      clearTimeout(task.timeoutId);
      this._pending.delete(data.requestId);
      this.isProcessing = this._pending.size &gt; 0;
      this.lastResult = data;
      task.resolve(data);
      this.host.requestUpdate();
    };

    this._worker.onerror = (e) =&gt; {
      this.error = e.message;
      // 拒絕所有等待中的任務
      for (const [, task] of this._pending) {
        clearTimeout(task.timeoutId);
        task.reject(new Error(e.message));
      }
      this._pending.clear();
      this.isProcessing = false;
      this.host.requestUpdate();
    };
  }

  send(message: TRequest, transfer: Transferable[] = []): Promise&lt;TResponse&gt; {
    return new Promise((resolve, reject) =&gt; {
      if (!this._worker) {
        reject(new Error('Worker 未初始化'));
        return;
      }

      const task: WorkerTask&lt;TResponse&gt; = { resolve, reject };

      // 設定逾時
      if (this.options.timeout) {
        task.timeoutId = setTimeout(() =&gt; {
          if (this._pending.has(message.requestId)) {
            this._pending.delete(message.requestId);
            reject(new Error(\`請求逾時（\${this.options.timeout}ms）\`));
          }
        }, this.options.timeout);
      }

      this._pending.set(message.requestId, task);
      this.isProcessing = true;
      this._worker.postMessage(message, transfer);
      this.host.requestUpdate();
    });
  }

  cancel(requestId: string) {
    const task = this._pending.get(requestId);
    if (task) {
      clearTimeout(task.timeoutId);
      this._pending.delete(requestId);
      // 通知 Worker 取消（Worker 端需要配合處理 CANCEL 訊息）
      this._worker?.postMessage({ type: 'CANCEL', payload: { requestId } });
      task.reject(new Error('已取消'));
      this.isProcessing = this._pending.size &gt; 0;
      this.host.requestUpdate();
    }
  }

  hostDisconnected() {
    // 取消所有等待中的請求
    for (const [requestId, task] of this._pending) {
      clearTimeout(task.timeoutId);
      task.reject(new Error('元件已卸載'));
    }
    this._pending.clear();
    this._worker?.terminate();
    this._worker = undefined;
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
        <th>主執行緒 FPS 影響</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>4K 圖片高斯模糊（JS）</td>
        <td>~800ms，頁面凍結</td>
        <td>~800ms（Worker 中）</td>
        <td>Worker 版：維持 60fps；主執行緒版：凍結 800ms</td>
      </tr>
      <tr>
        <td>4K 圖片高斯模糊（WASM）</td>
        <td>~80ms（仍阻塞）</td>
        <td>~80ms（WASM Worker）</td>
        <td>Worker+WASM：幾乎無影響；主執行緒 WASM：凍結 80ms</td>
      </tr>
      <tr>
        <td>100 萬粒子物理模擬</td>
        <td>~200ms/frame，&lt;5fps</td>
        <td>~200ms/frame（Worker）</td>
        <td>Worker 版：UI 仍可互動；直接在主執行緒：&lt;5fps</td>
      </tr>
      <tr>
        <td>50MB JSON 解析</td>
        <td>~3000ms，頁面無響應</td>
        <td>~3000ms（Worker 中）</td>
        <td>Worker 版：頁面保持響應；主執行緒版：頁面卡死</td>
      </tr>
      <tr>
        <td>100K 資料排序</td>
        <td>~20ms，偶爾掉幀</td>
        <td>~20ms（Worker）</td>
        <td>Worker 版：零影響；主執行緒版：偶爾掉 1-2 幀</td>
      </tr>
    </tbody>
  </table>

  <h3>Transferable Objects 的零拷貝效能</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 不使用 Transfer：拷貝 4MB 圖片資料（耗時 ~50ms，阻塞主執行緒）
worker.postMessage({ imageData: largeImageData });

// 使用 Transfer：轉移 ArrayBuffer 所有權（耗時 &lt;0.1ms，幾乎不阻塞）
worker.postMessage(
  { imageData: largeImageData },
  [largeImageData.data.buffer] // 轉移 ArrayBuffer，不拷貝
);
// 注意：轉移後，largeImageData.data 的 buffer 變為 detached（長度為 0）
// 如果你還需要原始資料，先 .slice() 建立副本

// SharedArrayBuffer：完全零拷貝（適合高頻率共享）
const shared = new SharedArrayBuffer(4 * width * height);
const data = new Uint8ClampedArray(shared);
// 主執行緒和 Worker 同時讀寫（需要 Atomics 保護）
worker.postMessage({ buffer: shared }); // 傳遞引用，不需要 transfer</code></pre>

  <h3>何時不應使用 Worker</h3>
  <ul>
    <li><strong>任務太輕量</strong>：Worker postMessage 本身有約 0.1–1ms 的開銷。小於 5ms 的任務不值得放到 Worker。</li>
    <li><strong>需要直接操作 DOM</strong>：Worker 完全沒有 DOM 存取能力（這是設計選擇，不是缺陷）。</li>
    <li><strong>高頻率小資料交換</strong>：每幀需要傳遞少量資料的場景，postMessage 往返開銷可能超過計算本身。改用 SharedArrayBuffer。</li>
    <li><strong>初始化成本高於計算成本</strong>：WASM 模組初始化需要 100–500ms。如果只執行一次輕量計算，不值得。</li>
  </ul>

  <div class="callout callout-tip">
    <div class="callout-title">使用 Chrome DevTools 衡量決策</div>
    <p>
      在 Chrome DevTools Performance 面板中，任何超過 50ms 的 Long Task
      都會被標記為紅色警告。這是判斷是否需要移到 Worker 的客觀標準。
      先測量，再最佳化——不要過早將所有東西都放入 Worker。
    </p>
  </div>
</section>
`,
};
