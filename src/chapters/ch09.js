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

  <h3>composed: true 的必要性</h3>
  <p>
    自訂事件預設不穿越 Shadow DOM 邊界（<code>composed: false</code>）。
    必須明確設定 <code>composed: true</code>：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// ✗ 這個事件不會離開 Shadow DOM
this.dispatchEvent(new CustomEvent('my-event', {
  bubbles: true,
  // composed 預設為 false
}));

// ✓ 這個事件會穿越 Shadow DOM 邊界
this.dispatchEvent(new CustomEvent('my-event', {
  bubbles: true,
  composed: true,
  detail: { data: 'value' },
}));</code></pre>
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
`,
};
