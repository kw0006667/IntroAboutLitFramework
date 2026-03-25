export default {
  id: 19,
  slug: 'chapter-19',
  title: 'WebGPU：下一代 GPU 運算與 Lit 的整合',
  part: 5,
  intro: 'WebGPU API 深度解析，從架構差異、管線快取到 Machine Learning 推論加速，在 Lit Component 中管理 GPUDevice 的初始化與釋放，實作 Compute Shader 驅動的粒子系統，GPU 影像後處理管線的封裝，以及完整的 WebGL 2 降級方案與除錯技巧。',
  sections: [
    { slug: 'webgpu-intro', title: 'WebGPU API 入門' },
    { slug: 'webgpu-vs-webgl', title: 'WebGPU vs WebGL：架構差異與遷移指南' },
    { slug: 'gpudevice-lifecycle', title: 'GPUDevice 初始化與釋放' },
    { slug: 'pipeline-cache', title: 'Pipeline State Object 快取策略' },
    { slug: 'buffer-upload', title: 'GPU Buffer 上傳模式：Staging Buffer 詳解' },
    { slug: 'compute-shader', title: 'Compute Shader 驅動粒子系統' },
    { slug: 'webgpu-compute-ml', title: 'WebGPU Compute：Machine Learning 推論加速' },
    { slug: 'render-pipeline', title: 'GPU 渲染管線封裝' },
    { slug: 'image-postprocess', title: 'GPU 影像後處理管線' },
    { slug: 'webgpu-fallback', title: 'WebGL 2 降級方案' },
    { slug: 'webgpu-debug', title: 'WebGPU 除錯：dawn:// Tracing' },
  ],
  content: `
<section id="webgpu-intro">
  <h2>WebGPU API 入門</h2>
  <p>
    WebGPU 是下一代 Web 圖形 API，設計目標是提供對現代 GPU 的<strong>直接且高效的存取</strong>。
    它比 WebGL 更接近底層 GPU API（Metal、Vulkan、Direct3D 12），
    並且新增了 <strong>Compute Shader</strong> 支援，讓 GPU 不只用於渲染，
    也可以進行通用計算（影像處理、物理模擬、機器學習推理）。
  </p>
  <p>
    對資深工程師而言，WebGPU 最關鍵的改進不只是效能數字，而是<strong>心智模型的根本轉變</strong>：
    從 OpenGL 的「隱式狀態機」模型（驅動程式猜測你的意圖），轉移到 Metal/Vulkan 的「顯式命令列表」模型
    （你明確地描述 GPU 應該做什麼）。這帶來可預測的效能特性與更低的 CPU 開銷。
  </p>

  <h3>WebGPU 核心概念圖</h3>
  <pre data-lang="typescript"><code class="language-typescript">// WebGPU 物件階層
// GPUAdapter（代表一張實體 GPU）
//   └─ GPUDevice（代表對 GPU 的一個虛擬連接）
//        ├─ GPUQueue（命令提交佇列）
//        ├─ GPUBuffer（GPU 端的記憶體緩衝區）
//        ├─ GPUTexture（GPU 紋理）
//        ├─ GPUShaderModule（編譯後的 WGSL shader）
//        ├─ GPURenderPipeline（渲染管線狀態物件，昂貴！）
//        ├─ GPUComputePipeline（運算管線狀態物件，昂貴！）
//        ├─ GPUBindGroup（資源綁定描述）
//        └─ GPUCommandEncoder（錄製 GPU 命令）
//              ├─ GPURenderPassEncoder（渲染通道）
//              └─ GPUComputePassEncoder（計算通道）</code></pre>

  <h3>瀏覽器支援檢測</h3>
  <pre data-lang="typescript"><code class="language-typescript">async function checkWebGPUSupport(): Promise&lt;GPUAdapterInfo | null&gt; {
  if (!navigator.gpu) {
    console.warn('WebGPU 不支援：navigator.gpu 未定義');
    return null;
  }

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',
  });
  if (!adapter) {
    console.warn('WebGPU 不支援：找不到 GPU Adapter');
    return null;
  }

  const info = await adapter.requestAdapterInfo();
  console.log('GPU 廠商：', info.vendor);
  console.log('GPU 型號：', info.device);
  console.log('GPU 架構：', info.architecture);
  console.log('支援功能：', [...adapter.features]);
  console.log('限制條件：', {
    maxBufferSize: adapter.limits.maxBufferSize,
    maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
    maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
  });

  return info;
}</code></pre>
</section>

<section id="webgpu-vs-webgl">
  <h2>WebGPU vs WebGL：架構差異與遷移指南</h2>
  <p>
    要理解 WebGPU 的價值，必須先深刻理解 WebGL 的根本缺陷——這些缺陷不是實作問題，
    而是 OpenGL 設計哲學的必然結果。
  </p>

  <h3>API 表面比較</h3>
  <table>
    <thead>
      <tr><th>特性</th><th>WebGL 2</th><th>WebGPU</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>底層 API 映射</td>
        <td>OpenGL ES 3.0（1992 年的設計哲學）</td>
        <td>Metal / Vulkan / Direct3D 12（2015+ 設計）</td>
      </tr>
      <tr>
        <td>狀態管理</td>
        <td>全域隱式狀態機（gl.bindTexture、gl.useProgram…）</td>
        <td>顯式管線狀態物件（Pipeline State Object）</td>
      </tr>
      <tr>
        <td>CPU 開銷</td>
        <td>較高（驅動層大量狀態追蹤與驗證）</td>
        <td>較低（大部分驗證在管線建立時完成）</td>
      </tr>
      <tr>
        <td>多執行緒</td>
        <td>單執行緒（Context 不可跨 Worker 共享）</td>
        <td>GPUDevice 可在 Worker 中建立與使用</td>
      </tr>
      <tr>
        <td>Compute Shader</td>
        <td>無（Transform Feedback 是不完整的替代品）</td>
        <td>完整 WGSL Compute Shader 支援</td>
      </tr>
      <tr>
        <td>Shader 語言</td>
        <td>GLSL（字串，執行時編譯，錯誤訊息差）</td>
        <td>WGSL（結構化，更好的錯誤訊息）</td>
      </tr>
      <tr>
        <td>命令提交</td>
        <td>即時執行（每次 gl.draw* 都提交命令）</td>
        <td>明確的 CommandEncoder + queue.submit()</td>
      </tr>
      <tr>
        <td>記憶體管理</td>
        <td>驅動決定（難以預測）</td>
        <td>顯式 Buffer/Texture 生命週期</td>
      </tr>
      <tr>
        <td>瀏覽器支援</td>
        <td>廣泛（所有主流瀏覽器）</td>
        <td>Chrome 113+、Edge 113+、Firefox（Nightly）、Safari 18+</td>
      </tr>
    </tbody>
  </table>

  <h3>WebGL 到 WebGPU 的概念映射</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ===== WebGL 2 方式 =====
// 問題：隱式全域狀態機，難以追蹤當前狀態
const gl = canvas.getContext('webgl2')!;

// 繫結全域狀態
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(0);
gl.useProgram(shaderProgram);
// ...如果你在這裡呼叫別的函數，全域狀態可能被改變！
gl.drawArrays(gl.TRIANGLES, 0, 3);

// ===== WebGPU 方式 =====
// 優勢：顯式管線狀態，無全域副作用
const commandEncoder = device.createCommandEncoder();
const renderPass = commandEncoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    loadOp: 'clear',
    storeOp: 'store',
  }],
});

// 管線狀態在建立時完全確定，渲染時只需設定
renderPass.setPipeline(renderPipeline);  // 不可變的管線狀態物件
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.setBindGroup(0, bindGroup);
renderPass.draw(3);
renderPass.end();

device.queue.submit([commandEncoder.finish()]);</code></pre>

  <h3>遷移路徑：從 WebGL 2 搬移到 WebGPU</h3>
  <div class="callout callout-info">
    <div class="callout-title">WebGPU 不是 WebGL 的升級版，而是重新設計</div>
    <p>
      不要期待 1:1 的 API 映射。WebGPU 的設計哲學完全不同：
      你需要重新思考資源管理（顯式 Buffer usage flags）、Shader 編寫（GLSL → WGSL）、
      以及渲染迴圈（即時提交 → CommandEncoder + submit）。
      建議從新功能（Compute Shader）開始使用 WebGPU，而非直接遷移既有的 WebGL 渲染程式碼。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">// WebGL GLSL vs WebGPU WGSL 比較

// ===== WebGL 2 Vertex Shader（GLSL） =====
/*
#version 300 es
in vec3 aPosition;
in vec4 aColor;
out vec4 vColor;
uniform mat4 uMVP;

void main() {
  gl_Position = uMVP * vec4(aPosition, 1.0);
  vColor = aColor;
}
*/

// ===== WebGPU Vertex Shader（WGSL） =====
// 優勢：強型別、模組化、更清晰的綁定語義
const vertexShaderWGSL = \`
struct Uniforms {
  mvp: mat4x4&lt;f32&gt;,
}

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) color: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@group(0) @binding(0) var&lt;uniform&gt; uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -&gt; VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.mvp * vec4f(input.position, 1.0);
  output.color = input.color;
  return output;
}
\`;</code></pre>
</section>

<section id="gpudevice-lifecycle">
  <h2>GPUDevice 初始化與釋放</h2>
  <p>
    <code>GPUDevice</code> 是 WebGPU 的核心物件，代表一個虛擬 GPU 連接。
    正確管理它的生命週期至關重要：洩漏 GPUDevice 不會造成 JS 記憶體洩漏，
    但會佔用 GPU 資源，導致效能下降或其他頁面無法獲取 GPU 存取。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// webgpu-controller.ts — 可復用的 WebGPU 管理 Controller
import { ReactiveController, ReactiveControllerHost } from 'lit';

export interface WebGPUOptions {
  powerPreference?: GPUPowerPreference;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Partial&lt;GPUSupportedLimits&gt;;
  canvasFormat?: GPUTextureFormat;
  canvasAlphaMode?: GPUCanvasAlphaMode;
}

export class WebGPUController implements ReactiveController {
  adapter?: GPUAdapter;
  device?: GPUDevice;
  context?: GPUCanvasContext;
  canvasFormat?: GPUTextureFormat;
  isReady = false;
  error?: string;

  constructor(
    private host: ReactiveControllerHost &amp; { shadowRoot: ShadowRoot },
    private canvasSelector: string = 'canvas',
    private options: WebGPUOptions = {}
  ) {
    host.addController(this);
  }

  async hostConnected() {
    try {
      await this._init();
      this.isReady = true;
    } catch (err) {
      this.error = String(err);
      console.error('[WebGPUController] 初始化失敗：', err);
    }
    this.host.requestUpdate();
  }

  private async _init() {
    if (!navigator.gpu) throw new Error('WebGPU 不支援（navigator.gpu 未定義）');

    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: this.options.powerPreference ?? 'high-performance',
    });
    if (!this.adapter) throw new Error('找不到 GPU Adapter');

    // 請求所需功能與限制
    this.device = await this.adapter.requestDevice({
      requiredFeatures: this.options.requiredFeatures ?? [],
      requiredLimits: this.options.requiredLimits ?? {},
      // 啟用 WebGPU 驗證層（開發時有用）
      // defaultQueue: { label: 'main-queue' },
    });

    // 設定裝置錯誤處理
    this.device.addEventListener('uncapturederror', (event) =&gt; {
      console.error('[GPUDevice] 未捕捉錯誤：', event.error.message);
    });

    // 監聽 device 丟失（GPU 重置、驅動程式崩潰、頁面切換到背景）
    this.device.lost.then(({ reason, message }) =&gt; {
      console.error(\`[GPUDevice] 裝置丟失：\${reason} - \${message}\`);
      this.isReady = false;
      this.device = undefined;
      this.context = undefined;
      // 嘗試重新初始化（僅在 'destroyed' 以外的原因時）
      if (reason !== 'destroyed') {
        setTimeout(() =&gt; this._init().then(() =&gt; {
          this.isReady = true;
          this.host.requestUpdate();
        }), 1000);
      }
      this.host.requestUpdate();
    });

    // 設定 Canvas Context
    const canvas = this.host.shadowRoot!.querySelector(this.canvasSelector) as HTMLCanvasElement;
    if (!canvas) throw new Error(\`找不到 canvas 元素：\${this.canvasSelector}\`);

    this.context = canvas.getContext('webgpu') as GPUCanvasContext;
    if (!this.context) throw new Error('無法取得 WebGPU Canvas Context');

    this.canvasFormat = this.options.canvasFormat ?? navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.canvasFormat,
      alphaMode: this.options.canvasAlphaMode ?? 'premultiplied',
      // 啟用時間戳（需要 timestamp-query feature）
      // usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  /**
   * 取得當前幀的 render target view
   * 每幀開始時呼叫一次（不要快取！）
   */
  getCurrentTextureView(): GPUTextureView | undefined {
    return this.context?.getCurrentTexture().createView();
  }

  hostDisconnected() {
    // 銷毀 device 會釋放所有相關 GPU 資源
    // 所有由此 device 建立的 Buffer、Texture、Pipeline 都會失效
    this.device?.destroy();
    this.isReady = false;
    this.device = undefined;
    this.context = undefined;
  }
}

// 在元件中使用
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('webgpu-canvas')
class WebGPUCanvas extends LitElement {
  private _gpu = new WebGPUController(this, 'canvas', {
    powerPreference: 'high-performance',
    requiredFeatures: ['timestamp-query'],
  });

  render() {
    if (this._gpu.error) {
      return html\`
        &lt;div class="error"&gt;
          &lt;p&gt;WebGPU 不可用：\${this._gpu.error}&lt;/p&gt;
          &lt;p&gt;請確認您使用 Chrome 113+ 並已啟用硬體加速。&lt;/p&gt;
        &lt;/div&gt;
      \`;
    }
    if (!this._gpu.isReady) {
      return html\`&lt;div class="loading"&gt;初始化 GPU 中...&lt;/div&gt;\`;
    }
    return html\`&lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">GPUDevice.lost 是 Promise，只解析一次</div>
    <p>
      <code>device.lost</code> 回傳的 Promise 只會解析一次，解析後 device 永久失效。
      如果你需要恢復，必須重新執行 <code>adapter.requestDevice()</code>。
      在行動裝置上，GPU 裝置丟失比桌機更常見（系統記憶體壓力、背景執行限制）。
    </p>
  </div>
</section>

<section id="pipeline-cache">
  <h2>Pipeline State Object 快取策略</h2>
  <p>
    WebGPU 中最昂貴的操作之一是建立 <code>GPURenderPipeline</code> 和 <code>GPUComputePipeline</code>。
    這些物件包含：Shader 編譯與最佳化、頂點格式驗證、Blend State 設定、
    以及驅動程式底層的 Pipeline State Object（PSO）建立。
    在複雜場景中，單次管線建立可能耗時 50–500ms。
  </p>

  <div class="callout callout-warning">
    <div class="callout-title">絕對不要在渲染迴圈中建立 Pipeline</div>
    <p>
      <code>device.createRenderPipeline()</code> 在渲染迴圈中呼叫是嚴重的效能反模式。
      應在初始化階段（<code>firstUpdated</code> 或 Controller 的 <code>hostConnected</code>）
      建立所有可能用到的管線，並快取它們。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">// pipeline-cache.ts — 管線快取管理器
export class PipelineCache {
  private _renderPipelines = new Map&lt;string, GPURenderPipeline&gt;();
  private _computePipelines = new Map&lt;string, GPUComputePipeline&gt;();
  private _shaderModules = new Map&lt;string, GPUShaderModule&gt;();

  constructor(private device: GPUDevice) {}

  /**
   * 取得或建立 ShaderModule（快取 WGSL 編譯結果）
   */
  getShaderModule(key: string, code: string): GPUShaderModule {
    if (!this._shaderModules.has(key)) {
      const module = this.device.createShaderModule({
        label: key,
        code,
        // hints 可以提前告知編譯器 entry point，加速編譯
        hints: {
          vertexMain: { layout: 'auto' },
          fragmentMain: { layout: 'auto' },
        },
      });
      // 非同步取得編譯錯誤（不阻塞，但比 try/catch 更詳細）
      module.getCompilationInfo().then(info =&gt; {
        for (const msg of info.messages) {
          if (msg.type === 'error') {
            console.error(\`[Shader \${key}] 編譯錯誤 L\${msg.lineNum}:\${msg.linePos}: \${msg.message}\`);
          }
        }
      });
      this._shaderModules.set(key, module);
    }
    return this._shaderModules.get(key)!;
  }

  /**
   * 取得或建立 RenderPipeline
   * 使用非同步版本（createRenderPipelineAsync）避免阻塞主執行緒
   */
  async getRenderPipeline(
    key: string,
    descriptor: GPURenderPipelineDescriptor
  ): Promise&lt;GPURenderPipeline&gt; {
    if (!this._renderPipelines.has(key)) {
      // 使用 async 版本：在背景編譯，不阻塞 JS 執行
      // 同步版 createRenderPipeline 會阻塞主執行緒數十至數百毫秒
      const pipeline = await this.device.createRenderPipelineAsync(descriptor);
      this._renderPipelines.set(key, pipeline);
    }
    return this._renderPipelines.get(key)!;
  }

  async getComputePipeline(
    key: string,
    descriptor: GPUComputePipelineDescriptor
  ): Promise&lt;GPUComputePipeline&gt; {
    if (!this._computePipelines.has(key)) {
      const pipeline = await this.device.createComputePipelineAsync(descriptor);
      this._computePipelines.set(key, pipeline);
    }
    return this._computePipelines.get(key)!;
  }

  /**
   * 預熱（Warm Up）：在頁面載入時就建立所有管線
   * 避免第一次使用時的卡頓
   */
  async warmUp(configs: Array&lt;{ key: string; descriptor: GPURenderPipelineDescriptor }&gt;) {
    // 並行建立所有管線
    await Promise.all(configs.map(({ key, descriptor }) =&gt;
      this.getRenderPipeline(key, descriptor)
    ));
    console.log(\`[PipelineCache] 已預熱 \${configs.length} 個管線\`);
  }

  destroy() {
    // GPURenderPipeline 不需要顯式銷毀，但清除快取釋放 JS 記憶體
    this._renderPipelines.clear();
    this._computePipelines.clear();
    this._shaderModules.clear();
  }
}

// 在 Lit Controller 中整合
export class WebGPUController implements ReactiveController {
  device?: GPUDevice;
  pipelineCache?: PipelineCache;
  // ...

  private async _init() {
    // ... adapter/device 初始化
    this.pipelineCache = new PipelineCache(this.device!);
    // 在初始化時預熱管線（非阻塞）
    await this.pipelineCache.warmUp([
      { key: 'main-render', descriptor: mainRenderPipelineDescriptor },
      { key: 'post-process', descriptor: postProcessPipelineDescriptor },
    ]);
  }
}</code></pre>

  <h3>Pipeline 快取的進階策略：持久化到 IndexedDB</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 瀏覽器提供了 GPUPipelineCache（Chrome 121+），可以持久化編譯結果
// 跨頁面重載保留 Shader 編譯快取，大幅加速後續載入

async function createCachedPipeline(
  device: GPUDevice,
  descriptor: GPURenderPipelineDescriptor,
  cacheKey: string
): Promise&lt;GPURenderPipeline&gt; {
  // 嘗試從 GPUPipelineCache 載入（如果瀏覽器支援）
  if ('createPipelineCache' in device) {
    const cachedData = await loadFromIndexedDB(cacheKey);
    const pipelineCache = device.createPipelineCache({
      data: cachedData ?? undefined,
    });

    const pipeline = await device.createRenderPipelineAsync({
      ...descriptor,
      cache: pipelineCache,
    });

    // 儲存更新後的快取資料
    const newData = await pipelineCache.getData();
    if (newData) {
      await saveToIndexedDB(cacheKey, newData);
    }
    return pipeline;
  }

  // 降級到非快取版本
  return device.createRenderPipelineAsync(descriptor);
}

// IndexedDB 工具函數（簡化版）
async function loadFromIndexedDB(key: string): Promise&lt;ArrayBuffer | null&gt; {
  // 實作略
  return null;
}

async function saveToIndexedDB(key: string, data: ArrayBuffer): Promise&lt;void&gt; {
  // 實作略
}</code></pre>
</section>

<section id="buffer-upload">
  <h2>GPU Buffer 上傳模式：Staging Buffer 詳解</h2>
  <p>
    在 WebGPU（以及底層的 Vulkan/Metal/D3D12）中，並非所有 GPU 記憶體都可以直接從 CPU 寫入。
    理解記憶體類型和資料傳輸路徑，是撰寫高效能 GPU 程式的基礎。
  </p>

  <h3>GPU 記憶體類型</h3>
  <table>
    <thead>
      <tr><th>記憶體類型</th><th>WebGPU 對應</th><th>CPU 可讀寫</th><th>GPU 效能</th><th>用途</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Device Local（VRAM）</td>
        <td>GPUBufferUsage.STORAGE | VERTEX | INDEX</td>
        <td>否</td>
        <td>最高</td>
        <td>頂點資料、計算資料</td>
      </tr>
      <tr>
        <td>Host Visible（共享）</td>
        <td>GPUBufferUsage.MAP_WRITE | COPY_SRC</td>
        <td>可寫</td>
        <td>中等</td>
        <td>Staging Buffer（暫存）</td>
      </tr>
      <tr>
        <td>Host Visible（讀回）</td>
        <td>GPUBufferUsage.MAP_READ | COPY_DST</td>
        <td>可讀</td>
        <td>低（需同步）</td>
        <td>GPU 計算結果讀回 CPU</td>
      </tr>
    </tbody>
  </table>

  <h3>模式一：直接上傳（小型資料，簡單但有限制）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// device.queue.writeBuffer：方便的 CPU→GPU 上傳
// 適用場景：Uniform Buffer（每幀更新的矩陣、參數），通常 &lt; 64KB
// 底層行為：瀏覽器自動使用 Staging Buffer，對你透明

const uniformBuffer = device.createBuffer({
  label: 'MVP Matrix Uniform',
  size: 64, // 4x4 float32 矩陣
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// 每幀更新（開銷低，因為資料小）
function updateMVP(mvpMatrix: Float32Array) {
  device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix);
  // 注意：writeBuffer 在 queue.submit() 執行前完成
}</code></pre>

  <h3>模式二：Staging Buffer（大型資料，最高效率）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Staging Buffer 模式：適用於大型 Buffer（頂點資料、紋理、計算資料）
// 原因：直接建立帶 COPY_DST 的 STORAGE Buffer 在某些 GPU 上效能較差
//       先寫入 Host Visible 的 Staging Buffer，再用 GPU 命令複製到 Device Local

class StagingBufferUploader {
  private _stagingBuffer?: GPUBuffer;
  private _stagingSize = 0;

  constructor(private device: GPUDevice) {}

  /**
   * 上傳大型資料到 GPU Buffer
   * @param data 要上傳的 CPU 端資料
   * @param gpuBuffer 目標 GPU Buffer（需有 COPY_DST）
   * @param offset GPU Buffer 中的偏移量（bytes）
   */
  async upload(
    data: Float32Array | Uint8Array | ArrayBuffer,
    gpuBuffer: GPUBuffer,
    offset = 0
  ): Promise&lt;void&gt; {
    const byteLength = data instanceof ArrayBuffer ? data.byteLength : data.byteLength;

    // 建立或重用 Staging Buffer
    if (!this._stagingBuffer || this._stagingSize &lt; byteLength) {
      this._stagingBuffer?.destroy();
      // 向上對齊至 256 bytes（WebGPU 對齊要求）
      this._stagingSize = Math.ceil(byteLength / 256) * 256;
      this._stagingBuffer = this.device.createBuffer({
        label: 'staging-upload',
        size: this._stagingSize,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true, // 建立時即映射，省一次 mapAsync 往返
      });

      // 直接寫入映射的記憶體（零拷貝）
      const arrayBuffer = this._stagingBuffer.getMappedRange(0, byteLength);
      if (data instanceof ArrayBuffer) {
        new Uint8Array(arrayBuffer).set(new Uint8Array(data));
      } else {
        new (data.constructor as any)(arrayBuffer).set(data);
      }
      this._stagingBuffer.unmap();
    } else {
      // 重用現有 Staging Buffer
      await this._stagingBuffer.mapAsync(GPUMapMode.WRITE, 0, byteLength);
      const arrayBuffer = this._stagingBuffer.getMappedRange(0, byteLength);
      if (data instanceof ArrayBuffer) {
        new Uint8Array(arrayBuffer).set(new Uint8Array(data));
      } else {
        new (data.constructor as any)(arrayBuffer).set(data);
      }
      this._stagingBuffer.unmap();
    }

    // GPU 命令：從 Staging Buffer 複製到目標 Buffer
    const encoder = this.device.createCommandEncoder({ label: 'staging-upload' });
    encoder.copyBufferToBuffer(this._stagingBuffer, 0, gpuBuffer, offset, byteLength);
    this.device.queue.submit([encoder.finish()]);
  }

  /**
   * 從 GPU Buffer 讀回資料到 CPU（注意：需要等待 GPU 完成）
   */
  async readBack(gpuBuffer: GPUBuffer, byteLength: number): Promise&lt;ArrayBuffer&gt; {
    // 建立讀回 Staging Buffer
    const readbackBuffer = this.device.createBuffer({
      label: 'staging-readback',
      size: byteLength,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // GPU 命令：複製到讀回 Buffer
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(gpuBuffer, 0, readbackBuffer, 0, byteLength);
    this.device.queue.submit([encoder.finish()]);

    // 等待 GPU 完成並映射
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    const data = readbackBuffer.getMappedRange().slice(0); // slice() 建立副本
    readbackBuffer.unmap();
    readbackBuffer.destroy();
    return data;
  }

  destroy() {
    this._stagingBuffer?.destroy();
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Buffer 對齊要求</div>
    <p>
      WebGPU 對 Buffer 大小與偏移量有嚴格的對齊要求：
      <code>copyBufferToBuffer</code> 的大小必須是 4 的倍數；
      Uniform Buffer 偏移量必須是 <code>device.limits.minUniformBufferOffsetAlignment</code>（通常 256）的倍數；
      Storage Buffer 偏移量必須是 <code>minStorageBufferOffsetAlignment</code>（通常 256）的倍數。
      忽略這些要求會導致 GPU 驗證錯誤。
    </p>
  </div>
</section>

<section id="compute-shader">
  <h2>Compute Shader 驅動粒子系統</h2>
  <p>
    粒子系統是展示 WebGPU Compute Shader 能力的經典範例。
    每幀有數萬個粒子需要更新位置——在 CPU 上執行開銷巨大，
    Compute Shader 讓這些計算在 GPU 上並行執行。
    以 10,000 個粒子為例，使用 workgroup_size(64) 只需要 157 次 Dispatch，
    所有計算在同一幀的 GPU 時間片內完成。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// WGSL Compute Shader：在 GPU 上並行更新粒子位置
const computeShaderCode = \`
struct Particle {
  pos: vec2f,
  vel: vec2f,
  life: f32,
  maxLife: f32,
}

struct SimParams {
  dt: f32,
  gravity: f32,
  damping: f32,
  width: f32,
  height: f32,
  time: f32,
  spawnX: f32,
  spawnY: f32,
}

@group(0) @binding(0) var&lt;storage, read_write&gt; particles: array&lt;Particle&gt;;
@group(0) @binding(1) var&lt;uniform&gt; params: SimParams;

// 簡單的 PRNG（GPU 上沒有 random()，需要手動實作）
fn randomF32(seed: u32) -&gt; f32 {
  var s = seed ^ (seed &lt;&lt; 13u);
  s = s ^ (s &gt;&gt; 7u);
  s = s ^ (s &lt;&lt; 17u);
  return f32(s) / f32(0xffffffffu);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i &gt;= arrayLength(&amp;particles)) { return; }

  var p = particles[i];

  // 更新速度（加入重力）
  p.vel.y += params.gravity * params.dt;
  p.vel *= params.damping;

  // 更新位置
  p.pos += p.vel * params.dt;

  // 邊界碰撞
  if (p.pos.x &lt; 0.0) { p.pos.x = 0.0; p.vel.x = abs(p.vel.x) * 0.7; }
  if (p.pos.x &gt; params.width) { p.pos.x = params.width; p.vel.x = -abs(p.vel.x) * 0.7; }
  if (p.pos.y &gt; params.height) {
    p.pos.y = params.height;
    p.vel.y = -abs(p.vel.y) * 0.6;
  }

  // 更新生命值
  p.life -= params.dt;

  // 粒子死亡後重生（在生成點附近）
  if (p.life &lt;= 0.0) {
    let seed = i + u32(params.time * 1000.0);
    p.pos = vec2f(params.spawnX, params.spawnY);
    p.vel = vec2f(
      (randomF32(seed) - 0.5) * 200.0,
      -randomF32(seed + 1u) * 300.0 - 50.0
    );
    p.life = p.maxLife;
  }

  particles[i] = p;
}
\`;

@customElement('gpu-particles')
class GPUParticles extends LitElement {
  @property({ type: Number }) count = 50000;
  @property({ type: Number }) gravity = 200;

  private _gpu = new WebGPUController(this);
  private _particleBuffer?: GPUBuffer;
  private _uniformBuffer?: GPUBuffer;
  private _computePipeline?: GPUComputePipeline;
  private _renderPipeline?: GPURenderPipeline;
  private _bindGroup?: GPUBindGroup;
  private _rafId?: number;
  private _startTime = 0;

  updated(_changedProps: Map&lt;string, unknown&gt;) {
    if (this._gpu.isReady &amp;&amp; !this._particleBuffer) {
      this._setup().catch(console.error);
    }
  }

  private async _setup() {
    if (!this._gpu.device || !this._gpu.canvasFormat) return;
    const device = this._gpu.device;
    const pipelineCache = new PipelineCache(device);

    // 建立粒子初始資料
    const particleData = new Float32Array(this.count * 6);
    for (let i = 0; i &lt; this.count; i++) {
      const base = i * 6;
      particleData[base]     = 400 + (Math.random() - 0.5) * 10; // pos.x
      particleData[base + 1] = 300;                               // pos.y
      particleData[base + 2] = (Math.random() - 0.5) * 200;      // vel.x
      particleData[base + 3] = -Math.random() * 300 - 50;         // vel.y
      const life = Math.random() * 3 + 1;
      particleData[base + 4] = life;  // life
      particleData[base + 5] = life;  // maxLife
    }

    this._particleBuffer = device.createBuffer({
      label: 'particles',
      size: particleData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this._particleBuffer, 0, particleData);

    this._uniformBuffer = device.createBuffer({
      label: 'sim-params',
      size: 32, // 8 x float32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // 建立 Compute Pipeline（非同步，不阻塞主執行緒）
    this._computePipeline = await pipelineCache.getComputePipeline('particles-compute', {
      layout: 'auto',
      compute: {
        module: pipelineCache.getShaderModule('particles-cs', computeShaderCode),
        entryPoint: 'main',
      },
    });

    this._bindGroup = device.createBindGroup({
      layout: this._computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this._particleBuffer } },
        { binding: 1, resource: { buffer: this._uniformBuffer } },
      ],
    });

    this._startTime = performance.now();
    this._startRenderLoop();
  }

  private _startRenderLoop() {
    let lastTime = performance.now();
    const frame = (time: number) =&gt; {
      const dt = Math.min((time - lastTime) / 1000, 0.033); // 最大 dt = 33ms
      lastTime = time;

      // 更新 Uniform Buffer（模擬參數）
      const params = new Float32Array([
        dt, this.gravity, 0.99, 800, 600,
        (time - this._startTime) / 1000, 400, 300,
      ]);
      this._gpu.device!.queue.writeBuffer(this._uniformBuffer!, 0, params);

      this._simulate();
      this._rafId = requestAnimationFrame(frame);
    };
    this._rafId = requestAnimationFrame(frame);
  }

  private _simulate() {
    if (!this._gpu.device || !this._computePipeline || !this._particleBuffer) return;
    const device = this._gpu.device;

    const commandEncoder = device.createCommandEncoder({ label: 'simulate' });
    const computePass = commandEncoder.beginComputePass({ label: 'particles-compute' });
    computePass.setPipeline(this._computePipeline);
    computePass.setBindGroup(0, this._bindGroup!);
    computePass.dispatchWorkgroups(Math.ceil(this.count / 64));
    computePass.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._particleBuffer?.destroy();
    this._uniformBuffer?.destroy();
  }

  render() {
    if (!this._gpu.isReady) return html\`&lt;div class="loading"&gt;初始化 GPU...&lt;/div&gt;\`;
    return html\`&lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="webgpu-compute-ml">
  <h2>WebGPU Compute：Machine Learning 推論加速</h2>
  <p>
    WebGPU 最令人興奮的應用之一是瀏覽器端的機器學習推論。
    TensorFlow.js 的 WebGPU 後端相比 WebGL 後端可達到 2–5x 的速度提升；
    ONNX Runtime Web 也支援 WebGPU 後端，可以在瀏覽器中執行 BERT、GPT-2 等大型模型。
  </p>

  <h3>TensorFlow.js + WebGPU 後端整合 Lit</h3>
  <pre data-lang="typescript"><code class="language-typescript">// npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgpu
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Task } from '@lit/task';

@customElement('ml-image-classifier')
class MLImageClassifier extends LitElement {
  static styles = css\`
    :host { display: block; }
    .result { font-size: 1.2rem; font-weight: bold; }
  \`;

  @state() private _imageSrc = '';
  @state() private _predictions: Array&lt;{ label: string; score: number }&gt; = [];

  // 初始化 TensorFlow.js WebGPU 後端
  private _initTask = new Task(this, {
    task: async () =&gt; {
      // 嘗試使用 WebGPU 後端，失敗時降級到 WebGL
      try {
        await tf.setBackend('webgpu');
        await tf.ready();
        console.log('TF.js 後端：', tf.getBackend()); // 'webgpu'
      } catch (e) {
        console.warn('WebGPU 後端不可用，降級到 WebGL', e);
        await tf.setBackend('webgl');
        await tf.ready();
      }
      // 載入 MobileNet 模型（量化版，&lt;5MB）
      const model = await tf.loadGraphModel(
        'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/classification/5/default/1',
        { fromTFHub: true }
      );
      return model;
    },
    args: () =&gt; [],
  });

  private async _classifyImage(imgElement: HTMLImageElement) {
    const model = this._initTask.value;
    if (!model) return;

    // 預處理：resize to 224x224, normalize to [0, 1]
    const tensor = tf.tidy(() =&gt; {
      const img = tf.browser.fromPixels(imgElement);
      const resized = tf.image.resizeBilinear(img, [224, 224]);
      const normalized = resized.div(255.0);
      return normalized.expandDims(0); // 加入 batch 維度
    });

    const predictions = await (model.predict(tensor) as tf.Tensor).data();
    tensor.dispose();

    // 取前 5 個預測結果
    const topK = Array.from(predictions)
      .map((score, idx) =&gt; ({ score: score as number, label: \`class-\${idx}\` }))
      .sort((a, b) =&gt; b.score - a.score)
      .slice(0, 5);

    this._predictions = topK;
  }

  render() {
    return html\`
      \${this._initTask.render({
        pending: () =&gt; html\`&lt;p&gt;載入 ML 模型中（使用 \${tf.getBackend()} 後端）...&lt;/p&gt;\`,
        complete: () =&gt; html\`
          &lt;input
            type="file"
            accept="image/*"
            @change=\${(e: Event) =&gt; {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              this._imageSrc = url;
              const img = new Image();
              img.onload = () =&gt; this._classifyImage(img);
              img.src = url;
            }}
          &gt;
          \${this._imageSrc ? html\`&lt;img src=\${this._imageSrc} width="224" height="224" style="object-fit: cover"&gt;\` : ''}
          &lt;div&gt;
            \${this._predictions.map(p =&gt; html\`
              &lt;div class="result"&gt;\${p.label}: \${(p.score * 100).toFixed(1)}%&lt;/div&gt;
            \`)}
          &lt;/div&gt;
        \`,
        error: (e) =&gt; html\`&lt;p&gt;模型載入失敗：\${e}&lt;/p&gt;\`,
      })}
    \`;
  }
}</code></pre>

  <h3>ONNX Runtime Web + WebGPU 後端</h3>
  <pre data-lang="typescript"><code class="language-typescript">// npm install onnxruntime-web
import * as ort from 'onnxruntime-web';

@customElement('onnx-inference')
class OnnxInference extends LitElement {
  private _session?: ort.InferenceSession;

  async connectedCallback() {
    super.connectedCallback();
    await this._initOnnx();
  }

  private async _initOnnx() {
    // 設定 WebGPU 執行提供者
    ort.env.wasm.numThreads = 1; // Worker 中使用 WASM 時需要
    ort.env.wasm.proxy = true;   // 在 Worker 中執行 WASM

    try {
      this._session = await ort.InferenceSession.create(
        '/models/bert-base-uncased.onnx',
        {
          executionProviders: [
            // 優先使用 WebGPU，不支援時降級
            { name: 'webgpu', deviceType: 'gpu', preferredLayout: 'NHWC' },
            { name: 'wasm' },  // 降級到 WASM CPU
          ],
          graphOptimizationLevel: 'all',
          // 啟用模型快取（IndexedDB）
          enableCpuMemArena: false,
        }
      );
      console.log('ONNX Runtime 後端：', this._session.handler.backendName);
    } catch (e) {
      console.error('ONNX 初始化失敗：', e);
    }
  }

  async runInference(inputIds: Int32Array): Promise&lt;Float32Array | null&gt; {
    if (!this._session) return null;

    const feeds: Record&lt;string, ort.Tensor&gt; = {
      input_ids: new ort.Tensor('int32', inputIds, [1, inputIds.length]),
      attention_mask: new ort.Tensor('int32', new Int32Array(inputIds.length).fill(1), [1, inputIds.length]),
    };

    const results = await this._session.run(feeds);
    return results['last_hidden_state'].data as Float32Array;
  }

  render() {
    return html\`
      &lt;div&gt;
        &lt;p&gt;ONNX Runtime Web（WebGPU 後端）就緒&lt;/p&gt;
        &lt;button @click=\${async () =&gt; {
          const input = new Int32Array([101, 7592, 1010, 2088, 999, 102]); // [CLS] hello, world! [SEP]
          const output = await this.runInference(input);
          console.log('推論結果：', output?.slice(0, 10));
        }}&gt;執行推論&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">WebGPU ML 效能基準</div>
    <p>
      以 MobileNet V3 分類（224x224 圖片）為例：
      WASM（CPU）約 80ms/次；WebGL 後端約 15ms/次；WebGPU 後端約 5ms/次。
      對大型 Transformer 模型（BERT-base），差距更顯著：
      WASM 約 800ms；WebGPU 約 120ms（使用量化模型）。
      但注意：第一次推論通常較慢（Shader 編譯），後續幀才能達到穩定效能。
    </p>
  </div>
</section>

<section id="render-pipeline">
  <h2>GPU 渲染管線封裝</h2>
  <p>
    WebGPU 的 <code>GPURenderPipeline</code> 封裝了完整的渲染管線狀態，
    包括 Vertex/Fragment Shader、頂點格式、混合模式、深度測試等。
    一旦建立就不可變更——如果需要不同狀態（例如透明/不透明），需要建立多個 Pipeline 物件。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// WGSL Vertex + Fragment Shader
const renderShaderCode = \`
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) size: f32,
}

struct Particle {
  pos: vec2f,
  vel: vec2f,
  life: f32,
  maxLife: f32,
}

struct Uniforms {
  resolution: vec2f,
  time: f32,
}

@group(0) @binding(0) var&lt;storage, read&gt; particles: array&lt;Particle&gt;;
@group(0) @binding(1) var&lt;uniform&gt; uniforms: Uniforms;

@vertex
fn vertexMain(@builtin(vertex_index) vi: u32) -&gt; VertexOutput {
  let p = particles[vi];
  let lifeRatio = p.life / p.maxLife;

  var out: VertexOutput;
  // 轉換到 NDC（-1 到 1）
  out.position = vec4f(
    p.pos / uniforms.resolution * 2.0 - 1.0,
    0.0, 1.0
  );
  // 生命值越少，顏色越暗，粒子越小
  out.color = vec4f(1.0, lifeRatio * 0.8 + 0.2, lifeRatio * 0.2, lifeRatio);
  out.size = lifeRatio * 4.0 + 1.0;
  return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -&gt; @location(0) vec4f {
  return in.color;
}
\`;

// 建立包含 Alpha Blending 的 Render Pipeline
function createParticleRenderPipeline(
  device: GPUDevice,
  format: GPUTextureFormat,
  shaderModule: GPUShaderModule
): GPURenderPipeline {
  return device.createRenderPipeline({
    label: 'particles-render',
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      // 注意：粒子資料來自 Storage Buffer（在 Shader 中直接讀取），
      // 而非 Vertex Buffer。這是 WebGPU 特有的 bindless 風格。
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{
        format,
        // Alpha Blending：standard alpha compositing
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      }],
    },
    primitive: {
      topology: 'point-list',
    },
    // 粒子通常不需要深度測試，但如果需要：
    // depthStencil: {
    //   format: 'depth24plus',
    //   depthWriteEnabled: true,
    //   depthCompare: 'less',
    // },
  });
}</code></pre>
</section>

<section id="image-postprocess">
  <h2>GPU 影像後處理管線</h2>
  <p>
    WebGPU Compute Shader 可以對圖片進行複雜的像素級處理，
    效能遠超 CPU 端的 Canvas 2D 操作。
    一張 4K 圖片（3840×2160）有約 830 萬像素，
    CPU 端的 Canvas ImageData 操作通常需要 200–800ms，
    而 WebGPU Compute Shader 可以在 5–20ms 內完成相同操作。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// WGSL Compute Shader：可分離高斯模糊（水平+垂直兩次 pass）
const blurShaderCode = \`
@group(0) @binding(0) var inputTexture: texture_2d&lt;f32&gt;;
@group(0) @binding(1) var outputTexture: texture_storage_2d&lt;rgba8unorm, write&gt;;
@group(0) @binding(2) var textureSampler: sampler;

struct BlurParams {
  horizontal: u32, // 1 = 水平 pass, 0 = 垂直 pass
  sigma: f32,
}
@group(0) @binding(3) var&lt;uniform&gt; params: BlurParams;

// 高斯函數
fn gaussian(x: f32, sigma: f32) -&gt; f32 {
  return exp(-0.5 * (x / sigma) * (x / sigma));
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let dims = textureDimensions(inputTexture, 0);
  if (id.x &gt;= dims.x || id.y &gt;= dims.y) { return; }

  let uv = vec2f(f32(id.x) / f32(dims.x), f32(id.y) / f32(dims.y));
  let texelSize = vec2f(1.0 / f32(dims.x), 1.0 / f32(dims.y));

  let radius = i32(ceil(params.sigma * 3.0));
  var color = vec4f(0.0);
  var weightSum = 0.0;

  for (var i = -radius; i &lt;= radius; i++) {
    let weight = gaussian(f32(i), params.sigma);
    var offset: vec2f;
    if (params.horizontal == 1u) {
      offset = vec2f(f32(i) * texelSize.x, 0.0);
    } else {
      offset = vec2f(0.0, f32(i) * texelSize.y);
    }
    color += textureSampleLevel(inputTexture, textureSampler, uv + offset, 0.0) * weight;
    weightSum += weight;
  }

  textureStore(outputTexture, vec2i(id.xy), color / weightSum);
}
\`;

@customElement('gpu-image-filter')
class GPUImageFilter extends LitElement {
  @property() imageSrc = '';
  @property({ type: Number }) blurRadius = 3;

  private _gpu = new WebGPUController(this, '#output-canvas');

  render() {
    return html\`
      &lt;canvas id="output-canvas"&gt;&lt;/canvas&gt;
      &lt;div class="controls"&gt;
        &lt;label&gt;
          模糊強度：\${this.blurRadius}
          &lt;input type="range" min="0" max="20" step="1"
            .value=\${String(this.blurRadius)}
            @input=\${(e: Event) =&gt; {
              this.blurRadius = Number((e.target as HTMLInputElement).value);
            }}&gt;
        &lt;/label&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">可分離核的重要性</div>
    <p>
      一個 r 半徑的二維高斯模糊需要 (2r+1)² 次紋理採樣。
      使用可分離核（先水平、再垂直）只需要 2×(2r+1) 次採樣，
      複雜度從 O(r²) 降到 O(r)。對 r=10 的模糊，
      效能差異達 10倍以上。這在 GPU 程式設計中是基本的最佳化技巧。
    </p>
  </div>
</section>

<section id="webgpu-fallback">
  <h2>WebGL 2 降級方案</h2>
  <p>
    WebGPU 的瀏覽器支援仍不完整（Safari 18+ 才開始支援，Firefox 仍在實驗階段）。
    為了覆蓋更廣的用戶群，必須實作 WebGL 2 降級方案。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// gpu-capability-detector.ts
export type GPUBackend = 'webgpu' | 'webgl2' | 'webgl1' | 'none';

export interface GPUCapability {
  backend: GPUBackend;
  // WebGPU 特有
  adapter?: GPUAdapter;
  device?: GPUDevice;
  // WebGL 特有
  gl?: WebGL2RenderingContext | WebGLRenderingContext;
}

export async function detectGPUCapability(
  canvas: HTMLCanvasElement
): Promise&lt;GPUCapability&gt; {
  // 1. 嘗試 WebGPU
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });
      if (adapter) {
        const device = await adapter.requestDevice();
        // 測試是否真的可用（有些系統 adapter 存在但 device 會失敗）
        if (device) {
          return { backend: 'webgpu', adapter, device };
        }
      }
    } catch (e) {
      console.warn('[GPUDetect] WebGPU 初始化失敗，嘗試降級：', e);
    }
  }

  // 2. 嘗試 WebGL 2
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    return { backend: 'webgl2', gl: gl2 };
  }

  // 3. 嘗試 WebGL 1
  const gl1 = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  if (gl1) {
    return { backend: 'webgl1', gl: gl1 as WebGLRenderingContext };
  }

  return { backend: 'none' };
}

// 在 Lit 元件中使用
@customElement('adaptive-renderer')
class AdaptiveRenderer extends LitElement {
  @state() private _backend: GPUBackend = 'none';
  @state() private _ready = false;

  @query('canvas') private _canvas!: HTMLCanvasElement;

  async firstUpdated() {
    const capability = await detectGPUCapability(this._canvas);
    this._backend = capability.backend;

    switch (capability.backend) {
      case 'webgpu':
        await this._initWebGPU(capability.device!);
        break;
      case 'webgl2':
        this._initWebGL2(capability.gl as WebGL2RenderingContext);
        break;
      case 'webgl1':
        this._initWebGL1(capability.gl as WebGLRenderingContext);
        break;
      default:
        console.error('此裝置不支援任何 GPU API');
    }

    this._ready = true;
    this.requestUpdate();
  }

  private async _initWebGPU(device: GPUDevice) { /* WebGPU 渲染器 */ }
  private _initWebGL2(gl: WebGL2RenderingContext) { /* WebGL 2 渲染器 */ }
  private _initWebGL1(gl: WebGLRenderingContext) { /* WebGL 1 渲染器（最大相容性）*/ }

  render() {
    return html\`
      &lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;
      \${this._ready
        ? html\`&lt;p class="backend-label"&gt;使用後端：\${this._backend}&lt;/p&gt;\`
        : html\`&lt;div class="loading"&gt;偵測 GPU 能力中...&lt;/div&gt;\`
      }
    \`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">不要在 WebGL 2 和 WebGPU 之間共享 Canvas Context</div>
    <p>
      一個 <code>&lt;canvas&gt;</code> 元素只能有一個 Context。
      一旦你呼叫 <code>getContext('webgpu')</code> 成功，就不能再呼叫 <code>getContext('webgl2')</code>，
      反之亦然。這也是為什麼降級偵測必須在建立任何 Context 之前完成。
    </p>
  </div>
</section>

<section id="webgpu-debug">
  <h2>WebGPU 除錯：dawn:// Tracing</h2>
  <p>
    WebGPU 的除錯工具鏈仍在成熟中，但 Chrome 的 Dawn（WebGPU 實作層）提供了強大的追蹤功能，
    可以精確了解 GPU 命令的執行情況。
  </p>

  <h3>方法一：WebGPU 驗證層錯誤捕捉</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 啟用 WebGPU 錯誤驗證（自動在 Chrome DevTools 中顯示）
function setupWebGPUErrorHandling(device: GPUDevice) {
  // 方式一：全域捕捉（生產環境也建議保留）
  device.addEventListener('uncapturederror', (event) =&gt; {
    // 常見錯誤類型：
    // GPUValidationError：API 使用不當（Buffer 大小不對、格式錯誤等）
    // GPUOutOfMemoryError：GPU 記憶體不足
    // GPUInternalError：驅動程式內部錯誤
    if (event.error instanceof GPUValidationError) {
      console.error('[WebGPU 驗證錯誤]', event.error.message);
    } else if (event.error instanceof GPUOutOfMemoryError) {
      console.error('[WebGPU 記憶體不足]', event.error.message);
    }
  });

  // 方式二：針對特定操作的 Error Scope（開發時使用）
  async function withErrorScope&lt;T&gt;(
    device: GPUDevice,
    filter: GPUErrorFilter,
    fn: () =&gt; T
  ): Promise&lt;T&gt; {
    device.pushErrorScope(filter);
    const result = fn();
    const error = await device.popErrorScope();
    if (error) {
      throw new Error(\`[WebGPU \${filter}] \${error.message}\`);
    }
    return result;
  }

  // 使用範例：捕捉 Pipeline 建立時的驗證錯誤
  return withErrorScope(device, 'validation', () =&gt;
    device.createRenderPipeline({ /* ... */ })
  );
}</code></pre>

  <h3>方法二：Chrome dawn:// 追蹤</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在 Chrome 中啟用 Dawn 追蹤：
// 1. 開啟 chrome://tracing
// 2. 點擊 "Record"
// 3. 勾選 "gpu" 類別（或選擇 "WebGPU" 預設設定）
// 4. 執行你的 WebGPU 程式碼
// 5. 停止錄製，分析時間軸

// 在程式碼中加入標記，讓追蹤結果更易讀：
function labelledDraw(
  device: GPUDevice,
  label: string,
  fn: (encoder: GPUCommandEncoder) =&gt; void
) {
  const encoder = device.createCommandEncoder({ label });
  fn(encoder);
  device.queue.submit([encoder.finish()]);
}

// 使用 GPU 時間戳查詢（需要 timestamp-query feature）
async function measureGPUTime(
  device: GPUDevice,
  fn: (encoder: GPUCommandEncoder) =&gt; void
): Promise&lt;number&gt; {
  if (!device.features.has('timestamp-query')) {
    console.warn('timestamp-query feature 不支援');
    return 0;
  }

  const querySet = device.createQuerySet({
    type: 'timestamp',
    count: 2,
  });

  const resolveBuffer = device.createBuffer({
    size: 2 * 8, // 2 x uint64
    usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
  });

  const resultBuffer = device.createBuffer({
    size: 2 * 8,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const encoder = device.createCommandEncoder();
  encoder.writeTimestamp(querySet, 0); // 開始時間
  fn(encoder);
  encoder.writeTimestamp(querySet, 1); // 結束時間
  encoder.resolveQuerySet(querySet, 0, 2, resolveBuffer, 0);
  encoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, 16);
  device.queue.submit([encoder.finish()]);

  await resultBuffer.mapAsync(GPUMapMode.READ);
  const times = new BigInt64Array(resultBuffer.getMappedRange());
  const durationNs = Number(times[1] - times[0]);
  resultBuffer.unmap();

  // 清理
  querySet.destroy();
  resolveBuffer.destroy();
  resultBuffer.destroy();

  return durationNs / 1_000_000; // 轉換為毫秒
}</code></pre>

  <h3>方法三：Chrome DevTools WebGPU 面板</h3>
  <div class="callout callout-info">
    <div class="callout-title">Chrome DevTools WebGPU 支援</div>
    <p>
      Chrome 113+ 的 DevTools 有 WebGPU 相關工具：
      <br><strong>Sources 面板</strong>：WGSL Shader 的語法高亮和除錯資訊。
      <br><strong>Performance 面板</strong>：GPU Task 在時間軸上的視覺化。
      <br><strong>Console</strong>：WebGPU 驗證錯誤會以清晰格式顯示，
      包含呼叫堆疊和 API 使用說明。
      <br>此外，可在 Chrome 啟動時加入 <code>--enable-dawn-features=dump_shaders</code>
      flag 來輸出編譯後的 Native Shader 程式碼（HLSL/MSL/SPIR-V）。
    </p>
  </div>
</section>
`,
};
