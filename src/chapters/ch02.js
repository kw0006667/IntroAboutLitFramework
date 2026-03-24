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
      <strong>不造 Router</strong>：Lit 沒有官方 Router，推薉使用瀏覽器原生的
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

  <div class="callout callout-tip">
    <div class="callout-title">對照比較</div>
    <p>
      React 18 + ReactDOM：約 44KB gzipped。Vue 3 Runtime + Compiler：約 33KB gzipped。
      Angular 核心模組（僅框架部分）：約 60KB+ gzipped。Lit：約 5KB gzipped。
      這不是說其他框架「不好」，但當你的應用場景需要最大效能（設計系統、微前端組件、嵌入式 Widget）時，
      這個差距是決定性的。
    </p>
  </div>
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
  </p>
</section>
`,
};
