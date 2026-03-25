export default {
  id: 2,
  slug: 'chapter-2',
  title: '認識 Lit：設計哲學與核心理念',
  part: 1,
  intro: 'Lit 為什麼選擇擁抱平台（Embrace the Platform），而不是抽象它？探討 Lit 的極簡主義設計與零框架鎖定（no framework lock-in）的哲學根基。',
  sections: [
    { slug: 'embrace-the-platform', title: 'Embrace the Platform 哲學' },
    { slug: 'minimalism-design', title: '極簡主義的設計取捨' },
    { slug: 'no-framework-lock-in', title: '零框架鎖定的承諾' },
    { slug: 'lit-architecture-overview', title: 'Lit 架構全覽' },
    { slug: 'lit-source-internals', title: 'Lit 原始碼架構解析' },
    { slug: 'tradeoff-analysis', title: '深度取捨分析：何時不適合用 Lit？' },
    { slug: 'when-to-choose-lit', title: '何時選擇 Lit？' },
  ],
  content: `
<section id="embrace-the-platform">
  <h2>Embrace the Platform 哲學</h2>
  <p>
    在眾多前端框架中，Lit 有一個鮮明的哲學立場：
    <strong>擁抱平台（Embrace the Platform），而非抽象它</strong>。
    這句話背後隱藏著深刻的工程智慧。
  </p>
  <p>
    大多數框架的設計出發點是「瀏覽器 API 不夠好，我們來提供一個更好的抽象層」。
    Angular 有自己的依賴注入系統、模板編譯器、變更偵測機制。
    React 有 Virtual DOM、合成事件系統（Synthetic Events）。
    這些抽象層確實解決了問題，但也帶來了自己的複雜度。
  </p>
  <p>
    Lit 的答案截然不同：<em>當瀏覽器平台已經提供了好的解決方案，就直接使用它</em>。
  </p>

  <h3>平台優先的具體體現</h3>
  <ul>
    <li>
      <strong>不用合成事件</strong>：Lit 直接使用瀏覽器原生事件系統，
      <code>@click</code> 就是 <code>addEventListener('click', ...)</code> 的語法糖
    </li>
    <li>
      <strong>不用虛擬 DOM</strong>：直接操作真實 DOM，
      透過 <code>lit-html</code> 的 Part 系統精確定位需要更新的節點
    </li>
    <li>
      <strong>不抽象 CSS</strong>：使用原生 CSS，包括 CSS Custom Properties、
      CSS Grid、Container Queries，而非 CSS-in-JS 或 CSS Modules
    </li>
    <li>
      <strong>不造 Router</strong>：Lit 沒有官方 Router，推薦使用瀏覽器原生的
      History API 或輕量的第三方 Router
    </li>
    <li>
      <strong>不包裝 Fetch</strong>：直接使用 <code>fetch()</code> API 或
      <code>@lit-labs/task</code>，不提供框架層面的 HTTP 抽象
    </li>
  </ul>

  <div class="callout callout-info">
    <div class="callout-title">這不是偷懶</div>
    <p>
      「擁抱平台」聽起來像是「不做事」，但這是一個深思熟慮的決策。
      當你依賴框架抽象時，你依賴的是框架作者的判斷，以及他們維護那個抽象的持續投入。
      當你依賴瀏覽器 API 時，你依賴的是 W3C 和瀏覽器廠商——這些組織有法律承諾維護向後相容性。
    </p>
  </div>

  <h3>「平台演進，框架跟上」的成本</h3>
  <p>
    思考一個具體例子：CSS Grid。2017 年各大瀏覽器開始支援 CSS Grid，
    這是一個改變佈局開發的革命性功能。
    對於使用原生 CSS 的開發者，可以立即享受這個功能。
    但對於使用 CSS-in-JS 方案的 React 開發者，
    必須等待 styled-components 或 Emotion 更新支援，
    然後升級依賴，然後可能面對 API 的 Breaking Changes。
  </p>
  <p>
    這個模式在前端歷史中反復出現。
    擁抱平台意味著你能<strong>第一時間享受平台演進帶來的紅利</strong>，
    而不是透過框架的稜鏡折射。
  </p>

  <h3>React 合成事件系統的教訓</h3>
  <p>
    React 的 Synthetic Events 系統是「不擁抱平台」成本的典型案例。
    React 在 v17 之前使用事件委派（Event Delegation）——將所有事件統一掛載在 <code>document</code> 上，
    而非元素本身。這個設計在 Web Components 出現後造成了嚴重問題：
    Shadow DOM 內部的事件在穿越 Shadow Boundary 時，其 <code>target</code> 會被重新映射（Retargeting），
    這讓 React 的合成事件系統無法正確識別事件來源。
  </p>
  <p>
    React 17 不得不將事件委派從 <code>document</code> 改為 React 的根節點（root container），
    這是一個破壞性的底層變更，專門為了修復與 Web Components 的相容性問題。
    如果 React 從一開始就直接使用原生事件，這個問題根本不會存在。
  </p>
</section>

<section id="minimalism-design">
  <h2>極簡主義的設計取捨</h2>
  <p>
    Lit 的核心大小約為 <strong>5KB gzipped</strong>，這個數字不是偶然的，
    而是一系列刻意取捨的結果。
  </p>

  <h3>Lit 提供什麼</h3>
  <ul>
    <li><strong>LitElement</strong>：一個輕量的 <code>HTMLElement</code> 基礎類別，整合響應式更新</li>
    <li><strong>lit-html</strong>：Tagged Template Literals 模板引擎</li>
    <li><strong>Reactive Properties</strong>：<code>@property</code> 和 <code>@state</code> 裝飾器</li>
    <li><strong>生命週期鉤子</strong>：整合 Web Components 生命週期的響應式版本</li>
    <li><strong>Reactive Controllers</strong>：可復用邏輯的封裝機制</li>
  </ul>

  <h3>Lit 故意不提供什麼</h3>
  <ul>
    <li>全域狀態管理（沒有 Redux、Pinia、MobX 等）</li>
    <li>客戶端路由系統</li>
    <li>HTTP 請求封裝</li>
    <li>表單驗證系統</li>
    <li>國際化（i18n）內建支援</li>
    <li>動畫系統（雖然 <code>@lit-labs/motion</code> 作為實驗性套件存在）</li>
  </ul>

  <p>
    這些「缺失」是設計決策，不是遺漏。
    每增加一個功能，Lit 就需要對它的 API 設計作出承諾，並長期維護它。
    Lit 選擇聚焦在它最擅長的事：<strong>讓 Web Components 的開發體驗盡可能好</strong>。
  </p>

  <h3>詳細的包大小比較</h3>
  <table>
    <thead>
      <tr><th>框架 / 函式庫</th><th>版本</th><th>Min+Gzip</th><th>Parse Time（低端設備）</th><th>備註</th></tr>
    </thead>
    <tbody>
      <tr><td>Lit</td><td>3.x</td><td>~5KB</td><td>~5ms</td><td>包含 lit-html + LitElement</td></tr>
      <tr><td>Preact</td><td>10.x</td><td>~4KB</td><td>~4ms</td><td>不含 hooks，需另外引入</td></tr>
      <tr><td>Vue 3 Runtime</td><td>3.x</td><td>~22KB</td><td>~30ms</td><td>不含 Compiler</td></tr>
      <tr><td>React 18 + ReactDOM</td><td>18.x</td><td>~44KB</td><td>~60ms</td><td>生產模式</td></tr>
      <tr><td>Angular（核心）</td><td>17.x</td><td>~60KB+</td><td>~80ms+</td><td>最小化後仍包含大量 Runtime</td></tr>
      <tr><td>Microsoft FAST Element</td><td>2.x</td><td>~8KB</td><td>~8ms</td><td>含 Design Token 系統</td></tr>
      <tr><td>Stencil.js（Runtime）</td><td>4.x</td><td>~15KB</td><td>~20ms</td><td>編譯後每個元件另計</td></tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">包大小對業務的真實影響</div>
    <p>
      Google 的研究顯示，頁面載入時間每增加 100ms，電商轉化率下降約 1%。
      在 3G 網路（仍是部分新興市場的主流連接）上，下載 44KB（React）vs 5KB（Lit）
      的差距約為 300-400ms。這個差距在全球最大市場（印度、東南亞、非洲）的用戶體驗上是決定性的。
      對於設計系統或 Widget 這類需要多次引入的程式碼，這個差距還會疊加。
    </p>
  </div>

  <h3>小即是美</h3>
  <p>
    5KB 的意義不只是「快」。它意味著：
  </p>
  <ul>
    <li>在 CDN 上直接引用，不需要構建步驟</li>
    <li>在 Edge Runtime 上執行，沒有冷啟動問題</li>
    <li>在低端設備上解析和執行的時間極短</li>
    <li>整個套件的原始碼可以在一個小時內通讀完畢</li>
  </ul>
</section>

<section id="no-framework-lock-in">
  <h2>零框架鎖定的承諾</h2>
  <p>
    Lit 最重要的優勢之一，是它產生的是<strong>真正的 Web Components</strong>，
    而不是「Lit 元件」。這個區別至關重要。
  </p>

  <h3>跨框架互通的現實</h3>
  <p>
    用 Lit 建立的 <code>&lt;my-button&gt;</code>，可以在以下環境中直接使用，
    無需任何 Wrapper 或橋接層：
  </p>
  <pre data-lang="html"><code class="language-html">&lt;!-- 在純 HTML 中使用 --&gt;
&lt;my-button variant="primary"&gt;Click me&lt;/my-button&gt;

&lt;!-- 在 React JSX 中（需要少量注意事項） --&gt;
&lt;my-button variant="primary" onClick={handleClick}&gt;Click me&lt;/my-button&gt;

&lt;!-- 在 Vue 模板中 --&gt;
&lt;my-button variant="primary" @click="handleClick"&gt;Click me&lt;/my-button&gt;

&lt;!-- 在 Angular 模板中 --&gt;
&lt;my-button variant="primary" (click)="handleClick()"&gt;Click me&lt;/my-button&gt;

&lt;!-- 在 Svelte 中 --&gt;
&lt;my-button variant="primary" on:click={handleClick}&gt;Click me&lt;/my-button&gt;</code></pre>

  <p>
    這種跨框架相容性對於以下場景尤其寶貴：
  </p>
  <ul>
    <li><strong>企業設計系統</strong>：需要跨多個技術棧的團隊共享 UI 元件</li>
    <li><strong>微前端架構</strong>：不同子應用可能使用不同框架</li>
    <li><strong>嵌入式 Widget</strong>：第三方 Widget 需要在任意頁面環境中工作</li>
    <li><strong>長期專案</strong>：今天的技術決策不應鎖定五年後的技術選擇</li>
  </ul>

  <h3>React 整合的細節</h3>
  <p>
    React 與 Web Components 的整合有兩個摩擦點值得深入了解：
  </p>
  <ul>
    <li>
      <strong>複雜物件 Prop 的傳遞</strong>：React 19 之前，React 只能向 Custom Elements 傳遞字串屬性（Attributes），
      無法直接傳遞 JavaScript 物件（Properties）。這是因為 React 的 JSX 編譯器將所有 Prop 視為 HTML Attribute。
      解決方案是使用 <code>ref</code> 手動設定 Property，或使用 <code>@lit/react</code> 建立 React Wrapper。
      React 19 已改善此問題，能夠自動區分 Attribute 和 Property。
    </li>
    <li>
      <strong>自訂事件（CustomEvent）</strong>：React 的 JSX 事件系統使用 <code>onXxx</code> 命名，
      但 Custom Elements 觸發的自訂事件（如 <code>count-change</code>）無法直接用 JSX 的事件語法監聽。
      需要使用 <code>ref</code> 加上 <code>addEventListener</code>，或使用 <code>@lit/react</code>。
    </li>
  </ul>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 @lit/react 建立 React Wrapper（推薦方式）
import { createComponent } from '@lit/react';
import React from 'react';
import { MyCounter } from './my-counter.js';

export const MyCounterReact = createComponent({
  tagName: 'my-counter',
  elementClass: MyCounter,
  react: React,
  events: {
    onCountChange: 'count-change', // 映射自訂事件到 React Prop
  },
});

// 現在可以在 React 中自然地使用
// &lt;MyCounterReact count={5} onCountChange={(e) =&gt; console.log(e.detail)} /&gt;</code></pre>

  <h3>未來的框架變遷</h3>
  <p>
    前端框架的更新換代速度是驚人的。2010 年的主流是 Backbone，
    2013 年是 AngularJS，2016 年是 React，2024 年可能是 Solid 或 Qwik。
    這個週期大約每五年一輪。
  </p>
  <p>
    用 Lit 寫的 Web Components，在任何一個新框架中都可以直接使用，
    因為<strong>所有框架都需要和 HTML 標準相容</strong>。
    你的投資是對 Web 平台本身的投資，而不是對某個公司框架的投資。
  </p>

  <div class="callout callout-warning">
    <div class="callout-title">注意事項</div>
    <p>
      Web Components 與 React 的整合在事件系統和複雜物件 Prop 傳遞上有一些摩擦點，
      我們會在 Chapter 12 詳細討論 <code>@lit/react</code> 解決方案。
    </p>
  </div>
</section>

<section id="lit-architecture-overview">
  <h2>Lit 架構全覽</h2>
  <p>
    理解 Lit 的整體架構有助於在開發時做出更好的決策。
    Lit 由幾個相互協作的層次組成：
  </p>

  <h3>第一層：lit-html</h3>
  <p>
    <code>lit-html</code> 是 Lit 的模板引擎，獨立存在（可以不使用 LitElement）。
    它接受 HTML Tagged Template Literals，透過 <code>render()</code> 函數將模板渲染到 DOM。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">import { html, render } from 'lit';

// 純函數風格，不需要 LitElement
const template = (name) =&gt; html\`&lt;p&gt;Hello, &lt;strong&gt;\${name}&lt;/strong&gt;!&lt;/p&gt;\`;

render(template('World'), document.body);
// 稍後更新：只有 "World" 部分的 DOM 節點會被更新
render(template('Lit'), document.body);</code></pre>

  <h3>第二層：LitElement</h3>
  <p>
    <code>LitElement</code> 繼承自 <code>HTMLElement</code>，
    將 <code>lit-html</code> 整合到 Web Components 的生命週期中，
    並加入響應式屬性系統。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-greeting')
class MyGreeting extends LitElement {
  static styles = css\`
    :host { display: block; }
    p { color: var(--greeting-color, #333); }
  \`;

  @property() name = 'World';

  render() {
    return html\`&lt;p&gt;Hello, &lt;strong&gt;\${this.name}&lt;/strong&gt;!&lt;/p&gt;\`;
  }
}</code></pre>

  <h3>第三層：Reactive Controllers</h3>
  <p>
    Reactive Controllers 是 Lit 2.0 引入的可復用邏輯封裝機制。
    類似 React Hooks，但基於類別（Class）而非函數（Function）。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">// 一個可復用的 Clock Controller
class ClockController {
  constructor(host, updateInterval = 1000) {
    this.host = host;
    this.interval = updateInterval;
    host.addController(this);
  }

  hostConnected() {
    this._timer = setInterval(() =&gt; {
      this.value = new Date();
      this.host.requestUpdate();
    }, this.interval);
  }

  hostDisconnected() {
    clearInterval(this._timer);
  }
}

// 在任何 LitElement 中使用
@customElement('my-clock')
class MyClock extends LitElement {
  clock = new ClockController(this);

  render() {
    return html\`&lt;p&gt;現在時刻：\${this.clock.value?.toLocaleTimeString()}&lt;/p&gt;\`;
  }
}</code></pre>

  <h3>第四層：@lit-labs 實驗性套件</h3>
  <p>
    <code>@lit-labs</code> 命名空間下有許多實驗性功能，
    是「預覽版」的 Lit 生態：
    <code>@lit-labs/task</code>（非同步任務管理）、
    <code>@lit-labs/motion</code>（動畫）、
    <code>@lit-labs/virtualizer</code>（虛擬滾動）等。
    我們會在 Chapter 21 詳細介紹。
  </p>
</section>

<section id="lit-source-internals">
  <h2>Lit 原始碼架構解析</h2>
  <p>
    對有志深入的資深工程師，理解 Lit 的內部實作不只是學術興趣——
    它直接影響你如何除錯效能問題、如何正確擴展 Lit 元件、以及如何評估 Lit 在邊緣案例的行為。
  </p>

  <h3>三層類別繼承體系</h3>
  <p>
    Lit 的核心類別形成一個清晰的三層繼承鏈：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 繼承鏈（從底層到高層）：
// HTMLElement（瀏覽器原生）
//   → ReactiveElement（@lit/reactive-element 套件）
//     → LitElement（lit 套件）
//       → 你的元件

// ReactiveElement 負責：
// - 響應式屬性系統（@property, @state）
// - 更新排程（Microtask-based batching）
// - 生命週期：requestUpdate, performUpdate, scheduleUpdate

// LitElement 負責：
// - 將 lit-html 的 render() 整合到 ReactiveElement 的更新週期
// - 提供 static styles 的 CSS 採用機制（CSSStyleSheet）
// - 提供 createRenderRoot()（預設建立 Shadow DOM）</code></pre>

  <h3>lit-html 的 Part 系統</h3>
  <p>
    lit-html 的核心是 <strong>Part 系統</strong>——一套追蹤動態表達式在 DOM 中位置的機制。
    理解這個系統能幫你明白為什麼 Lit 的更新如此高效。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// lit-html 內部運作的概念性說明（非完整原始碼）

// 當你第一次執行：
const result = html\`&lt;div class=\${cls}&gt;\${content}&lt;/div&gt;\`;

// lit-html 做了兩件事：
// 1. 解析靜態字串部分，建立 Template：
//    strings = ['&lt;div class="', '"&gt;', '&lt;/div&gt;']
//    這只發生一次（利用 WeakMap 快取 Template 實例）

// 2. 建立 TemplateResult，記錄動態 values：
//    values = [cls, content]

// 第二次渲染時（值改變了）：
// 1. 比較新舊 values 陣列的每個元素
// 2. 只更新改變的 Part 對應的 DOM 節點
// 3. 靜態 HTML 字串的 DOM 節點完全不觸碰

// 這比 innerHTML 快的根本原因：
// innerHTML 每次都要：重新解析整個字串 → 銷毀舊 DOM → 建立新 DOM
// lit-html 只需要：比較 values 陣列 → 更新對應 DOM 節點（最小化操作）</code></pre>

  <h3>響應式更新的排程機制</h3>
  <p>
    Lit 的響應式更新是<strong>非同步批次</strong>的——這是一個關鍵的效能設計決策。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 假設你有：
@customElement('my-element')
class MyElement extends LitElement {
  @property({ type: Number }) a = 0;
  @property({ type: Number }) b = 0;
  @property({ type: String }) c = '';

  render() {
    return html\`\${this.a} \${this.b} \${this.c}\`;
  }
}

// 如果你在同一個同步執行上下文中連續修改多個屬性：
element.a = 1;
element.b = 2;
element.c = 'hello';

// Lit 不會觸發三次 render()！
// 它的更新排程是這樣工作的：
// 1. a = 1 → 呼叫 requestUpdate()，排程一個 Microtask
// 2. b = 2 → 呼叫 requestUpdate()，但 Microtask 已排程，跳過
// 3. c = 'hello' → 同上
// 4. 當前同步程式碼執行完畢
// 5. Microtask 執行 → 只觸發一次 render()，反映所有三個改變

// 這等同於 React 的 batching，但 Lit 是透過 Promise.resolve() 實作的
// 可以在 await element.updateComplete 之後確認渲染已完成：
element.a = 1;
element.b = 2;
await element.updateComplete;
// 此時 DOM 已反映最新狀態</code></pre>

  <h3>CSS 採用機制（CSSStyleSheet）</h3>
  <p>
    Lit 使用 <strong>Constructable Stylesheets</strong>（<code>CSSStyleSheet</code> API）
    來最大化 CSS 的復用效率：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 傳統方式：每個元件實例都有自己的 &lt;style&gt; 標籤
// 100 個 &lt;my-button&gt; 實例 = 100 個重複的 &lt;style&gt; 標籤

// Lit 的方式（使用 Constructable Stylesheets）：
// 1. 第一次建立元件時，將 static styles 解析為 CSSStyleSheet 物件
// 2. 同一個 CSSStyleSheet 物件被所有實例的 Shadow Root 共享
//    透過 shadowRoot.adoptedStyleSheets = [sharedSheet]
// 3. 瀏覽器只需解析 CSS 一次，記憶體中只有一份 CSS 規則

// 這對於有大量重複元件（如資料表格中的每個 cell）的場景
// 可以顯著降低記憶體使用和解析時間

// 在不支援 Constructable Stylesheets 的瀏覽器（舊版 Safari）：
// Lit 自動降級為 &lt;style&gt; 標籤方案，但依然只建立一個 style 元素並複製</code></pre>

  <h3>Reactive Controllers 的底層介面</h3>
  <p>
    Reactive Controllers 是 Lit 2.0 中最精心設計的 API 之一，
    它定義了一個清晰的 <code>ReactiveController</code> 介面：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// ReactiveController 介面（來自 @lit/reactive-element）
interface ReactiveController {
  // 元件連接到 DOM 時呼叫
  hostConnected?(): void;
  // 元件從 DOM 移除時呼叫
  hostDisconnected?(): void;
  // 在元件更新（update）前呼叫
  hostUpdate?(): void;
  // 在元件更新（update）後呼叫
  hostUpdated?(): void;
}

// ReactiveControllerHost 介面（LitElement 實作了它）
interface ReactiveControllerHost {
  addController(controller: ReactiveController): void;
  removeController(controller: ReactiveController): void;
  requestUpdate(): void;
  readonly updateComplete: Promise&lt;boolean&gt;;
}

// 這個介面設計的優雅之處：
// 任何實作了 ReactiveControllerHost 的物件都可以使用 Controller
// 不只是 LitElement，也可以是其他自訂的 Host 類別
// 這使得 Lit 的 Controller 生態可以在 Lit 之外復用</code></pre>

  <h3>與 React Hooks 的架構比較</h3>
  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>React Hooks</h4>
      <ul>
        <li>基於函數呼叫順序（依賴 Hook 呼叫的順序不變）</li>
        <li>狀態存在 React 的 Fiber 節點中，不在物件實例上</li>
        <li>每次渲染都重新執行函數體，需要 useMemo/useCallback 優化</li>
        <li>不能在條件語句或迴圈中使用（Hook Rules）</li>
        <li>可組合性強，但副作用管理依賴 useEffect 的依賴陣列</li>
      </ul>
    </div>
    <div class="comparison-card">
      <h4>Lit Reactive Controllers</h4>
      <ul>
        <li>基於物件實例（類別），無順序依賴</li>
        <li>狀態存在 Controller 物件本身上</li>
        <li>生命週期方法只在適當時機呼叫，無需 memo 優化</li>
        <li>可以在任何位置建立，無使用規則限制</li>
        <li>副作用在 hostConnected/hostDisconnected 中明確管理</li>
      </ul>
    </div>
  </div>
</section>

<section id="tradeoff-analysis">
  <h2>深度取捨分析：何時不適合用 Lit？</h2>
  <p>
    優秀的工程師不只知道工具的優勢，更能清醒地認識它的局限。
    以下是 Lit 在特定場景的真實局限，以及替代方案的考量。
  </p>

  <h3>Lit vs Stencil.js：編譯時 vs Runtime</h3>
  <p>
    Stencil.js（由 Ionic 團隊開發）是 Lit 最直接的競爭對手，但它採用了截然不同的技術路線：
  </p>
  <table>
    <thead>
      <tr><th>特性</th><th>Lit</th><th>Stencil.js</th></tr>
    </thead>
    <tbody>
      <tr><td>更新策略</td><td>Runtime Template Diff（lit-html Part 系統）</td><td>編譯時靜態分析 + 精細 DOM 更新</td></tr>
      <tr><td>Runtime 大小</td><td>~5KB gzipped</td><td>~15KB（含 Lazy Loading 機制）</td></tr>
      <tr><td>TypeScript 整合</td><td>需要裝飾器，設定較複雜</td><td>一流的 TypeScript 支援，類似 Angular</td></tr>
      <tr><td>框架整合生成</td><td>需手動建立 React/Angular Wrapper</td><td>自動生成 React/Angular/Vue Wrapper</td></tr>
      <tr><td>服務端渲染</td><td>@lit-labs/ssr（較複雜）</td><td>內建 Hydration 機制</td></tr>
      <tr><td>設計系統工具</td><td>依賴 Storybook 等第三方</td><td>內建 Storybook 整合</td></tr>
    </tbody>
  </table>
  <div class="callout callout-info">
    <div class="callout-title">什麼時候選 Stencil？</div>
    <p>
      如果你的主要目標是建立一個需要<strong>自動生成多框架 Wrapper</strong>（React、Angular、Vue 的 npm 套件）的設計系統，
      Stencil 的工具鏈比 Lit 更成熟。Ionic 自己的元件庫就是 Stencil 的最佳廣告。
      如果你的目標是構建應用或不需要多框架發布，Lit 的輕量和簡潔更有優勢。
    </p>
  </div>

  <h3>Lit vs Microsoft FAST：設計令牌系統</h3>
  <p>
    如果你的設計系統需要強大的<strong>Design Token 系統</strong>（主題化、色彩方案切換、自適應密度），
    FAST 內建的 Design Token 機制比 Lit + CSS Custom Properties 的手工方案更系統化。
    FAST 的 DesignToken API 允許程式化地定義和計算令牌，而不只是靜態的 CSS 變數。
  </p>

  <h3>Lit 的真實局限</h3>
  <ul>
    <li>
      <strong>SSR 成熟度不足</strong>：<code>@lit-labs/ssr</code> 仍是實驗性的，
      Declarative Shadow DOM 的水合（Hydration）語義還在演進中。
      如果 SEO 是核心需求，Next.js + React 目前仍是更成熟的選擇。
    </li>
    <li>
      <strong>全域狀態管理需要額外方案</strong>：Lit 沒有等同於 Redux、Zustand 或 Pinia 的官方狀態管理方案。
      <code>@lit/context</code>（基於 Context Protocol）是輕量選項，但對於複雜的跨元件狀態仍需整合第三方方案（如 MobX 的 Observable）。
    </li>
    <li>
      <strong>模板型別安全限制</strong>：Tagged Template Literals 在 TypeScript 中缺乏完整的型別推斷。
      <code>lit-analyzer</code> 提供了 lint-level 的靜態分析，但無法達到 Angular 模板編譯器級別的型別安全。
      傳遞錯誤型別的 Property 到自訂元素，編譯期間不一定能捕獲。
    </li>
    <li>
      <strong>測試工具生態較小</strong>：React Testing Library 的生態豐富度遠超 Lit 的測試方案（<code>@web/test-runner</code> + <code>@open-wc/testing</code>）。
      熟悉這個測試棧需要額外的學習成本。
    </li>
    <li>
      <strong>Server Components 無對應方案</strong>：React Server Components 允許部分 UI 在伺服器端以零 JS 的方式渲染，
      這個架構模式在 Web Components 生態中目前沒有等效方案。
    </li>
  </ul>

  <h3>框架選擇的決策矩陣</h3>
  <table>
    <thead>
      <tr><th>場景</th><th>推薦方案</th><th>理由</th></tr>
    </thead>
    <tbody>
      <tr><td>跨框架設計系統</td><td>Lit</td><td>最小 Runtime，真正的 Web Components 輸出</td></tr>
      <tr><td>需自動生成多框架 Wrapper 的元件庫</td><td>Stencil.js</td><td>內建工具鏈支援</td></tr>
      <tr><td>企業全棧應用（含 SSR、路由、表單）</td><td>React/Next.js 或 Vue/Nuxt</td><td>成熟的全棧生態</td></tr>
      <tr><td>嵌入式 Widget / 微前端葉節點</td><td>Lit 或原生 Web Components</td><td>最小化 JS payload</td></tr>
      <tr><td>Microsoft 設計系統 / Fluent UI</td><td>FAST</td><td>與 Fluent 深度整合</td></tr>
      <tr><td>Ionic 行動應用</td><td>Stencil.js</td><td>Ionic 的原生技術棧</td></tr>
      <tr><td>需要豐富動畫的互動應用</td><td>React + Framer Motion</td><td>React 動畫生態更成熟</td></tr>
    </tbody>
  </table>
</section>

<section id="when-to-choose-lit">
  <h2>何時選擇 Lit？</h2>
  <p>
    Lit 並非萬能解藥。了解它的最佳使用場景，同樣重要。
  </p>

  <h3>Lit 最適合的場景</h3>
  <ul>
    <li>
      <strong>設計系統 / Component Library</strong>：需要跨框架共享 UI 元件時，
      Web Components 是最佳選擇，Lit 是最好的建構工具
    </li>
    <li>
      <strong>微前端架構</strong>：各子應用使用不同框架，但需要共享核心 UI 元件
    </li>
    <li>
      <strong>長壽命專案</strong>：需要考慮未來十年的維護性，
      不希望被單一框架的版本升級路徑所綁定
    </li>
    <li>
      <strong>極致效能場景</strong>：需要最小的 JavaScript payload，
      例如電商首頁、媒體網站
    </li>
    <li>
      <strong>嵌入式 Widget</strong>：需要在第三方頁面嵌入的功能元件（聊天機器人、反饋按鈕等）
    </li>
    <li>
      <strong>漸進增強</strong>：在伺服器渲染的 HTML 頁面上逐步添加互動性
    </li>
  </ul>

  <h3>可能不適合 Lit 的場景</h3>
  <ul>
    <li>
      <strong>全棧應用需要豐富的框架生態</strong>：如果你需要 Next.js 的 SSR/SSG 生態、
      Nuxt.js 的全棧整合，或 Angular 的企業功能集，那麼 Lit 可能不是主框架的最佳選擇
    </li>
    <li>
      <strong>純 React/Vue 團隊的應用層</strong>：如果整個應用都在 React 生態中，
      沒有跨框架需求，引入 Lit 的額外複雜度未必值得
    </li>
    <li>
      <strong>需要大量 SEO 的內容網站</strong>：雖然 Lit 有 SSR 方案，但成熟度不及 Next.js 等
    </li>
  </ul>

  <div class="callout callout-info">
    <div class="callout-title">Lit 的最佳定位</div>
    <p>
      最理想的使用模式是：<strong>用 Lit 建構可重用的 UI 元件層，
      在應用框架（React/Vue/Angular）中使用這些元件</strong>。
      這樣你能同時享受 Lit 的跨框架優勢和框架的應用級功能。
    </p>
  </div>

  <h3>初學者 vs 資深工程師的視角</h3>
  <p>
    <strong>對初學者</strong>：Lit 是學習 Web Components 標準的絕佳切入點。
    它的 API 與瀏覽器原生 API 保持一致，讓你學到的知識可以直接遷移到純 Web Components 開發。
  </p>
  <p>
    <strong>對資深工程師</strong>：Lit 提供了一個精心設計的低層次抽象，
    讓你能夠完全掌控 DOM 操作、事件系統和渲染週期，
    同時享受現代 JavaScript 特性（裝飾器、Tagged Templates、模組系統）帶來的開發體驗提升。
    最重要的是：Lit 讓你建立的資產是<strong>平台原生的</strong>，
    它的價值不隨框架版本迭代而折舊。
  </p>
</section>
`,
};
