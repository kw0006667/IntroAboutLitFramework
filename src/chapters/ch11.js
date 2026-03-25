export default {
  id: 11,
  slug: 'chapter-11',
  title: '效能剖析：Virtual DOM vs. Lit 的 Fine-grained Updates',
  part: 3,
  intro: '用 Chrome DevTools 和 Benchmark 數據說話，分析兩者在大量列表、高頻更新場景下的實際差異。深入記憶體洩漏分析、hasChanged 優化、Shadow DOM 效能特性、Core Web Vitals 優化，以及生產環境效能清單。',
  sections: [
    { slug: 'vdom-explained', title: 'Virtual DOM 的運作原理' },
    { slug: 'lit-fine-grained', title: 'Lit 的精細更新策略' },
    { slug: 'benchmark-methodology', title: 'Benchmark 方法論' },
    { slug: 'list-rendering-perf', title: '大量列表渲染比較' },
    { slug: 'high-frequency-updates', title: '高頻更新場景分析' },
    { slug: 'memory-profiling', title: '記憶體分析：如何找出 Lit 元件的洩漏' },
    { slug: 'rendering-performance-advanced', title: '渲染效能進階：避免不必要的更新' },
    { slug: 'lighthouse-web-vitals', title: 'Lighthouse 與 Core Web Vitals 優化' },
    { slug: 'devtools-profiling', title: 'Chrome DevTools 效能分析實戰' },
  ],
  content: `
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

  <h3>React Concurrent Mode 的調度機制</h3>
  <p>
    React 18 的 Concurrent Mode 引入了<strong>可中斷渲染</strong>（Interruptible Rendering）。
    長時間的渲染任務可以被中斷，讓瀏覽器優先處理更緊急的使用者輸入：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// React：Concurrent Mode 的優先級控制
import { startTransition, useDeferredValue } from 'react';

function SearchResults({ query }: { query: string }) {
  // 降低優先級：這個計算可以在低優先級佇列中執行
  const deferredQuery = useDeferredValue(query);
  const results = expensiveSearch(deferredQuery);

  return &lt;ResultsList results={results} /&gt;;
}

// 標記為低優先級轉換
function handleInput(value: string) {
  // 緊急：立刻更新輸入框
  setInputValue(value);

  // 非緊急：可中斷的結果更新
  startTransition(() =&gt; {
    setSearchQuery(value);
  });
}</code></pre>

  <p>
    Lit 沒有 Concurrent Mode，但 Lit 的 microtask 批次排程（非 requestAnimationFrame）
    讓大多數場景已足夠，且更可預測。
    Concurrent Mode 解決的問題（長任務阻塞輸入）在 Lit 中通常不會出現，
    因為 Lit 的更新範圍本來就更小。
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

  <h3>Shadow DOM 的樣式計算隔離優勢</h3>
  <p>
    Shadow DOM 不只是樣式封裝，它對效能也有正面影響：
  </p>
  <ul>
    <li>
      <strong>Style Recalculation 範圍縮小</strong>：
      全域 CSS 改變不會觸發 Shadow DOM 內部的樣式重計算。
      大型應用中，一個頂層 class 改變可能觸發數百個元素的樣式重算，
      Shadow DOM 隔離了這個連鎖反應。
    </li>
    <li>
      <strong>CSS 採用樣式表（Adopted Stylesheets）</strong>：
      Lit 使用 <code>CSSStyleSheet</code> API，同一個樣式表在多個 Shadow Root 之間共享，
      不會為每個元件複製一份 CSS 字串。
    </li>
  </ul>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 的 Adopted StyleSheets：共享樣式表，零複製
import { css, CSSResult } from 'lit';

// 這個樣式表在所有 MyButton 實例之間共享（記憶體中只有一份）
const sharedButtonStyles: CSSResult = css\`
  :host {
    display: inline-flex;
    contain: layout style;  /* contain 屬性進一步隔離效能影響範圍 */
  }
  button {
    padding: 8px 16px;
    border-radius: 4px;
  }
\`;

@customElement('my-button')
class MyButton extends LitElement {
  static styles = [sharedButtonStyles]; // 共享，非複製
}

// CSS contain 屬性：效能優化的重要工具
// layout：元件的版面配置不影響外部
// style：元件的計數器不影響外部
// paint：元件超出邊界的內容不繪製
// strict：等於 layout + style + paint + size
// 大多數自訂元素適合使用 contain: layout style</code></pre>

  <h3>Lit 內部調度：Microtask 批次</h3>
  <p>
    Lit 使用 <code>Promise.resolve()</code>（microtask）而非 <code>requestAnimationFrame</code>
    來批次渲染更新。這有重要的效能含義：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('batch-demo')
class BatchDemo extends LitElement {
  @state() a = 0;
  @state() b = 0;
  @state() c = 0;

  private _updateAll() {
    // 三次同步賦值，但只觸發一次渲染
    this.a = 1;   // 排程 microtask 更新
    this.b = 2;   // 已有排程中，不重複排程
    this.c = 3;   // 已有排程中，不重複排程
    // 當前 JS 執行完畢後，microtask 執行，只渲染一次
  }

  // 對比 React：useState 的批次更新
  // React 18 已自動批次所有事件處理中的更新
  // 但 React 的批次是在 React 事件系統內，
  // 非同步操作（setTimeout、原生事件）需要 flushSync

  // 等待 Lit 完成更新
  private async _waitForUpdate() {
    this.a = 1;
    await this.updateComplete;  // 等待目前排程的更新完成
    console.log('渲染完成，可以讀取 DOM');
    const span = this.shadowRoot!.querySelector('span');
    // span 現在反映最新狀態
  }
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
    return html\`
      &lt;div class="tracker"&gt;
        位置：(\${this._x}, \${this._y})
        &lt;div class="cursor" style="transform: translate(\${this._x}px, \${this._y}px)"&gt;&lt;/div&gt;
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

<section id="memory-profiling">
  <h2>記憶體分析：如何找出 Lit 元件的洩漏</h2>
  <p>
    Web Components 有幾個常見的記憶體洩漏模式。
    了解如何使用 Chrome Memory 面板診斷和修復這些問題是進階開發的必備技能。
  </p>

  <h3>常見記憶體洩漏來源</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ❌ 洩漏模式 1：未清理的全域事件監聽器
@customElement('leaky-component-1')
class LeakyComponent1 extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // 元件移除後，這個監聽器仍然存在
    // 且持有 this 的參考，導致元件無法被 GC
    window.addEventListener('resize', () =&gt; {
      this._handleResize();   // this 的閉包！
    });
  }
  // disconnectedCallback 沒有移除監聽器
}

// ✓ 修復方式：儲存參考，在 disconnectedCallback 移除
@customElement('clean-component-1')
class CleanComponent1 extends LitElement {
  // 儲存為類別屬性，確保是同一個函數參考
  private _handleResize = () =&gt; {
    // 處理 resize
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
  }
}

// ❌ 洩漏模式 2：未清理的 setInterval / setTimeout
@customElement('leaky-component-2')
class LeakyComponent2 extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    setInterval(() =&gt; {
      this._fetchLatestData();  // 元件移除後仍然每秒執行
    }, 1000);
  }
}

// ✓ 修復：儲存 ID 並在 disconnectedCallback 清理
@customElement('clean-component-2')
class CleanComponent2 extends LitElement {
  private _intervalId?: ReturnType&lt;typeof setInterval&gt;;

  connectedCallback() {
    super.connectedCallback();
    this._intervalId = setInterval(() =&gt; {
      this._fetchLatestData();
    }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._intervalId !== undefined) {
      clearInterval(this._intervalId);
    }
  }
}

// ❌ 洩漏模式 3：IntersectionObserver / ResizeObserver 未斷開
@customElement('leaky-component-3')
class LeakyComponent3 extends LitElement {
  firstUpdated() {
    new IntersectionObserver((entries) =&gt; {
      // entries[0].isIntersecting
    }).observe(this);
    // observe 建立了對 this 的強參考，但從未 disconnect
  }
}

// ✓ 修復：儲存 Observer，在 disconnectedCallback 斷開
@customElement('clean-component-3')
class CleanComponent3 extends LitElement {
  private _observer?: IntersectionObserver;

  firstUpdated() {
    this._observer = new IntersectionObserver((entries) =&gt; {
      this._onVisibilityChange(entries[0].isIntersecting);
    });
    this._observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }
}

// ✓ 最佳實踐：使用 ReactiveController 封裝生命週期清理
class IntersectionController implements ReactiveController {
  isIntersecting = false;
  private _observer?: IntersectionObserver;

  constructor(
    private host: ReactiveControllerHost &amp; Element,
    private options?: IntersectionObserverInit,
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._observer = new IntersectionObserver(
      ([entry]) =&gt; {
        this.isIntersecting = entry.isIntersecting;
        this.host.requestUpdate();
      },
      this.options
    );
    // host 已連接到 DOM，可以觀察
    if (this.host.isConnected) {
      this._observer.observe(this.host);
    }
  }

  hostDisconnected() {
    this._observer?.disconnect();
  }
}</code></pre>

  <h3>Chrome Memory 面板使用步驟</h3>
  <ol>
    <li>打開 DevTools → Memory 面板</li>
    <li>選擇 <strong>Heap Snapshot</strong>，拍攝基準快照（Snapshot 1）</li>
    <li>執行「建立並移除元件」的操作若干次（例如：打開/關閉 Modal 10 次）</li>
    <li>點選 <strong>Collect garbage</strong> 圖示（強制 GC）</li>
    <li>再次拍攝快照（Snapshot 2）</li>
    <li>在 Snapshot 2 中，選擇 <strong>Comparison</strong> 視圖，與 Snapshot 1 比較</li>
    <li>篩選 <code>#Delta</code>（新增數量）：如果有你的元件類別名稱殘留，說明有洩漏</li>
  </ol>

  <pre data-lang="typescript"><code class="language-typescript">// 輔助工具：追蹤元件實例數量（開發模式用）
const componentRegistry = new WeakSet();
let instanceCount = 0;

function trackComponent(name: string) {
  return (Base: typeof LitElement) =&gt; {
    return class extends Base {
      connectedCallback() {
        super.connectedCallback();
        instanceCount++;
        console.debug(\`[\${name}] 連接，目前實例數: \${instanceCount}\`);
      }
      disconnectedCallback() {
        super.disconnectedCallback();
        instanceCount--;
        console.debug(\`[\${name}] 斷開，目前實例數: \${instanceCount}\`);
      }
    };
  };
}

// 使用：@trackComponent('my-modal') @customElement('my-modal')
// 開發時可以觀察實例數是否在關閉後歸零</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">WeakRef 與 FinalizationRegistry</div>
    <p>
      對於需要追蹤大量元件實例的場景，<code>WeakRef</code> 讓你持有對元件的弱參考（不阻止 GC），
      <code>FinalizationRegistry</code> 讓你在元件被 GC 時得到通知。
      這些工具適合建立進階的開發時除錯工具，不建議用於生產邏輯。
    </p>
  </div>
</section>

<section id="rendering-performance-advanced">
  <h2>渲染效能進階：避免不必要的更新</h2>
  <p>
    理解何時 Lit 會觸發重渲染，以及如何精確控制，是寫出高效能 Lit 元件的核心技能。
  </p>

  <h3>hasChanged 深度控制</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, PropertyValues } from 'lit';
import { property, customElement } from 'lit/decorators.js';

interface DataPoint {
  id: string;
  value: number;
  label: string;
  metadata: Record&lt;string, unknown&gt;;  // 頻繁改變但不影響顯示
}

@customElement('chart-bar')
class ChartBar extends LitElement {
  // 只有 value 或 label 改變才重渲染，忽略 metadata 的變化
  @property({
    hasChanged(newVal: DataPoint, oldVal: DataPoint) {
      if (!oldVal) return true;
      return newVal.value !== oldVal.value || newVal.label !== oldVal.label;
    }
  })
  dataPoint!: DataPoint;

  // 陣列：淺層比較（只比較長度和第一個元素）
  // 適合排序後的穩定列表
  @property({
    hasChanged(newArr: string[], oldArr: string[]) {
      if (!oldArr) return true;
      if (newArr.length !== oldArr.length) return true;
      // 只檢查第一個和最後一個元素作為快速路徑
      return newArr[0] !== oldArr[0] || newArr[newArr.length - 1] !== oldArr[oldArr.length - 1];
    }
  })
  sortedIds: string[] = [];

  render() {
    return html\`
      &lt;div class="bar" style="height: \${this.dataPoint?.value}px"&gt;
        \${this.dataPoint?.label}
      &lt;/div&gt;
    \`;
  }
}

// 使用 willUpdate 精確計算衍生值
@customElement('data-grid')
class DataGrid extends LitElement {
  @property({ type: Array }) rows: Row[] = [];
  @property({ type: String }) sortKey = 'name';
  @property({ type: String }) filterText = '';

  // 衍生狀態：只在依賴改變時重新計算
  private _sortedFilteredRows: Row[] = [];
  private _totalCount = 0;
  private _visibleCount = 0;

  willUpdate(changed: PropertyValues) {
    const needsRecompute =
      changed.has('rows') ||
      changed.has('sortKey') ||
      changed.has('filterText');

    if (needsRecompute) {
      const filtered = this.rows.filter(r =&gt;
        r.name.toLowerCase().includes(this.filterText.toLowerCase())
      );
      this._sortedFilteredRows = [...filtered].sort((a, b) =&gt;
        String(a[this.sortKey]).localeCompare(String(b[this.sortKey]))
      );
      this._totalCount = this.rows.length;
      this._visibleCount = filtered.length;
    }
    // 如果只有不相關屬性改變，跳過昂貴的排序/篩選
  }

  render() {
    return html\`
      &lt;p&gt;顯示 \${this._visibleCount} / \${this._totalCount} 行&lt;/p&gt;
      \${this._sortedFilteredRows.map(row =&gt; html\`&lt;grid-row .row=\${row}&gt;&lt;/grid-row&gt;\`)}
    \`;
  }
}</code></pre>

  <h3>避免在 render() 中建立新參考</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ❌ 每次渲染都建立新物件，子元件收到新參考必然重渲染
class ParentBad extends LitElement {
  render() {
    return html\`
      &lt;!-- 每次渲染 options 都是新物件 → child 必定重渲染 --&gt;
      &lt;my-select .options=\${[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}&gt;
      &lt;/my-select&gt;
      &lt;!-- 每次渲染 handler 都是新函數 → child 必定重渲染 --&gt;
      &lt;my-button .onAction=\${(x: string) =&gt; this._handleAction(x)}&gt;
      &lt;/my-button&gt;
    \`;
  }
}

// ✓ 將穩定值提升到類別屬性或 willUpdate
class ParentGood extends LitElement {
  // 靜態選項：只建立一次
  private static readonly OPTIONS = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ];

  // 穩定的函數參考：使用 arrow function 類別屬性
  private _handleAction = (x: string) =&gt; {
    // 處理 action
  };

  render() {
    return html\`
      &lt;my-select .options=\${ParentGood.OPTIONS}&gt;&lt;/my-select&gt;
      &lt;my-button .onAction=\${this._handleAction}&gt;&lt;/my-button&gt;
    \`;
  }
}

// 對於動態計算的選項，在 willUpdate 中建立並快取
class ParentDynamic extends LitElement {
  @property({ type: Array }) items: Item[] = [];
  private _selectOptions: SelectOption[] = [];

  willUpdate(changed: PropertyValues) {
    if (changed.has('items')) {
      this._selectOptions = this.items.map(i =&gt; ({ value: i.id, label: i.name }));
    }
  }

  render() {
    return html\`&lt;my-select .options=\${this._selectOptions}&gt;&lt;/my-select&gt;\`;
  }
}</code></pre>

  <h3>Bundle 分析工具</h3>
  <p>
    效能優化不只是執行時，也包含載入時間。以下是分析和優化 bundle 大小的工具鏈：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// vite.config.ts：配置 rollup-plugin-visualizer
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: true,          // 建置後自動打開視覺化報告
      gzipSize: true,      // 顯示 gzip 後的大小
      brotliSize: true,    // 顯示 brotli 後的大小
      template: 'treemap', // sunburst | treemap | network
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // 手動分割 chunk：讓路由懶加載真正生效
        manualChunks: {
          'vendor-lit': ['lit', '@lit/reactive-element'],
          'vendor-state': ['zustand', '@tanstack/query-core'],
        },
      },
    },
  },
});</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// 使用 source-map-explorer 分析已有的 bundle
// package.json scripts:
// "analyze": "source-map-explorer 'dist/assets/*.js' --html dist/analysis.html"

// 動態匯入實現真正的程式碼分割
// 只有在路由到達時才載入元件定義
const routes = {
  '/dashboard': () =&gt; import('./pages/dashboard-page.js'),
  '/products': () =&gt; import('./pages/products-page.js'),
  '/settings': () =&gt; import('./pages/settings-page.js'),
};

// 路由器中：
async function navigate(path: string) {
  const loader = routes[path];
  if (loader) {
    await loader(); // 動態匯入，載入並定義 Web Component
    // 元件定義後，&lt;dashboard-page&gt; 等標籤自動升級
  }
}</code></pre>
</section>

<section id="lighthouse-web-vitals">
  <h2>Lighthouse 與 Core Web Vitals 優化</h2>
  <p>
    Core Web Vitals 是 Google 衡量使用者體驗的核心指標，也直接影響 SEO 排名。
    以下是針對 Lit 應用的具體優化策略。
  </p>

  <h3>Core Web Vitals 指標解析</h3>
  <table>
    <thead>
      <tr>
        <th>指標</th>
        <th>全名</th>
        <th>良好門檻</th>
        <th>Lit 應用的主要影響因素</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>LCP</strong></td>
        <td>Largest Contentful Paint</td>
        <td>&lt; 2.5s</td>
        <td>元件首次渲染時間、圖片/字體載入、SSR 支援</td>
      </tr>
      <tr>
        <td><strong>INP</strong></td>
        <td>Interaction to Next Paint</td>
        <td>&lt; 200ms</td>
        <td>事件處理器耗時、重渲染範圍、長任務</td>
      </tr>
      <tr>
        <td><strong>CLS</strong></td>
        <td>Cumulative Layout Shift</td>
        <td>&lt; 0.1</td>
        <td>元件尺寸確定性、字體載入、動態內容插入</td>
      </tr>
      <tr>
        <td><strong>FCP</strong></td>
        <td>First Contentful Paint</td>
        <td>&lt; 1.8s</td>
        <td>關鍵 CSS inline、JavaScript bundle 大小</td>
      </tr>
      <tr>
        <td><strong>TTFB</strong></td>
        <td>Time to First Byte</td>
        <td>&lt; 800ms</td>
        <td>SSR、CDN、伺服器響應速度</td>
      </tr>
    </tbody>
  </table>

  <h3>LCP 優化：測量與改善</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 PerformanceObserver 測量 Lit 元件的 LCP 貢獻
const lcpObserver = new PerformanceObserver((entryList) =&gt; {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
  console.log('LCP:', lastEntry.startTime, 'ms');
  console.log('LCP Element:', (lastEntry as any).element);
});
lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

// FCP 測量
const fcpObserver = new PerformanceObserver((list) =&gt; {
  list.getEntries().forEach((entry) =&gt; {
    if (entry.name === 'first-contentful-paint') {
      console.log('FCP:', entry.startTime, 'ms');
      // 報告到分析服務
    }
  });
});
fcpObserver.observe({ type: 'paint', buffered: true });

// 在 Lit 元件中測量首次渲染時間
@customElement('critical-hero')
class CriticalHero extends LitElement {
  private _renderStart = performance.now();

  firstUpdated() {
    const renderTime = performance.now() - this._renderStart;
    performance.measure('CriticalHero:firstRender', {
      start: this._renderStart,
      duration: renderTime,
    });
    // 在 DevTools Performance 面板中可以看到這個 measure
  }
}</code></pre>

  <h3>INP 優化：讓互動快速響應</h3>
  <pre data-lang="typescript"><code class="language-typescript">// INP 測量：追蹤最慢的互動
const inpObserver = new PerformanceObserver((list) =&gt; {
  list.getEntries().forEach((entry: any) =&gt; {
    if (entry.duration &gt; 200) {
      console.warn('慢互動 INP:', entry.duration, 'ms', entry);
    }
  });
});
inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });

// 對於耗時的事件處理：使用 scheduler.yield() 讓出主執行緒
@customElement('heavy-list')
class HeavyList extends LitElement {
  private async _handleSort() {
    // 立即更新 UI 狀態（讓使用者知道已點擊）
    this._isSorting = true;

    // 讓出主執行緒，讓瀏覽器可以處理其他事件
    if ('scheduler' in globalThis) {
      await (globalThis as any).scheduler.yield();
    } else {
      await new Promise(r =&gt; setTimeout(r, 0));
    }

    // 現在執行耗時的排序
    this._sortedItems = await this._expensiveSort(this._items);
    this._isSorting = false;
  }

  // 使用 requestIdleCallback 在瀏覽器空閒時預計算
  private _prefetchNextPage() {
    requestIdleCallback(
      async () =&gt; {
        this._nextPageData = await api.getNextPage(this._currentPage + 1);
      },
      { timeout: 2000 }
    );
  }
}</code></pre>

  <h3>CLS 優化：穩定的版面配置</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ❌ 導致 CLS 的模式：未知高度的元件
// 元件載入前高度為 0，載入後突然展開，導致頁面跳動
@customElement('cls-bad')
class CLSBad extends LitElement {
  static styles = css\`
    :host { display: block; }  // 高度不固定！
  \`;
}

// ✓ 修復：使用 aspect-ratio 或 min-height 佔位
@customElement('cls-good')
class CLSGood extends LitElement {
  static styles = css\`
    :host {
      display: block;
      // 方法一：固定高度（適合已知尺寸的元件）
      min-height: 200px;
    }

    .image-container {
      // 方法二：aspect-ratio 保持比例（適合圖片/影片）
      aspect-ratio: 16 / 9;
      width: 100%;
      background: #f0f0f0;  // 骨架屏
    }

    .skeleton {
      // 骨架屏動畫：在內容載入前保持佔位
      animation: shimmer 1.5s infinite;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
    }
  \`;
}</code></pre>

  <h3>生產環境效能清單</h3>
  <div class="callout callout-info">
    <div class="callout-title">Lit 應用生產部署前的效能檢查清單</div>
    <p>以下清單涵蓋載入、渲染、互動三個維度：</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>類別</th>
        <th>檢查項目</th>
        <th>工具</th>
        <th>優先級</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="4"><strong>載入效能</strong></td>
        <td>Lit 核心 bundle 大小 &lt; 20KB（gzip）</td>
        <td>rollup-plugin-visualizer</td>
        <td>高</td>
      </tr>
      <tr>
        <td>關鍵路徑元件使用 inline CSS（避免 FOUC）</td>
        <td>Lighthouse</td>
        <td>高</td>
      </tr>
      <tr>
        <td>非關鍵元件動態匯入（code splitting）</td>
        <td>Chrome DevTools Network</td>
        <td>中</td>
      </tr>
      <tr>
        <td>預載入（preload）關鍵元件 JS</td>
        <td>Lighthouse</td>
        <td>中</td>
      </tr>
      <tr>
        <td rowspan="4"><strong>渲染效能</strong></td>
        <td>列表使用 repeat() 並提供穩定 key</td>
        <td>Code Review</td>
        <td>高</td>
      </tr>
      <tr>
        <td>render() 不建立新物件/陣列參考</td>
        <td>Code Review</td>
        <td>高</td>
      </tr>
      <tr>
        <td>複雜計算在 willUpdate 中快取</td>
        <td>Code Review</td>
        <td>高</td>
      </tr>
      <tr>
        <td>高頻更新元件使用 CSS contain</td>
        <td>Chrome DevTools Rendering</td>
        <td>中</td>
      </tr>
      <tr>
        <td rowspan="4"><strong>記憶體</strong></td>
        <td>所有 addEventListener 在 disconnectedCallback 移除</td>
        <td>Code Review + Memory Profiler</td>
        <td>高</td>
      </tr>
      <tr>
        <td>所有 Observer（Intersection/Resize/Mutation）disconnect</td>
        <td>Code Review + Memory Profiler</td>
        <td>高</td>
      </tr>
      <tr>
        <td>所有 setInterval/setTimeout 清理</td>
        <td>Code Review</td>
        <td>高</td>
      </tr>
      <tr>
        <td>ReactiveController 的 hostDisconnected 正確清理</td>
        <td>Code Review</td>
        <td>高</td>
      </tr>
    </tbody>
  </table>
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
// style="top: \${this.y}px; left: \${this.x}px"
// ✓ 只觸發 Composite
// style="transform: translate(\${this.x}px, \${this.y}px)"

// 4. 避免在 render() 中建立新物件（每次都是新參考，觸發不必要更新）
// ✗ 每次渲染都建立新陣列
// render() { return html\`&lt;my-chart .data=\${[...this.items]}&gt;\`; }
// ✓ 在 willUpdate 中計算，只在依賴改變時更新
willUpdate(changed: PropertyValues) {
  if (changed.has('items')) this._chartData = [...this.items];
}
render() {
  return html\`&lt;my-chart .data=\${this._chartData}&gt;\`;
}

// 5. 使用 Performance.mark() 自訂量測點
@customElement('measured-list')
class MeasuredList extends LitElement {
  update(changedProperties: PropertyValues) {
    performance.mark('MeasuredList:update-start');
    super.update(changedProperties);
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    performance.mark('MeasuredList:update-end');
    performance.measure(
      'MeasuredList:update',
      'MeasuredList:update-start',
      'MeasuredList:update-end'
    );
    // 在 DevTools Performance 面板的 Timings 軌道中可見
  }
}</code></pre>
</section>
`,
};
