export default {
  id: 9,
  slug: 'chapter-9',
  title: '心智模型的根本差異',
  part: 3,
  intro: '從「元件是函數」（React）到「元件是 DOM 節點」（Lit）的思維轉換，解釋 Shadow DOM encapsulation 對 CSS 和事件的影響。',
  sections: [
    { slug: 'function-vs-dom-node', title: '函數 vs DOM 節點的元件觀' },
    { slug: 'shadow-dom-css-impact', title: 'Shadow DOM 對 CSS 的影響' },
    { slug: 'event-bubbling-shadow', title: '事件冒泡與 Shadow DOM' },
    { slug: 'react-fiber-vs-lit', title: 'React Fiber vs Lit 更新策略' },
    { slug: 'jsx-vs-tagged-templates', title: 'JSX vs Tagged Template Literals' },
    { slug: 'render-hijacking', title: 'Render Hijacking 與 Decorator 模式' },
    { slug: 'slot-advanced', title: 'Slot 進階模式：named slots、slot assignment API' },
    { slug: 'custom-element-registry', title: 'Custom Element Registry 與作用域' },
    { slug: 'migration-mental-model', title: 'React 開發者遷移 Lit 的心智模型轉換' },
  ],
  content: `
<section id="function-vs-dom-node">
  <h2>函數 vs DOM 節點的元件觀</h2>
  <p>
    React 和 Lit 對「元件」的定義有根本上的不同，這個差異影響了所有後續的設計決策。
  </p>

  <h3>React 的觀點：元件是函數</h3>
  <p>
    在 React 中，元件是一個純函數（或 Hooks 增強的函數）：
    <strong>輸入 Props，輸出 UI 描述（JSX）</strong>。
    React 負責將這個 UI 描述映射到真實 DOM。
  </p>
  <pre data-lang="jsx"><code class="language-jsx">// React：元件是一個函數
function UserCard({ name, avatar, role }) {
  const [expanded, setExpanded] = useState(false);

  return (
    &lt;div className="card"&gt;
      &lt;img src={avatar} alt={name} /&gt;
      &lt;h2&gt;{name}&lt;/h2&gt;
      {expanded &amp;&amp; &lt;p&gt;{role}&lt;/p&gt;}
      &lt;button onClick={() =&gt; setExpanded(!expanded)}&gt;
        {expanded ? '收合' : '展開'}
      &lt;/button&gt;
    &lt;/div&gt;
  );
}

// React 元件沒有持久的 DOM 身份
// 每次渲染都是重新執行這個函數</code></pre>

  <h3>Lit 的觀點：元件是 DOM 節點</h3>
  <p>
    在 Lit 中，元件是一個<strong>真實存在的 HTML 元素</strong>（繼承自 <code>HTMLElement</code>）。
    它有持久的生命週期，是 DOM 樹的一部分，
    <code>document.querySelector('user-card')</code> 可以找到它。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// Lit：元件是一個 DOM 節點（HTMLElement 的子類別）
@customElement('user-card')
class UserCard extends LitElement {
  @property() name = '';
  @property() avatar = '';
  @property() role = '';
  @state() private _expanded = false;

  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;img src=\${this.avatar} alt=\${this.name}&gt;
        &lt;h2&gt;\${this.name}&lt;/h2&gt;
        \${this._expanded ? html\`&lt;p&gt;\${this.role}&lt;/p&gt;\` : ''}
        &lt;button @click=\${() =&gt; { this._expanded = !this._expanded; }}&gt;
          \${this._expanded ? '收合' : '展開'}
        &lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}

// Lit 元件有持久的 DOM 身份
// render() 只更新改變的部分，元素本身不會被重建</code></pre>

  <h3>這個差異帶來的實際影響</h3>
  <table>
    <thead>
      <tr><th>面向</th><th>React（函數模型）</th><th>Lit（DOM 節點模型）</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>元件身份</td>
        <td>由 key prop 決定</td>
        <td>即是 DOM 元素本身</td>
      </tr>
      <tr>
        <td>DOM 操作</td>
        <td>透過 ref 間接存取</td>
        <td>直接操作（<code>this.shadowRoot</code>）</td>
      </tr>
      <tr>
        <td>CSS 樣式</td>
        <td>共享全域 CSS 命名空間</td>
        <td>Shadow DOM 封裝</td>
      </tr>
      <tr>
        <td>生命週期</td>
        <td>由 React 控制，隨渲染存在</td>
        <td>由 DOM 決定（連接/斷開）</td>
      </tr>
      <tr>
        <td>自省（Introspection）</td>
        <td>需要 React DevTools</td>
        <td>瀏覽器 DevTools 直接可見</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="shadow-dom-css-impact">
  <h2>Shadow DOM 對 CSS 的影響</h2>

  <h3>React 的 CSS 全域汙染問題</h3>
  <p>
    React 沒有內建 CSS 封裝機制。<code>.button { color: red; }</code>
    會影響整個頁面的所有 <code>.button</code>。
    因此 React 生態發展出了許多 CSS 封裝方案：
    CSS Modules、styled-components、Emotion、Tailwind CSS 等。
    每種方案都有自己的 API 和取捨。
  </p>

  <h3>Lit 的 Shadow DOM 封裝</h3>
  <p>
    Lit 元件的 <code>static styles</code> 完全封裝在 Shadow DOM 中：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-button')
class MyButton extends LitElement {
  static styles = css\`
    /* 這個 button 樣式只影響 my-button 的 Shadow DOM 內部 */
    /* 不會洩漏到外部，外部的 button 樣式也不會進來 */
    button {
      background: var(--button-bg, #FF6D00);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }

    /* 可以用 CSS Custom Properties 接受外部主題化 */
    :host([variant="secondary"]) button {
      background: var(--button-secondary-bg, #e0e0e0);
      color: var(--button-secondary-color, #333);
    }
  \`;
}</code></pre>

  <h3>CSS Custom Properties：穿透 Shadow DOM 的橋樑</h3>
  <p>
    CSS Custom Properties（CSS 變數）是唯一可以穿透 Shadow DOM 邊界的 CSS 機制，
    這讓主題化（Theming）成為可能：
  </p>
  <pre data-lang="css"><code class="language-css">/* 外部：設定主題變數 */
:root {
  --button-bg: #1a73e8;
  --button-color: white;
}

/* 深色主題 */
[data-theme="dark"] {
  --button-bg: #4a90d9;
}</code></pre>
</section>

<section id="event-bubbling-shadow">
  <h2>事件冒泡與 Shadow DOM</h2>
  <p>
    Shadow DOM 的事件邊界是許多開發者的困惑來源。
    讓我們澄清規則：
  </p>

  <h3>事件的「重新定位」（Retargeting）</h3>
  <p>
    當事件從 Shadow DOM 內部冒泡到外部時，
    瀏覽器會進行「事件重新定位」：
    在外部看到的 <code>event.target</code> 是 Shadow Host（宿主元素），
    而不是 Shadow DOM 內部的實際觸發元素。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">// Shadow DOM 內部：
// &lt;button id="inner-btn"&gt;Click&lt;/button&gt;

// 外部的事件監聽器：
document.addEventListener('click', (e) =&gt; {
  console.log(e.target);         // my-custom-element（宿主元素）
  console.log(e.composedPath()); // 完整路徑，包括 Shadow DOM 內部
});</code></pre>

  <h3>composedPath() 深度解析</h3>
  <p>
    <code>event.composedPath()</code> 返回事件傳播路徑上的所有節點陣列，
    包括 Shadow DOM 內部的節點。
    這是唯一可以在外部取得 Shadow DOM 內部真實觸發元素的方式。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 判斷事件是否來自特定 Shadow DOM 內部
function isFromShadow(event: Event, host: Element): boolean {
  const path = event.composedPath();
  // 路徑中最後一個 Element（不含 Window/Document）就是宿主
  const composedTarget = path[0];
  return host.contains(composedTarget as Node) || host === composedTarget;
}

// 取得 Shadow DOM 內部的實際觸發元素（跨 Shadow 邊界）
function getDeepTarget(event: Event): Element | null {
  const path = event.composedPath();
  // path[0] 是最深的觸發元素
  return (path[0] instanceof Element) ? path[0] : null;
}</code></pre>

  <h3>composed: true 的必要性</h3>
  <p>
    自訂事件預設不穿越 Shadow DOM 邊界（<code>composed: false</code>）。
    必須明確設定 <code>composed: true</code>：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 這個事件不會離開 Shadow DOM
this.dispatchEvent(new CustomEvent('my-event', {
  bubbles: true,
  // composed 預設為 false
}));

// 這個事件會穿越 Shadow DOM 邊界
this.dispatchEvent(new CustomEvent('my-event', {
  bubbles: true,
  composed: true,
  detail: { data: 'value' },
}));</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">composed: true 的安全考量</div>
    <p>
      不是所有事件都應該設定 <code>composed: true</code>。
      對於元件內部的實作細節事件（例如：內部狀態變更的通知），
      保持 <code>composed: false</code>（預設值）可以防止外部意外監聽到
      不應暴露的內部行為。<br>
      <br>
      一般原則：如果事件是元件公開 API 的一部分（使用者需要監聽），設 <code>composed: true</code>；
      如果只是內部通訊，保持預設的 <code>composed: false</code>。
    </p>
  </div>
</section>

<section id="react-fiber-vs-lit">
  <h2>React Fiber vs Lit 更新策略</h2>

  <h3>React Fiber：可中斷的工作調度</h3>
  <p>
    React 18 的 Concurrent Mode 引入了可中斷的渲染：
    React 可以將大型更新分割成小塊，
    讓瀏覽器在渲染幀之間執行高優先級工作（如使用者輸入），
    避免 UI 卡頓。這需要複雜的 Fiber 架構支撐。
  </p>

  <h3>Lit：簡單高效的批次更新</h3>
  <p>
    Lit 的更新策略更簡單：
    使用 Microtask 批次同步改變，
    在一個渲染幀內完成所有更新。
    因為 Lit 的更新成本本身就很低（精準 Part 更新），
    通常不需要 Concurrent Mode 的複雜度。
  </p>

  <div class="callout callout-info">
    <div class="callout-title">適合的複雜度</div>
    <p>
      React 的 Concurrent Mode 解決了「大型應用中有大量元件需要更新」的問題。
      Lit 的設計前提是「精準更新少量動態部分」，從根本上避免了這個問題。
      不同的問題，不同的解法。
    </p>
  </div>
</section>

<section id="jsx-vs-tagged-templates">
  <h2>JSX vs Tagged Template Literals</h2>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>JSX（React）</h4>
      <ul>
        <li>需要 Babel/TypeScript 編譯器轉換</li>
        <li>產生 <code>React.createElement()</code> 調用</li>
        <li>編輯器支援良好（透過插件）</li>
        <li>屬性名稱有差異（<code>className</code>、<code>htmlFor</code>）</li>
        <li>可以嵌入任意 JavaScript 表達式</li>
        <li>型別檢查整合良好</li>
      </ul>
    </div>
    <div class="comparison-card">
      <h4>Tagged Template Literals（Lit）</h4>
      <ul>
        <li>純 JavaScript，不需要編譯步驟</li>
        <li>使用標準 HTML 屬性名稱</li>
        <li>需要 lit-plugin 獲得 IDE 支援</li>
        <li>可以直接在瀏覽器執行（ES Modules）</li>
        <li>靜態部分只解析一次，效能更好</li>
        <li>更接近真實 HTML</li>
      </ul>
    </div>
  </div>

  <pre data-lang="jsx"><code class="language-jsx">// React JSX
function List({ items, onDelete }) {
  return (
    &lt;ul className="list"&gt;
      {items.map(item =&gt; (
        &lt;li key={item.id} className={item.active ? 'active' : ''}&gt;
          {item.name}
          &lt;button onClick={() =&gt; onDelete(item.id)}&gt;刪除&lt;/button&gt;
        &lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// Lit Tagged Template
render() {
  return html\`
    &lt;ul class="list"&gt;
      \${this.items.map(item =&gt; html\`
        &lt;li class=\${item.active ? 'active' : ''}&gt;
          \${item.name}
          &lt;button @click=\${() =&gt; this._onDelete(item.id)}&gt;刪除&lt;/button&gt;
        &lt;/li&gt;
      \`)}
    &lt;/ul&gt;
  \`;
}</code></pre>
</section>

<section id="render-hijacking">
  <h2>Render Hijacking 與 Decorator 模式</h2>
  <p>
    「Render Hijacking」是 React HOC（Higher-Order Component）中的概念：
    包裹原始元件，攔截並修改其渲染輸出。
    在 Lit 中，雖然沒有直接等效的機制，
    但可以透過 <strong>Class Decorator</strong> 和 <strong>Mixin</strong> 達到類似效果。
  </p>

  <h3>Lit 中的 Mixin 模式</h3>
  <p>
    Mixin 是 Lit 最接近「Render Hijacking」的機制，
    允許你在不修改原始類別的情況下，擴展其行為。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 定義一個 Mixin 型別
type Constructor&lt;T = {}> = new (...args: any[]) =&gt; T;

// Logging Mixin：在每次渲染前後記錄日誌
function LoggingMixin&lt;TBase extends Constructor&lt;LitElement&gt;&gt;(Base: TBase) {
  return class extends Base {
    private _renderCount = 0;

    // 覆寫 performUpdate 是真正的「Render Hijacking」
    override async performUpdate() {
      this._renderCount++;
      console.group(\`[\${this.tagName}] 開始第 \${this._renderCount} 次渲染\`);
      console.time('render');
      await super.performUpdate();
      console.timeEnd('render');
      console.groupEnd();
    }
  };
}

// 效能監控 Mixin
function PerformanceMixin&lt;TBase extends Constructor&lt;LitElement&gt;&gt;(Base: TBase) {
  return class extends Base {
    private _renderTimes: number[] = [];

    override async performUpdate() {
      const start = performance.now();
      await super.performUpdate();
      const duration = performance.now() - start;
      this._renderTimes.push(duration);

      if (duration &gt; 16) {
        console.warn(
          \`[\${this.tagName}] 渲染耗時 \${duration.toFixed(2)}ms，超過一幀（16ms）\`
        );
      }
    }

    get averageRenderTime() {
      if (!this._renderTimes.length) return 0;
      return this._renderTimes.reduce((a, b) =&gt; a + b, 0) / this._renderTimes.length;
    }
  };
}

// 組合多個 Mixin
@customElement('monitored-list')
class MonitoredList extends PerformanceMixin(LoggingMixin(LitElement)) {
  @property({ type: Array }) items: Item[] = [];

  render() {
    return html\`\${this.items.map(i =&gt; html\`&lt;li&gt;\${i.name}&lt;/li&gt;\`)}\`;
  }
}</code></pre>

  <h3>Class Decorator 作為輕量級 AOP</h3>
  <p>
    TypeScript 5.0 的新版 Decorator 語法（不需要 <code>experimentalDecorators</code>）
    讓你可以在類別層面攔截行為。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 TC39 標準 Decorator（TypeScript 5.0+）
// 為元件自動加入載入狀態管理
function withLoadingState(target: typeof LitElement, context: ClassDecoratorContext) {
  return class extends target {
    @state() _globalLoading = false;

    // 覆寫 render，在載入狀態時顯示 overlay
    override render() {
      const originalContent = super.render();
      if (this._globalLoading) {
        return html\`
          &lt;div style="position: relative;"&gt;
            \${originalContent}
            &lt;div class="loading-overlay" aria-live="polite"&gt;
              &lt;div class="spinner"&gt;&lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        \`;
      }
      return originalContent;
    }

    // 注入輔助方法
    protected withLoading&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
      this._globalLoading = true;
      return fn().finally(() =&gt; { this._globalLoading = false; });
    }
  };
}

// 使用
@withLoadingState
@customElement('data-table')
class DataTable extends LitElement {
  @property({ type: Array }) data: Row[] = [];

  private async _fetchData() {
    // withLoading 來自 decorator 注入
    await (this as any).withLoading(async () =&gt; {
      this.data = await api.getData();
    });
  }

  render() {
    return html\`
      &lt;table&gt;\${this.data.map(row =&gt; html\`&lt;tr&gt;&lt;td&gt;\${row.name}&lt;/td&gt;&lt;/tr&gt;\`)}&lt;/table&gt;
    \`;
  }
}</code></pre>

  <h3>與 React HOC 的概念對比</h3>
  <table>
    <thead>
      <tr><th>React HOC</th><th>Lit 等效方案</th><th>適用場景</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>withAuth(Component)</code></td>
        <td>Mixin：<code>AuthMixin(Base)</code></td>
        <td>為元件加入認證檢查</td>
      </tr>
      <tr>
        <td><code>withLogger(Component)</code></td>
        <td>Class Decorator <code>@withLogger</code></td>
        <td>為元件加入日誌</td>
      </tr>
      <tr>
        <td><code>React.memo(Component)</code></td>
        <td>在 <code>shouldUpdate()</code> 中比較</td>
        <td>避免不必要的重新渲染</td>
      </tr>
      <tr>
        <td><code>React.forwardRef</code></td>
        <td>直接暴露 DOM 方法（Public API）</td>
        <td>讓父元件存取子元件的方法</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="slot-advanced">
  <h2>Slot 進階模式：named slots、slot assignment API</h2>

  <h3>基礎：Default Slot 與 Named Slots</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 卡片元件：多個 named slots 搭配 default content fallback
@customElement('info-card')
class InfoCard extends LitElement {
  static styles = css\`
    :host { display: block; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .header { padding: 16px; background: #f5f5f5; }
    .body { padding: 16px; }
    .footer { padding: 12px 16px; border-top: 1px solid #e0e0e0; font-size: 0.875rem; color: #666; }
  \`;

  render() {
    return html\`
      &lt;div class="header"&gt;
        &lt;!-- named slot，帶有 fallback 預設內容 --&gt;
        &lt;slot name="title"&gt;
          &lt;h3&gt;（無標題）&lt;/h3&gt;
        &lt;/slot&gt;
        &lt;slot name="subtitle"&gt;&lt;/slot&gt;
      &lt;/div&gt;
      &lt;div class="body"&gt;
        &lt;!-- default slot --&gt;
        &lt;slot&gt;
          &lt;p class="empty-state"&gt;此卡片尚無內容&lt;/p&gt;
        &lt;/slot&gt;
      &lt;/div&gt;
      &lt;div class="footer"&gt;
        &lt;slot name="actions"&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }
}

// 使用：可以選擇性地填入任意 slot
html\`
  &lt;info-card&gt;
    &lt;h2 slot="title"&gt;用戶統計&lt;/h2&gt;
    &lt;span slot="subtitle"&gt;過去 30 天&lt;/span&gt;
    &lt;p&gt;活躍用戶：1,234&lt;/p&gt;
    &lt;p&gt;新增用戶：89&lt;/p&gt;
    &lt;button slot="actions"&gt;查看詳情&lt;/button&gt;
  &lt;/info-card&gt;

  &lt;!-- 只填入部分 slot，其他使用 fallback 預設內容 --&gt;
  &lt;info-card&gt;
    &lt;p&gt;簡單內容，使用預設標題&lt;/p&gt;
  &lt;/info-card&gt;
\`</code></pre>

  <h3>slotchange 事件：響應 Slot 內容變化</h3>
  <p>
    當 Slot 中的內容改變時，<code>slotchange</code> 事件會被觸發。
    這讓元件可以感知並響應外部投影進來的內容變化。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('tab-group')
class TabGroup extends LitElement {
  @state() private _tabs: HTMLElement[] = [];
  @state() private _activeTab: string = '';

  firstUpdated() {
    // 取得預設 slot 的參考
    const slot = this.shadowRoot!.querySelector('slot') as HTMLSlotElement;

    // 監聽 slotchange 事件
    slot.addEventListener('slotchange', () =&gt; {
      this._updateTabs(slot);
    });

    // 初始化時也需要處理一次
    this._updateTabs(slot);
  }

  private _updateTabs(slot: HTMLSlotElement) {
    // assignedElements() 返回被投影到此 slot 的元素
    // { flatten: true } 展開巢狀的 slot
    const elements = slot.assignedElements({ flatten: true });
    this._tabs = elements.filter(
      el =&gt; el.tagName.toLowerCase() === 'tab-panel'
    ) as HTMLElement[];

    // 設定預設激活的 tab
    if (this._tabs.length &gt; 0 &amp;&amp; !this._activeTab) {
      this._activeTab = this._tabs[0].getAttribute('name') ?? '';
    }

    // 通知所有 tab-panel 哪個是激活狀態
    this._tabs.forEach(tab =&gt; {
      const name = tab.getAttribute('name') ?? '';
      (tab as any).active = (name === this._activeTab);
    });
  }

  render() {
    return html\`
      &lt;div class="tab-list" role="tablist"&gt;
        \${this._tabs.map(tab =&gt; {
          const name = tab.getAttribute('name') ?? '';
          const label = tab.getAttribute('label') ?? name;
          return html\`
            &lt;button
              role="tab"
              ?aria-selected=\${name === this._activeTab}
              @click=\${() =&gt; { this._activeTab = name; this._updateTabs(this.shadowRoot!.querySelector('slot') as HTMLSlotElement); }}
            &gt;\${label}&lt;/button&gt;
          \`;
        })}
      &lt;/div&gt;
      &lt;div class="tab-content"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>Declarative Shadow DOM 與 Slot Assignment API</h3>
  <p>
    瀏覽器現代版本支援 <code>element.assignedSlot</code> 和 <code>shadowRoot.getSlotted()</code>
    等 Slot Assignment API，讓你可以程式化地查詢 slot 分配狀態。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 查詢元素被分配到哪個 slot
const myElement = document.querySelector('[slot="title"]');
console.log(myElement?.assignedSlot);  // 返回對應的 &lt;slot&gt; 元素

// 在 Shadow DOM 內部查詢哪些元素被投影到特定 slot
@customElement('slot-aware')
class SlotAware extends LitElement {
  firstUpdated() {
    const titleSlot = this.shadowRoot!.querySelector('slot[name="title"]') as HTMLSlotElement;

    // assignedNodes() 返回包含文字節點的全部節點
    const allNodes = titleSlot.assignedNodes({ flatten: true });

    // assignedElements() 只返回元素節點（不含文字）
    const elements = titleSlot.assignedElements({ flatten: true });

    console.log('投影到 title slot 的元素：', elements);
  }

  render() {
    return html\`&lt;slot name="title"&gt;&lt;/slot&gt;\`;
  }
}

// 程式化的 Slot 指派（Imperative Slot Assignment）
// 需要在 Shadow Root 使用 { slotAssignment: 'manual' }
@customElement('virtual-scroller')
class VirtualScroller extends LitElement {
  @property({ type: Array }) items: Item[] = [];
  @state() private _visibleItems: Item[] = [];

  protected createRenderRoot() {
    // 使用手動 slot 指派模式
    return this.attachShadow({ mode: 'open', slotAssignment: 'manual' });
  }

  updated() {
    // 手動控制哪些子節點被顯示在 slot 中（虛擬捲動的基礎）
    const slot = this.shadowRoot!.querySelector('slot') as HTMLSlotElement;
    const childrenToShow = Array.from(this.children)
      .filter((_, i) =&gt; i &gt;= this._startIndex &amp;&amp; i &lt; this._endIndex);
    slot.assign(...childrenToShow);
  }

  private _startIndex = 0;
  private _endIndex = 20;

  render() {
    return html\`
      &lt;div class="viewport" @scroll=\${this._handleScroll}&gt;
        &lt;div class="spacer-top" style=\${styleMap({ height: \`\${this._startIndex * 48}px\` })}&gt;&lt;/div&gt;
        &lt;slot&gt;&lt;/slot&gt;
        &lt;div class="spacer-bottom"&gt;&lt;/div&gt;
      &lt;/div&gt;
    \`;
  }

  private _handleScroll(e: Event) {
    const viewport = e.target as HTMLElement;
    const scrollTop = viewport.scrollTop;
    this._startIndex = Math.floor(scrollTop / 48);
    this._endIndex = this._startIndex + 20;
    this.updated();
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Slot 的 CSS 樣式規則</div>
    <p>
      被投影到 Slot 的元素的樣式遵循以下規則：<br>
      1. 外部 CSS 可以樣式化被投影的元素（它們在 Light DOM 中，作用域是外部文件）<br>
      2. Shadow DOM 內部的 CSS 可以使用 <code>::slotted(selector)</code> 選取投影的元素<br>
      3. <code>::slotted()</code> 只能選取直接投影的子元素，無法選取更深層的後代
    </p>
  </div>
  <pre data-lang="css"><code class="language-css">/* 在 Shadow DOM 的 css\`...\` 中 */
/* 樣式化被投影的直接子元素 */
::slotted(p) {
  margin: 0;
  line-height: 1.6;
}

/* 樣式化有 class 的投影元素 */
::slotted(.highlight) {
  background: yellow;
}

/* 不能用：::slotted(p span) 無法選取投影元素的後代 */</code></pre>
</section>

<section id="custom-element-registry">
  <h2>Custom Element Registry 與作用域</h2>
  <p>
    預設情況下，所有使用 <code>customElements.define()</code> 定義的元素
    都在全域的 <code>CustomElementRegistry</code> 中共享，
    這在微前端和設計系統中會造成命名衝突問題。
  </p>

  <h3>全域 Registry 的問題</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 應用程式使用 v1.0.0 的設計系統
import 'design-system-v1/button'; // 定義了 &lt;ds-button&gt;

// 嘗試使用 v2.0.0（有破壞性變更）
import 'design-system-v2/button'; // 錯誤！&lt;ds-button&gt; 已被定義，無法重新定義

// 錯誤訊息：
// NotSupportedError: CustomElementRegistry: 'ds-button' already been defined as a custom element</code></pre>

  <h3>Scoped Custom Element Registries（提案中）</h3>
  <p>
    <a href="https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Scoped-Custom-Element-Registries.md" target="_blank" rel="noopener">Scoped Custom Element Registries</a>
    是 WICG 正在推進的提案，允許為特定的 Shadow Root 建立獨立的 Registry，
    解決全域命名衝突問題。目前（2024 年）Chrome 已實驗性支援。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 未來標準 API（目前需要 polyfill）
// https://github.com/webcomponents/polyfills/tree/master/packages/scoped-custom-element-registry

class MyApp extends HTMLElement {
  constructor() {
    super();
    // 建立一個獨立的 registry
    const registry = new CustomElementRegistry();

    // 在這個 registry 中定義元素（不影響全域）
    registry.define('my-button', class extends HTMLElement {
      connectedCallback() {
        this.innerHTML = '&lt;button&gt;v2 Button&lt;/button&gt;';
      }
    });

    // 將 Shadow Root 與特定 registry 關聯
    const shadowRoot = this.attachShadow({
      mode: 'open',
      // @ts-ignore：目前仍在提案階段
      registry,
    });

    shadowRoot.innerHTML = \`
      &lt;!-- 使用此 Shadow Root 的 registry 中定義的 my-button --&gt;
      &lt;my-button&gt;&lt;/my-button&gt;
    \`;
  }
}

customElements.define('my-app', MyApp);</code></pre>

  <h3>Lit 中使用 Scoped Registry（透過 @lit-labs/scoped-registry-mixin）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 安裝：npm install @lit-labs/scoped-registry-mixin
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';

// 本地版本的 Button（不需要全域 define）
class LocalButton extends LitElement {
  render() { return html\`&lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;\`; }
}

// 在元件的 scoped registry 中定義局部元素
@customElement('my-widget')
class MyWidget extends ScopedRegistryHost(LitElement) {
  // 定義只在這個元件 Shadow Root 內可用的元素
  static elementDefinitions = {
    'local-button': LocalButton, // 不是全域的 'my-button'
  };

  render() {
    return html\`
      &lt;!-- 使用 scoped 的 local-button，不與全域衝突 --&gt;
      &lt;local-button&gt;點擊&lt;/local-button&gt;
    \`;
  }
}

// 好處：
// 1. 不同版本的元件可以共存（微前端場景）
// 2. 設計系統可以安全更新，不破壞使用舊版的應用
// 3. 更清晰的依賴關係（元素的使用者明確宣告依賴）</code></pre>

  <h3>命名策略：避免衝突的實用建議</h3>
  <div class="callout callout-tip">
    <div class="callout-title">在 Scoped Registry 普及之前的緩解策略</div>
    <ul>
      <li>
        <strong>使用組織前綴</strong>：<code>acme-button</code>、<code>mds-input</code>（mds = my design system）
      </li>
      <li>
        <strong>避免過於通用的名稱</strong>：<code>button</code>、<code>input</code>、<code>modal</code> 等容易衝突
      </li>
      <li>
        <strong>提供自訂前綴選項</strong>：設計系統可以讓消費者設定前綴，例如 <code>defineComponents({ prefix: 'my' })</code>
      </li>
      <li>
        <strong>使用 <code>customElements.get()</code> 做檢查</strong>：在定義前先確認是否已定義，避免報錯
      </li>
    </ul>
  </div>
  <pre data-lang="typescript"><code class="language-typescript">// 安全的 define 模式：如果已定義則跳過
function safeDefine(name: string, constructor: CustomElementConstructor) {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  } else {
    console.warn(\`Custom element '\${name}' already defined. Skipping.\`);
  }
}

// 支援自訂前綴的設計系統
export function defineComponents(options: { prefix?: string } = {}) {
  const prefix = options.prefix ?? 'ds';
  safeDefine(\`\${prefix}-button\`, ButtonElement);
  safeDefine(\`\${prefix}-input\`, InputElement);
  safeDefine(\`\${prefix}-dialog\`, DialogElement);
}

// 使用者可以選擇自己的前綴
defineComponents({ prefix: 'acme' }); // 定義 acme-button、acme-input 等</code></pre>

  <h3>伺服器端渲染（SSR）中的 Registry 考量</h3>
  <p>
    在 Node.js SSR 環境中（使用 <code>@lit-labs/ssr</code>），
    Custom Element Registry 的行為與瀏覽器端有所不同：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// @lit-labs/ssr 中的 Registry 使用
import { render } from '@lit-labs/ssr';
import { html } from 'lit';

// SSR 環境需要確保元件在 import 時完成 define
import './components/my-button.js'; // 自動執行 customElements.define()

// 渲染
const result = render(html\`&lt;my-button&gt;Hello&lt;/my-button&gt;\`);
for (const chunk of result) {
  process.stdout.write(chunk);
}
// 輸出：
// &lt;my-button&gt;
//   &lt;template shadowroot="open"&gt;&lt;button&gt;Hello&lt;/button&gt;&lt;/template&gt;
// &lt;/my-button&gt;</code></pre>
</section>

<section id="migration-mental-model">
  <h2>React 開發者遷移 Lit 的心智模型轉換</h2>
  <p>
    從 React 遷移到 Lit 時，最大的挑戰不是語法，
    而是<strong>思維方式的轉換</strong>。
    以下是系統性的對照指南。
  </p>

  <h3>狀態管理</h3>
  <table>
    <thead>
      <tr><th>React</th><th>Lit 等效</th><th>說明</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>useState()</code></td>
        <td><code>@state() private _value = ...</code></td>
        <td>內部狀態，改變觸發重新渲染</td>
      </tr>
      <tr>
        <td><code>props.value</code></td>
        <td><code>@property() value = ...</code></td>
        <td>外部傳入的屬性，可 reflect 到 attribute</td>
      </tr>
      <tr>
        <td><code>useReducer()</code></td>
        <td>在類別方法中手動管理，或搭配 Zustand</td>
        <td>複雜狀態邏輯</td>
      </tr>
      <tr>
        <td><code>useRef()</code></td>
        <td><code>@query('#selector') el!: HTMLElement</code></td>
        <td>存取 Shadow DOM 內的元素</td>
      </tr>
      <tr>
        <td><code>useMemo()</code></td>
        <td>getter 方法（天然 lazy）</td>
        <td>衍生計算值</td>
      </tr>
      <tr>
        <td><code>useCallback()</code></td>
        <td>類別方法（參考穩定）</td>
        <td>事件處理函數</td>
      </tr>
    </tbody>
  </table>

  <h3>In React you'd do X, in Lit you do Y</h3>

  <h4>條件渲染</h4>
  <pre data-lang="jsx"><code class="language-jsx">// React：短路運算子 &amp;&amp; 或三元運算子
function Component({ isLoggedIn, user }) {
  return (
    &lt;div&gt;
      {isLoggedIn &amp;&amp; &lt;p&gt;歡迎, {user.name}!&lt;/p&gt;}
      {isLoggedIn ? &lt;LogoutBtn /&gt; : &lt;LoginBtn /&gt;}
    &lt;/div&gt;
  );
}</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">// Lit：完全相同的語法，在 html\`...\` 中使用
render() {
  return html\`
    &lt;div&gt;
      \${this.isLoggedIn ? html\`&lt;p&gt;歡迎, \${this.user?.name}!&lt;/p&gt;\` : ''}
      \${this.isLoggedIn ? html\`&lt;logout-btn&gt;&lt;/logout-btn&gt;\` : html\`&lt;login-btn&gt;&lt;/login-btn&gt;\`}
    &lt;/div&gt;
  \`;
}</code></pre>

  <h4>列表渲染</h4>
  <pre data-lang="jsx"><code class="language-jsx">// React：需要 key prop
function List({ items }) {
  return (
    &lt;ul&gt;
      {items.map(item =&gt; (
        &lt;li key={item.id}&gt;{item.name}&lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">// Lit：不需要 key（但可以用 repeat() 優化重排）
render() {
  return html\`
    &lt;ul&gt;
      \${this.items.map(item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`)}
    &lt;/ul&gt;
  \`;
}

// 需要重排優化時，用 repeat() 的第二個參數作為 key
import { repeat } from 'lit/directives/repeat.js';
render() {
  return html\`
    &lt;ul&gt;
      \${repeat(this.items, item =&gt; item.id, item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`)}
    &lt;/ul&gt;
  \`;
}</code></pre>

  <h4>副作用</h4>
  <pre data-lang="jsx"><code class="language-jsx">// React：useEffect 管理副作用
function Component({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() =&gt; {
    fetchUser(userId).then(setUser);
    return () =&gt; { /* cleanup */ };
  }, [userId]);

  return &lt;div&gt;{user?.name}&lt;/div&gt;;
}</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">// Lit：使用 updated() 生命週期或 Reactive Controller
@customElement('user-component')
class UserComponent extends LitElement {
  @property({ type: String }) userId = '';
  @state() private _user: User | null = null;

  // 相當於 useEffect([userId]) — 在 userId 改變後執行
  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('userId')) {
      this._fetchUser(this.userId);
    }
  }

  private async _fetchUser(id: string) {
    this._user = await fetchUser(id);
  }

  render() {
    return html\`&lt;div&gt;\${this._user?.name}&lt;/div&gt;\`;
  }
}</code></pre>

  <h4>元件組合 vs Slots</h4>
  <pre data-lang="jsx"><code class="language-jsx">// React：透過 children prop 實現組合
function Card({ children, title }) {
  return (
    &lt;div className="card"&gt;
      &lt;h2&gt;{title}&lt;/h2&gt;
      &lt;div className="body"&gt;{children}&lt;/div&gt;
    &lt;/div&gt;
  );
}

// 使用
&lt;Card title="Hello"&gt;
  &lt;p&gt;Card content&lt;/p&gt;
&lt;/Card&gt;</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">// Lit：透過 Slots 實現組合
@customElement('my-card')
class MyCard extends LitElement {
  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;h2&gt;&lt;slot name="title"&gt;&lt;/slot&gt;&lt;/h2&gt;
        &lt;div class="body"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}

// 使用
html\`
  &lt;my-card&gt;
    &lt;span slot="title"&gt;Hello&lt;/span&gt;
    &lt;p&gt;Card content&lt;/p&gt;
  &lt;/my-card&gt;
\`</code></pre>

  <h4>Context（跨層級共享狀態）</h4>
  <pre data-lang="jsx"><code class="language-jsx">// React：createContext + useContext
const ThemeContext = createContext('light');

function App() {
  return (
    &lt;ThemeContext.Provider value="dark"&gt;
      &lt;DeepChild /&gt;
    &lt;/ThemeContext.Provider&gt;
  );
}

function DeepChild() {
  const theme = useContext(ThemeContext);
  return &lt;div className={theme}&gt;...&lt;/div&gt;;
}</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">// Lit：@lit/context
export const themeContext = createContext&lt;'light' | 'dark'&gt;('theme');

@customElement('app-root')
class App extends LitElement {
  @provide({ context: themeContext })
  @state() theme: 'light' | 'dark' = 'dark';

  render() { return html\`&lt;deep-child&gt;&lt;/deep-child&gt;\`; }
}

@customElement('deep-child')
class DeepChild extends LitElement {
  @consume({ context: themeContext, subscribe: true })
  theme: 'light' | 'dark' = 'light';

  render() { return html\`&lt;div class=\${this.theme}&gt;...&lt;/div&gt;\`; }
}</code></pre>

  <h3>生命週期對照表</h3>
  <table>
    <thead>
      <tr><th>React 生命週期</th><th>Lit 等效</th><th>說明</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>useEffect(() =&gt; {}, [])</code></td>
        <td><code>firstUpdated()</code></td>
        <td>只在第一次渲染後執行</td>
      </tr>
      <tr>
        <td><code>useEffect(() =&gt; {}, [dep])</code></td>
        <td><code>updated(changedProps)</code></td>
        <td>在特定 prop 改變後執行</td>
      </tr>
      <tr>
        <td><code>useEffect(() =&gt; () =&gt; cleanup())</code></td>
        <td><code>disconnectedCallback()</code></td>
        <td>清理副作用</td>
      </tr>
      <tr>
        <td><code>componentDidMount</code>（Class）</td>
        <td><code>connectedCallback()</code></td>
        <td>元素連接到 DOM</td>
      </tr>
      <tr>
        <td><code>componentWillUnmount</code>（Class）</td>
        <td><code>disconnectedCallback()</code></td>
        <td>元素從 DOM 移除</td>
      </tr>
      <tr>
        <td><code>shouldComponentUpdate</code>（Class）</td>
        <td><code>shouldUpdate(changedProps)</code></td>
        <td>決定是否重新渲染</td>
      </tr>
      <tr>
        <td><code>getSnapshotBeforeUpdate</code>（Class）</td>
        <td><code>willUpdate(changedProps)</code></td>
        <td>更新前讀取 DOM 狀態（同步）</td>
      </tr>
    </tbody>
  </table>

  <h3>SSR（伺服器端渲染）心智模型差異</h3>
  <p>
    React 的 SSR（<code>renderToString</code> / <code>renderToPipeableStream</code>）
    和 Lit 的 SSR（<code>@lit-labs/ssr</code>）在心智模型上有重要差異：
  </p>
  <table>
    <thead>
      <tr><th>面向</th><th>React SSR</th><th>Lit SSR</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>輸出格式</td>
        <td>純 HTML 字串（無 Shadow DOM）</td>
        <td>含 Declarative Shadow DOM 的 HTML</td>
      </tr>
      <tr>
        <td>Hydration</td>
        <td>需要 React 運行時重新接管 DOM</td>
        <td>瀏覽器原生解析 DSD，輕量 hydration</td>
      </tr>
      <tr>
        <td>CSS</td>
        <td>需要 CSS-in-JS SSR 支援</td>
        <td>Shadow DOM 的 <code>&lt;style&gt;</code> 直接包含在 HTML 中</td>
      </tr>
      <tr>
        <td>狀態序列化</td>
        <td>需要 Dehydrate/Rehydrate（如 React Query）</td>
        <td>透過 Attribute 傳遞初始值（標準 HTML）</td>
      </tr>
    </tbody>
  </table>
  <pre data-lang="typescript"><code class="language-typescript">// Lit SSR 輸出範例
// 輸入：html\`&lt;my-button variant="primary"&gt;送出&lt;/my-button&gt;\`
// 輸出：
// &lt;my-button variant="primary"&gt;
//   &lt;template shadowrootmode="open"&gt;
//     &lt;style&gt;button { background: blue; }&lt;/style&gt;
//     &lt;button class="primary"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;
//   &lt;/template&gt;
//   送出
// &lt;/my-button&gt;

// Declarative Shadow DOM 讓瀏覽器在解析 HTML 時即建立 Shadow Root
// 不需要等待 JavaScript 執行，實現真正的「零 JS」初始渲染</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">遷移節奏建議</div>
    <p>
      從 React 遷移到 Lit 最有效的方式是「由葉到根」：
      先將 UI 元件庫（Button、Input、Card 等）改寫為 Lit Custom Elements，
      這些元件可以在 React 應用中直接使用（React 18 對 Custom Elements 的支援已成熟）。
      逐步替換後，再考慮移除 React 框架層。
      這個策略讓你可以在不中斷現有開發的情況下，
      漸進式地獲得 Custom Elements 的好處（框架無關、永久相容）。
    </p>
  </div>
</section>
`,
};
