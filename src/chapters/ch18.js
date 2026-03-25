export default {
  id: 18,
  slug: 'chapter-18',
  title: 'WebGL 與 Three.js：Lit 作為 3D 場景的容器',
  part: 5,
  intro: '用 Lit 封裝 Three.js 場景，管理 WebGL context 的生命週期，以及如何透過 Reactive Properties 驅動 3D 場景的動態變化。',
  sections: [
    { slug: 'webgl-context-lifecycle', title: 'WebGL Context 生命週期管理' },
    { slug: 'threejs-setup', title: 'Three.js 場景封裝' },
    { slug: 'reactive-props-3d', title: 'Reactive Properties 驅動 3D 場景' },
    { slug: 'resource-cleanup', title: '資源清理與記憶體管理' },
    { slug: 'postprocessing', title: '後處理效果整合' },
    { slug: 'webgl-resource-manager', title: 'WebGL 資源管理器：Texture、Buffer、Program 生命週期' },
    { slug: 'reactive-scene-graph', title: '響應式場景圖：Lit Properties 驅動 3D 更新' },
    { slug: 'r3f-comparison', title: 'React Three Fiber vs Lit + Three.js 架構比較' },
  ],
  content: `
<section id="webgl-context-lifecycle">
  <h2>WebGL Context 生命週期管理</h2>
  <p>
    WebGL Context 是有限資源。每個頁面最多只能有 16 個 WebGL Context（瀏覽器限制）。
    在 Lit 元件中管理 WebGL 需要嚴格遵守「連接時建立，斷開時釋放」的規則。
    此外，GPU 記憶體壓力、驅動程式更新或 Tab 切換都可能導致 Context 丟失，
    健壯的元件必須能夠偵測並從 Context 丟失中恢復。
  </p>

  <h3>Context Lost / Restored 事件處理</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('webgl-canvas')
class WebGLCanvas extends LitElement {
  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _gl?: WebGL2RenderingContext;
  private _rafId?: number;

  firstUpdated() {
    this._initWebGL();

    // webglcontextlost：GPU 資源被系統回收時觸發
    // 常見原因：多個 WebGL context 超過上限、GPU 驅動崩潰、記憶體壓力
    this._canvas.addEventListener('webglcontextlost', (e: WebGLContextEvent) =&gt; {
      // 必須呼叫 preventDefault()，否則 context 會被永久丟棄
      e.preventDefault();
      console.warn('[WebGLCanvas] Context lost，暫停渲染');
      this._onContextLost();
    });

    // webglcontextrestored：系統重新分配 GPU 資源後觸發
    this._canvas.addEventListener('webglcontextrestored', () =&gt; {
      console.info('[WebGLCanvas] Context restored，重新初始化');
      this._initWebGL();
    });
  }

  private _initWebGL() {
    // 先嘗試 WebGL2，再降級到 WebGL1
    this._gl = (
      this._canvas.getContext('webgl2', {
        antialias: true,
        alpha: false,
        // preserveDrawingBuffer: true 會禁用雙緩衝，造成效能損失
        // 只有需要 canvas.toDataURL() 時才啟用
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        // 請求低延遲模式（適合互動式 3D）
        desynchronized: false,
      }) as WebGL2RenderingContext
    ) ?? (
      this._canvas.getContext('webgl', { antialias: true }) as unknown as WebGL2RenderingContext
    );

    if (!this._gl) {
      this._showFallback('WebGL 不受支援，請升級瀏覽器或更新 GPU 驅動');
      return;
    }

    this._detectCapabilities();
    this._setupScene();
    this._startRenderLoop();
  }

  private _detectCapabilities() {
    const gl = this._gl!;

    // 檢測 WebGL 版本
    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    console.info(\`[WebGLCanvas] 使用 \${isWebGL2 ? 'WebGL 2.0' : 'WebGL 1.0'}\`);

    // 偵測常用延伸功能
    const extensions = {
      // 各向異性過濾（提升斜角紋理品質）
      anisotropic:
        gl.getExtension('EXT_texture_filter_anisotropic') ||
        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'),
      // 浮點紋理（HDR、後處理必要）
      floatTexture:
        isWebGL2
          ? gl.getExtension('EXT_color_buffer_float')
          : gl.getExtension('OES_texture_float'),
      // 繪製多個緩衝區（MRT，延遲渲染必要）
      drawBuffers:
        isWebGL2 ? true : gl.getExtension('WEBGL_draw_buffers'),
      // 深度紋理（shadow mapping 必要）
      depthTexture:
        isWebGL2 ? true : gl.getExtension('WEBGL_depth_texture'),
    };

    if (!extensions.floatTexture) {
      console.warn('[WebGLCanvas] 不支援浮點紋理，後處理效果受限');
    }

    // 查詢硬體限制
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxAnisotropy = extensions.anisotropic
      ? gl.getParameter(extensions.anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
      : 1;

    console.info(\`[WebGLCanvas] 最大紋理尺寸：\${maxTextureSize}px，最大各向異性：\${maxAnisotropy}x\`);
    return extensions;
  }

  private _onContextLost() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = undefined;
  }

  private _showFallback(message: string) {
    // 顯示降級 UI（CSS/Canvas 2D 替代內容）
    console.error('[WebGLCanvas]', message);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    // 主動釋放 context（讓瀏覽器回收 GPU 記憶體）
    this._gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private _setupScene() {}
  private _startRenderLoop() {}
  render() { return html\`&lt;canvas&gt;&lt;/canvas&gt;\`; }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">WebGL Context 配額的實務陷阱</div>
    <p>
      Chrome 對同一個頁面限制約 16 個 WebGL Context（不同瀏覽器有差異）。
      當超過限制時，最舊的 context 會被強制觸發 <code>webglcontextlost</code>。
      如果你的應用有動態渲染的 3D 元件列表（如商品縮圖），
      務必實作共享 Renderer 架構或使用虛擬化（virtual scrolling）限制同時存在的 context 數量。
    </p>
  </div>
</section>

<section id="threejs-setup">
  <h2>Three.js 場景封裝</h2>
  <pre data-lang="bash"><code class="language-bash">npm install three
npm install --save-dev @types/three</code></pre>

  <p>
    完整的 Three.js 場景封裝需要處理：類型安全的 TypeScript 整合、OrbitControls 的正確掛載、
    以及透過 ResizeObserver 響應容器尺寸變化（而非監聽 window.resize，後者在 Shadow DOM 中有佈局隔離問題）。
  </p>

  <h3>完整場景封裝（含 TypeScript 型別）</h3>
  <pre data-lang="typescript"><code class="language-typescript">import * as THREE from 'three';
import type { WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('three-scene')
export class ThreeScene extends LitElement {
  static styles = css\`
    :host {
      display: block;
      width: 100%;
      /* :host 需要有明確高度，否則容器高度為 0 */
      height: 400px;
    }
    .container {
      width: 100%;
      height: 100%;
      /* 防止 canvas 撐開父元素 */
      overflow: hidden;
    }
    canvas {
      display: block;
      /* 覆蓋 Three.js 設定的 inline style */
      width: 100% !important;
      height: 100% !important;
    }
  \`;

  @property({ type: String }) modelUrl = '';
  @property({ type: Number }) fov = 75;

  @query('.container') private _container!: HTMLDivElement;

  // 明確型別標注，避免 any 蔓延
  private _renderer?: WebGLRenderer;
  private _scene?: Scene;
  private _camera?: PerspectiveCamera;
  private _controls?: OrbitControls;
  private _rafId?: number;
  private _resizeObserver?: ResizeObserver;

  firstUpdated() {
    this._initThree();
    this._startRender();
  }

  private _initThree() {
    const { clientWidth: width, clientHeight: height } = this._container;

    // --- Renderer ---
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      // 高效能場景建議停用 preserveDrawingBuffer
      preserveDrawingBuffer: false,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制最高 2x 避免 4K 螢幕效能問題
    this._renderer.setSize(width, height);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;
    // 將 canvas 插入 Shadow DOM 的容器
    this._container.appendChild(this._renderer.domElement);

    // --- Scene ---
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1a2e);
    this._scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);

    // --- Camera ---
    this._camera = new THREE.PerspectiveCamera(this.fov, width / height, 0.1, 1000);
    this._camera.position.set(0, 2, 5);

    // --- OrbitControls ---
    // 注意：OrbitControls 的 domElement 需傳入 renderer.domElement 而非 canvas
    // 否則在 Shadow DOM 內事件監聽會有問題
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;       // 慣性阻尼，更自然的旋轉感
    this._controls.dampingFactor = 0.05;
    this._controls.screenSpacePanning = false; // 固定地平線
    this._controls.minDistance = 2;
    this._controls.maxDistance = 20;
    this._controls.maxPolarAngle = Math.PI / 2; // 限制不能翻轉到地面以下

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    this._scene.add(ambientLight, dirLight);

    // --- Default Geometry ---
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6d00,
      metalness: 0.3,
      roughness: 0.7,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    this._scene.add(cube);

    // --- ResizeObserver（響應 Shadow DOM 內的容器尺寸變化）---
    // 使用 ResizeObserver 而非 window.resize，因為：
    // 1. 元件可能在不改變 window 尺寸的情況下改變大小（flex/grid 佈局調整）
    // 2. window.resize 監聽器在元件銷毀後需要手動清除，容易 leak
    this._resizeObserver = new ResizeObserver((entries) =&gt; {
      const entry = entries[0];
      if (!entry) return;
      // 使用 devicePixelContentBoxSize 取得物理像素尺寸（若支援）
      let width: number;
      let height: number;
      if (entry.devicePixelContentBoxSize) {
        width = entry.devicePixelContentBoxSize[0].inlineSize;
        height = entry.devicePixelContentBoxSize[0].blockSize;
        this._renderer?.setPixelRatio(1); // 物理像素已包含 DPR
      } else {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        this._renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }

      this._renderer?.setSize(width, height, false); // false = 不修改 canvas style
      if (this._camera) {
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
      }
    });
    this._resizeObserver.observe(this._container);
  }

  private _startRender() {
    const animate = () =&gt; {
      this._rafId = requestAnimationFrame(animate);
      // controls.update() 必須在每幀呼叫（enableDamping 需要）
      this._controls?.update();
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    };
    animate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._resizeObserver?.disconnect();
    this._renderer?.dispose();
  }

  render() {
    return html\`&lt;div class="container"&gt;&lt;/div&gt;\`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">devicePixelRatio 與 Retina 螢幕</div>
    <p>
      <code>setPixelRatio(window.devicePixelRatio)</code> 在 4K 或 5K 螢幕（DPR=2 以上）會讓 GPU 負荷暴增。
      建議限制最大為 <code>Math.min(window.devicePixelRatio, 2)</code>。
      大多數使用者在 DPR 1.5x 和 2x 之間看不出畫質差異，但效能差距顯著。
    </p>
  </div>
</section>

<section id="reactive-props-3d">
  <h2>Reactive Properties 驅動 3D 場景</h2>
  <p>
    Lit 的響應式屬性可以直接控制 3D 場景的狀態。
    關鍵原則是：<strong>更新物件的屬性，而非重新建立物件</strong>。
    重新建立 <code>THREE.Vector3</code>、<code>THREE.Color</code> 等物件會造成 GC 壓力，
    應改用 <code>.set()</code>、<code>.setHex()</code>、<code>.copy()</code> 等 in-place 更新方法。
  </p>

  <h3>正確的高效更新模式</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('interactive-model')
class InteractiveModel extends LitElement {
  @property({ type: Number }) rotationX = 0;
  @property({ type: Number }) rotationY = 0;
  @property({ type: String }) color = '#FF6D00';
  @property({ type: Number }) scale = 1;
  @property({ type: Boolean }) wireframe = false;
  @property({ type: Number }) emissiveIntensity = 0;

  private _mesh?: THREE.Mesh;
  private _material?: THREE.MeshStandardMaterial;

  firstUpdated() {
    this._initScene();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (!this._mesh || !this._material) return;

    // ✓ 使用 .x = 直接設定 Euler 角度（無 GC）
    if (changedProps.has('rotationX')) {
      this._mesh.rotation.x = THREE.MathUtils.degToRad(this.rotationX);
    }
    if (changedProps.has('rotationY')) {
      this._mesh.rotation.y = THREE.MathUtils.degToRad(this.rotationY);
    }

    // ✓ color.set() 接受 CSS 色彩字串，原地更新（無 GC）
    // ✗ 錯誤做法：this._material.color = new THREE.Color(this.color);
    if (changedProps.has('color')) {
      this._material.color.set(this.color);
      // needsUpdate 對 color 不必要，但對 map、alphaMap 等紋理更換時必須設為 true
    }

    // ✓ scale.setScalar() 同時設定 x/y/z（無 GC）
    // ✗ 錯誤做法：this._mesh.scale = new THREE.Vector3(this.scale, this.scale, this.scale);
    if (changedProps.has('scale')) {
      this._mesh.scale.setScalar(this.scale);
    }

    // wireframe 是 material 的直接布林屬性，不需要 needsUpdate
    if (changedProps.has('wireframe')) {
      this._material.wireframe = this.wireframe;
    }

    if (changedProps.has('emissiveIntensity')) {
      this._material.emissiveIntensity = this.emissiveIntensity;
    }
  }

  private _initScene() {
    // 初始化時才建立物件（在整個元件生命週期中只建立一次）
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 16);
    this._material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color),
      emissive: new THREE.Color(0xff6d00),
      emissiveIntensity: this.emissiveIntensity,
      metalness: 0.5,
      roughness: 0.3,
    });
    this._mesh = new THREE.Mesh(geometry, this._material);
  }

  render() {
    return html\`
      &lt;div class="canvas-container"&gt;&lt;/div&gt;
      &lt;div class="controls"&gt;
        &lt;label&gt;
          X 旋轉：\${this.rotationX}°
          &lt;input type="range" min="-180" max="180"
            .value=\${String(this.rotationX)}
            @input=\${(e: Event) =&gt; {
              this.rotationX = Number((e.target as HTMLInputElement).value);
            }}&gt;
        &lt;/label&gt;
        &lt;label&gt;
          色彩：
          &lt;input type="color" .value=\${this.color}
            @input=\${(e: Event) =&gt; {
              this.color = (e.target as HTMLInputElement).value;
            }}&gt;
        &lt;/label&gt;
        &lt;label&gt;
          &lt;input type="checkbox" ?checked=\${this.wireframe}
            @change=\${(e: Event) =&gt; {
              this.wireframe = (e.target as HTMLInputElement).checked;
            }}&gt;
          線框模式
        &lt;/label&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">高頻率更新的效能陷阱</div>
    <p>
      當屬性透過 <code>input[type=range]</code> 以每秒 60 次更新時，
      Lit 的批次更新機制（microtask 排隊）會確保每個 Lit 渲染週期只觸發一次 <code>updated()</code>，
      但 Three.js 的屬性更新（<code>rotation.x</code>、<code>scale.setScalar()</code>）是同步的——
      它們的效果在下一幀的 RAF 中才會被渲染，這是正確的行為。
      不需要節流（throttle）Lit 屬性更新，因為 RAF 本身已是天然的節流機制。
    </p>
  </div>
</section>

<section id="resource-cleanup">
  <h2>資源清理與記憶體管理</h2>
  <p>
    Three.js 的幾何體（Geometry）、材質（Material）和紋理（Texture）
    不會被 JavaScript GC 自動釋放——它們在 GPU 顯存中有對應的緩衝區。
    必須手動呼叫 <code>dispose()</code>，否則即使 JavaScript 物件被 GC，GPU 記憶體仍會洩漏。
  </p>

  <h3>完整的 disconnectedCallback 清理</h3>
  <pre data-lang="typescript"><code class="language-typescript">disconnectedCallback() {
  super.disconnectedCallback();

  // 1. 停止動畫迴圈（最優先，避免在清理過程中繼續渲染）
  if (this._rafId) {
    cancelAnimationFrame(this._rafId);
    this._rafId = undefined;
  }

  // 2. 斷開 ResizeObserver
  this._resizeObserver?.disconnect();

  // 3. 釋放 OrbitControls（移除事件監聽器）
  this._controls?.dispose();

  // 4. 遍歷場景圖，釋放所有 GPU 資源
  if (this._scene) {
    this._scene.traverse((obj) =&gt; {
      // 只處理網格（Mesh、SkinnedMesh 等）
      if (obj instanceof THREE.Mesh) {
        // 釋放頂點緩衝區（VBO）
        obj.geometry.dispose();

        // 材質可能是陣列（多材質網格）
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

        for (const mat of materials) {
          this._disposeMaterial(mat);
        }
      }
    });

    // 清空場景（讓 JavaScript 物件也能被 GC）
    while (this._scene.children.length &gt; 0) {
      this._scene.remove(this._scene.children[0]);
    }
  }

  // 5. 釋放 WebGL Renderer（刪除所有 WebGL 程式、緩衝區）
  this._renderer?.dispose();

  // 6. 主動觸發 context loss（立即釋放 GPU 記憶體，而非等待 GC）
  this._renderer?.forceContextLoss();

  this._renderer = undefined;
  this._scene = undefined;
  this._camera = undefined;
}

private _disposeMaterial(material: THREE.Material) {
  // 釋放材質本身的 GPU 資源
  material.dispose();

  // 反射所有可能的紋理屬性
  const mat = material as Record&lt;string, unknown&gt;;
  const textureProperties = [
    'map', 'normalMap', 'roughnessMap', 'metalnessMap',
    'emissiveMap', 'aoMap', 'displacementMap', 'alphaMap',
    'envMap', 'lightMap', 'bumpMap',
  ];

  for (const prop of textureProperties) {
    const value = mat[prop];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">如何偵測 WebGL 記憶體洩漏</div>
    <p>
      Chrome DevTools 的 Memory 面板無法直接顯示 GPU 記憶體使用量。
      但可以透過 <code>renderer.info</code> 監控 Three.js 追蹤的 GPU 資源：
    </p>
    <pre data-lang="typescript"><code class="language-typescript">// 在渲染迴圈中定期印出（開發環境）
if (import.meta.env.DEV && frameCount % 600 === 0) { // 每 10 秒（60fps）
  const { memory, render } = this._renderer!.info;
  console.table({
    幾何體: memory.geometries,
    紋理: memory.textures,
    '每幀三角形': render.triangles,
    '每幀 Draw calls': render.calls,
  });
}</code></pre>
  </div>

  <div class="callout callout-warning">
    <div class="callout-title">WebGL Context 限制</div>
    <p>
      瀏覽器對每個頁面的 WebGL Context 數量有限制（通常 8-16 個）。
      如果你的頁面有多個 Three.js 元件（如列表中每行一個 3D 預覽），
      必須考慮使用共享 Renderer 的架構，或限制同時存在的元件數量。
    </p>
  </div>
</section>

<section id="postprocessing">
  <h2>後處理效果整合</h2>
  <p>
    後處理（Post-processing）在 3D 渲染完成後對畫面進行全螢幕的影像處理效果，
    例如 Bloom、景深（DOF）、環境光遮蔽（SSAO）等。
    Three.js 內建 <code>EffectComposer</code>，也可使用效能更好的 <code>postprocessing</code> 套件。
  </p>

  <h3>Three.js 內建 EffectComposer（UnrealBloom + SSAO）</h3>
  <pre data-lang="bash"><code class="language-bash"># Three.js 內建後處理（addons/）
# 不需額外安裝，已包含在 three 套件中</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

@customElement('three-postfx')
class ThreePostFX extends LitElement {
  @property({ type: Number }) bloomStrength = 0.5;
  @property({ type: Number }) bloomRadius = 0.4;
  @property({ type: Number }) bloomThreshold = 0.85;
  @property({ type: Boolean }) ssaoEnabled = true;

  private _composer?: EffectComposer;
  private _bloomPass?: UnrealBloomPass;
  private _ssaoPass?: SSAOPass;

  private _initPostProcessing(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
  ) {
    this._composer = new EffectComposer(renderer);

    // Pass 1：正常場景渲染
    const renderPass = new RenderPass(scene, camera);
    this._composer.addPass(renderPass);

    // Pass 2：SSAO（環境光遮蔽）— 增強立體感
    if (this.ssaoEnabled) {
      this._ssaoPass = new SSAOPass(scene, camera, width, height);
      this._ssaoPass.kernelRadius = 16;
      this._ssaoPass.minDistance = 0.005;
      this._ssaoPass.maxDistance = 0.1;
      this._composer.addPass(this._ssaoPass);
    }

    // Pass 3：Unreal Bloom（光暈效果）
    const bloomResolution = new THREE.Vector2(width, height);
    this._bloomPass = new UnrealBloomPass(
      bloomResolution,
      this.bloomStrength,   // 光暈強度
      this.bloomRadius,     // 擴散半徑
      this.bloomThreshold,  // 觸發閾值（亮度 &gt; threshold 才產生光暈）
    );
    this._composer.addPass(this._bloomPass);

    // Pass 4：輸出（色調映射 + sRGB 轉換，最後一個 pass 必加）
    const outputPass = new OutputPass();
    this._composer.addPass(outputPass);
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('bloomStrength') && this._bloomPass) {
      this._bloomPass.strength = this.bloomStrength;
    }
    if (changedProps.has('bloomRadius') && this._bloomPass) {
      this._bloomPass.radius = this.bloomRadius;
    }
    if (changedProps.has('bloomThreshold') && this._bloomPass) {
      this._bloomPass.threshold = this.bloomThreshold;
    }
  }

  private _renderLoop() {
    // 使用 composer.render() 取代 renderer.render()
    this._composer?.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // EffectComposer 也需要釋放（其內部有 RenderTarget）
    this._composer?.dispose();
  }

  render() {
    return html\`
      &lt;div class="scene-container"&gt;&lt;/div&gt;
      &lt;div class="controls"&gt;
        &lt;label&gt;
          Bloom 強度：\${this.bloomStrength.toFixed(2)}
          &lt;input type="range" min="0" max="3" step="0.05"
            .value=\${String(this.bloomStrength)}
            @input=\${(e: Event) =&gt; {
              this.bloomStrength = Number((e.target as HTMLInputElement).value);
            }}&gt;
        &lt;/label&gt;
        &lt;label&gt;
          Bloom 閾值：\${this.bloomThreshold.toFixed(2)}
          &lt;input type="range" min="0" max="1" step="0.05"
            .value=\${String(this.bloomThreshold)}
            @input=\${(e: Event) =&gt; {
              this.bloomThreshold = Number((e.target as HTMLInputElement).value);
            }}&gt;
        &lt;/label&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="webgl-resource-manager">
  <h2>WebGL 資源管理器：Texture、Buffer、Program 生命週期</h2>
  <p>
    當場景複雜度增加（多個元件共用紋理、動態載入模型、粒子系統），
    分散在各處的 <code>dispose()</code> 呼叫很容易遺漏或重複釋放。
    一個集中式的 <code>WebGLResourceManager</code> 可以追蹤所有 GPU 資源，
    並在元件生命週期結束時一次性清理。
  </p>

  <h3>WebGLResourceManager 類別</h3>
  <pre data-lang="typescript"><code class="language-typescript">// webgl-resource-manager.ts

type DisposableResource = {
  dispose(): void;
};

interface TextureCacheEntry {
  texture: THREE.Texture;
  refCount: number;
  lastUsed: number;
}

export class WebGLResourceManager {
  // 追蹤所有已建立的 GPU 資源
  private _textures = new Map&lt;string, TextureCacheEntry&gt;();
  private _geometries = new Set&lt;THREE.BufferGeometry&gt;();
  private _materials = new Set&lt;THREE.Material&gt;();
  private _renderTargets = new Set&lt;THREE.WebGLRenderTarget&gt;();

  private _textureLoader = new THREE.TextureLoader();

  /**
   * 帶有引用計數的紋理快取
   * 相同 URL 的紋理只建立一個 GPU 資源，共享給多個 Mesh
   */
  async loadTexture(url: string): Promise&lt;THREE.Texture&gt; {
    const cached = this._textures.get(url);
    if (cached) {
      cached.refCount++;
      cached.lastUsed = Date.now();
      return cached.texture;
    }

    const texture = await this._textureLoader.loadAsync(url);
    // 設定最佳化選項
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    this._textures.set(url, { texture, refCount: 1, lastUsed: Date.now() });
    return texture;
  }

  /**
   * 釋放紋理引用（引用計數歸零才真正 dispose）
   */
  releaseTexture(url: string) {
    const entry = this._textures.get(url);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount &lt;= 0) {
      entry.texture.dispose();
      this._textures.delete(url);
    }
  }

  /**
   * 紋理圖集（Texture Atlas）：將多個小圖合併為一張大紋理
   * 大幅減少 Draw Call（每個 Mesh 切換紋理都是一次 Draw Call 邊界）
   */
  createTextureAtlas(
    images: HTMLImageElement[],
    atlasSize = 2048,
  ): { texture: THREE.Texture; uvMap: Array&lt;{ u: number; v: number; w: number; h: number }&gt; } {
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d')!;

    const uvMap: Array&lt;{ u: number; v: number; w: number; h: number }&gt; = [];
    const tileSize = atlasSize / Math.ceil(Math.sqrt(images.length));

    images.forEach((img, i) =&gt; {
      const col = i % Math.floor(atlasSize / tileSize);
      const row = Math.floor(i / Math.floor(atlasSize / tileSize));
      const x = col * tileSize;
      const y = row * tileSize;

      ctx.drawImage(img, x, y, tileSize, tileSize);
      uvMap.push({
        u: x / atlasSize,
        v: y / atlasSize,
        w: tileSize / atlasSize,
        h: tileSize / atlasSize,
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this._registerTexture('__atlas__' + Date.now(), texture);
    return { texture, uvMap };
  }

  /**
   * 幾何體緩衝池：重用形狀相同的幾何體，避免重複上傳頂點資料到 GPU
   */
  private _geometryPool = new Map&lt;string, THREE.BufferGeometry&gt;();

  getPooledGeometry(key: string, factory: () =&gt; THREE.BufferGeometry): THREE.BufferGeometry {
    if (!this._geometryPool.has(key)) {
      const geo = factory();
      this._geometryPool.set(key, geo);
      this._geometries.add(geo);
    }
    return this._geometryPool.get(key)!;
  }

  /**
   * 追蹤一個材質（確保它被 disposeAll 清理）
   */
  trackMaterial&lt;T extends THREE.Material&gt;(material: T): T {
    this._materials.add(material);
    return material;
  }

  /**
   * 追蹤 RenderTarget
   */
  trackRenderTarget&lt;T extends THREE.WebGLRenderTarget&gt;(rt: T): T {
    this._renderTargets.add(rt);
    return rt;
  }

  private _registerTexture(key: string, texture: THREE.Texture) {
    this._textures.set(key, { texture, refCount: 1, lastUsed: Date.now() });
  }

  /**
   * 一次性釋放所有追蹤的資源
   * 在 disconnectedCallback 中呼叫
   */
  disposeAll() {
    for (const entry of this._textures.values()) {
      entry.texture.dispose();
    }
    this._textures.clear();

    for (const geo of this._geometries) {
      geo.dispose();
    }
    this._geometries.clear();
    this._geometryPool.clear();

    for (const mat of this._materials) {
      mat.dispose();
    }
    this._materials.clear();

    for (const rt of this._renderTargets) {
      rt.dispose();
    }
    this._renderTargets.clear();
  }

  /**
   * LRU 快取清理：釋放超過 maxAge 毫秒未使用的紋理
   */
  evictStaleCachedTextures(maxAge = 60_000) {
    const now = Date.now();
    for (const [url, entry] of this._textures) {
      if (entry.refCount === 0 && (now - entry.lastUsed) &gt; maxAge) {
        entry.texture.dispose();
        this._textures.delete(url);
      }
    }
  }
}</code></pre>

  <h3>在 Lit 元件中使用 WebGLResourceManager</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('managed-scene')
class ManagedScene extends LitElement {
  // 每個元件實例擁有自己的 ResourceManager
  private _resources = new WebGLResourceManager();

  async firstUpdated() {
    await this._initScene();
  }

  private async _initScene() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const scene = new THREE.Scene();

    // 透過 ResourceManager 載入紋理（自動快取 + 追蹤）
    const albedo = await this._resources.loadTexture('/textures/rock_albedo.webp');
    const normal = await this._resources.loadTexture('/textures/rock_normal.webp');

    const material = this._resources.trackMaterial(
      new THREE.MeshStandardMaterial({ map: albedo, normalMap: normal })
    );

    // 從幾何體池取得（相同參數的 BoxGeometry 只建立一次）
    const geometry = this._resources.getPooledGeometry(
      'box-1-1-1',
      () =&gt; new THREE.BoxGeometry(1, 1, 1)
    );

    scene.add(new THREE.Mesh(geometry, material));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // 一行清理所有 GPU 資源
    this._resources.disposeAll();
  }

  render() {
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="reactive-scene-graph">
  <h2>響應式場景圖：Lit Properties 驅動 3D 更新</h2>
  <p>
    當 3D 場景的複雜度增加（多個物件、複雜的動畫狀態、粒子系統），
    直接在 <code>updated()</code> 中管理 Three.js 物件會讓程式碼難以維護。
    <code>ReactiveController</code> 是 Lit 提供的架構模式，
    可以將 3D 場景圖的管理邏輯獨立封裝，同時與 Lit 的更新週期正確整合。
  </p>

  <h3>SceneGraphController：ReactiveController 封裝</h3>
  <pre data-lang="typescript"><code class="language-typescript">// scene-graph-controller.ts
import type { ReactiveControllerHost, ReactiveController } from 'lit';
import * as THREE from 'three';

export interface SceneNode {
  id: string;
  object: THREE.Object3D;
  // 每幀更新函式（可選）
  tick?: (deltaTime: number, elapsed: number) =&gt; void;
}

export class SceneGraphController implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _scene: THREE.Scene;
  private _nodes = new Map&lt;string, SceneNode&gt;();
  private _clock = new THREE.Clock();

  // 待處理的更新隊列（在 Lit update cycle 中批次套用）
  private _pendingUpdates: Array&lt;() =&gt; void&gt; = [];

  constructor(host: ReactiveControllerHost, scene: THREE.Scene) {
    this._host = host;
    this._scene = scene;
    host.addController(this);
  }

  // Lit 生命週期鉤子：在每次 host.updated() 之後呼叫
  hostUpdated() {
    // 批次套用所有待處理的場景更新
    // 這確保 Three.js 物件只在 Lit 更新週期內被修改，
    // 避免與 RAF 渲染迴圈的 race condition
    for (const update of this._pendingUpdates) {
      update();
    }
    this._pendingUpdates = [];
  }

  hostDisconnected() {
    this._nodes.clear();
  }

  /**
   * 新增節點到場景圖
   */
  addNode(node: SceneNode) {
    this._nodes.set(node.id, node);
    this._scene.add(node.object);
  }

  /**
   * 移除節點
   */
  removeNode(id: string) {
    const node = this._nodes.get(id);
    if (node) {
      this._scene.remove(node.object);
      this._nodes.delete(id);
    }
  }

  /**
   * 排隊一個場景更新（在下次 Lit 更新週期中套用）
   * 適合回應屬性變更
   */
  queueUpdate(update: () =&gt; void) {
    this._pendingUpdates.push(update);
    // 通知 host 需要更新
    this._host.requestUpdate();
  }

  /**
   * 執行一幀的動畫更新（在 RAF 中呼叫）
   */
  tick() {
    const delta = this._clock.getDelta();
    const elapsed = this._clock.getElapsedTime();

    for (const node of this._nodes.values()) {
      node.tick?.(delta, elapsed);
    }
  }
}

// --- 物件池：粒子系統優化 ---
export class ObjectPool&lt;T extends THREE.Object3D&gt; {
  private _pool: T[] = [];
  private _active = new Set&lt;T&gt;();
  private _factory: () =&gt; T;

  constructor(factory: () =&gt; T, initialSize = 0) {
    this._factory = factory;
    for (let i = 0; i &lt; initialSize; i++) {
      this._pool.push(factory());
    }
  }

  /**
   * 從池中取出物件（若池為空則建立新物件）
   */
  acquire(): T {
    const obj = this._pool.pop() ?? this._factory();
    this._active.add(obj);
    return obj;
  }

  /**
   * 歸還物件到池（重設狀態，供下次使用）
   */
  release(obj: T) {
    if (this._active.delete(obj)) {
      // 重設位置、旋轉、縮放到預設值
      obj.position.set(0, 0, 0);
      obj.rotation.set(0, 0, 0);
      obj.scale.set(1, 1, 1);
      obj.visible = false;
      this._pool.push(obj);
    }
  }

  get activeCount() { return this._active.size; }
  get poolSize() { return this._pool.length; }
}
</code></pre>

  <h3>在 Lit 元件中使用 SceneGraphController</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('particle-system')
class ParticleSystem extends LitElement {
  @property({ type: Number }) particleCount = 1000;
  @property({ type: String }) emitterColor = '#ff6d00';

  private _scene = new THREE.Scene();
  private _sceneGraph!: SceneGraphController;

  // 粒子物件池（避免頻繁 new THREE.Mesh() 的 GC 壓力）
  private _particlePool!: ObjectPool&lt;THREE.Mesh&gt;;

  constructor() {
    super();
    // 在 constructor 中初始化 controller（確保 Lit 生命週期正確整合）
    this._sceneGraph = new SceneGraphController(this, this._scene);
  }

  firstUpdated() {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4); // 低多邊形粒子
    const material = new THREE.MeshBasicMaterial({ color: this.emitterColor });

    // 初始化物件池（預先建立 500 個）
    this._particlePool = new ObjectPool(
      () =&gt; {
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.visible = false;
        this._scene.add(mesh);
        return mesh;
      },
      500
    );

    this._spawnParticles();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('emitterColor')) {
      // 透過 queueUpdate 在 Lit 更新週期內安全地修改 Three.js 物件
      this._sceneGraph.queueUpdate(() =&gt; {
        // 更新所有粒子的顏色
        this._scene.traverse((obj) =&gt; {
          if (obj instanceof THREE.Mesh) {
            (obj.material as THREE.MeshBasicMaterial).color.set(this.emitterColor);
          }
        });
      });
    }

    if (changedProps.has('particleCount')) {
      this._sceneGraph.queueUpdate(() =&gt; this._spawnParticles());
    }
  }

  private _spawnParticles() {
    // 從物件池取出粒子並設定初始位置
    for (let i = 0; i &lt; this.particleCount; i++) {
      const particle = this._particlePool.acquire();
      particle.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      );
      particle.visible = true;
    }
  }

  render() {
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>
</section>

<section id="r3f-comparison">
  <h2>React Three Fiber vs Lit + Three.js 架構比較</h2>
  <p>
    React Three Fiber（R3F）是目前最流行的 3D Web 框架，提供宣告式的 Three.js 整合。
    Lit + Three.js 則代表 Web Components 原生路線，兩者在架構哲學上有根本差異。
    資深工程師在選型時應理解兩者的取捨，而非盲目跟從社群熱度。
  </p>

  <h3>同一個旋轉正方體：R3F vs Lit + Three.js</h3>

  <p><strong>React Three Fiber 版本</strong>（宣告式，React 元件樹驅動）：</p>
  <pre data-lang="typescript"><code class="language-typescript">// R3F 版本
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function RotatingCube({ color = 'orange' }: { color?: string }) {
  const meshRef = useRef&lt;THREE.Mesh&gt;(null);

  // useFrame 在每個 RAF 中呼叫（R3F 管理渲染迴圈）
  useFrame((state, delta) =&gt; {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });

  // JSX 對應 Three.js 物件（駝峰命名，自動小寫）
  return (
    &lt;mesh ref={meshRef} castShadow&gt;
      &lt;boxGeometry args={[1, 1, 1]} /&gt;
      &lt;meshStandardMaterial color={color} /&gt;
    &lt;/mesh&gt;
  );
}

function App() {
  return (
    &lt;Canvas shadows camera={{ position: [0, 2, 5], fov: 75 }}&gt;
      &lt;ambientLight intensity={0.4} /&gt;
      &lt;directionalLight position={[5, 10, 5]} castShadow /&gt;
      &lt;RotatingCube color="orange" /&gt;
      &lt;OrbitControls /&gt;
    &lt;/Canvas&gt;
  );
}</code></pre>

  <p><strong>Lit + Three.js 版本</strong>（命令式，元件生命週期驅動）：</p>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 版本
@customElement('rotating-cube')
class RotatingCube extends LitElement {
  @property({ type: String }) color = 'orange';

  private _renderer?: THREE.WebGLRenderer;
  private _scene?: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _mesh?: THREE.Mesh;
  private _material?: THREE.MeshStandardMaterial;
  private _controls?: OrbitControls;
  private _clock = new THREE.Clock();
  private _rafId?: number;

  @query('.container') private _container!: HTMLDivElement;

  firstUpdated() {
    const { clientWidth: w, clientHeight: h } = this._container;

    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(w, h);
    this._renderer.shadowMap.enabled = true;
    this._container.appendChild(this._renderer.domElement);

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this._camera.position.set(0, 2, 5);

    this._scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    this._scene.add(dir);

    this._material = new THREE.MeshStandardMaterial({ color: this.color });
    this._mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this._material);
    this._mesh.castShadow = true;
    this._scene.add(this._mesh);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;

    const animate = () =&gt; {
      this._rafId = requestAnimationFrame(animate);
      const delta = this._clock.getDelta();
      if (this._mesh) this._mesh.rotation.y += delta;
      this._controls?.update();
      this._renderer!.render(this._scene!, this._camera!);
    };
    animate();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('color') && this._material) {
      this._material.color.set(this.color);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._controls?.dispose();
    this._renderer?.dispose();
  }

  render() {
    return html\`&lt;div class="container" style="width:100%;height:400px;"&gt;&lt;/div&gt;\`;
  }
}</code></pre>

  <h3>架構取捨比較</h3>
  <table>
    <thead>
      <tr>
        <th>維度</th>
        <th>React Three Fiber</th>
        <th>Lit + Three.js</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>學習曲線</td>
        <td>需要 React + R3F 生態知識</td>
        <td>只需 Three.js + Lit 基礎知識</td>
      </tr>
      <tr>
        <td>程式碼風格</td>
        <td>宣告式（JSX 場景樹）</td>
        <td>命令式（明確的 API 呼叫）</td>
      </tr>
      <tr>
        <td>效能控制</td>
        <td>R3F 管理 RAF / renderer，可自訂但有層次</td>
        <td>完全自主控制渲染迴圈</td>
      </tr>
      <tr>
        <td>生態系整合</td>
        <td>Drei、Rapier、PMNDRS 豐富生態</td>
        <td>直接使用任何 Three.js 插件，無相容性顧慮</td>
      </tr>
      <tr>
        <td>框架相依性</td>
        <td>強耦合 React</td>
        <td>Web Components，可嵌入任何框架</td>
      </tr>
      <tr>
        <td>Bundle 大小</td>
        <td>React（~40kB）+ R3F（~30kB）+ Three.js</td>
        <td>Lit（~6kB）+ Three.js</td>
      </tr>
      <tr>
        <td>除錯工具</td>
        <td>React DevTools + R3F Leva</td>
        <td>三個.js Inspector、標準 DevTools</td>
      </tr>
      <tr>
        <td>動畫系統</td>
        <td>useFrame 鉤子，直覺整合 React state</td>
        <td>手動 RAF + Three.js AnimationMixer</td>
      </tr>
      <tr>
        <td>Shadow DOM 整合</td>
        <td>不支援（React 不使用 Shadow DOM）</td>
        <td>原生支援，完整 CSS 封裝</td>
      </tr>
      <tr>
        <td>可分發性</td>
        <td>難以作為獨立 npm 套件分發</td>
        <td>可發布為標準 Web Component，任何環境使用</td>
      </tr>
    </tbody>
  </table>

  <h3>選型決策建議</h3>
  <div class="callout callout-tip">
    <div class="callout-title">何時選擇 React Three Fiber</div>
    <ul>
      <li>專案已使用 React 技術棧，且 3D 場景與 React 狀態（UI 互動、資料流）高度整合</li>
      <li>需要利用 Drei、Rapier（物理引擎）、PMNDRS shaders 等豐富生態</li>
      <li>團隊對 React 熟悉度高，開發速度優先於最終 bundle 大小</li>
      <li>3D 元件不需要跨框架複用</li>
    </ul>
  </div>

  <div class="callout callout-info">
    <div class="callout-title">何時選擇 Lit + Three.js</div>
    <ul>
      <li>需要建立可跨框架複用的 3D Web Component（如 Design System 中的 3D 元件）</li>
      <li>需要最精確的渲染迴圈控制（例如 VR/AR、60fps 嚴格要求、自訂排程）</li>
      <li>應用需要嵌入 Vue、Angular、Svelte 等非 React 環境</li>
      <li>Bundle 大小敏感（Lit 比 React 小約 85%）</li>
      <li>團隊有 Three.js 原生開發背景，不希望學習 R3F 的抽象層</li>
    </ul>
  </div>

  <div class="callout callout-warning">
    <div class="callout-title">R3F 宣告式模型的潛在陷阱</div>
    <p>
      R3F 的 JSX 場景樹看起來直覺，但底層仍然是命令式的 Three.js API。
      當需要細粒度控制時（例如在特定幀才觸發材質更新、共享幾何體的緩衝池、
      自訂渲染通道順序），R3F 的抽象層反而會成為阻礙。
      Lit + Three.js 沒有這層抽象，所有行為都是透明可預期的。
    </p>
  </div>
</section>
`,
};
