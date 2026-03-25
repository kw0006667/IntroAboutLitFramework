export default {
  id: 22,
  slug: 'chapter-22',
  title: 'Web Components 的未來：Signals、Declarative Custom Elements 與標準化趨勢',
  part: 6,
  intro: 'TC39 Signals Proposal 對 Lit 的影響，以及 Web Components 標準未來可能補足的缺口。',
  sections: [
    { slug: 'tc39-signals', title: 'TC39 Signals Proposal' },
    { slug: 'signals-lit-impact', title: 'Signals 對 Lit 的影響' },
    { slug: 'declarative-custom-elements', title: 'Declarative Custom Elements' },
    { slug: 'css-scope', title: 'CSS @scope 與 Shadow DOM 的未來' },
    { slug: 'wc-standards-gaps', title: 'Web Components 現有缺口與補足' },
    { slug: 'future-outlook', title: '展望：下一個十年的 Web 元件' },
    { slug: 'view-transitions-lit', title: 'View Transitions API 與 Lit 路由整合' },
    { slug: 'popover-api', title: 'Popover API：原生 Overlay 的終局' },
    { slug: 'react19-wc-support', title: 'React 19 完整 Web Components 支援：意義與影響' },
  ],
  content: `
<section id="tc39-signals">
  <h2>TC39 Signals Proposal</h2>
  <p>
    TC39 Signals Proposal 試圖為 JavaScript 語言本身加入一個響應式原語（Primitive），
    讓所有框架使用同一套響應式機制，消除框架間的「響應式孤島」問題。
    截至 2025 年，該提案處於 Stage 1，意味著 TC39 委員會已認可問題值得解決，
    但語法和語義細節仍在積極討論中。
  </p>

  <h3>TC39 Stage 狀態與時間線</h3>
  <table>
    <thead>
      <tr><th>Stage</th><th>意義</th><th>Signals 目前狀態</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Stage 0</td>
        <td>提案草案（Strawman）</td>
        <td>—</td>
      </tr>
      <tr>
        <td>Stage 1</td>
        <td>問題被認可，探索解決方案</td>
        <td>✅ 目前位置（2024-2025）</td>
      </tr>
      <tr>
        <td>Stage 2</td>
        <td>草案規格，API 大致定案</td>
        <td>預計 2025-2026</td>
      </tr>
      <tr>
        <td>Stage 3</td>
        <td>候選規格，瀏覽器開始實作</td>
        <td>預計 2026-2027</td>
      </tr>
      <tr>
        <td>Stage 4</td>
        <td>正式納入 ECMAScript 規格</td>
        <td>預計 2027+</td>
      </tr>
    </tbody>
  </table>

  <h3>TC39 Signals API 核心設計</h3>
  <pre data-lang="typescript"><code class="language-typescript">// TC39 Signals API（基於 signal-polyfill，語法可能變化）
import { Signal } from 'signal-polyfill';

// ── Signal.State：可讀可寫的基本 Signal ──────────────────────
const count = new Signal.State(0);
const name = new Signal.State('台灣');

// 讀取值
console.log(count.get()); // 0

// 寫入值
count.set(1);
count.set(count.get() + 1); // 2

// ── Signal.Computed：衍生計算，自動追蹤依賴 ──────────────────
// 當 count 或 name 改變時，自動重新計算
const doubled = new Signal.Computed(() =&gt; count.get() * 2);
const greeting = new Signal.Computed(() =&gt; \`\${name.get()} 您好，計數：\${count.get()}\`);

// Computed 是惰性的（lazy）：只在被讀取時才計算
// 且有快取：多次讀取不重複計算（除非依賴改變）
console.log(doubled.get()); // 4
console.log(doubled.get()); // 4（從快取讀取，不重新計算）

count.set(5);
console.log(doubled.get()); // 10（依賴改變，重新計算）

// ── Signal.subtle.Watcher：低階訂閱機制 ──────────────────────
// 這是框架作者使用的底層 API，應用開發者通常不直接使用
const watcher = new Signal.subtle.Watcher(() =&gt; {
  // 當任何被監看的 Signal 改變時，此 callback 被呼叫
  // 注意：這是同步通知，不應在此執行副作用
  // 應排程（schedule）到下一個 microtask 或 animation frame
  queueMicrotask(() =&gt; {
    // 處理 Signal 變化
    for (const signal of watcher.getPending()) {
      console.log('Signal 已改變:', signal);
    }
    watcher.watch(); // 重新訂閱
  });
});

// 開始監看 Signal
watcher.watch(count, doubled);

// 停止監看
watcher.unwatch(count);</code></pre>

  <h3>與現有響應式系統的比較</h3>
  <table>
    <thead>
      <tr><th>框架/函式庫</th><th>State</th><th>Computed</th><th>Effect/Watch</th><th>與 TC39 相容性</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>TC39 Signals</strong>（提案）</td>
        <td><code>new Signal.State(v)</code></td>
        <td><code>new Signal.Computed(fn)</code></td>
        <td><code>new Signal.subtle.Watcher(fn)</code></td>
        <td>本身即標準</td>
      </tr>
      <tr>
        <td><strong>@preact/signals</strong></td>
        <td><code>signal(v)</code></td>
        <td><code>computed(fn)</code></td>
        <td><code>effect(fn)</code></td>
        <td>設計受 TC39 影響；提供適配層</td>
      </tr>
      <tr>
        <td><strong>Vue 3 reactive</strong></td>
        <td><code>ref(v)</code></td>
        <td><code>computed(fn)</code></td>
        <td><code>watchEffect(fn)</code></td>
        <td>概念相似，但非原語層面相容</td>
      </tr>
      <tr>
        <td><strong>Angular Signals</strong></td>
        <td><code>signal(v)</code></td>
        <td><code>computed(fn)</code></td>
        <td><code>effect(fn)</code></td>
        <td>明確設計為向 TC39 靠攏</td>
      </tr>
      <tr>
        <td><strong>SolidJS</strong></td>
        <td><code>createSignal(v)</code></td>
        <td><code>createMemo(fn)</code></td>
        <td><code>createEffect(fn)</code></td>
        <td>先驅者，影響了 TC39 提案</td>
      </tr>
      <tr>
        <td><strong>Lit</strong>（<code>@lit-labs/signals</code>）</td>
        <td>透過 TC39 Signal.State</td>
        <td>透過 TC39 Signal.Computed</td>
        <td>SignalWatcher mixin</td>
        <td>直接基於 TC39 Signals polyfill</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info">
    <div class="callout-title">為什麼需要語言層面的 Signals？</div>
    <p>
      目前各框架的響應式系統互不相通：Vue 的 <code>ref()</code> 無法在 Lit 元件中直接使用，
      @preact/signals 的 Signal 也無法在 Angular 中原生訂閱。
      TC39 Signals 的目標不是取代這些框架的響應式系統，
      而是提供一個<strong>共同的底層原語</strong>，
      讓框架可以建立在同一個基礎上，從而實現跨框架的狀態共享。
      這類似於 Promise 的演進——最初有 jQuery.Deferred、Q、Bluebird 等不相容實作，
      最終 Promise/A+ 標準統一了生態。
    </p>
  </div>
</section>

<section id="signals-lit-impact">
  <h2>Signals 對 Lit 的影響</h2>
  <p>
    Lit 已透過 <code>@lit-labs/signals</code> 提供了早期的 Signals 整合。
    理解 Signals 如何影響 Lit 的內部架構，
    有助於資深工程師評估何時以及如何採用這個模式。
  </p>

  <h3>目前 Lit 的響應式機制</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 目前 Lit 的響應式更新是以「元件」為粒度
// 當任何 @state 或 @property 改變，整個元件的 render() 重新執行
// Lit 用 dirty checking 優化（只在下一個 microtask 批次更新）

@customElement('counter')
class Counter extends LitElement {
  @state() count = 0;
  @state() name = 'Lit';

  render() {
    // 即使只有 count 改變，整個 render() 都會重新執行
    // Lit 的 lit-html 會 diff 結果，只更新真正改變的 DOM 節點
    return html\`
      &lt;p&gt;\${this.name}&lt;/p&gt;  &lt;!-- 不會更新 DOM，因為值沒變 --&gt;
      &lt;p&gt;\${this.count}&lt;/p&gt; &lt;!-- 會更新 DOM --&gt;
    \`;
  }
}
</code></pre>

  <h3>使用 @lit-labs/signals：更細粒度的響應式</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher, watch } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

// ── 應用層共享 Signals（獨立於任何元件）──────────────────────
export const appState = {
  user: new Signal.State&lt;User | null&gt;(null),
  cartItems: new Signal.State&lt;CartItem[]&gt;([]),
  theme: new Signal.State&lt;'light' | 'dark'&gt;('light'),
};

// 衍生計算
export const cartTotal = new Signal.Computed(() =&gt;
  appState.cartItems.get().reduce((sum, item) =&gt; sum + item.price * item.quantity, 0)
);

export const cartCount = new Signal.Computed(() =&gt;
  appState.cartItems.get().reduce((sum, item) =&gt; sum + item.quantity, 0)
);

// ── Lit 元件：使用 SignalWatcher 自動訂閱 ────────────────────
@customElement('cart-icon')
class CartIcon extends SignalWatcher(LitElement) {
  // SignalWatcher 會追蹤 render() 中讀取的所有 Signal
  // 任何被讀取的 Signal 改變時，只有這個元件重新渲染
  render() {
    return html\`
      &lt;button class="cart-icon"&gt;
        &lt;svg&gt;...&lt;/svg&gt;
        &lt;span class="badge"&gt;\${cartCount.get()}&lt;/span&gt;
      &lt;/button&gt;
    \`;
  }
}

// ── watch directive：更細粒度——只更新模板的特定部分 ──────────
@customElement('price-display')
class PriceDisplay extends LitElement {
  // 不使用 SignalWatcher，而是在模板中用 watch() directive
  // 這讓更新粒度更細：只有 watch() 包裹的部分重新求值
  render() {
    return html\`
      &lt;div class="price-display"&gt;
        &lt;span class="label"&gt;購物車總金額&lt;/span&gt;
        &lt;span class="amount"&gt;
          \${watch(cartTotal)}  &lt;!-- 只有這個表達式在 cartTotal 改變時更新 --&gt;
        &lt;/span&gt;
      &lt;/div&gt;
    \`;
  }
}

// ── 與 React 共享同一個 Signal ────────────────────────────────
// 未來（或透過 @preact/signals-react）：
// 同一個 cartCount Signal 可以在 React 元件中使用
// function ReactCartBadge() {
//   const count = useSignal(cartCount); // 假設的 React hook
//   return &lt;span&gt;{count}&lt;/span&gt;;
// }
</code></pre>

  <h3>Signals 對 Lit 架構的潛在影響</h3>
  <table>
    <thead>
      <tr><th>層面</th><th>目前（Lit 3.x）</th><th>原生 Signals 後（Lit 4.x 預期）</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>更新粒度</td>
        <td>元件層級（整個 render() 重新執行）</td>
        <td>表達式層級（只有讀取了改變 Signal 的部分更新）</td>
      </tr>
      <tr>
        <td>跨元件狀態</td>
        <td>需要 @lit/context 或 props drilling</td>
        <td>直接共享 Signal 物件，無需 Context</td>
      </tr>
      <tr>
        <td>@state/@property 的角色</td>
        <td>核心響應式原語</td>
        <td>可能成為 Signal.State 的語法糖</td>
      </tr>
      <tr>
        <td>ReactiveElement 內部</td>
        <td>自製 dirty tracking + microtask scheduling</td>
        <td>可能基於 Signal.subtle.Watcher 重建</td>
      </tr>
      <tr>
        <td>效能</td>
        <td>已相當優秀</td>
        <td>理論上更少不必要的 re-render</td>
      </tr>
    </tbody>
  </table>

  <h3>遷移路徑評估</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 遷移策略：漸進式採用 Signals
// 不需要一次性重寫；可以在現有 Lit 元件中逐步引入

// 步驟 1：識別跨元件共享的「全域狀態」
// 這些是最適合換成 Signal 的候選
// 例如：使用者登入狀態、購物車、主題設定

// 步驟 2：將全域狀態從 Context 遷移到 Signal
// 之前（使用 @lit/context）：
// const cartContext = createContext&lt;CartItem[]&gt;(Symbol('cart'));

// 之後（使用 Signal）：
export const cartSignal = new Signal.State&lt;CartItem[]&gt;([]);

// 步驟 3：讓使用到全域狀態的元件繼承 SignalWatcher
// 之前：
// class CartIcon extends ContextConsumer(LitElement) { ... }

// 之後：
// class CartIcon extends SignalWatcher(LitElement) { ... }

// 步驟 4：保留 @state/@property 用於元件本地狀態
// Signal 適合全域/跨元件狀態；@state 適合組件私有狀態
@customElement('todo-item')
class TodoItem extends SignalWatcher(LitElement) {
  // 元件本地狀態：繼續使用 @state
  @state() private _isEditing = false;

  // 全域狀態：來自 Signal
  render() {
    const theme = appState.theme.get(); // 全域 Signal
    return html\`
      &lt;div class="todo \${theme}"&gt;
        \${this._isEditing
          ? html\`&lt;input&gt;\`
          : html\`&lt;span @dblclick=\${() =&gt; this._isEditing = true}&gt;...&lt;/span&gt;\`
        }
      &lt;/div&gt;
    \`;
  }
}
</code></pre>
</section>

<section id="declarative-custom-elements">
  <h2>Declarative Custom Elements</h2>
  <p>
    目前建立 Custom Element 必須使用 JavaScript：<code>customElements.define()</code>。
    有數個正在討論的提案，試圖讓 Web Components 在無需（或少量）JavaScript 的情況下定義和使用。
  </p>

  <h3>提案一：HTML Modules</h3>
  <p>
    HTML Modules 提案允許用 <code>import</code> 語句匯入 HTML 檔案，
    類似於 CSS Modules 和 JSON Modules。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 提案中的語法（尚未實作）
// 在 JavaScript 中匯入 HTML 模組
import template from './my-card.html' assert { type: 'html' };

// my-card.html 的內容：
// &lt;template id="my-card"&gt;
//   &lt;style&gt;...&lt;/style&gt;
//   &lt;div class="card"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;
// &lt;/template&gt;

customElements.define('my-card', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // 直接使用 HTML 模組中的模板
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
});
</code></pre>

  <h3>提案二：Template Instantiation</h3>
  <p>
    Template Instantiation 提案為 <code>&lt;template&gt;</code> 元素加入資料綁定能力，
    讓模板可以接收資料並生成 DOM，類似於框架的模板引擎，但完全原生。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 提案中的 Template Instantiation 語法
// HTML 模板定義
// &lt;template type="module"&gt;
//   &lt;div&gt;{{name}}&lt;/div&gt;
//   &lt;p&gt;{{bio}}&lt;/p&gt;
// &lt;/template&gt;

// JavaScript 實例化（提案中，語法待定）
const template = document.querySelector('template');
const instance = template.createInstance({
  name: 'Tim Chang',
  bio: '前端工程師',
});
document.body.appendChild(instance);

// 更新：只更新改變的部分，類似虛擬 DOM diff
instance.update({ name: 'New Name' });
</code></pre>

  <h3>提案三：Declarative Custom Elements（純 HTML 定義）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 假設的未來語法（WHATWG 討論中，不保證實現）
// 完全不需要 JavaScript 的 Custom Element 定義

// &lt;!-- my-greeting.html 或直接在頁面中 --&gt;
// &lt;definition name="my-greeting"&gt;
//   &lt;template shadowrootmode="open"&gt;
//     &lt;style&gt;
//       :host { display: block; font-family: sans-serif; }
//       .name { color: var(--greeting-name-color, #0070f3); font-weight: bold; }
//     &lt;/style&gt;
//     &lt;p&gt;Hello, &lt;span class="name"&gt;&lt;slot&gt;World&lt;/slot&gt;&lt;/span&gt;!&lt;/p&gt;
//   &lt;/template&gt;
// &lt;/definition&gt;
//
// &lt;!-- 使用方式 --&gt;
// &lt;my-greeting&gt;Lit 開發者&lt;/my-greeting&gt;
// &lt;!-- 渲染結果：Hello, Lit 開發者! --&gt;

// 這個提案如果實現，最大的意義是：
// 1. 不依賴 JavaScript 的 Web Components（對 JS 停用的環境有效）
// 2. SSR 更自然（HTML 直接包含完整定義）
// 3. 更低的學習曲線（HTML 作者不需要學 JS）
</code></pre>

  <h3>目前可用的「宣告式」替代方案</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 1. Declarative Shadow DOM（已標準化，Chrome 90+、Safari 16.4+）
// 讓 Shadow DOM 可以在 HTML 中宣告，無需 JavaScript
// 主要用於 SSR

// 伺服器輸出的 HTML：
// &lt;my-profile&gt;
//   &lt;template shadowrootmode="open"&gt;
//     &lt;style&gt;h2 { color: #0070f3; }&lt;/style&gt;
//     &lt;h2&gt;Tim Chang&lt;/h2&gt;
//     &lt;p&gt;Lit 愛好者&lt;/p&gt;
//   &lt;/template&gt;
// &lt;/my-profile&gt;

// 瀏覽器解析 HTML 時，直接建立 Shadow Root
// 不需要等待 JavaScript 載入和執行
// 這是 Lit SSR 的核心機制

// 2. 使用 Lit SSR + Declarative Shadow DOM
// @lit-labs/ssr 在伺服器端渲染 Lit 元件為 DSD HTML
// 用戶端 JavaScript 載入後進行 Hydration（綁定事件等）
// 這是目前最接近「宣告式 Web Components」的生產可用方案
</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">提案與現實的差距</div>
    <p>
      HTML Modules 和 Template Instantiation 這兩個提案已討論多年，
      但推進緩慢，主要原因是各瀏覽器廠商對優先級和語義有分歧。
      Declarative Custom Elements 目前仍是概念討論，尚未進入 WHATWG 正式規格流程。
      資深工程師應對這些提案保持關注，但不應在生產中依賴未標準化的語法。
    </p>
  </div>
</section>

<section id="css-scope">
  <h2>CSS @scope 與 Shadow DOM 的未來</h2>
  <p>
    CSS <code>@scope</code> 是 CSS 的新特性（Chrome 118+，Firefox 128+，Safari 17.4+），
    讓你可以在不使用 Shadow DOM 的情況下建立 CSS 作用域。
    這對 Web Components 的定位有重要影響，也影響設計系統的架構決策。
  </p>

  <h3>CSS @scope 語法</h3>
  <pre data-lang="css"><code class="language-css">/* 基本用法：限制樣式只在 .card 內部生效 */
@scope (.card) {
  /* :scope 指向 .card 本身 */
  :scope {
    padding: 16px;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  h2 { font-size: 1.25rem; color: #1a1a1a; }
  p  { color: #666; line-height: 1.6; }
}

/* 排除特定後代：@scope (A) to (B)
   只影響 .card 到 .nested-card 之間的元素 */
@scope (.card) to (.nested-card) {
  h2 { font-size: 1.5rem; }
  /* .nested-card 內的 h2 不受影響 */
}

/* 解決「鄰近性優先」問題 */
@scope (.light-theme) {
  button { background: white; color: black; }
}
@scope (.dark-theme) {
  button { background: #333; color: white; }
}
/* .dark-theme 內的按鈕：
   使用 dark-theme 規則（更近的祖先）
   無需 !important 或提高 specificity */
</code></pre>

  <h3>CSS @layer：設計 Token 的 Cascade 控制</h3>
  <pre data-lang="css"><code class="language-css">/* @layer 讓你明確控制樣式的優先級層級 */
/* 宣告 layer 順序：後面的優先級更高 */
@layer reset, tokens, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
}

@layer tokens {
  :root {
    --color-primary: #0070f3;
    --color-surface: #ffffff;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --radius-md: 8px;
  }
}

@layer components {
  /* 使用設計 Token 的元件樣式 */
  .button {
    background: var(--color-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
  }

  /* 在 Lit 元件的 Shadow DOM 內也可以使用 @layer */
  /* 但 Shadow DOM 的 @layer 是獨立的，不與 Light DOM 共享 */
}

@layer utilities {
  /* 工具類：最高優先級 */
  .mt-0 { margin-top: 0 !important; }
  .hidden { display: none !important; }
}
</code></pre>

  <h3>@scope vs Shadow DOM：詳細比較</h3>
  <table>
    <thead>
      <tr><th>特性</th><th>CSS @scope</th><th>Shadow DOM</th><th>推薦場景</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>CSS 封裝</td>
        <td>✅ 選擇器作用域</td>
        <td>✅ 完整隔離</td>
        <td>@scope 適合設計系統；Shadow DOM 適合獨立元件</td>
      </tr>
      <tr>
        <td>JS 封裝</td>
        <td>❌ 無</td>
        <td>✅ 有</td>
        <td>需要 JS 邏輯封裝時必須用 Shadow DOM</td>
      </tr>
      <tr>
        <td>querySelector 可存取性</td>
        <td>✅ 外部可查詢</td>
        <td>❌ 外部無法查詢</td>
        <td>需要外部 JS 操作 DOM 時用 @scope</td>
      </tr>
      <tr>
        <td>Slots / 內容投影</td>
        <td>❌ 無</td>
        <td>✅ 有</td>
        <td>需要 slot 機制必須用 Shadow DOM</td>
      </tr>
      <tr>
        <td>全域 CSS 繼承</td>
        <td>✅ 正常繼承</td>
        <td>⚠️ 僅透過 CSS 自訂屬性穿透</td>
        <td>需要繼承全域字體、顏色時用 @scope</td>
      </tr>
      <tr>
        <td>SSR 友好度</td>
        <td>✅ 天然支援</td>
        <td>⚠️ 需要 DSD</td>
        <td>SSR 優先架構優先考慮 @scope + DSD</td>
      </tr>
      <tr>
        <td>ARIA / 無障礙</td>
        <td>✅ 無額外複雜度</td>
        <td>⚠️ 跨 Shadow 邊界的 ARIA 有問題</td>
        <td>無障礙敏感元件謹慎使用 Shadow DOM</td>
      </tr>
      <tr>
        <td>瀏覽器支援</td>
        <td>Chrome 118+, Safari 17.4+, FF 128+</td>
        <td>Chrome 53+, Firefox 63+, Safari 10+</td>
        <td>需要舊瀏覽器支援時 Shadow DOM 更成熟</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">@scope 在設計系統中的實踐</div>
    <p>
      對於設計系統，一個常見的混合策略是：
      基礎樣式（Typography、Color、Spacing）使用 <code>@scope</code> + <code>@layer</code>，
      互動元件（Button、Dialog、Dropdown）使用 Shadow DOM（Lit）。
      這樣既能讓基礎樣式自然繼承，又能讓互動元件的邏輯完整封裝。
    </p>
  </div>
</section>

<section id="wc-standards-gaps">
  <h2>Web Components 現有缺口與補足</h2>
  <p>
    誠實面對 Web Components 目前的不足，有助於做出更好的技術選型。
    以下是資深工程師在生產環境中最常遇到的挑戰及對應方案。
  </p>

  <h3>缺口一：Customized Built-in Elements 與 Safari 的拒絕</h3>
  <p>
    <code>customElements.define('my-button', MyButton, { extends: 'button' })</code>
    讓你繼承原生 HTML 元素，獲得原生的無障礙功能和表單整合。
    但 Safari（WebKit）明確拒絕實作此功能，理由是設計上的根本分歧。
    解決方案是使用 polyfill：
  </p>
  <pre data-lang="bash"><code class="language-bash">npm install @ungap/custom-elements</code></pre>
  <pre data-lang="typescript"><code class="language-typescript">// 在應用程式入口點引入 polyfill（需在所有元件定義之前）
// main.ts
import '@ungap/custom-elements';

// 現在可以在 Safari 中使用 Customized Built-in Elements
customElements.define('fancy-button', class extends HTMLButtonElement {
  static get observedAttributes() { return ['variant']; }

  connectedCallback() {
    this.classList.add('fancy-button');
  }
}, { extends: 'button' });

// 使用方式：
// &lt;button is="fancy-button" variant="primary"&gt;點擊&lt;/button&gt;
// 注意：這個按鈕完全繼承 &lt;button&gt; 的行為，包括表單提交、鍵盤控制等

// ── 但在 Lit 中，通常不推薦 Customized Built-in Elements ──
// 因為 Lit 的 LitElement 本身不繼承自特定 HTML 元素
// 改用 ElementInternals 來達成相同目標（見下方）
</code></pre>

  <h3>缺口二：ElementInternals 表單整合（現已穩定）</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * 一個完整的自訂表單元件，使用 ElementInternals API
 * 支援：表單提交、驗證、constraint validation、ARIA
 */
@customElement('custom-rating')
class CustomRating extends LitElement {
  // 宣告為表單關聯元素
  static formAssociated = true;

  static styles = css\`
    :host { display: inline-flex; gap: 4px; }
    .star { cursor: pointer; font-size: 24px; }
    .star.active { color: #f59e0b; }
    .star:not(.active) { color: #d1d5db; }
  \`;

  private _internals: ElementInternals;
  @state() private _value = 0;
  @property({ type: String }) name = '';
  @property({ type: Boolean }) required = false;

  constructor() {
    super();
    // 建立 ElementInternals：與表單系統的橋接
    this._internals = this.attachInternals();
  }

  // 對外暴露表單相關屬性（符合 ElementInternals 規格）
  get form() { return this._internals.form; }
  get validity() { return this._internals.validity; }
  get validationMessage() { return this._internals.validationMessage; }
  get willValidate() { return this._internals.willValidate; }

  checkValidity() { return this._internals.checkValidity(); }
  reportValidity() { return this._internals.reportValidity(); }

  private _rate(value: number) {
    this._value = value;

    // 更新表單值（FormData 會包含這個值）
    this._internals.setFormValue(String(value));

    // 更新驗證狀態
    if (this.required &amp;&amp; value === 0) {
      this._internals.setValidity(
        { valueMissing: true },
        '請選擇評分',
        this.shadowRoot?.querySelector('.star') ?? undefined,
      );
    } else {
      this._internals.setValidity({}); // 清除驗證錯誤
    }

    // 更新 ARIA 狀態
    this._internals.ariaValueNow = String(value);
    this._internals.ariaValueMin = '0';
    this._internals.ariaValueMax = '5';

    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // formResetCallback：表單 reset 時重置元件狀態
  formResetCallback() {
    this._value = 0;
    this._internals.setFormValue(null);
  }

  // formStateRestoreCallback：瀏覽器自動填入時恢復狀態
  formStateRestoreCallback(state: string) {
    this._value = Number(state);
    this._internals.setFormValue(state);
  }

  render() {
    return html\`
      &lt;div
        role="slider"
        aria-label="評分"
        tabindex="0"
      &gt;
        \${[1, 2, 3, 4, 5].map(star =&gt; html\`
          &lt;span
            class="star \${this._value &gt;= star ? 'active' : ''}"
            @click=\${() =&gt; this._rate(star)}
          &gt;★&lt;/span&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }
}

// 使用方式：完整的表單整合
// &lt;form id="review-form"&gt;
//   &lt;custom-rating name="rating" required&gt;&lt;/custom-rating&gt;
//   &lt;button type="submit"&gt;提交&lt;/button&gt;
// &lt;/form&gt;
//
// document.getElementById('review-form').addEventListener('submit', (e) =&gt; {
//   const data = new FormData(e.target);
//   console.log(data.get('rating')); // "4"
// });
</code></pre>

  <h3>缺口三：Cross-Root ARIA（Shadow DOM 的無障礙問題）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 問題：Shadow DOM 邊界阻斷了 ARIA 關係
// 例如：下拉選單的 button 在 Light DOM，
// 但 listbox 在 Shadow DOM，ARIA 關係無法連結

// ❌ 目前無效的做法（跨 Shadow 邊界的 ARIA 不被支援）
// &lt;my-combobox&gt;
//   #shadow-root
//     &lt;input aria-controls="my-listbox"&gt;  &lt;!-- listbox 在另一個 Shadow Root --&gt;
// &lt;/my-combobox&gt;
// &lt;my-listbox id="my-listbox"&gt;&lt;/my-listbox&gt;

// 目前的解決方案：使用 ariaActiveDescendantElement（ElementInternals）
// 這是 ARIA IDL attribute，接受 Element 物件而非 ID 字串
class CustomCombobox extends LitElement {
  static formAssociated = true;
  private _internals = this.attachInternals();

  private _connectAriaToListbox(listboxEl: Element) {
    // 使用 Element 物件，而非字串 ID，繞過 Shadow DOM 邊界
    // 注意：需要瀏覽器支援 ElementInternals 的 ARIA mixin（Chrome 102+）
    this._internals.ariaActiveDescendantElement = listboxEl as HTMLElement;
  }
}

// Cross-Root ARIA 的正式解決方案：
// ARIA Reflection 提案（https://github.com/WICG/aom/blob/main/explainer.md）
// 允許 ARIA attribute 跨越 Shadow DOM 邊界引用 Element
// 目前仍在討論中，Chrome 已實作部分功能

// 實際建議：對於需要複雜 ARIA 關係的元件（Combobox、Tree、Grid），
// 考慮使用 Light DOM 模式（renderRoot 設定為 this）而非 Shadow DOM
class ComboboxWithLightDOM extends LitElement {
  // 強制使用 Light DOM，讓 ARIA 關係正常工作
  // 代價：失去 CSS 封裝
  protected override createRenderRoot() {
    return this;
  }
}
</code></pre>

  <h3>缺口四：Open Styling 提案</h3>
  <p>
    Shadow DOM 的 CSS 封裝有時過於嚴格，外部無法輕易自訂樣式。
    目前有幾個提案試圖解決這個問題：
  </p>
  <pre data-lang="css"><code class="language-css">/* 現有解決方案：::part() 偽元素 */
/* 元件作者在 Shadow DOM 內標記可自訂的部分 */
/* Shadow DOM 內部 */
/* &lt;button part="button"&gt;&lt;span part="label"&gt;文字&lt;/span&gt;&lt;/button&gt; */

/* 消費者的 CSS */
my-button::part(button) {
  background: hotpink;
  border-radius: 999px;
}
my-button::part(label) {
  font-weight: bold;
}

/* 限制：::part() 無法選取 part 的後代元素 */
/* my-button::part(button) span { ... } -- 無效！ */

/* 未來提案：CSS @sheet / Adoptable Stylesheets 的改進 */
/* 目前 Lit 使用 adoptedStyleSheets，效能已很好 */
/* 未來可能允許從外部直接 adopt stylesheet 進 Shadow Root */

/* 實際建議：提供豐富的 CSS 自訂屬性 */
my-element {
  --primary-color: hotpink;
  --border-radius: 999px;
  --font-weight: bold;
}
</code></pre>
</section>

<section id="future-outlook">
  <h2>展望：下一個十年的 Web 元件</h2>
  <p>
    站在 2025 年，我們可以清晰地看到幾個收斂的趨勢，
    以及 Web Components 生態在未來數年的具體發展路徑。
  </p>

  <h3>Chrome Interop 2024/2025 對 Web Components 的影響</h3>
  <p>
    Interop 是 Chrome、Firefox、Safari、Edge 的瀏覽器廠商聯合計畫，
    每年選定一批需要提高跨瀏覽器相容性的功能，集中投入資源實作。
  </p>
  <table>
    <thead>
      <tr><th>功能</th><th>Interop 年份</th><th>現狀（2025）</th><th>對 Web Components 的意義</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Declarative Shadow DOM</td>
        <td>Interop 2024</td>
        <td>✅ 全主流瀏覽器支援</td>
        <td>SSR 的基礎，Lit SSR 可穩定生產使用</td>
      </tr>
      <tr>
        <td>CSS @scope</td>
        <td>Interop 2024</td>
        <td>✅ 全主流瀏覽器支援</td>
        <td>設計系統可採用輕量 CSS 封裝</td>
      </tr>
      <tr>
        <td>Popover API</td>
        <td>Interop 2024</td>
        <td>✅ 全主流瀏覽器支援</td>
        <td>Overlay 類元件可不依賴 z-index 魔法</td>
      </tr>
      <tr>
        <td>View Transitions</td>
        <td>Interop 2024/2025</td>
        <td>✅ Same-doc；🔶 Cross-doc 部分支援</td>
        <td>頁面轉場動畫原生化，路由整合</td>
      </tr>
      <tr>
        <td>CSS Anchor Positioning</td>
        <td>Interop 2025</td>
        <td>🔶 Chrome 125+；FF/Safari 進行中</td>
        <td>Tooltip/Dropdown 定位不再需要 JS 計算</td>
      </tr>
    </tbody>
  </table>

  <h3>框架生態的收斂趨勢</h3>
  <ul>
    <li>
      <strong>React 19</strong>：完整支援 Web Components（事件監聽、屬性綁定），
      降低了「必須包 wrapper」的門檻，詳見本章 react19-wc-support 節
    </li>
    <li>
      <strong>Angular 17+</strong>：Signals 設計對齊 TC39，<code>@angular/elements</code>
      成熟度持續提升，Angular 元件可以直接輸出為 Web Components
    </li>
    <li>
      <strong>Vue 3</strong>：<code>defineCustomElement()</code> 讓 Vue 元件直接輸出 Custom Element，
      且支援 CSS 注入
    </li>
    <li>
      <strong>Svelte 5</strong>：Svelte 5 的 Runes 系統與 Signals 概念高度對齊，
      且 Svelte 元件可以直接輸出為 Web Components
    </li>
  </ul>

  <h3>Lit 4.0 的路線圖預期</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 4.0 預期改進方向（基於官方 GitHub Discussions 和 RFCs）

// 1. 更深度的 TC39 Signals 整合
// 目前：@lit-labs/signals（實驗性）
// 預期：SignalWatcher 和 watch directive 進入 @lit/reactive-element 核心

// 2. 強化 SSR + Hydration
// 目前：@lit-labs/ssr（Preview 狀態）
// 預期：升級至 @lit/ssr（Stable），提供 partial hydration 支援
//        （只 hydrate 有互動的部分，靜態內容保持 HTML）

// 3. 改進的 Decorator 支援（Stage 3 Decorators）
// 目前：使用 legacy experimental decorators
// 預期：遷移到 TC39 Stage 3 Decorators（已合入 TypeScript 5.0）
// 差異：Stage 3 decorators 的語義略有不同，但 Lit 會提供相容層

// 目前 Lit 3.x 的 @property 裝飾器
@property({ type: String, reflect: true })
name = '';

// Stage 3 decorators 的潛在樣式（語義可能調整）
// @property({ type: String, reflect: true })
// accessor name = ''; // 注意：使用 accessor 關鍵字

// 4. 效能改進：更小的 Bundle Size
// Lit 3.x：核心約 6kb gzipped
// 目標：透過更好的 tree-shaking 和模組分拆，進一步減小
</code></pre>

  <h3>給資深工程師的戰略建議</h3>
  <div class="callout callout-tip">
    <div class="callout-title">投資 Web 平台，而非特定框架</div>
    <p>
      深入理解 Custom Elements、Shadow DOM、CSS Custom Properties、
      ElementInternals、Intersection/Resize Observer、Web Animations API——
      這些是瀏覽器平台的一部分，你的知識不會因為某個框架的衰退而過時。
      Lit 是學習這些技術的絕佳起點，因為它讓你直接面對平台，
      而不是在抽象層背後學習。
    </p>
  </div>

  <div class="callout callout-info">
    <div class="callout-title">Web Components 的長期可靠性</div>
    <p>
      2013 年編寫的 Custom Elements 程式碼，在 2025 年的瀏覽器中仍然有效。
      Web 平台對向後相容性有幾乎宗教般的堅持（Brendan Eich：「don't break the web」）。
      當你選擇擁抱 Web Components 標準時，你投資的是一個<strong>以十年為單位的平台</strong>，
      而不是一個以主版本為單位的框架。
      這，或許是 Lit 最深刻的價值所在。
    </p>
  </div>
</section>

<section id="view-transitions-lit">
  <h2>View Transitions API 與 Lit 路由整合</h2>
  <p>
    View Transitions API 讓頁面或 DOM 狀態的切換附帶流暢的動畫，
    無需手動管理動畫的進入/離場邏輯。
    它在 Chrome 111+ 支援同文件（SPA）轉場，
    Chrome 126+ 開始支援跨文件（MPA）轉場。
    Firefox 和 Safari 也在跟進實作中。
  </p>

  <h3>基礎 API：document.startViewTransition()</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 最簡單的用法：包裹任何會改變 DOM 的操作
async function updateContent() {
  if (!document.startViewTransition) {
    // 降級處理：瀏覽器不支援時直接更新
    performUpdate();
    return;
  }

  // startViewTransition 會：
  // 1. 截圖當前狀態（old state）
  // 2. 執行 callback，更新 DOM
  // 3. 截圖新狀態（new state）
  // 4. 播放淡入淡出動畫
  const transition = document.startViewTransition(() =&gt; {
    performUpdate();
  });

  // 等待動畫完成
  await transition.finished;
}

// 自訂過場動畫（CSS）
// ::view-transition-old(root) — 舊頁面的截圖
// ::view-transition-new(root) — 新頁面的截圖
</code></pre>

  <pre data-lang="css"><code class="language-css">/* 預設：淡入淡出（crossfade）*/
/* 自訂：滑動效果 */
@keyframes slide-in-from-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes slide-out-to-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}

::view-transition-old(root) {
  animation: 300ms ease-in slide-out-to-left;
}
::view-transition-new(root) {
  animation: 300ms ease-out slide-in-from-right;
}

/* 減少動畫：尊重使用者的無障礙偏好 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
</code></pre>

  <h3>具名 View Transition：只動畫特定元素</h3>
  <pre data-lang="css"><code class="language-css">/* 給特定元素命名，讓它在轉場時獨立動畫 */
/* 例如：文章卡片展開為文章詳情頁 */

/* 文章列表頁 */
.article-card[data-id="42"] {
  view-transition-name: article-hero-42;
}

/* 文章詳情頁的主圖 */
.article-hero {
  view-transition-name: article-hero-42;
}

/* 瀏覽器會自動計算從卡片位置到主圖位置的補間動畫（FLIP）*/
/* 這就是「Shared Element Transition」效果 */
</code></pre>

  <h3>在 Lit 路由中整合 View Transitions</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

type Route = 'home' | 'articles' | 'article';

@customElement('app-shell')
class AppShell extends LitElement {
  @state() private _currentArticleId?: string;

  // @lit-labs/router 的路由設定
  private _router = new Router(this, [
    {
      path: '/',
      render: () =&gt; html\`&lt;home-page&gt;&lt;/home-page&gt;\`,
      enter: async () =&gt; {
        await this._transition(() =&gt; {
          this._currentRoute = 'home';
        });
        return true;
      },
    },
    {
      path: '/articles',
      render: () =&gt; html\`&lt;article-list&gt;&lt;/article-list&gt;\`,
      enter: async () =&gt; {
        await this._transition(() =&gt; {
          this._currentRoute = 'articles';
        });
        return true;
      },
    },
    {
      path: '/articles/:id',
      render: ({ id }) =&gt; html\`
        &lt;article-detail .articleId=\${id}&gt;&lt;/article-detail&gt;
      \`,
      enter: async ({ id }) =&gt; {
        await this._transitionWithName(() =&gt; {
          this._currentArticleId = id;
          this._currentRoute = 'article';
        }, id!);
        return true;
      },
    },
  ]);

  @state() private _currentRoute: Route = 'home';

  // 通用轉場函數
  private async _transition(updateFn: () =&gt; void): Promise&lt;void&gt; {
    if (!document.startViewTransition) {
      updateFn();
      return;
    }
    const t = document.startViewTransition(updateFn);
    await t.finished;
  }

  // 帶具名元素的轉場（用於文章卡片 → 文章詳情）
  private async _transitionWithName(updateFn: () =&gt; void, articleId: string): Promise&lt;void&gt; {
    // 先設定來源元素的 view-transition-name
    const card = this.querySelector(\`[data-article-id="\${articleId}"]\`) as HTMLElement | null;
    if (card) {
      card.style.viewTransitionName = \`article-\${articleId}\`;
    }

    await this._transition(() =&gt; {
      updateFn();
    });

    // 清除 transition name（避免衝突）
    if (card) {
      card.style.viewTransitionName = '';
    }
  }

  render() {
    return html\`
      &lt;nav&gt;
        &lt;a href="/" @click=\${this._handleNavClick}&gt;首頁&lt;/a&gt;
        &lt;a href="/articles" @click=\${this._handleNavClick}&gt;文章&lt;/a&gt;
      &lt;/nav&gt;
      &lt;main&gt;
        \${this._router.outlet()}
      &lt;/main&gt;
    \`;
  }

  private _handleNavClick(e: Event) {
    e.preventDefault();
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href')!;
    window.history.pushState({}, '', href);
    this._router.goto(href);
  }
}
</code></pre>

  <h3>跨文件轉場（Cross-Document / MPA）</h3>
  <pre data-lang="css"><code class="language-css">/* 跨文件 View Transitions：無需 JavaScript！*/
/* Chrome 126+，在 CSS 中啟用 */

/* 在每個頁面的 CSS 中加入 */
@view-transition {
  navigation: auto; /* 對所有同源的頁面導航啟用轉場 */
}

/* 自訂動畫（同樣使用 ::view-transition-old/new）*/
::view-transition-old(root) {
  animation: 200ms ease-in fade-out;
}
::view-transition-new(root) {
  animation: 200ms ease-out fade-in;
}

/* 這讓 MPA（多頁應用）也能有 SPA 般的流暢轉場！*/
/* 對於 Lit SSR 生成的靜態網站特別有價值 */
</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">View Transitions 的漸進增強策略</div>
    <p>
      始終使用 <code>if (!document.startViewTransition)</code> 進行降級處理，
      確保在不支援的瀏覽器中（或在 <code>prefers-reduced-motion: reduce</code> 模式下）
      內容仍然能正確顯示和更新，只是沒有動畫效果。
      View Transitions 應被視為增強體驗的層，而不是核心功能。
    </p>
  </div>
</section>

<section id="popover-api">
  <h2>Popover API：原生 Overlay 的終局</h2>
  <p>
    Popover API 是 HTML 的新特性（Chrome 114+，Firefox 125+，Safari 17+），
    讓瀏覽器原生處理 Overlay 元素的顯示/隱藏，
    包括點擊外部關閉（light dismiss）、焦點管理、頂層渲染（Top Layer）等，
    這些以前都需要大量 JavaScript 實現。
  </p>

  <h3>Popover 的兩種模式</h3>
  <pre data-lang="typescript"><code class="language-typescript">// HTML 原生 popover（無需 JavaScript！）
// popover="auto"（預設）：
//   - 點擊外部自動關閉（light dismiss）
//   - 同時只能開啟一個 auto popover（開新的會關閉舊的）
//   - 支援鍵盤 Escape 關閉
//   - 渲染在 Top Layer（永遠在最上層，不受 z-index 影響）

// &lt;button popovertarget="my-menu"&gt;開啟選單&lt;/button&gt;
// &lt;div id="my-menu" popover="auto"&gt;
//   &lt;ul&gt;
//     &lt;li&gt;選項一&lt;/li&gt;
//     &lt;li&gt;選項二&lt;/li&gt;
//   &lt;/ul&gt;
// &lt;/div&gt;

// popover="manual"：
//   - 不會自動關閉（需要手動控制）
//   - 可以同時開啟多個
//   - 適合 Toast、Tooltip 等不需要 light dismiss 的元素

// JavaScript API
const popover = document.getElementById('my-menu');
popover.showPopover();    // 顯示
popover.hidePopover();    // 隱藏
popover.togglePopover();  // 切換
</code></pre>

  <h3>CSS :popover-open 偽類</h3>
  <pre data-lang="css"><code class="language-css">/* 樣式化 popover 的開啟/關閉狀態 */
[popover] {
  /* 重置瀏覽器預設樣式 */
  border: none;
  padding: 0;
  background: transparent;

  /* 自訂樣式 */
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 8px 0;
  min-width: 200px;
}

/* 開啟狀態的特定樣式 */
[popover]:popover-open {
  /* 進場動畫 */
  animation: popover-in 150ms ease-out;
}

@keyframes popover-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 離場動畫（需要搭配 @starting-style）*/
@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* 離場動畫（Chrome 117+ 支援 transition on popover）*/
[popover] {
  transition:
    opacity 150ms,
    transform 150ms,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}
[popover]:not(:popover-open) {
  opacity: 0;
  transform: scale(0.95);
}
</code></pre>

  <h3>在 Lit 元件中使用 Popover API</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

// 比較：以前需要大量 JS 的 Dropdown，現在用原生 popover
@customElement('native-dropdown')
class NativeDropdown extends LitElement {
  static styles = css\`
    :host { position: relative; display: inline-block; }

    button {
      padding: 8px 16px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }

    [popover] {
      position: absolute;
      inset: auto;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      padding: 4px;
      min-width: 180px;
    }

    ::slotted(li) {
      list-style: none;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
    }
    ::slotted(li:hover) {
      background: #f0f4ff;
    }
  \`;

  @property({ type: String }) label = '選項';

  // 使用 Anchor Positioning（CSS）定位 popover（Chrome 125+）
  // 或退回到手動 JS 定位
  render() {
    const triggerId = \`trigger-\${this.id || Math.random().toString(36).slice(2)}\`;
    const popoverId = \`popover-\${this.id || Math.random().toString(36).slice(2)}\`;

    return html\`
      &lt;button
        id=\${triggerId}
        popovertarget=\${popoverId}
        popovertargetaction="toggle"
        aria-haspopup="listbox"
      &gt;
        \${this.label} ▾
      &lt;/button&gt;

      &lt;ul
        id=\${popoverId}
        popover="auto"
        role="listbox"
        @click=\${this._handleSelect}
      &gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/ul&gt;
    \`;
  }

  private _handleSelect(e: Event) {
    const li = (e.target as HTMLElement).closest('li');
    if (!li) return;

    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: li.dataset.value, label: li.textContent?.trim() },
      bubbles: true,
      composed: true,
    }));

    // 選取後關閉 popover
    const popover = this.shadowRoot?.querySelector('[popover]') as HTMLElement;
    popover?.hidePopover();
  }
}

// 使用方式：
// &lt;native-dropdown label="選擇語言"&gt;
//   &lt;li data-value="zh-TW"&gt;繁體中文&lt;/li&gt;
//   &lt;li data-value="en"&gt;English&lt;/li&gt;
//   &lt;li data-value="ja"&gt;日本語&lt;/li&gt;
// &lt;/native-dropdown&gt;
</code></pre>

  <h3>CSS Anchor Positioning：解決 Tooltip/Dropdown 定位難題</h3>
  <pre data-lang="css"><code class="language-css">/* CSS Anchor Positioning（Chrome 125+）*/
/* 讓 popover 相對於 trigger 元素定位，無需 JS 計算位置 */

/* 1. 在觸發元素上設定 anchor-name */
.dropdown-trigger {
  anchor-name: --dropdown-anchor;
}

/* 2. 在 popover 上使用 position-anchor */
.dropdown-menu[popover] {
  position: absolute;
  position-anchor: --dropdown-anchor;

  /* 定位在 anchor 的下方，左對齊 */
  top: calc(anchor(bottom) + 4px);
  left: anchor(left);

  /* 自動翻轉：當下方空間不足時，自動移到上方 */
  position-try-fallbacks:
    flip-block,
    flip-inline,
    flip-block flip-inline;
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Popover API vs 自製 Overlay 的選擇</div>
    <p>
      對於簡單的下拉選單、Tooltip、選單：優先使用原生 Popover API，
      它內建了 light dismiss、Top Layer 和無障礙語義，
      不再需要維護 <code>z-index</code> 堆疊、點擊外部監聽器和焦點管理邏輯。
      對於需要複雜動畫、拖拽、特殊定位邏輯的 Modal/Dialog，
      仍然建議使用自製的 Lit 元件（搭配 <code>&lt;dialog&gt;</code> 元素）。
    </p>
  </div>
</section>

<section id="react19-wc-support">
  <h2>React 19 完整 Web Components 支援：意義與影響</h2>
  <p>
    React 19（2024 年 12 月正式發布）解決了長期以來 React 對 Web Components 支援不足的問題。
    這是 React 12 年歷史上第一次讓 Web Components 在 React 中「自然工作」，
    對整個前端生態有深遠影響。
  </p>

  <h3>React 18 的問題</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ❌ React 18 中使用 Web Components 的各種問題

// 問題 1：Custom Events 無法被 React 事件系統攔截
// React 18 使用合成事件（Synthetic Events），
// Web Components 的 CustomEvent（composed: true）無法觸發 React 的 onClick

function App() {
  return (
    &lt;my-button
      // ❌ React 18：CustomEvent 'my-button-click' 不會觸發這個 handler
      onMyButtonClick={(e) =&gt; console.log(e)}
    &gt;
      點擊
    &lt;/my-button&gt;
  );
}

// 必須使用 ref 手動 addEventListener
function App() {
  const ref = useRef(null);
  useEffect(() =&gt; {
    const el = ref.current;
    const handler = (e) =&gt; console.log(e);
    el?.addEventListener('my-button-click', handler);
    return () =&gt; el?.removeEventListener('my-button-click', handler);
  }, []);
  return &lt;my-button ref={ref}&gt;點擊&lt;/my-button&gt;;
}

// 問題 2：屬性（Properties）無法直接設定
// React 18 只能傳遞 attribute（字串），不能傳遞 property（物件/陣列）
function App() {
  const items = [{ id: 1, name: 'A' }];
  return (
    // ❌ React 18：items 會被序列化為字串 "[object Object]"
    &lt;my-list items={items}&gt;&lt;/my-list&gt;
  );
}

// 必須用 ref 手動設定 property
function App() {
  const ref = useRef(null);
  useEffect(() =&gt; {
    if (ref.current) ref.current.items = items;
  }, [items]);
  return &lt;my-list ref={ref}&gt;&lt;/my-list&gt;;
}
</code></pre>

  <h3>React 19 的改善</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ✅ React 19：Web Components 自然工作

// 1. Custom Events 現在正確觸發
function App() {
  return (
    &lt;my-button
      // ✅ React 19：直接監聽 Custom Event，無需 ref
      onMyButtonClick={(e: CustomEvent) =&gt; {
        console.log('點擊了！', e.detail);
      }}
    &gt;
      點擊
    &lt;/my-button&gt;
  );
}

// 2. 物件/陣列 Props 自動設定為 Property（而非 Attribute）
function App() {
  const items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
  return (
    // ✅ React 19：items 陣列直接設定為 my-list.items property
    &lt;my-list items={items} onSelectionChange={(e) =&gt; console.log(e.detail)}&gt;&lt;/my-list&gt;
  );
}

// 3. 布林 Attribute 正確處理
function App() {
  return (
    // ✅ React 19：disabled 正確設定為 attribute（而非字串 "true"）
    &lt;my-button disabled={isLoading}&gt;載入中&lt;/my-button&gt;
  );
}
</code></pre>

  <h3>@lit/react 的定位：仍然有價值</h3>
  <pre data-lang="typescript"><code class="language-typescript">// @lit/react 在 React 19 後的角色

// 即使 React 19 原生支援 Web Components，@lit/react 仍然有價值：

// 1. TypeScript 型別安全
// React 19 的 Web Components 支援沒有型別資訊
// 使用 &lt;my-button items={items}&gt; 時，TypeScript 不知道 items 的型別

// @lit/react 提供完整的型別定義
import { createComponent } from '@lit/react';
import React from 'react';
import { MyButton } from './my-button.js';

// 創建型別安全的 React Wrapper
const ReactMyButton = createComponent({
  tagName: 'my-button',
  elementClass: MyButton,
  react: React,
  events: {
    onMyButtonClick: 'my-button-click',  // 事件映射
    onMyButtonFocus: 'my-button-focus',
  },
});

// 現在有完整的 TypeScript 型別！
function App() {
  return (
    &lt;ReactMyButton
      variant="primary"   // ✅ 型別：'primary' | 'secondary' | 'danger'
      disabled={false}    // ✅ 型別：boolean
      onMyButtonClick={(e) =&gt; {
        // ✅ e 的型別正確推導
        console.log(e.detail.originalEvent);
      }}
    &gt;
      點擊
    &lt;/ReactMyButton&gt;
  );
}
</code></pre>

  <h3>從 React 18 + @lit/react 遷移到 React 19</h3>
  <table>
    <thead>
      <tr><th>場景</th><th>React 18 方案</th><th>React 19 建議</th><th>是否需要 @lit/react</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>傳遞字串/數字 attribute</td>
        <td><code>&lt;my-el name="Tim"&gt;</code></td>
        <td>相同（無變化）</td>
        <td>否</td>
      </tr>
      <tr>
        <td>傳遞物件/陣列 property</td>
        <td>useRef + useEffect 手動設定</td>
        <td><code>&lt;my-el .items={items}&gt;</code> 直接傳遞</td>
        <td>否（但 @lit/react 提供型別）</td>
      </tr>
      <tr>
        <td>監聽 Custom Events</td>
        <td>useRef + addEventListener</td>
        <td><code>onMyEvent={handler}</code> 直接綁定</td>
        <td>否（但 @lit/react 提供型別）</td>
      </tr>
      <tr>
        <td>TypeScript 型別安全</td>
        <td>需要 @lit/react 或 custom type declarations</td>
        <td>仍需 @lit/react 或 manual declarations</td>
        <td>是（強烈建議）</td>
      </tr>
      <tr>
        <td>Server Components（RSC）</td>
        <td>不支援</td>
        <td>不支援（Web Components 需要 client-side）</td>
        <td>@lit/react 提供 'use client' directive</td>
      </tr>
    </tbody>
  </table>

  <h3>React 19 + Web Components 的架構建議</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 最佳實踐：設計系統使用 Lit，應用使用 React

// libs/design-system/src/my-button.ts（Lit 元件，框架無關）
@customElement('ds-button')
export class DsButton extends LitElement {
  @property({ type: String, reflect: true }) variant: 'primary' | 'secondary' = 'primary';
  @property({ type: Boolean, reflect: true }) loading = false;
  // ...
}

// apps/react-app/src/components/Button.tsx
// 方式一：React 19 原生（簡單但無完整型別）
export function Button({ children, variant = 'primary', loading = false, onClick }) {
  return (
    &lt;ds-button
      variant={variant}
      loading={loading}
      onDsButtonClick={onClick}
    &gt;
      {children}
    &lt;/ds-button&gt;
  );
}

// 方式二：@lit/react Wrapper（完整型別，推薦用於大型專案）
import { createComponent } from '@lit/react';
import { DsButton } from '@company/design-system';

export const Button = createComponent({
  tagName: 'ds-button',
  elementClass: DsButton,
  react: React,
  events: { onDsButtonClick: 'ds-button-click' },
});

// 結果：設計系統的業務邏輯和樣式只需維護一份（Lit）
// React、Vue、Angular 應用都能使用同一套設計系統
// 未來切換應用框架時，設計系統不需要重寫
</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">React 19 的意義：生態融合的里程碑</div>
    <p>
      React 19 對 Web Components 的完整支援，標誌著「框架對抗 Web 標準」的時代逐漸終結。
      當 React——這個最廣泛使用的 UI 框架——宣布良好支援 Web Components，
      設計系統和元件庫選擇 Web Components（Lit）作為底層實作變得更加合理。
      微前端架構中，各技術棧之間的狀態共享和 UI 複用也因此更加可行。
    </p>
  </div>
</section>
`,
};
