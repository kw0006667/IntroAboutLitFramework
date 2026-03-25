export default {
  id: 6,
  slug: 'chapter-6',
  title: '生命週期：從 connectedCallback 到 updateComplete',
  part: 2,
  intro: '完整的生命週期地圖，包含 firstUpdated、updated、willUpdate 的正確使用時機。本章深入探討 Web Components 原生生命週期、非同步模式、效能監控，以及真實世界的資源管理策略。',
  sections: [
    { slug: 'wc-lifecycle', title: 'Web Components 原生生命週期' },
    { slug: 'lit-lifecycle-map', title: 'Lit 生命週期完整地圖' },
    { slug: 'first-updated', title: 'firstUpdated 的正確使用' },
    { slug: 'updated-hook', title: 'updated() 與副作用處理' },
    { slug: 'will-update', title: 'willUpdate() 的計算屬性模式' },
    { slug: 'update-complete', title: 'updateComplete Promise 的應用' },
    { slug: 'adoptedCallback', title: 'adoptedCallback 與 Document 遷移' },
    { slug: 'performance-lifecycle', title: '生命週期效能監控與優化' },
    { slug: 'async-lifecycle-patterns', title: '非同步生命週期模式' },
  ],
  content: `
<section id="wc-lifecycle">
  <h2>Web Components 原生生命週期</h2>
  <p>
    Lit 建立在 Web Components 的原生生命週期之上。理解底層 API 有助於在邊界情況下做出正確決策。
  </p>

  <h3>四個原生回調</h3>
  <pre data-lang="javascript"><code class="language-javascript">class MyElement extends HTMLElement {
  constructor() {
    super();
    // 元素被建立（或從 HTML 解析）時呼叫
    // 禁止在此讀取 attributes 或 children（可能尚未解析）
    // 只做初始化：建立 Shadow Root、設定預設狀態
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // 元素被插入 DOM 時呼叫
    // 可以存取 attributes、安全讀取父節點
    // 適合：啟動定時器、訂閱事件、初始化第三方函式庫
    console.log('元素已連接到 DOM');
  }

  disconnectedCallback() {
    // 元素從 DOM 中移除時呼叫
    // 必須：清除定時器、取消訂閱、釋放資源
    console.log('元素已從 DOM 斷開');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // 被觀察的 attribute 改變時呼叫
    // Lit 自動處理這個回調，通常不需要手動覆寫
  }

  adoptedCallback() {
    // 元素被移動到不同的 Document 時（罕見場景）
  }
}</code></pre>

  <h3>完整生命週期時序圖</h3>
  <p>
    以下是一個元件從建立到銷毀的完整事件時序，包含 Lit 附加的更新週期：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 1. 元素建立（new MyElement() 或 document.createElement）
//    → constructor()
//       → super()（LitElement 在此建立 Shadow Root）
//       → 初始化 @property/@state 的預設值

// 2. 元素插入 DOM（parent.appendChild(el) 或 HTML 解析）
//    → connectedCallback()
//       → super.connectedCallback()（Lit 啟動響應式系統、排程首次更新）
//       → 你的自訂邏輯（啟動訂閱、定時器等）

// 3. 首次更新週期（microtask 中）
//    → shouldUpdate(changedProperties)  // 可選：是否執行更新
//    → willUpdate(changedProperties)    // 計算衍生值
//    → update(changedProperties)        // 執行 render()，更新 Shadow DOM
//    → firstUpdated(changedProperties)  // 只在首次渲染後呼叫
//    → updated(changedProperties)       // 每次渲染後呼叫
//    → updateComplete Promise 解析

// 4. 屬性改變 → 觸發新的更新週期（重複步驟 3，但不呼叫 firstUpdated）

// 5. 元素從 DOM 移除（parent.removeChild(el) 或 innerHTML = ''）
//    → disconnectedCallback()
//       → super.disconnectedCallback()
//       → 你的清理邏輯（移除訂閱、停止定時器等）

// 6. 元素可能再次被插入 DOM（步驟 2-4 重複）</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">constructor 的禁止事項</div>
    <p>
      Web Components 規範嚴格禁止在 <code>constructor</code> 中讀取或修改 attributes、
      存取子節點（children）、或觸發同步 DOM 操作。
      這些操作只能在 <code>connectedCallback</code> 或更之後的生命週期中執行。
      LitElement 的 <code>super()</code> 已經安全地設定好 Shadow Root，
      你只需要在 constructor 中設定初始屬性值。
    </p>
  </div>
</section>

<section id="lit-lifecycle-map">
  <h2>Lit 生命週期完整地圖</h2>
  <p>Lit 在原生 Web Components 生命週期之上，加入了響應式更新週期：</p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('lifecycle-demo')
class LifecycleDemo extends LitElement {
  @property({ type: String }) data = '';
  @state() private _computed = '';

  // ─── 初始化階段 ───
  constructor() {
    super();
    // 初始化預設屬性值、建立 Shadow Root（super() 已處理）
  }

  // ─── 連接 DOM 階段 ───
  connectedCallback() {
    super.connectedCallback(); // 必須呼叫！啟動 Lit 的響應式系統
    // 啟動 Intervals、訂閱 Store、初始化事件監聽
    window.addEventListener('resize', this._onResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback(); // 必須呼叫！
    // 清除 Intervals、取消訂閱、移除事件監聽
    window.removeEventListener('resize', this._onResize);
  }

  // ─── 更新週期 ───

  // 1. 屬性改變時，requestUpdate() 被呼叫
  // 2. Microtask 排程更新

  // 3. shouldUpdate：是否應該執行更新（很少需要覆寫）
  shouldUpdate(changedProperties: Map&lt;string, unknown&gt;): boolean {
    return this.data !== '';  // 只在 data 有值時才渲染
  }

  // 4. willUpdate：渲染前計算衍生值
  willUpdate(changedProperties: Map&lt;string, unknown&gt;) {
    if (changedProperties.has('data')) {
      this._computed = this.data.toUpperCase();
    }
  }

  // 5. update：執行 render() 並更新 DOM
  // （Lit 自動處理，通常不需要覆寫）

  // 6. render：宣告 UI 結構
  render() {
    return html\`&lt;p&gt;\${this._computed}&lt;/p&gt;\`;
  }

  // 7. firstUpdated：第一次渲染完成後呼叫（只一次）
  firstUpdated(changedProperties: Map&lt;string, unknown&gt;) {
    // 安全地操作已渲染的 DOM
    const el = this.shadowRoot?.querySelector('.target');
    el?.focus();
  }

  // 8. updated：每次渲染完成後呼叫
  updated(changedProperties: Map&lt;string, unknown&gt;) {
    if (changedProperties.has('data')) {
      // 資料改變後觸發動畫等副作用
      this._animateIn();
    }
  }

  // 9. updateComplete Promise 解析
  // 外部程式碼可 await element.updateComplete
}</code></pre>

  <h3>connectedCallback vs firstUpdated：初始化時機的抉擇</h3>
  <p>
    這是 Lit 開發中最常見的困惑點之一。來自 React 背景的工程師可能會想用 <code>firstUpdated</code> 做所有初始化，但兩者有明確的分工：
  </p>
  <table>
    <thead>
      <tr>
        <th>初始化類型</th>
        <th>正確位置</th>
        <th>原因</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>全域事件監聽（window、document）</td>
        <td><code>connectedCallback</code></td>
        <td>元件可能多次插入/移除 DOM，每次都需要重新訂閱</td>
      </tr>
      <tr>
        <td>Store 訂閱（Redux、MobX 等）</td>
        <td><code>connectedCallback</code></td>
        <td>同上，需要配對的 <code>disconnectedCallback</code> 取消訂閱</td>
      </tr>
      <tr>
        <td>第三方函式庫（需要真實 DOM）</td>
        <td><code>firstUpdated</code></td>
        <td>需要等待 Shadow DOM 渲染完成才能取得 DOM 節點</td>
      </tr>
      <tr>
        <td>設定初始 Focus</td>
        <td><code>firstUpdated</code></td>
        <td>DOM 必須存在才能 focus</td>
      </tr>
      <tr>
        <td>初始資料載入（fetch）</td>
        <td><code>connectedCallback</code> 或 <code>firstUpdated</code></td>
        <td>兩者皆可；<code>connectedCallback</code> 更早，但若需要 DOM 尺寸資訊則用 <code>firstUpdated</code></td>
      </tr>
      <tr>
        <td>IntersectionObserver / ResizeObserver</td>
        <td><code>firstUpdated</code>（observer 本身）+ <code>disconnectedCallback</code>（disconnect）</td>
        <td>Observer 需要觀察 Shadow DOM 中的元素</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="first-updated">
  <h2>firstUpdated 的正確使用</h2>
  <p>
    <code>firstUpdated()</code> 在元件第一次渲染到 DOM 後呼叫一次。
    這是操作「第一次出現在 DOM 中的元素」的最佳時機。
  </p>

  <h3>典型使用場景</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('auto-focus-input')
class AutoFocusInput extends LitElement {
  render() {
    return html\`&lt;input type="text" placeholder="自動聚焦"&gt;\`;
  }

  firstUpdated() {
    // ✓ 此時 Shadow DOM 已渲染，可以安全操作
    const input = this.shadowRoot?.querySelector('input');
    input?.focus();
  }
}

@customElement('chart-container')
class ChartContainer extends LitElement {
  private chart?: ChartLibrary;

  render() {
    return html\`&lt;canvas id="chart"&gt;&lt;/canvas&gt;\`;
  }

  firstUpdated() {
    // ✓ 初始化第三方函式庫（需要真實 DOM 存在）
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (canvas) {
      this.chart = new ChartLibrary(canvas);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.chart?.destroy(); // 清理資源
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">常見誤用</div>
    <p>
      不要在 <code>firstUpdated()</code> 中設定響應式屬性，
      這會觸發一次額外的更新週期。
      如果需要基於初始渲染設定某些狀態，
      考慮在 <code>constructor()</code> 或 <code>connectedCallback()</code> 中處理。
    </p>
  </div>

  <h3>使用 @query 裝飾器簡化 DOM 存取</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { customElement, property, query, queryAll } from 'lit/decorators.js';

@customElement('form-with-refs')
class FormWithRefs extends LitElement {
  // @query 等同於 this.shadowRoot?.querySelector()
  // 注意：這是 lazy getter，每次存取都會查詢 DOM
  @query('#main-input') private _mainInput!: HTMLInputElement;
  @query('.submit-btn') private _submitBtn!: HTMLButtonElement;

  // @queryAll 等同於 this.shadowRoot?.querySelectorAll()
  @queryAll('input[required]') private _requiredInputs!: NodeListOf&lt;HTMLInputElement&gt;;

  // @query({ cache: true }) 只查詢一次並快取（元件生命週期內不再重新查詢）
  // 適合靜態的、不會被 render() 移除的元素
  @query('#static-canvas', true) private _canvas!: HTMLCanvasElement;

  firstUpdated() {
    // 直接使用裝飾器提供的參考，無需手動 querySelector
    this._mainInput.focus();

    // 驗證所有必填欄位
    this._requiredInputs.forEach(input =&gt; {
      input.addEventListener('blur', () =&gt; this._validateField(input));
    });
  }

  private _validateField(input: HTMLInputElement) {
    // 驗證邏輯
  }

  render() {
    return html\`
      &lt;input id="main-input" type="text"&gt;
      &lt;input required name="email" type="email"&gt;
      &lt;input required name="phone" type="tel"&gt;
      &lt;canvas id="static-canvas"&gt;&lt;/canvas&gt;
      &lt;button class="submit-btn"&gt;提交&lt;/button&gt;
    \`;
  }
}</code></pre>
</section>

<section id="updated-hook">
  <h2>updated() 與副作用處理</h2>
  <p>
    <code>updated(changedProperties)</code> 在每次 DOM 更新完成後呼叫。
    <code>changedProperties</code> 是一個 Map，記錄哪些屬性改變了（及其舊值）。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('animated-list')
class AnimatedList extends LitElement {
  @property({ type: Array }) items: Item[] = [];
  @state() private _prevCount = 0;

  render() {
    return html\`
      &lt;ul&gt;
        \${this.items.map(item =&gt; html\`
          &lt;li class="item" data-id=\${item.id}&gt;\${item.name}&lt;/li&gt;
        \`)}
      &lt;/ul&gt;
    \`;
  }

  updated(changedProperties: Map&lt;string, unknown&gt;) {
    super.updated(changedProperties);

    if (changedProperties.has('items')) {
      const oldCount = changedProperties.get('items')?.length ?? 0;

      if (this.items.length &gt; oldCount) {
        // 有新項目加入：觸發進入動畫
        const newItems = this.shadowRoot?.querySelectorAll('.item:last-child');
        newItems?.forEach(el =&gt; el.animate(
          [{ opacity: 0, transform: 'translateX(-20px)' },
           { opacity: 1, transform: 'translateX(0)' }],
          { duration: 300, easing: 'ease-out' }
        ));
      }
    }
  }
}</code></pre>

  <h3>Web Animations API 與 LitElement 的協調</h3>
  <p>
    Web Animations API（WAAPI）是現代瀏覽器原生支援的動畫 API，比 CSS transitions 更靈活，比 JavaScript 的 requestAnimationFrame 更高層。
    在 Lit 的生命週期中，<code>updated()</code> 是啟動 WAAPI 動畫的最佳時機——此時 DOM 已更新，動畫基於最終狀態執行：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('slide-panel')
class SlidePanel extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;

  // 持有動畫實例的參考，以便取消/反轉
  private _animation: Animation | null = null;

  @query('.panel') private _panel!: HTMLElement;

  static styles = css\`
    .panel {
      overflow: hidden;
      /* WAAPI 動畫會覆蓋這些值 */
    }
  \`;

  render() {
    return html\`
      &lt;div class="panel"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }

  updated(changed: PropertyValues&lt;this&gt;) {
    super.updated(changed);

    if (changed.has('open')) {
      // 取消正在執行的動畫（避免動畫衝突）
      this._animation?.cancel();

      const panel = this._panel;
      if (!panel) return;

      if (this.open) {
        // 展開動畫
        this._animation = panel.animate(
          [
            { height: '0px', opacity: 0 },
            { height: \`\${panel.scrollHeight}px\`, opacity: 1 },
          ],
          { duration: 250, easing: 'ease-out', fill: 'forwards' }
        );
      } else {
        // 收起動畫
        this._animation = panel.animate(
          [
            { height: \`\${panel.scrollHeight}px\`, opacity: 1 },
            { height: '0px', opacity: 0 },
          ],
          { duration: 200, easing: 'ease-in', fill: 'forwards' }
        );
      }

      // 動畫完成後發送自訂事件
      this._animation.addEventListener('finish', () =&gt; {
        this.dispatchEvent(new CustomEvent(
          this.open ? 'panel-opened' : 'panel-closed',
          { bubbles: true }
        ));
      });
    }
  }
}</code></pre>
</section>

<section id="will-update">
  <h2>willUpdate() 的計算屬性模式</h2>
  <p>
    <code>willUpdate()</code> 是實現「計算屬性（Computed Properties）」的正確位置。
    它在 <code>render()</code> 之前執行，讓你可以根據響應式屬性計算衍生值。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('data-table')
class DataTable extends LitElement {
  @property({ type: Array }) rows: Row[] = [];
  @property({ type: String }) sortKey = 'name';
  @property({ type: String }) sortDirection: 'asc' | 'desc' = 'asc';
  @property({ type: String }) filterText = '';

  // 衍生值（不需要 @state，在 willUpdate 中計算）
  private _filteredRows: Row[] = [];
  private _sortedRows: Row[] = [];
  private _totalPages = 0;

  willUpdate(changedProperties: Map&lt;string, unknown&gt;) {
    // 只有相關屬性改變時才重新計算
    if (changedProperties.has('rows') || changedProperties.has('filterText')) {
      this._filteredRows = this.rows.filter(row =&gt;
        row.name.toLowerCase().includes(this.filterText.toLowerCase())
      );
    }

    if (changedProperties.has('rows') ||
        changedProperties.has('filterText') ||
        changedProperties.has('sortKey') ||
        changedProperties.has('sortDirection')) {
      this._sortedRows = [...this._filteredRows].sort((a, b) =&gt; {
        const aVal = a[this.sortKey as keyof Row];
        const bVal = b[this.sortKey as keyof Row];
        const cmp = String(aVal).localeCompare(String(bVal));
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }
  }

  render() {
    // 直接使用已計算好的 _sortedRows，render() 保持簡潔
    return html\`
      &lt;table&gt;
        \${this._sortedRows.map(row =&gt; html\`
          &lt;tr&gt;&lt;td&gt;\${row.name}&lt;/td&gt;&lt;td&gt;\${row.value}&lt;/td&gt;&lt;/tr&gt;
        \`)}
      &lt;/table&gt;
    \`;
  }
}</code></pre>
</section>

<section id="update-complete">
  <h2>updateComplete Promise 的應用</h2>
  <p>
    <code>element.updateComplete</code> 是一個 Promise，
    在最近一次 DOM 更新完成時解析（resolve）。
    它是外部程式碼等待 Lit 元件渲染完成的標準方式。
  </p>

  <h3>測試中的應用</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在測試中等待更新完成
it('should display error message', async () =&gt; {
  const el = document.createElement('my-form') as MyForm;
  document.body.appendChild(el);

  el.submit(); // 觸發驗證

  // 等待 Lit 完成 DOM 更新
  await el.updateComplete;

  const errorMsg = el.shadowRoot?.querySelector('.error-message');
  expect(errorMsg?.textContent).to.include('必填欄位');
});</code></pre>

  <h3>動畫協調</h3>
  <pre data-lang="typescript"><code class="language-typescript">async function showAndAnimatePanel(el: MyPanel) {
  el.visible = true;

  // 等待 Lit 渲染 visible=true 的狀態
  await el.updateComplete;

  // 現在 panel 的 DOM 已存在，可以啟動動畫
  el.shadowRoot?.querySelector('.panel')?.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 200 }
  );
}</code></pre>

  <h3>連續更新的等待</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 如果在 updated() 中又觸發了更新，
// updateComplete 等待所有連鎖更新完成
async function waitForAllUpdates(el: LitElement) {
  while (el.isUpdatePending) {
    await el.updateComplete;
  }
}</code></pre>

  <h3>updateComplete 的連鎖等待與 lazy initialization</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('lazy-init-component')
class LazyInitComponent extends LitElement {
  @property() config: Config | null = null;
  @state() private _initialized = false;
  @state() private _initError: Error | null = null;

  private _heavyResource: HeavyResource | null = null;

  async connectedCallback() {
    super.connectedCallback();

    // 首次渲染發生在 connectedCallback 返回後的 microtask
    // 等待首次渲染，確保 loading 狀態已顯示
    await this.updateComplete;

    // 現在進行耗時的初始化
    try {
      this._heavyResource = await initializeHeavyResource(this.config);
      this._initialized = true;
    } catch (error) {
      this._initError = error instanceof Error ? error : new Error(String(error));
    }
    // 設定 _initialized 或 _initError 會觸發第二次更新
  }

  render() {
    if (this._initError) {
      return html\`&lt;error-display .error=\${this._initError}&gt;&lt;/error-display&gt;\`;
    }
    if (!this._initialized) {
      return html\`&lt;loading-skeleton&gt;&lt;/loading-skeleton&gt;\`;
    }
    return html\`&lt;main-content .resource=\${this._heavyResource}&gt;&lt;/main-content&gt;\`;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._heavyResource?.dispose();
    this._heavyResource = null;
    this._initialized = false;
  }
}</code></pre>
</section>

<section id="adoptedCallback">
  <h2>adoptedCallback 與 Document 遷移</h2>
  <p>
    <code>adoptedCallback</code> 是 Web Components 規範中最罕見的生命週期回調，
    在元素從一個 <code>Document</code> 被移動到另一個 <code>Document</code> 時觸發。
    雖然在一般 Web 應用中很少見，但在特定場景下至關重要。
  </p>

  <h3>什麼時候會觸發 adoptedCallback？</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 觸發場景 1：iframe 跨 Document 遷移
const iframe = document.querySelector('iframe');
const iframeDoc = iframe.contentDocument;

const el = document.createElement('my-element');
document.body.appendChild(el); // connectedCallback 觸發

// 將元素從主 document 移到 iframe 的 document
iframeDoc.adoptNode(el);        // adoptedCallback 觸發
iframeDoc.body.appendChild(el); // 再次觸發 connectedCallback

// 觸發場景 2：DOMParser 的結果插入主 document
const parser = new DOMParser();
const parsedDoc = parser.parseFromString(htmlString, 'text/html');
const parsedEl = parsedDoc.querySelector('my-element');
document.body.appendChild(parsedEl); // adoptedCallback 觸發

// 觸發場景 3：使用 document.importNode
const cloned = document.importNode(externalEl, true);
// 注意：importNode 不會觸發 adoptedCallback，只有 adoptNode 才會</code></pre>

  <h3>LitElement 中的 adoptedCallback 實作</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('adaptive-element')
class AdaptiveElement extends LitElement {
  // 追蹄目前所在的 Document
  private _currentDoc: Document | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._currentDoc = this.ownerDocument;
    this._adaptToDocument(this._currentDoc);
  }

  // 覆寫 adoptedCallback（Lit 沒有特別封裝這個）
  adoptedCallback() {
    super.adoptedCallback?.(); // Lit 3.x 中 LitElement 有此方法

    const newDoc = this.ownerDocument;
    console.log(\`元素從 \${this._currentDoc?.URL} 遷移到 \${newDoc.URL}\`);

    this._currentDoc = newDoc;
    this._adaptToDocument(newDoc);
  }

  private _adaptToDocument(doc: Document) {
    // 場景：元件使用了 document-level 的資源（如 document.fonts）
    // 需要在 Document 改變時重新訂閱

    // 監聽目標 document 的字體載入
    doc.fonts.ready.then(() =&gt; {
      this.requestUpdate(); // 字體就緒後重新渲染
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  render() {
    return html\`&lt;p&gt;當前 Document：\${this.ownerDocument.URL}&lt;/p&gt;\`;
  }
}</code></pre>

  <h3>實際使用場景：組件設計工具與 iframe 沙盒</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 場景：組件設計工具（如 Storybook 的 iframe 預覽）
// 元件可能在主 document 建立，然後被移動到 iframe 的沙盒環境
@customElement('sandboxable-widget')
class SandboxableWidget extends LitElement {
  // 儲存跨 document 不安全的資源
  private _styleObserver: MutationObserver | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._setupStyleObserver();
  }

  adoptedCallback() {
    // 當移動到新 document 時：
    // 1. 清理舊 document 的資源
    this._styleObserver?.disconnect();
    this._styleObserver = null;

    // 2. 在新 document 中重新設定
    this._setupStyleObserver();

    // 3. 請求更新（以反映新環境可能不同的樣式）
    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._styleObserver?.disconnect();
    this._styleObserver = null;
  }

  private _setupStyleObserver() {
    // 觀察 document 的 &lt;head&gt; 中的樣式表變化
    this._styleObserver = new MutationObserver(() =&gt; {
      this.requestUpdate();
    });
    this._styleObserver.observe(
      this.ownerDocument.head,
      { childList: true, subtree: true }
    );
  }

  render() {
    return html\`&lt;slot&gt;&lt;/slot&gt;\`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">LitElement 的 adoptedCallback 支援</div>
    <p>
      Lit 3.x 中 <code>LitElement</code> 沒有特別封裝 <code>adoptedCallback</code>——
      你可以直接覆寫原生的 <code>adoptedCallback</code> 方法。
      由於這個回調非常罕見，大多數應用不需要理會它。
      需要關注它的主要場景是：組件庫設計工具、Web 應用的 iframe 嵌入架構、以及跨視窗的 DOM 遷移功能。
    </p>
  </div>
</section>

<section id="performance-lifecycle">
  <h2>生命週期效能監控與優化</h2>
  <p>
    對於生產環境的高效能要求，精確測量 Lit 元件的生命週期耗時是診斷效能瓶頸的基礎。
    結合 <code>performance.mark()</code>/<code>performance.measure()</code> 和 Lit 的生命週期鉤子，
    可以建立精準的效能基準。
  </p>

  <h3>使用 performance.mark() 監控生命週期時間</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('monitored-component')
class MonitoredComponent extends LitElement {
  @property({ type: Array }) data: DataItem[] = [];

  private readonly _perfPrefix: string;

  constructor() {
    super();
    // 為每個實例建立唯一的效能標記前綴
    this._perfPrefix = \`\${this.tagName.toLowerCase()}-\${Math.random().toString(36).slice(2, 7)}\`;
  }

  connectedCallback() {
    performance.mark(\`\${this._perfPrefix}:connected-start\`);
    super.connectedCallback();
    performance.mark(\`\${this._perfPrefix}:connected-end\`);
    performance.measure(
      \`\${this._perfPrefix}:connectedCallback\`,
      \`\${this._perfPrefix}:connected-start\`,
      \`\${this._perfPrefix}:connected-end\`
    );
  }

  willUpdate(changed: PropertyValues&lt;this&gt;) {
    performance.mark(\`\${this._perfPrefix}:will-update-start\`);
    super.willUpdate(changed);

    // 模擬昂貴的計算
    this._expensiveComputation();

    performance.mark(\`\${this._perfPrefix}:will-update-end\`);
    performance.measure(
      \`\${this._perfPrefix}:willUpdate\`,
      \`\${this._perfPrefix}:will-update-start\`,
      \`\${this._perfPrefix}:will-update-end\`
    );
  }

  protected update(changed: PropertyValues&lt;this&gt;) {
    performance.mark(\`\${this._perfPrefix}:render-start\`);
    super.update(changed);
    performance.mark(\`\${this._perfPrefix}:render-end\`);
    performance.measure(
      \`\${this._perfPrefix}:render\`,
      \`\${this._perfPrefix}:render-start\`,
      \`\${this._perfPrefix}:render-end\`
    );
  }

  updated(changed: PropertyValues&lt;this&gt;) {
    super.updated(changed);
    performance.mark(\`\${this._perfPrefix}:updated-end\`);
    // 測量整個更新週期
    try {
      performance.measure(
        \`\${this._perfPrefix}:full-update-cycle\`,
        \`\${this._perfPrefix}:will-update-start\`,
        \`\${this._perfPrefix}:updated-end\`
      );
    } catch {
      // will-update-start 可能不存在（如 shouldUpdate 返回 false）
    }
  }

  private _expensiveComputation() {
    // 計算邏輯...
  }

  render() {
    return html\`&lt;ul&gt;\${this.data.map(d =&gt; html\`&lt;li&gt;\${d.name}&lt;/li&gt;\`)}&lt;/ul&gt;\`;
  }
}

// 在 DevTools Performance 面板中，你可以看到所有的 measure 結果
// 或者在程式碼中讀取：
const measures = performance.getEntriesByType('measure')
  .filter(m =&gt; m.name.startsWith('monitored-component'));
console.table(measures.map(m =&gt; ({ name: m.name, duration: m.duration.toFixed(2) + 'ms' })));</code></pre>

  <h3>建立可重用的效能監控 Mixin</h3>
  <pre data-lang="typescript"><code class="language-typescript">// perf-mixin.ts：為任何 LitElement 添加效能監控
type Constructor&lt;T = LitElement&gt; = new (...args: unknown[]) =&gt; T;

export function PerfMixin&lt;T extends Constructor&lt;LitElement&gt;&gt;(Base: T) {
  return class PerfMonitored extends Base {
    private readonly _perfId = \`\${
      this.constructor.name
    }-\${Math.random().toString(36).slice(2, 6)}\`;

    private _updateCount = 0;
    private _totalRenderTime = 0;

    protected update(changed: PropertyValues) {
      const start = performance.now();
      super.update(changed);
      const end = performance.now();

      this._updateCount++;
      this._totalRenderTime += end - start;

      // 只在開發環境輸出警告
      if (import.meta.env?.DEV &amp;&amp; end - start &gt; 16) {
        console.warn(
          \`[PerfMixin] \${this._perfId} 渲染耗時 \${(end - start).toFixed(1)}ms，超過一個畫面幀（16ms）。考慮優化 render() 或 willUpdate()。\`
        );
      }
    }

    // 輸出效能摘要
    getPerfReport() {
      return {
        componentId: this._perfId,
        updateCount: this._updateCount,
        totalRenderTime: this._totalRenderTime.toFixed(2) + 'ms',
        avgRenderTime: (this._totalRenderTime / this._updateCount).toFixed(2) + 'ms',
      };
    }
  };
}

// 使用方式
@customElement('perf-aware-list')
class PerfAwareList extends PerfMixin(LitElement) {
  @property({ type: Array }) items: Item[] = [];

  render() {
    return html\`
      &lt;ul&gt;
        \${this.items.map(item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`)}
      &lt;/ul&gt;
    \`;
  }
}</code></pre>

  <h3>shouldUpdate：效能優化的精準控制</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('selective-renderer')
class SelectiveRenderer extends LitElement {
  @property({ type: Object }) user: User | null = null;
  @property({ type: Object }) config: Config | null = null;
  @state() private _lastScrollY = 0;

  shouldUpdate(changed: PropertyValues&lt;this&gt;): boolean {
    // 場景 1：config 改變但不影響渲染
    if (changed.size === 1 &amp;&amp; changed.has('_lastScrollY')) {
      // 只有 scroll 位置改變（用於某些計算但不影響 UI）
      // 不需要重新渲染 → 返回 false
      return false;
    }

    // 場景 2：user 改變，但只有 lastLogin 欄位不同（不影響顯示）
    if (changed.has('user')) {
      const newUser = this.user;
      const oldUser = changed.get('user') as User | null;

      if (
        newUser?.id === oldUser?.id &amp;&amp;
        newUser?.name === oldUser?.name &amp;&amp;
        newUser?.avatar === oldUser?.avatar
      ) {
        // 使用者的顯示相關資訊沒變，跳過渲染
        return false;
      }
    }

    return true; // 其他情況正常渲染
  }

  render() {
    return html\`
      &lt;div class="user-info"&gt;
        &lt;img src=\${this.user?.avatar} alt=\${this.user?.name}&gt;
        &lt;span&gt;\${this.user?.name}&lt;/span&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">shouldUpdate 的使用時機</div>
    <p>
      <code>shouldUpdate</code> 是一個逃生門（escape hatch），不應過度使用。
      Lit 的渲染本身已經很高效——只有在 profiling 確認渲染確實是瓶頸，
      而非某個 <code>willUpdate</code> 中的昂貴計算時，才考慮使用 <code>shouldUpdate</code>。
      大多數效能問題可以透過優化 <code>willUpdate</code> 中的計算邏輯來解決。
    </p>
  </div>
</section>

<section id="async-lifecycle-patterns">
  <h2>非同步生命週期模式</h2>
  <p>
    真實世界的元件往往需要在生命週期中執行非同步操作：資料載入、WebSocket 連線、Permission API、
    甚至等待其他自訂元素就緒。這一節深入探討處理這些場景的穩健模式。
  </p>

  <h3>完整資源管理範例：複雜元件的生命週期</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 這是一個具備完整資源管理的生產品質元件範例
// 整合了：WebSocket、IntersectionObserver、ResizeObserver、事件監聽、定時器

interface StreamMessage {
  type: 'data' | 'error' | 'status';
  payload: unknown;
}

@customElement('realtime-dashboard')
class RealtimeDashboard extends LitElement {
  @property() streamUrl = '';
  @property({ type: Boolean }) autoConnect = true;

  @state() private _connected = false;
  @state() private _messages: StreamMessage[] = [];
  @state() private _visible = false;
  @state() private _containerWidth = 0;
  @state() private _error: Error | null = null;

  // 資源追蹤
  private _ws: WebSocket | null = null;
  private _reconnectTimer: ReturnType&lt;typeof setTimeout&gt; | null = null;
  private _reconnectAttempts = 0;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _abortController = new AbortController();
  private _statsInterval: ReturnType&lt;typeof setInterval&gt; | null = null;

  // ─────────────────────────────────────────
  // 連接 DOM 時：設定觀察器和非 DOM 相關的訂閱
  // ─────────────────────────────────────────
  connectedCallback() {
    super.connectedCallback();

    // 重置 abort controller（如果元件被重新插入 DOM）
    if (this._abortController.signal.aborted) {
      this._abortController = new AbortController();
    }

    // 全域事件監聽（使用 AbortController 管理移除）
    window.addEventListener(
      'online',
      () =&gt; this._handleNetworkChange(true),
      { signal: this._abortController.signal }
    );
    window.addEventListener(
      'offline',
      () =&gt; this._handleNetworkChange(false),
      { signal: this._abortController.signal }
    );
  }

  // ─────────────────────────────────────────
  // 首次渲染完成後：設定需要真實 DOM 的觀察器
  // ─────────────────────────────────────────
  firstUpdated() {
    this._setupIntersectionObserver();
    this._setupResizeObserver();

    if (this.autoConnect && this.streamUrl) {
      this._connect();
    }
  }

  // ─────────────────────────────────────────
  // 屬性改變後：響應配置變化
  // ─────────────────────────────────────────
  updated(changed: PropertyValues&lt;this&gt;) {
    super.updated(changed);

    if (changed.has('streamUrl') && this.streamUrl) {
      // URL 改變：斷開舊連線，建立新連線
      this._disconnect();
      if (this.autoConnect) {
        this._connect();
      }
    }
  }

  // ─────────────────────────────────────────
  // 從 DOM 移除時：清理所有資源
  // ─────────────────────────────────────────
  disconnectedCallback() {
    super.disconnectedCallback();

    // 1. 取消所有 AbortController 管理的事件監聽
    this._abortController.abort();

    // 2. 斷開 WebSocket
    this._disconnect();

    // 3. 清除計時器
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._statsInterval !== null) {
      clearInterval(this._statsInterval);
      this._statsInterval = null;
    }

    // 4. 停止觀察器
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  // ─── 私有方法 ───

  private _connect() {
    if (this._ws?.readyState === WebSocket.OPEN) return;

    try {
      this._ws = new WebSocket(this.streamUrl);

      this._ws.addEventListener('open', () =&gt; {
        this._connected = true;
        this._reconnectAttempts = 0;
        this._error = null;
        this._startStatsInterval();
      });

      this._ws.addEventListener('message', (event: MessageEvent) =&gt; {
        try {
          const msg: StreamMessage = JSON.parse(event.data);
          // 只保留最近 100 條訊息（避免記憶體無限增長）
          this._messages = [...this._messages.slice(-99), msg];
        } catch {
          // 忽略無效的 JSON
        }
      });

      this._ws.addEventListener('error', () =&gt; {
        this._error = new Error('WebSocket 連線錯誤');
      });

      this._ws.addEventListener('close', () =&gt; {
        this._connected = false;
        this._stopStatsInterval();
        // 指數退避重連（只在元件仍連接到 DOM 時）
        if (this.isConnected &amp;&amp; this._reconnectAttempts &lt; 5) {
          const delay = Math.min(1000 * 2 ** this._reconnectAttempts, 30000);
          this._reconnectTimer = setTimeout(() =&gt; {
            this._reconnectAttempts++;
            this._connect();
          }, delay);
        }
      });
    } catch (err) {
      this._error = err instanceof Error ? err : new Error('無法建立 WebSocket 連線');
    }
  }

  private _disconnect() {
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    this._ws?.close();
    this._ws = null;
    this._connected = false;
  }

  private _setupIntersectionObserver() {
    this._intersectionObserver = new IntersectionObserver(
      ([entry]) =&gt; {
        this._visible = entry.isIntersecting;
        // 不可見時暫停更新（節省資源）
        if (!this._visible) {
          this._stopStatsInterval();
        } else if (this._connected) {
          this._startStatsInterval();
        }
      },
      { threshold: 0.1 }
    );
    this._intersectionObserver.observe(this);
  }

  private _setupResizeObserver() {
    this._resizeObserver = new ResizeObserver(([entry]) =&gt; {
      this._containerWidth = entry.contentRect.width;
    });
    this._resizeObserver.observe(this);
  }

  private _startStatsInterval() {
    if (this._statsInterval !== null) return;
    this._statsInterval = setInterval(() =&gt; {
      // 定期更新統計資料
      this.requestUpdate();
    }, 5000);
  }

  private _stopStatsInterval() {
    if (this._statsInterval !== null) {
      clearInterval(this._statsInterval);
      this._statsInterval = null;
    }
  }

  private _handleNetworkChange(online: boolean) {
    if (online &amp;&amp; !this._connected &amp;&amp; this.streamUrl) {
      this._reconnectAttempts = 0; // 網路恢復時重置退避計數
      this._connect();
    }
  }

  render() {
    if (this._error) {
      return html\`
        &lt;div class="error"&gt;
          \${this._error.message}
          &lt;button @click=\${() =&gt; { this._error = null; this._connect(); }}&gt;重新連線&lt;/button&gt;
        &lt;/div&gt;
      \`;
    }

    return html\`
      &lt;div class="dashboard" style="--width: \${this._containerWidth}px"&gt;
        &lt;div class="status"&gt;
          &lt;span class=\${this._connected ? 'online' : 'offline'}&gt;
            \${this._connected ? '● 已連線' : '○ 離線'}
          &lt;/span&gt;
          \${!this._visible ? html\`&lt;span class="paused"&gt;（背景暫停）&lt;/span&gt;\` : ''}
        &lt;/div&gt;
        &lt;ul class="messages"&gt;
          \${this._messages.slice(-10).map(msg =&gt; html\`
            &lt;li class="message \${msg.type}"&gt;\${JSON.stringify(msg.payload)}&lt;/li&gt;
          \`)}
        &lt;/ul&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>使用 AbortController 統一管理事件監聽</h3>
  <p>
    上面的範例展示了一個現代 Web 開發的重要模式：使用 <code>AbortController</code> 的 <code>signal</code>
    作為 <code>addEventListener</code> 的選項，讓你可以用一個 <code>abort()</code> 呼叫移除多個監聽器，
    而無需追蹤每個監聽器的函數參考：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('keyboard-shortcut-handler')
class KeyboardShortcutHandler extends LitElement {
  private _abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    const signal = this._abortController.signal;

    // 不需要儲存函數參考，全部由 signal 管理
    document.addEventListener('keydown', this._handleKeyDown, { signal });
    document.addEventListener('keyup', this._handleKeyUp, { signal });
    window.addEventListener('blur', this._handleBlur, { signal });
    window.addEventListener('focus', this._handleFocus, { signal });

    // 甚至可以設定 once 選項（只觸發一次後自動移除）
    document.addEventListener(
      'visibilitychange',
      () =&gt; this._handleFirstVisibility(),
      { signal, once: true }
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // 一行清除所有監聽器
    this._abortController.abort();
    // 為下次 connectedCallback 準備新的 controller
    this._abortController = new AbortController();
  }

  private _handleKeyDown = (e: KeyboardEvent) =&gt; { /* ... */ };
  private _handleKeyUp = (e: KeyboardEvent) =&gt; { /* ... */ };
  private _handleBlur = () =&gt; { /* ... */ };
  private _handleFocus = () =&gt; { /* ... */ };
  private _handleFirstVisibility = () =&gt; { /* ... */ };

  render() {
    return html\`&lt;slot&gt;&lt;/slot&gt;\`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">AbortController 作為資源管理工具</div>
    <p>
      <code>AbortController</code> 最初是為 <code>fetch</code> 設計的取消機制，
      但它的 signal 也可以傳給 <code>addEventListener</code> 的 options（Chrome 88+、Firefox 87+、Safari 15+）。
      這個模式大幅簡化了 <code>disconnectedCallback</code> 中的清理工作，
      特別是在元件監聽許多事件時。對於需要支援舊版瀏覽器的場景，
      仍需回退到傳統的 <code>removeEventListener</code> 方式。
    </p>
  </div>

  <h3>等待子元件就緒（customElements.whenDefined）</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('composite-view')
class CompositeView extends LitElement {
  @state() private _childrenReady = false;

  async firstUpdated() {
    // 等待所有子自訂元素都已定義
    // 這在 lazy loading 的場景中特別重要
    await Promise.all([
      customElements.whenDefined('data-chart'),
      customElements.whenDefined('data-table'),
      customElements.whenDefined('filter-panel'),
    ]);

    this._childrenReady = true;

    // 等待子元件完成首次渲染
    await this.updateComplete;

    // 現在可以安全地存取子元件的 API
    const chart = this.shadowRoot?.querySelector('data-chart') as DataChart;
    chart?.setDataSource(this._dataSource);
  }

  render() {
    if (!this._childrenReady) {
      return html\`&lt;loading-overlay&gt;&lt;/loading-overlay&gt;\`;
    }
    return html\`
      &lt;filter-panel @filter-change=\${this._onFilterChange}&gt;&lt;/filter-panel&gt;
      &lt;data-chart&gt;&lt;/data-chart&gt;
      &lt;data-table&gt;&lt;/data-table&gt;
    \`;
  }
}</code></pre>
</section>
`,
};
