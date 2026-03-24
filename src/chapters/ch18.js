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
  ],
  content: `
<section id="webgl-context-lifecycle">
  <h2>WebGL Context 生命週期管理</h2>
  <p>
    WebGL Context 是有限資源。每個頁面最多只能有 16 個 WebGL Context（瀏覽器限制）。
    在 Lit 元件中管理 WebGL 需要嚴格遵守「連接時建立，斷開時釋放」的規則。
  </p>

  <h3>WebGL Context 丟失處理</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('webgl-canvas')
class WebGLCanvas extends LitElement {
  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _gl?: WebGL2RenderingContext;

  firstUpdated() {
    this._initWebGL();

    // 監聽 Context 丟失事件（記憶體壓力、GPU 重置時發生）
    this._canvas.addEventListener('webglcontextlost', (e) =&gt; {
      e.preventDefault(); // 防止預設行為（完全丟棄 context）
      this._onContextLost();
    });

    this._canvas.addEventListener('webglcontextrestored', () =&gt; {
      this._initWebGL(); // 重新初始化
    });
  }

  private _initWebGL() {
    this._gl = this._canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false, // 不保留緩衝區（效能優化）
      powerPreference: 'high-performance',
    }) as WebGL2RenderingContext;

    if (!this._gl) {
      console.error('WebGL2 不支援，嘗試降級到 WebGL1');
      return;
    }

    this._setupScene();
  }

  private _onContextLost() {
    // 停止動畫迴圈，等待 context 恢復
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = undefined;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // 釋放 WebGL Context
    this._gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  // ... 其他方法
  private _rafId?: number;
  private _setupScene() {}
  render() { return html\`&lt;canvas&gt;&lt;/canvas&gt;\`; }
}</code></pre>
</section>

<section id="threejs-setup">
  <h2>Three.js 場景封裝</h2>
  <pre data-lang="bash"><code class="language-bash">npm install three
npm install --save-dev @types/three</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

@customElement('three-scene')
class ThreeScene extends LitElement {
  static styles = css\`
    :host { display: block; width: 100%; }
    canvas { display: block; width: 100% !important; height: 100% !important; }
    .container { width: 100%; aspect-ratio: 16/9; }
  \`;

  @property({ type: String }) modelUrl = '';

  private _renderer?: THREE.WebGLRenderer;
  private _scene?: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _controls?: OrbitControls;
  private _rafId?: number;

  firstUpdated() {
    this._initThree();
    this._startRender();
  }

  private _initThree() {
    const container = this.shadowRoot!.querySelector('.container') as HTMLElement;
    const { clientWidth: width, clientHeight: height } = container;

    // Renderer
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(width, height);
    this._renderer.shadowMap.enabled = true;
    container.appendChild(this._renderer.domElement);

    // Scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    this._camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this._camera.position.set(0, 2, 5);

    // Orbit Controls
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    this._scene.add(ambientLight, dirLight);

    // Default geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff6d00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    this._scene.add(cube);

    // Resize handler
    new ResizeObserver(([entry]) =&gt; {
      const { width, height } = entry.contentRect;
      this._renderer?.setSize(width, height);
      if (this._camera) {
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
      }
    }).observe(container);
  }

  private _startRender() {
    const animate = () =&gt; {
      this._rafId = requestAnimationFrame(animate);
      this._controls?.update();
      if (this._renderer &amp;&amp; this._scene &amp;&amp; this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    };
    animate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._renderer?.dispose();
  }

  render() {
    return html\`&lt;div class="container"&gt;&lt;/div&gt;\`;
  }
}</code></pre>
</section>

<section id="reactive-props-3d">
  <h2>Reactive Properties 驅動 3D 場景</h2>
  <p>
    Lit 的響應式屬性可以直接控制 3D 場景的狀態，
    讓 3D 場景變得「宣告式」。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('interactive-model')
class InteractiveModel extends LitElement {
  // 這些屬性改變時，直接更新 3D 場景
  @property({ type: Number }) rotationX = 0;
  @property({ type: Number }) rotationY = 0;
  @property({ type: String }) color = '#FF6D00';
  @property({ type: Number }) scale = 1;
  @property({ type: Boolean }) wireframe = false;

  private _mesh?: THREE.Mesh;
  private _material?: THREE.MeshPhongMaterial;

  firstUpdated() {
    this._initScene();
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (!this._mesh || !this._material) return;

    if (changedProps.has('rotationX')) {
      this._mesh.rotation.x = THREE.MathUtils.degToRad(this.rotationX);
    }
    if (changedProps.has('rotationY')) {
      this._mesh.rotation.y = THREE.MathUtils.degToRad(this.rotationY);
    }
    if (changedProps.has('color')) {
      this._material.color.set(this.color);
    }
    if (changedProps.has('scale')) {
      this._mesh.scale.setScalar(this.scale);
    }
    if (changedProps.has('wireframe')) {
      this._material.wireframe = this.wireframe;
    }
  }

  private _initScene() {
    // ... 初始化 Three.js（省略）
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    this._material = new THREE.MeshPhongMaterial({ color: this.color });
    this._mesh = new THREE.Mesh(geometry, this._material);
    // this._scene.add(this._mesh);
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
</section>

<section id="resource-cleanup">
  <h2>資源清理與記憶體管理</h2>
  <p>
    Three.js 的幾何體（Geometry）、材質（Material）和紋理（Texture）
    不會被 JavaScript GC 自動釋放，必須手動 <code>dispose()</code>。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">disconnectedCallback() {
  super.disconnectedCallback();

  // 停止動畫
  if (this._rafId) cancelAnimationFrame(this._rafId);

  // 釋放 Three.js 資源
  if (this._scene) {
    this._scene.traverse((obj) =&gt; {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m =&gt; this._disposeMaterial(m));
        } else {
          this._disposeMaterial(obj.material);
        }
      }
    });
  }

  this._controls?.dispose();
  this._renderer?.dispose();
  this._renderer?.forceContextLoss();
}

private _disposeMaterial(material: THREE.Material) {
  material.dispose();
  // 釋放材質中的所有紋理
  for (const key of Object.keys(material)) {
    const value = (material as any)[key];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}</code></pre>

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
  <pre data-lang="bash"><code class="language-bash">npm install postprocessing</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">import { EffectComposer, RenderPass, BloomEffect, EffectPass } from 'postprocessing';

@customElement('three-bloom')
class ThreeBloom extends LitElement {
  @property({ type: Number }) bloomIntensity = 1.0;

  private _composer?: EffectComposer;
  private _bloomEffect?: BloomEffect;

  private _initPostProcessing(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this._composer = new EffectComposer(renderer);
    this._composer.addPass(new RenderPass(scene, camera));

    this._bloomEffect = new BloomEffect({ intensity: this.bloomIntensity });
    this._composer.addPass(new EffectPass(camera, this._bloomEffect));
  }

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('bloomIntensity') &amp;&amp; this._bloomEffect) {
      this._bloomEffect.intensity = this.bloomIntensity;
    }
  }

  private _renderLoop() {
    // 用 composer 代替 renderer 直接渲染
    this._composer?.render();
  }

  render() {
    return html\`
      &lt;div class="scene-container"&gt;&lt;/div&gt;
      &lt;label&gt;
        Bloom 強度：\${this.bloomIntensity.toFixed(1)}
        &lt;input type="range" min="0" max="3" step="0.1"
          .value=\${String(this.bloomIntensity)}
          @input=\${(e: Event) =&gt; {
            this.bloomIntensity = Number((e.target as HTMLInputElement).value);
          }}&gt;
      &lt;/label&gt;
    \`;
  }
}</code></pre>
</section>
`,
};
