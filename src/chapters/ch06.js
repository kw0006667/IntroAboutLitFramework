export default {
  id: 6,
  slug: 'chapter-6',
  title: '生命週期：從 connectedCallback 到 updateComplete',
  part: 2,
  intro: '完整的生命週期地圖，包含 firstUpdated、updated、willUpdate 的正確使用時機。',
  sections: [
    { slug: 'wc-lifecycle', title: 'Web Components 原生生命週期' },
    { slug: 'lit-lifecycle-map', title: 'Lit 生命週期完整地圖' },
    { slug: 'first-updated', title: 'firstUpdated 的正確使用' },
    { slug: 'updated-hook', title: 'updated() 與副作用處理' },
    { slug: 'will-update', title: 'willUpdate() 的計算屬性模式' },
    { slug: 'update-complete', title: 'updateComplete Promise 的應用' },
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

      if (this.items.length > oldCount) {
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
</section>
`,
};
