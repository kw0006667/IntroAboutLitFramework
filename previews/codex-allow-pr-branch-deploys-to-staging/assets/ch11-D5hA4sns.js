const t={id:11,slug:"chapter-11",title:"效能剖析：Virtual DOM vs. Lit 的 Fine-grained Updates",part:3,intro:"用 Chrome DevTools 和 Benchmark 數據說話，分析兩者在大量列表、高頻更新場景下的實際差異。",sections:[{slug:"vdom-explained",title:"Virtual DOM 的運作原理"},{slug:"lit-fine-grained",title:"Lit 的精細更新策略"},{slug:"benchmark-methodology",title:"Benchmark 方法論"},{slug:"list-rendering-perf",title:"大量列表渲染比較"},{slug:"high-frequency-updates",title:"高頻更新場景分析"},{slug:"devtools-profiling",title:"Chrome DevTools 效能分析實戰"}],content:`
<section id="vdom-explained">
  <h2>Virtual DOM 的運作原理</h2>
  <p>
    Virtual DOM（虛擬 DOM）是 React 最著名的技術特性，也是最常被誤解的一個。
    它解決了 2013 年的一個真實問題，但在 2024 年的脈絡下，其優勢需要重新審視。
  </p>

  <h3>Virtual DOM 的工作流</h3>
  <ol>
    <li>
      <strong>建立 VDOM 樹</strong>：每次 <code>render()</code> 都建立一個完整的
      JavaScript 物件樹（VDOM），描述 UI 的當前狀態。
    </li>
    <li>
      <strong>Diff 算法</strong>：將新 VDOM 樹與上次的 VDOM 樹比較，
      找出「最小差異集」。React 的 diff 算法是 O(n)，
      有若干啟發式規則（同層比較、key 追蹤等）。
    </li>
    <li>
      <strong>協調（Reconciliation）</strong>：將差異應用到真實 DOM。
      只有確實改變的 DOM 節點會被更新。
    </li>
  </ol>

  <h3>Virtual DOM 的成本</h3>
  <p>
    即使最終 DOM 沒有改變，VDOM diff 仍然需要：
  </p>
  <ul>
    <li>建立新的 VDOM 物件樹（記憶體分配 + GC 壓力）</li>
    <li>遍歷兩棵樹做比較（CPU 時間）</li>
    <li>即使結果是「沒有差異」，這個成本仍然存在</li>
  </ul>

  <p>
    對於大型應用，React 18 的 Concurrent Mode 和 <code>useMemo</code>/<code>React.memo</code>
    是解決這個問題的工具。但它們增加了開發複雜度。
  </p>
</section>

<section id="lit-fine-grained">
  <h2>Lit 的精細更新策略</h2>
  <p>
    Lit 跳過了「先建立 VDOM 再 diff」的步驟，
    直接追蹤哪些 DOM 節點需要更新。
  </p>

  <h3>關鍵差異：靜態與動態的分離</h3>
  <p>
    Tagged Template Literals 讓 Lit 在<strong>模板定義時</strong>就知道哪些部分是靜態的，
    哪些是動態的。這個信息在編譯期（或首次執行時）確定，不需要每次渲染重新計算。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 的模板：靜態部分（✓）和動態部分（★）清晰分離
render() {
  return html\`
    &lt;!-- ✓ 靜態：永遠不需要更新 --&gt;
    &lt;div class="card"&gt;
      &lt;header&gt;
        &lt;h2&gt;用戶資訊&lt;/h2&gt;  &lt;!-- ✓ 靜態 --&gt;
      &lt;/header&gt;
      &lt;div class="body"&gt;
        &lt;!-- ★ 動態：可能改變 --&gt;
        &lt;span class=\${this.statusClass}&gt;
          \${this.userName}  &lt;!-- ★ 動態 --&gt;
        &lt;/span&gt;
        &lt;!-- ✓ 靜態 --&gt;
        &lt;p&gt;會員等級：&lt;strong&gt;\${this.tier}&lt;/strong&gt;&lt;/p&gt;  &lt;!-- ★ 動態 --&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  \`;
  // 只有 3 個 Part 需要在更新時比較，而不是整個 DOM 樹
}</code></pre>
</section>

<section id="benchmark-methodology">
  <h2>Benchmark 方法論</h2>
  <p>
    效能比較需要謹慎：不同的 Benchmark 測試不同的東西，
    脫離場景的數字可能具有誤導性。
  </p>

  <h3>著名的 js-framework-benchmark</h3>
  <p>
    <a href="https://krausest.github.io/js-framework-benchmark/" target="_blank">
    js-framework-benchmark</a> 是最廣泛使用的前端框架效能基準測試，
    包含以下測試場景：
  </p>
  <ul>
    <li><strong>建立 1000 行</strong>：初始渲染效能</li>
    <li><strong>更新 1000 行中的每 10 行</strong>：部分更新</li>
    <li><strong>選中一行</strong>：單點互動</li>
    <li><strong>交換兩行</strong>：重排</li>
    <li><strong>移除一行</strong>：刪除</li>
    <li><strong>建立 10000 行</strong>：大量初始渲染</li>
    <li><strong>追加 1000 行</strong>：增量添加</li>
    <li><strong>清空 1000 行</strong>：批量刪除</li>
    <li><strong>記憶體使用</strong>：1000/10000 行的記憶體占用</li>
    <li><strong>啟動時間</strong>：首次載入到可互動的時間</li>
  </ul>

  <h3>解讀數字的注意事項</h3>
  <div class="callout callout-warning">
    <div class="callout-title">Benchmark 的局限性</div>
    <p>
      Benchmark 數字反映特定測試場景，不代表真實應用效能。
      在 1000 行列表的 Benchmark 中，Lit 可能比 React 快 30%，
      但如果你的應用瓶頸在 API 呼叫或業務邏輯，這 30% 完全不重要。
      選擇技術棧應基於你的實際瓶頸，而非 Benchmark 排名。
    </p>
  </div>
</section>

<section id="list-rendering-perf">
  <h2>大量列表渲染比較</h2>

  <h3>初始渲染（1000 行）</h3>
  <p>
    在 js-framework-benchmark 的典型結果中（數字僅供參考，實際會隨版本變化）：
  </p>
  <table>
    <thead>
      <tr><th>框架</th><th>建立 1000 行（ms）</th><th>記憶體（MB）</th></tr>
    </thead>
    <tbody>
      <tr><td>Vanilla JS（基準）</td><td>~50ms</td><td>~3MB</td></tr>
      <tr><td>Lit</td><td>~60ms</td><td>~4MB</td></tr>
      <tr><td>Svelte</td><td>~65ms</td><td>~4MB</td></tr>
      <tr><td>Solid.js</td><td>~55ms</td><td>~3MB</td></tr>
      <tr><td>Vue 3</td><td>~80ms</td><td>~5MB</td></tr>
      <tr><td>React 18</td><td>~100ms</td><td>~7MB</td></tr>
      <tr><td>Angular 17</td><td>~120ms</td><td>~9MB</td></tr>
    </tbody>
  </table>
  <p>
    Lit 在初始渲染上接近 Vanilla JS 基準，明顯優於 React 和 Angular。
    但要注意：這些差距在真實應用中通常被 API 延遲所掩蓋。
  </p>

  <h3>局部更新的優勢</h3>
  <p>
    Lit 真正的優勢在「更新 1000 行中的每 10 行」這個場景：
    Lit 的 Part 系統只更新確實改變的 10 行，
    而 React 需要 diff 所有 1000 行的 VDOM。
  </p>
</section>

<section id="high-frequency-updates">
  <h2>高頻更新場景分析</h2>
  <p>
    高頻更新（如實時資料儀表板、遊戲 UI、滑鼠追蹤）是最能體現框架效能差異的場景。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// Lit 處理高頻更新的範例：滑鼠位置追蹤
@customElement('mouse-tracker')
class MouseTracker extends LitElement {
  @state() private _x = 0;
  @state() private _y = 0;

  connectedCallback() {
    super.connectedCallback();
    // 每次滑鼠移動都更新
    window.addEventListener('mousemove', this._onMouseMove);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  private _onMouseMove = (e: MouseEvent) =&gt; {
    this._x = e.clientX;
    this._y = e.clientY;
    // Lit 批次多個快速連續的更新為一次渲染
  };

  render() {
    // 只有座標數字的 Part 需要更新
    return html\`
      &lt;div class="tracker"&gt;
        位置：(\${this._x}, \${this._y})
        &lt;div class="cursor" style="left: \${this._x}px; top: \${this._y}px"&gt;&lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>Microtask 批次的保護</h3>
  <p>
    即使 <code>mousemove</code> 每秒觸發數百次，
    Lit 的 Microtask 排程確保只有在當前 JavaScript 執行完成後才渲染，
    多個快速連續的狀態更新會被批次為一次渲染。
    這防止了「因為更新太頻繁而阻塞主執行緒」的問題。
  </p>
</section>

<section id="devtools-profiling">
  <h2>Chrome DevTools 效能分析實戰</h2>

  <h3>Performance 面板錄製步驟</h3>
  <ol>
    <li>打開 Chrome DevTools → Performance 面板</li>
    <li>點擊「錄製」按鈕</li>
    <li>執行你想分析的操作（例如：點擊按鈕、滾動列表）</li>
    <li>停止錄製</li>
    <li>分析 Flame Chart</li>
  </ol>

  <h3>關鍵指標解讀</h3>
  <ul>
    <li>
      <strong>Long Tasks（長任務）</strong>：超過 50ms 的 JavaScript 執行，
      會阻塞主執行緒，導致頁面卡頓
    </li>
    <li>
      <strong>Layout（版面配置）</strong>：「版面配置抖動」（Layout Thrashing）
      是常見效能問題，由交替讀寫 DOM 屬性造成
    </li>
    <li>
      <strong>Paint（繪製）</strong>：觀察哪些 DOM 區域被重繪
    </li>
    <li>
      <strong>Composite（合成）</strong>：使用 CSS transform/opacity 可以只觸發合成，
      跳過 Layout 和 Paint
    </li>
  </ul>

  <h3>Lit 友好的效能最佳化技巧</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 1. 使用 repeat() 代替 map() 處理頻繁重排的列表
\${repeat(this.sortedItems, item =&gt; item.id, item =&gt; html\`...\`)}

// 2. 使用 guard() 跳過昂貴計算
\${guard([this.expensiveData], () =&gt; expensiveRender(this.expensiveData))}

// 3. CSS transform 代替 top/left 觸發 Composite 而非 Layout
// ✗ 觸發 Layout
style="top: \${this.y}px; left: \${this.x}px"
// ✓ 只觸發 Composite
style="transform: translate(\${this.x}px, \${this.y}px)"

// 4. 避免在 render() 中建立新物件（每次都是新參考，觸發不必要更新）
// ✗ 每次渲染都建立新陣列
render() {
  return html\`&lt;my-chart .data=\${[...this.items]}&gt;\`;  // 新參考！
}
// ✓ 在 willUpdate 中計算，只在依賴改變時更新
willUpdate(changed) {
  if (changed.has('items')) this._chartData = [...this.items];
}
render() {
  return html\`&lt;my-chart .data=\${this._chartData}&gt;\`;
}</code></pre>
</section>
`};export{t as default};
