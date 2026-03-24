const e={id:19,slug:"chapter-19",title:"WebGPU：下一代 GPU 運算與 Lit 的整合",part:5,intro:"WebGPU API 入門，在 Lit Component 中管理 GPUDevice 的初始化與釋放，實作 Compute Shader 驅動的粒子系統，以及 GPU 影像後處理管線的封裝。",sections:[{slug:"webgpu-intro",title:"WebGPU API 入門"},{slug:"gpudevice-lifecycle",title:"GPUDevice 初始化與釋放"},{slug:"compute-shader",title:"Compute Shader 驅動粒子系統"},{slug:"render-pipeline",title:"GPU 渲染管線封裝"},{slug:"image-postprocess",title:"GPU 影像後處理管線"}],content:`
<section id="webgpu-intro">
  <h2>WebGPU API 入門</h2>
  <p>
    WebGPU 是下一代 Web 圖形 API，設計目標是提供對現代 GPU 的<strong>直接且高效的存取</strong>。
    它比 WebGL 更接近底層 GPU API（Metal、Vulkan、Direct3D 12），
    並且新增了 <strong>Compute Shader</strong> 支援，讓 GPU 不只用於渲染，
    也可以進行通用計算（影像處理、物理模擬、機器學習推理）。
  </p>

  <h3>WebGPU vs WebGL</h3>
  <table>
    <thead>
      <tr><th>特性</th><th>WebGL 2</th><th>WebGPU</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>底層 API 映射</td>
        <td>OpenGL ES 3.0</td>
        <td>Metal / Vulkan / Direct3D 12</td>
      </tr>
      <tr>
        <td>CPU 開銷</td>
        <td>較高（驅動層狀態管理）</td>
        <td>較低（顯式 GPU 狀態）</td>
      </tr>
      <tr>
        <td>Compute Shader</td>
        <td>有限（Transform Feedback）</td>
        <td>完整支援（WGSL）</td>
      </tr>
      <tr>
        <td>多執行緒</td>
        <td>單執行緒</td>
        <td>支援 Web Workers</td>
      </tr>
      <tr>
        <td>瀏覽器支援</td>
        <td>廣泛（所有瀏覽器）</td>
        <td>Chrome 113+、Firefox（實驗）、Safari（實驗）</td>
      </tr>
    </tbody>
  </table>

  <h3>瀏覽器支援檢測</h3>
  <pre data-lang="typescript"><code class="language-typescript">async function checkWebGPUSupport(): Promise&lt;boolean&gt; {
  if (!navigator.gpu) {
    console.warn('WebGPU 不支援：navigator.gpu 未定義');
    return false;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.warn('WebGPU 不支援：找不到 GPU Adapter');
    return false;
  }

  console.log('WebGPU 支援！');
  console.log('Adapter 功能：', adapter.features);
  return true;
}</code></pre>
</section>

<section id="gpudevice-lifecycle">
  <h2>GPUDevice 初始化與釋放</h2>
  <p>
    <code>GPUDevice</code> 是 WebGPU 的核心物件，代表一個虛擬 GPU。
    正確管理它的生命週期是在 Lit 元件中使用 WebGPU 的基礎。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// webgpu-controller.ts — 可復用的 WebGPU 管理 Controller
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class WebGPUController implements ReactiveController {
  adapter?: GPUAdapter;
  device?: GPUDevice;
  context?: GPUCanvasContext;
  isReady = false;
  error?: string;

  constructor(
    private host: ReactiveControllerHost &amp; { shadowRoot: ShadowRoot },
    private canvasSelector: string = 'canvas'
  ) {
    host.addController(this);
  }

  async hostConnected() {
    try {
      await this._init();
      this.isReady = true;
    } catch (err) {
      this.error = String(err);
    }
    this.host.requestUpdate();
  }

  private async _init() {
    if (!navigator.gpu) throw new Error('WebGPU 不支援');

    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!this.adapter) throw new Error('找不到 GPU Adapter');

    this.device = await this.adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {},
    });

    // 監聽 device 丟失
    this.device.lost.then(({ reason, message }) =&gt; {
      console.error(\`GPUDevice 丟失：\${reason} - \${message}\`);
      this.isReady = false;
      this.host.requestUpdate();
    });

    // 設定 Canvas Context
    const canvas = this.host.shadowRoot.querySelector(this.canvasSelector) as HTMLCanvasElement;
    if (!canvas) throw new Error('找不到 canvas 元素');

    this.context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format,
      alphaMode: 'premultiplied',
    });
  }

  hostDisconnected() {
    this.device?.destroy(); // 釋放 GPU 資源
    this.isReady = false;
  }
}

// 在元件中使用
@customElement('webgpu-canvas')
class WebGPUCanvas extends LitElement {
  private _gpu = new WebGPUController(this);

  render() {
    if (this._gpu.error) {
      return html\`&lt;div class="error"&gt;WebGPU 不可用：\${this._gpu.error}&lt;/div&gt;\`;
    }
    if (!this._gpu.isReady) {
      return html\`&lt;div class="loading"&gt;初始化 GPU 中...&lt;/div&gt;\`;
    }
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="compute-shader">
  <h2>Compute Shader 驅動粒子系統</h2>
  <p>
    粒子系統是展示 WebGPU Compute Shader 能力的經典範例。
    每幀有數萬個粒子需要更新位置——在 CPU 上執行開銷巨大，
    Compute Shader 讓這些計算在 GPU 上並行執行。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// WGSL Compute Shader：在 GPU 上並行更新粒子位置
const computeShaderCode = \`
struct Particle {
  pos: vec2f,
  vel: vec2f,
  life: f32,
  _pad: f32,
}

struct SimParams {
  dt: f32,
  gravity: f32,
  damping: f32,
  width: f32,
  height: f32,
}

@group(0) @binding(0) var&lt;storage, read_write&gt; particles: array&lt;Particle&gt;;
@group(0) @binding(1) var&lt;uniform&gt; params: SimParams;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i &gt;= arrayLength(&particles)) { return; }

  var p = particles[i];

  // 更新速度（加入重力）
  p.vel.y += params.gravity * params.dt;
  p.vel *= params.damping;

  // 更新位置
  p.pos += p.vel * params.dt;

  // 邊界碰撞
  if (p.pos.x &lt; 0.0 || p.pos.x &gt; params.width) {
    p.vel.x = -p.vel.x;
  }
  if (p.pos.y &gt; params.height) {
    p.pos.y = params.height;
    p.vel.y = -abs(p.vel.y) * 0.8;
  }

  // 更新生命
  p.life -= params.dt;

  particles[i] = p;
}
\`;

@customElement('gpu-particles')
class GPUParticles extends LitElement {
  @property({ type: Number }) count = 10000;
  @property({ type: Number }) gravity = 9.8;

  private _gpu = new WebGPUController(this);
  private _particleBuffer?: GPUBuffer;
  private _computePipeline?: GPUComputePipeline;
  private _rafId?: number;

  // firstUpdated 在 render() 執行後呼叫
  // 但 WebGPU 初始化是非同步的，需要等待 Controller 就緒
  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (this._gpu.isReady &amp;&amp; !this._particleBuffer) {
      this._setupParticles();
    }
  }

  private _setupParticles() {
    if (!this._gpu.device) return;
    const device = this._gpu.device;

    // 建立粒子資料（初始位置、速度）
    const particleData = new Float32Array(this.count * 6);
    for (let i = 0; i &lt; this.count; i++) {
      const base = i * 6;
      particleData[base]     = Math.random() * 800;  // pos.x
      particleData[base + 1] = Math.random() * -200; // pos.y（從上方掉落）
      particleData[base + 2] = (Math.random() - 0.5) * 100; // vel.x
      particleData[base + 3] = Math.random() * 50;   // vel.y
      particleData[base + 4] = Math.random();         // life
    }

    // 建立 GPU Buffer
    this._particleBuffer = device.createBuffer({
      size: particleData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this._particleBuffer, 0, particleData);

    // 建立 Compute Pipeline
    const computeShaderModule = device.createShaderModule({ code: computeShaderCode });
    this._computePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module: computeShaderModule, entryPoint: 'main' },
    });

    this._startRenderLoop();
  }

  private _startRenderLoop() {
    let lastTime = performance.now();
    const frame = (time: number) =&gt; {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      this._simulate(dt);
      this._render();
      this._rafId = requestAnimationFrame(frame);
    };
    this._rafId = requestAnimationFrame(frame);
  }

  private _simulate(dt: number) {
    if (!this._gpu.device || !this._computePipeline || !this._particleBuffer) return;
    const device = this._gpu.device;

    const commandEncoder = device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this._computePipeline);
    // ... 設定 bind group 和 dispatch
    computePass.dispatchWorkgroups(Math.ceil(this.count / 64));
    computePass.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  private _render() {
    // 渲染粒子點（使用 Render Pipeline）
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._particleBuffer?.destroy();
  }

  render() {
    if (!this._gpu.isReady) return html\`&lt;div&gt;初始化中...&lt;/div&gt;\`;
    return html\`&lt;canvas width="800" height="600"&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="render-pipeline">
  <h2>GPU 渲染管線封裝</h2>
  <pre data-lang="typescript"><code class="language-typescript">// WGSL Vertex + Fragment Shader
const renderShaderCode = \`
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@vertex
fn vertexMain(
  @location(0) pos: vec2f,
  @location(1) color: vec4f,
) -&gt; VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(pos / vec2f(400.0, 300.0) - 1.0, 0.0, 1.0);
  output.color = color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -&gt; @location(0) vec4f {
  return input.color;
}
\`;

// 建立 Render Pipeline
function createRenderPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): GPURenderPipeline {
  const shaderModule = device.createShaderModule({ code: renderShaderCode });

  return device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [{
        arrayStride: 6 * 4, // 2 floats pos + 4 floats color
        stepMode: 'instance',
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' },  // pos
          { shaderLocation: 1, offset: 8, format: 'float32x4' },  // color
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format }],
    },
    primitive: { topology: 'point-list' },
  });
}</code></pre>
</section>

<section id="image-postprocess">
  <h2>GPU 影像後處理管線</h2>
  <p>
    WebGPU Compute Shader 可以對圖片進行複雜的像素級處理，
    效能遠超 CPU 端的 Canvas 2D 操作。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// WGSL Compute Shader：高斯模糊
const blurShaderCode = \`
@group(0) @binding(0) var inputTexture: texture_2d&lt;f32&gt;;
@group(0) @binding(1) var outputTexture: texture_storage_2d&lt;rgba8unorm, write&gt;;
@group(0) @binding(2) var textureSampler: sampler;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let dims = textureDimensions(inputTexture, 0);
  if (id.x &gt;= dims.x || id.y &gt;= dims.y) { return; }

  let uv = vec2f(f32(id.x) / f32(dims.x), f32(id.y) / f32(dims.y));
  let texelSize = vec2f(1.0 / f32(dims.x), 1.0 / f32(dims.y));

  // 5x5 高斯核
  var color = vec4f(0.0);
  let kernel = array&lt;f32, 25&gt;(
    1.0/256.0,  4.0/256.0,  6.0/256.0,  4.0/256.0,  1.0/256.0,
    4.0/256.0, 16.0/256.0, 24.0/256.0, 16.0/256.0,  4.0/256.0,
    6.0/256.0, 24.0/256.0, 36.0/256.0, 24.0/256.0,  6.0/256.0,
    4.0/256.0, 16.0/256.0, 24.0/256.0, 16.0/256.0,  4.0/256.0,
    1.0/256.0,  4.0/256.0,  6.0/256.0,  4.0/256.0,  1.0/256.0,
  );

  for (var y = -2; y &lt;= 2; y++) {
    for (var x = -2; x &lt;= 2; x++) {
      let offset = vec2f(f32(x), f32(y)) * texelSize;
      let k = kernel[(y + 2) * 5 + (x + 2)];
      color += textureSampleLevel(inputTexture, textureSampler, uv + offset, 0.0) * k;
    }
  }

  textureStore(outputTexture, vec2i(id.xy), color);
}
\`;

@customElement('gpu-image-filter')
class GPUImageFilter extends LitElement {
  @property() imageSrc = '';
  @property({ type: Number }) blurRadius = 1;

  private _gpu = new WebGPUController(this, '#output-canvas');

  // ... 完整實作包含：載入圖片到 GPUTexture、建立 Compute Pipeline、執行模糊

  render() {
    return html\`
      &lt;canvas id="output-canvas"&gt;&lt;/canvas&gt;
      &lt;label&gt;
        模糊強度：\${this.blurRadius}
        &lt;input type="range" min="0" max="10" step="1"
          .value=\${String(this.blurRadius)}
          @input=\${(e: Event) =&gt; {
            this.blurRadius = Number((e.target as HTMLInputElement).value);
          }}&gt;
      &lt;/label&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">WebGPU 的現實</div>
    <p>
      WebGPU 目前（2024）仍在快速演進，API 可能有細節變化。
      建議在生產環境使用時加入 WebGL 2 fallback，
      並用 <code>navigator.gpu</code> 做功能偵測。
      未來隨著瀏覽器支援完善，WebGPU 將成為高效能 Web 應用的標配技術。
    </p>
  </div>
</section>
`};export{e as default};
