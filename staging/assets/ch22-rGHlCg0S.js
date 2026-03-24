const t={id:22,slug:"chapter-22",title:"Web Components 的未來：Signals、Declarative Custom Elements 與標準化趨勢",part:6,intro:"TC39 Signals Proposal 對 Lit 的影響，以及 Web Components 標準未來可能補足的缺口。",sections:[{slug:"tc39-signals",title:"TC39 Signals Proposal"},{slug:"signals-lit-impact",title:"Signals 對 Lit 的影響"},{slug:"declarative-custom-elements",title:"Declarative Custom Elements"},{slug:"css-scope",title:"CSS @scope 與 Shadow DOM 的未來"},{slug:"wc-standards-gaps",title:"Web Components 現有缺口與補足"},{slug:"future-outlook",title:"展望：下一個十年的 Web 元件"}],content:`
<section id="tc39-signals">
  <h2>TC39 Signals Proposal</h2>
  <p>
    TC39 Signals Proposal（Stage 1）試圖為 JavaScript 語言本身加入一個響應式原語（Primitive），
    讓所有框架使用同一套響應式機制，消除框架間的「響應式孤島」問題。
  </p>

  <h3>什麼是 Signal？</h3>
  <p>
    Signal 是一個包含值的容器，當值改變時，所有「訂閱」了這個 Signal 的計算和效果
    都會自動更新。它是所有現代響應式系統（MobX、Vue Reactivity、SolidJS、Angular Signals）的共同抽象。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// TC39 Signals API（提案中，語法可能變化）
import { Signal } from 'signal-polyfill';

// State Signal：可讀可寫
const count = new Signal.State(0);
const name = new Signal.State('Tim');

// Computed Signal：衍生值，自動追蹤依賴
const doubled = new Signal.Computed(() =&gt; count.get() * 2);
const greeting = new Signal.Computed(() =&gt; \`Hello, \${name.get()}!\`);

// Effect：副作用，Signal 改變時自動執行
Signal.subtle.watchEffect(() =&gt; {
  document.title = \`Count: \${count.get()}\`;
});

// 更新 Signal 值
count.set(1);    // doubled 自動變為 2，title 自動更新
name.set('Lit'); // greeting 自動變為 "Hello, Lit!"

// 讀取值
console.log(doubled.get()); // 2
console.log(greeting.get()); // "Hello, Lit!"</code></pre>

  <h3>為什麼 Signals 很重要</h3>
  <p>
    目前每個框架都有自己的響應式系統：
  </p>
  <ul>
    <li>React：<code>useState</code>、<code>useMemo</code>、Context</li>
    <li>Vue：<code>ref</code>、<code>computed</code>、<code>watch</code></li>
    <li>Angular：<code>signal()</code>、<code>computed()</code>（Angular 17+）</li>
    <li>SolidJS：<code>createSignal</code>、<code>createMemo</code></li>
    <li>Lit：<code>@state</code>、<code>@property</code></li>
  </ul>
  <p>
    TC39 Signals 的目標是提供<strong>原語（Primitive）</strong>而非完整 API，
    讓上述所有框架都能建立在同一個底層機制上。
    就像 Promise 統一了非同步編程一樣，Signals 可能統一響應式編程。
  </p>
</section>

<section id="signals-lit-impact">
  <h2>Signals 對 Lit 的影響</h2>
  <p>
    Lit 已透過 <code>@lit-labs/signals</code> 提供了早期的 Signals 整合，
    讓開發者可以預覽未來的開發體驗。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 未來的 Lit + TC39 Signals 開發體驗（概念預覽）
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

// 應用級共享 Signals（框架無關）
export const cartItems = new Signal.State&lt;CartItem[]&gt;([]);
export const cartTotal = new Signal.Computed(() =&gt;
  cartItems.get().reduce((sum, item) =&gt; sum + item.price, 0)
);

// Lit 元件：混入 SignalWatcher，自動訂閱 Signal
@customElement('cart-icon')
class CartIcon extends SignalWatcher(LitElement) {
  render() {
    // 直接讀取 Signal——不需要 @property 或 @state
    // SignalWatcher 追蹤在 render() 中讀取的所有 Signal
    return html\`
      &lt;button class="cart"&gt;
        🛒 &lt;span class="badge"&gt;\${cartItems.get().length}&lt;/span&gt;
      &lt;/button&gt;
    \`;
  }
}

// React 元件：同樣的 Signal，但用 React 的方式訂閱
// （未來可能透過 @preact/signals-react 或類似套件）
function ReactCartIcon() {
  // 同一個 cartItems Signal，跨框架共享！
  const count = useSignal(cartItems); // 假設的 React Signal hook
  return &lt;button&gt;🛒 {count.length}&lt;/button&gt;;
}</code></pre>

  <h3>Signals 對 Lit 的具體改善</h3>
  <ul>
    <li>
      <strong>更細粒度的更新</strong>：目前 Lit 以「元件」為更新單位，
      Signals 可以讓更新精細到「模板中的單個表達式」
    </li>
    <li>
      <strong>跨元件共享狀態更自然</strong>：不需要 Context API，
      直接共享 Signal 物件
    </li>
    <li>
      <strong>與 React 的狀態互通</strong>：同一個 Signal 可以在 Lit 和 React 元件中使用，
      真正解決微前端的狀態共享問題
    </li>
  </ul>
</section>

<section id="declarative-custom-elements">
  <h2>Declarative Custom Elements</h2>
  <p>
    目前建立 Custom Element 必須使用 JavaScript：<code>customElements.define()</code>。
    有一個正在討論的提案：允許在 HTML 中宣告式地定義 Custom Elements，
    無需 JavaScript。
  </p>

  <pre data-lang="html"><code class="language-html">&lt;!-- 假設的未來語法（提案中，不保證實現）--&gt;
&lt;definition name="my-greeting"&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;
      p { color: var(--greeting-color, #FF6D00); }
    &lt;/style&gt;
    &lt;p&gt;Hello, &lt;slot&gt;World&lt;/slot&gt;!&lt;/p&gt;
  &lt;/template&gt;
&lt;/definition&gt;

&lt;!-- 使用 --&gt;
&lt;my-greeting&gt;Lit&lt;/my-greeting&gt;</code></pre>

  <p>
    這個提案如果實現，將讓 Web Components 在不依賴 JavaScript 的情況下可用，
    對 SSR、SEO 和 Progressive Enhancement 有重大意義。
  </p>

  <div class="callout callout-info">
    <div class="callout-title">提案現狀</div>
    <p>
      Declarative Custom Elements 目前是 WHATWG/W3C 討論中的概念，
      尚未進入正式標準流程。實際語法和功能可能與上述示例完全不同。
      但這個方向代表了 Web Components 標準化的重要趨勢。
    </p>
  </div>
</section>

<section id="css-scope">
  <h2>CSS @scope 與 Shadow DOM 的未來</h2>
  <p>
    CSS <code>@scope</code> 是 CSS 的新特性（Chrome 118+，Safari 17.4+），
    讓你可以在不使用 Shadow DOM 的情況下建立 CSS 作用域。
    這對 Web Components 的定位有重要影響。
  </p>

  <pre data-lang="css"><code class="language-css">/* CSS @scope：限制樣式的作用範圍 */
@scope (.card) {
  /* 這個 p 樣式只影響 .card 內部的 p 元素 */
  p {
    color: #333;
    line-height: 1.6;
  }

  /* 可以設定「排除」範圍 */
  @scope (.card) to (.nested-card) {
    /* 只影響 .card 到 .nested-card 之間的元素，不進入 .nested-card */
    h2 { font-size: 1.5rem; }
  }
}</code></pre>

  <h3>@scope vs Shadow DOM</h3>
  <table>
    <thead>
      <tr><th>特性</th><th>CSS @scope</th><th>Shadow DOM</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>CSS 封裝</td>
        <td>有（選擇器作用域）</td>
        <td>有（完整隔離）</td>
      </tr>
      <tr>
        <td>JS 封裝</td>
        <td>無</td>
        <td>有</td>
      </tr>
      <tr>
        <td>querySelector</td>
        <td>外部可查詢</td>
        <td>外部無法查詢</td>
      </tr>
      <tr>
        <td>Slots</td>
        <td>無</td>
        <td>有</td>
      </tr>
      <tr>
        <td>SSR 支援</td>
        <td>天然支援</td>
        <td>需要 DSD</td>
      </tr>
      <tr>
        <td>採用成本</td>
        <td>低（純 CSS）</td>
        <td>中（需要 JS）</td>
      </tr>
    </tbody>
  </table>
  <p>
    <code>@scope</code> 不會取代 Shadow DOM，而是補充它。
    對於只需要 CSS 封裝的場景（如設計系統的基礎樣式），
    <code>@scope</code> 提供了一個更輕量的選項。
  </p>
</section>

<section id="wc-standards-gaps">
  <h2>Web Components 現有缺口與補足</h2>
  <p>
    誠實面對 Web Components 目前的不足，有助於做出更好的技術選型。
  </p>

  <h3>已知缺口</h3>
  <ul>
    <li>
      <strong>表單整合</strong>：Web Components 無法原生參與 HTML 表單（<code>&lt;form&gt;</code>）。
      解決方案：<strong>ElementInternals API</strong> + <code>attachInternals()</code>，
      讓 Custom Elements 成為真正的表單控制元件。
    </li>
    <li>
      <strong>CSS 選擇器</strong>：目前無法從外部 CSS 選中 Shadow DOM 內的特定元素
      （只能透過 CSS Custom Properties）。
      <code>::part()</code> 偽元素提供了部分解決方案。
    </li>
    <li>
      <strong>Server-Side Rendering</strong>：Declarative Shadow DOM 解決了基礎問題，
      但 Hydration 生態仍不如 Next.js/Nuxt.js 成熟。
    </li>
    <li>
      <strong>跨 Shadow DOM 的 ARIA</strong>：可存取性（Accessibility）在 Shadow DOM 邊界的傳遞
      需要 ARIA reflection 機制。<code>ElementInternals</code> 的 ARIA mixin 正在解決這個問題。
    </li>
  </ul>

  <h3>ElementInternals：真正的表單整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 讓 Custom Element 成為真正的表單元件
@customElement('custom-checkbox')
class CustomCheckbox extends LitElement {
  // 宣告這是一個表單關聯元素
  static formAssociated = true;

  private _internals: ElementInternals;
  @state() private _checked = false;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _toggle() {
    this._checked = !this._checked;
    // 設定表單值
    this._internals.setFormValue(this._checked ? 'on' : null);
    // 設定 ARIA
    this._internals.ariaChecked = String(this._checked);
  }

  render() {
    return html\`
      &lt;div
        role="checkbox"
        @click=\${this._toggle}
        class=\${this._checked ? 'checked' : ''}
      &gt;
        \${this._checked ? '✓' : ''}
      &lt;/div&gt;
    \`;
  }
}

// 現在可以在 &lt;form&gt; 中正常使用
// &lt;form&gt;
//   &lt;custom-checkbox name="agree"&gt;&lt;/custom-checkbox&gt;
//   &lt;button type="submit"&gt;提交&lt;/button&gt;
// &lt;/form&gt;
// 提交時 FormData 會包含 agree: "on"</code></pre>
</section>

<section id="future-outlook">
  <h2>展望：下一個十年的 Web 元件</h2>
  <p>
    站在 2024 年，我們可以清晰地看到幾個收斂的趨勢：
  </p>

  <h3>趨勢一：瀏覽器平台持續增強</h3>
  <p>
    每年都有新的 Web Platform API 出現：
    View Transitions API、Popover API、CSS Nesting、Container Queries、
    CSS @scope、Declarative Shadow DOM……
    這些原生能力讓框架的「必要性」在某些場景下降低。
  </p>

  <h3>趨勢二：框架向 Web Components 靠攏</h3>
  <p>
    Angular 17+ 的 Signals 設計借鑒了 TC39 Signals。
    React 19 改善了 Web Components 支援。
    Vue 3 允許直接使用 Web Components。
    所有主流框架都在向 Web 標準靠攏，而非遠離它。
  </p>

  <h3>趨勢三：Lit 的定位更清晰</h3>
  <p>
    Lit 不是 React 或 Vue 的競爭對手，而是<strong>基礎設施層</strong>的工具。
    它最終的成功形態可能是：
    「大多數人不知道 Lit，但他們用的設計系統是用 Lit 建的。」
  </p>

  <h3>給開發者的建議</h3>
  <div class="callout callout-tip">
    <div class="callout-title">投資 Web 平台，而非特定框架</div>
    <p>
      學習 Web Components、CSS Custom Properties、Intersection Observer、
      ResizeObserver、Web Animations API……這些是瀏覽器平台的一部分，
      你學到的知識不會因為某個框架的衰退而過時。
      Lit 是學習這些技術的絕佳起點，因為它讓你直接面對平台，
      而不是在抽象層背後學習。
    </p>
  </div>

  <h3>Web Components 的長期價值</h3>
  <p>
    2010 年寫的 jQuery 程式碼在 2024 年的瀏覽器中仍然可以運行。
    2013 年寫的 Custom Elements 仍然有效。
    Web 平台對向後相容性有幾乎宗教般的堅持。
  </p>
  <p>
    當你選擇擁抱 Web Components 標準時，你投資的是一個
    <strong>以十年為單位的平台</strong>，而不是一個以版本為單位的框架。
  </p>
  <p>
    這，或許是 Lit 最深刻的價值所在。
  </p>
</section>
`};export{t as default};
