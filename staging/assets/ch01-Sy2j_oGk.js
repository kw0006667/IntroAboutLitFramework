const t={id:1,slug:"chapter-1",title:"Web Components 的前世今生",part:1,intro:"從 jQuery 到 Angular、React、Vue 的框架演化史，解釋為什麼瀏覽器原生標準（Web Components）的誕生是必然的，以及 Polymer → LitElement → Lit 的技術傳承脈絡。",sections:[{slug:"pre-framework-era",title:"框架戰爭前夜"},{slug:"jquery-dominance",title:"jQuery 的稱霸時代"},{slug:"spa-revolution",title:"SPA 框架的崛起"},{slug:"wc-spec-birth",title:"Web Components 規格誕生"},{slug:"polymer-to-lit",title:"Polymer → LitElement → Lit"},{slug:"why-native-wins",title:"為何原生標準終將勝出"}],content:`
<section id="pre-framework-era">
  <h2>框架戰爭前夜</h2>
  <p>
    要理解 Lit，必須先回到 Web 開發的起點。2005 年前後，前端開發的主要挑戰是
    <strong>瀏覽器相容性</strong>。Internet Explorer 6 的市占率超過 80%，
    Firefox 剛剛起步，開發者每天面對的不是設計模式或架構問題，而是如何讓同一段程式碼
    在不同瀏覽器上正常運行。
  </p>
  <p>
    那個年代的「元件化」幾乎不存在。一個典型的 Web 頁面由伺服器渲染 HTML，
    搭配少量的 JavaScript 處理表單驗證和簡單的 DOM 操作。
    網頁是靜態的，互動是稀缺的。
  </p>
  <div class="callout callout-info">
    <div class="callout-title">歷史脈絡</div>
    <p>
      2004 年，Gmail 的推出震驚了整個業界。一個幾乎完全用 JavaScript 驅動的 Web 應用程式，
      流暢的非同步通訊（AJAX），讓人們第一次看到 Web 應用程式可以媲美桌面軟體的可能性。
      Gmail 的存在本身就是一個宣言：JavaScript 是嚴肅的程式語言，Web 是嚴肅的應用程式平台。
    </p>
  </div>
  <p>
    DHTML（Dynamic HTML）時代的開發者使用 <code>document.getElementById</code>、
    <code>innerHTML</code> 和各種瀏覽器私有 API 拼湊出互動效果。
    程式碼散落各處，沒有模組化，沒有測試，可維護性極差。
    這個問題需要一個解決方案。
  </p>
</section>

<section id="jquery-dominance">
  <h2>jQuery 的稱霸時代</h2>
  <p>
    2006 年，John Resig 發布了 jQuery 1.0，解決了那個時代最大的痛點：
    <strong>跨瀏覽器 DOM 操作</strong>。
    <code>$('#myElement').addClass('active').fadeIn()</code> 這樣簡潔的鏈式 API，
    加上強大的 AJAX 封裝，讓 jQuery 迅速成為前端開發的標配。
  </p>
  <p>
    巔峰時期，超過 <strong>78% 的主流網站</strong>使用 jQuery。
    它是如此無處不在，以至於許多開發者將「jQuery 開發」等同於「JavaScript 開發」。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">// jQuery 時代的典型程式碼
$(document).ready(function() {
  $('.btn').on('click', function() {
    var $panel = $('#panel');
    $.ajax({
      url: '/api/data',
      success: function(data) {
        $panel.html(data.message).fadeIn();
      }
    });
  });
});</code></pre>
  <p>
    jQuery 解決了相容性問題，但它本質上是一個<strong>工具函式庫</strong>，
    而非架構方案。隨著應用程式越來越複雜，jQuery 程式碼開始變得難以管理。
    狀態散落在 DOM 上，業務邏輯與視圖邏輯混雜，「Spaghetti Code（義大利麵程式碼）」
    成了大型 jQuery 專案的代名詞。
  </p>
  <h3>jQuery 的根本局限</h3>
  <p>
    jQuery 的設計哲學是命令式（Imperative）的：你告訴瀏覽器<em>如何</em>操作 DOM。
    當應用程式狀態改變時，你需要手動更新相關的 DOM 元素。
    這在小型應用中可行，但在大型應用中，追蹤「哪個狀態對應哪個 DOM 元素」
    變成了噩夢。
  </p>
  <p>
    市場需要一個新的答案：<strong>宣告式（Declarative）的 UI 程式設計</strong>。
    描述 UI 應該<em>是什麼樣子</em>，而不是<em>如何改變它</em>。
  </p>
</section>

<section id="spa-revolution">
  <h2>SPA 框架的崛起</h2>
  <p>
    2010 年前後，Single Page Application（SPA）框架如雨後春筍般出現，
    每一個都試圖解決 jQuery 留下的架構問題。
  </p>
  <h3>Backbone.js（2010）</h3>
  <p>
    Backbone 引入了 MVC 模式到前端，提供 Model、View、Collection 等概念。
    它比 jQuery 更有結構，但依然偏向命令式，且樣板（Boilerplate）相當多。
  </p>
  <h3>AngularJS（2010）</h3>
  <p>
    Google 的 AngularJS 帶來了革命性的雙向資料綁定（Two-way Data Binding）。
    <code>ng-model</code> 讓 HTML 和 JavaScript 物件自動同步，開發者第一次可以
    用宣告式的方式描述 UI 與資料的關係。
  </p>
  <pre data-lang="html"><code class="language-html">&lt;!-- AngularJS 的雙向綁定 --&gt;
&lt;input ng-model="user.name" /&gt;
&lt;p&gt;Hello, {{ user.name }}!&lt;/p&gt;</code></pre>
  <p>
    AngularJS 的出現讓許多人看到了未來的方向，但它的問題也很明顯：
    <strong>效能問題</strong>（Dirty Checking 機制）、<strong>學習曲線陡峭</strong>
    （Directive、Scope、Service、Controller 等大量概念），以及緊密的框架鎖定。
  </p>
  <h3>React（2013）</h3>
  <p>
    Facebook 在 2013 年開源的 React 重新定義了前端開發。
    它引入了三個關鍵創新：
  </p>
  <ul>
    <li><strong>Virtual DOM</strong>：在記憶體中維護 UI 的虛擬表示，透過 diff 算法最小化真實 DOM 操作</li>
    <li><strong>元件化思維</strong>：UI 是元件的組合，每個元件封裝自己的狀態和渲染邏輯</li>
    <li><strong>單向資料流</strong>：資料只從父元件流向子元件，讓應用程式狀態可預測</li>
  </ul>
  <p>
    React 的 <code>render()</code> 方法是真正的宣告式：給定相同的 props 和 state，
    永遠渲染相同的 UI。這個純函數思維極大地降低了複雜度。
  </p>
  <h3>Vue.js（2014）</h3>
  <p>
    尤雨溪（Evan You）在汲取 AngularJS 和 React 的優點後，創造了 Vue.js。
    它保留了模板語法的直覺性，同時引入了響應式資料系統和元件化架構。
    Vue 的漸進式設計讓它可以從簡單的 HTML 增強到複雜的 SPA。
  </p>
  <h3>框架戰爭的代價</h3>
  <p>
    到 2015 年，前端生態系出現了一個奇特的現象：每個主流框架都有自己的元件模型、
    自己的模板語法、自己的狀態管理方案。
    用 React 寫的元件無法在 Angular 或 Vue 中使用。
    企業在技術選型上面臨巨大的風險——今天選錯了框架，
    明天可能要面臨整個重寫的代價。
  </p>
  <p>
    這個問題促使瀏覽器廠商思考：能不能在<strong>瀏覽器層面</strong>提供一個
    通用的元件標準，讓任何框架都能使用？
  </p>
</section>

<section id="wc-spec-birth">
  <h2>Web Components 規格誕生</h2>
  <p>
    Web Components 不是單一規格，而是由四個相互協作的瀏覽器 API 組成的技術集合。
    它的概念最早由 Google 工程師 Alex Russell 在 2011 年的 Fronteers Conference 上提出。
  </p>
  <h3>四大核心規格</h3>

  <h4>1. Custom Elements</h4>
  <p>
    允許開發者定義自己的 HTML 標籤。
    <code>customElements.define('my-button', MyButton)</code> 之後，
    HTML 中的 <code>&lt;my-button&gt;</code> 就是一個完整的自訂元素。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">class MyButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '&lt;button&gt;Click me&lt;/button&gt;';
  }
}
customElements.define('my-button', MyButton);</code></pre>

  <h4>2. Shadow DOM</h4>
  <p>
    為元素提供封裝的 DOM 子樹。Shadow DOM 內的 CSS 不會洩漏到外部，
    外部的 CSS 也不會意外影響 Shadow DOM 內部（除非透過 CSS Custom Properties）。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">class MyCard extends HTMLElement {
  constructor() {
    super();
    // 建立 Shadow Root
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = \`
      &lt;style&gt;
        /* 這個樣式只影響 Shadow DOM 內部 */
        p { color: blue; }
      &lt;/style&gt;
      &lt;p&gt;封裝的內容&lt;/p&gt;
    \`;
  }
}
customElements.define('my-card', MyCard);</code></pre>

  <h4>3. HTML Templates</h4>
  <p>
    <code>&lt;template&gt;</code> 元素讓你定義不立即渲染的 HTML 片段。
    透過 JavaScript 複製（clone）模板並插入 DOM，可以高效地建立重複結構。
  </p>
  <pre data-lang="html"><code class="language-html">&lt;template id="card-template"&gt;
  &lt;div class="card"&gt;
    &lt;h2&gt;&lt;slot name="title"&gt;&lt;/slot&gt;&lt;/h2&gt;
    &lt;p&gt;&lt;slot name="content"&gt;&lt;/slot&gt;&lt;/p&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

  <h4>4. ES Modules</h4>
  <p>
    雖然 ES Modules 不是 Web Components 規格的一部分，
    但瀏覽器原生的模組系統讓 Web Components 的分發和復用成為可能，
    無需任何構建工具。
  </p>

  <h3>規格的演進歷程</h3>
  <table>
    <thead>
      <tr><th>年份</th><th>事件</th></tr>
    </thead>
    <tbody>
      <tr><td>2011</td><td>Alex Russell 在 Fronteers Conference 提出 Web Components 概念</td></tr>
      <tr><td>2013</td><td>Chrome 25 首次實作 Shadow DOM v0（非標準版本）</td></tr>
      <tr><td>2014</td><td>Google 發布 Polymer 1.0，基於 v0 規格</td></tr>
      <tr><td>2016</td><td>Shadow DOM v1 規格定稿，解決 v0 的諸多問題</td></tr>
      <tr><td>2018</td><td>Firefox 63 實作 Custom Elements v1，主流瀏覽器全面支援</td></tr>
      <tr><td>2019</td><td>Web Components 正式成為 W3C 標準的一部分</td></tr>
      <tr><td>2022</td><td>Declarative Shadow DOM 草案，Server-Side Rendering 支援</td></tr>
    </tbody>
  </table>
</section>

<section id="polymer-to-lit">
  <h2>Polymer → LitElement → Lit</h2>
  <p>
    Lit 的前身是 Google 的 Polymer 專案，這段演化史對於理解 Lit 的設計決策至關重要。
  </p>
  <h3>Polymer 的原罪（2013-2018）</h3>
  <p>
    Polymer 是 Web Components 最早的重要推廣者，但它背負著一個沉重的包袱：
    瀏覽器支援太差。2013-2015 年間，只有 Chrome 原生支援 Web Components，
    其他瀏覽器需要大量的 Polyfill。
  </p>
  <p>
    Polymer 的 Polyfill 策略讓它在 IE 11 和 Safari 上都能運行，
    但代價是<strong>巨大的包大小</strong>和<strong>不穩定的效能</strong>。
    Polymer 的資料綁定系統（基於 <code>Object.observe()</code>，後來被廢棄）
    也帶來了額外的複雜度。
  </p>
  <p>
    Polymer 的根本問題在於它<em>試圖做太多事</em>：
    它既是 Polyfill、又是框架、又是設計系統（Material Design Components）。
    這種大而全的策略在瀏覽器支援快速演進的環境下變得難以維護。
  </p>
  <h3>LitElement 的誕生（2018）</h3>
  <p>
    2018 年，Google 的 Polymer 團隊意識到需要一個全新的方向。
    隨著 Chrome、Firefox、Safari 相繼原生支援 Web Components，
    Polyfill 的需求大幅降低。
  </p>
  <p>
    LitElement 是一個輕量的基礎類別（Base Class），它做了一件核心的事：
    <strong>將 lit-html 模板引擎整合到 Web Components 的生命週期中</strong>。
    lit-html 是另一個 Google 專案，由 Justin Fagnani 開發，
    它用 Tagged Template Literals 實現了高效的 DOM 更新。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">// LitElement 時代的元件（2018-2021）
import { LitElement, html, css } from 'lit-element';

class MyCounter extends LitElement {
  static properties = {
    count: { type: Number },
  };

  static styles = css\`
    button { background: #ff6d00; color: white; }
  \`;

  constructor() {
    super();
    this.count = 0;
  }

  render() {
    return html\`
      &lt;button @click=\${() => this.count++}&gt;
        Count: \${this.count}
      &lt;/button&gt;
    \`;
  }
}
customElements.define('my-counter', MyCounter);</code></pre>

  <h3>Lit 2.0 的整合（2021）</h3>
  <p>
    2021 年，Google 將 lit-html 和 LitElement 合併為單一套件：<strong>Lit</strong>。
    這次整合不只是名稱變更，而是帶來了幾個重要改進：
  </p>
  <ul>
    <li><strong>Reactive Controllers</strong>：允許將可復用的邏輯抽離為獨立的控制器，類似 React Hooks 的概念</li>
    <li><strong>裝飾器標準化</strong>：<code>@property</code>、<code>@state</code>、<code>@query</code> 等裝飾器更加穩定</li>
    <li><strong>更小的包大小</strong>：整合後的 Lit 核心只有約 <strong>5KB gzipped</strong></li>
    <li><strong>TypeScript 支援改善</strong>：更好的型別推斷和 IDE 工具支援</li>
    <li><strong>SSR 路徑清晰化</strong>：為 <code>@lit-labs/ssr</code> 奠定基礎</li>
  </ul>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Polymer（2013-2018）</h4>
      <ul>
        <li>大型 Polyfill 套件</li>
        <li>自有資料綁定語法</li>
        <li>緊密與 Material Design 綁定</li>
        <li>包大小較大</li>
        <li>學習曲線陡峭</li>
      </ul>
    </div>
    <div class="comparison-card">
      <h4>Lit（2021-至今）</h4>
      <ul>
        <li>核心只有 ~5KB gzipped</li>
        <li>標準 Tagged Template Literals</li>
        <li>與任何設計系統相容</li>
        <li>極致輕量</li>
        <li>學習曲線平緩</li>
      </ul>
    </div>
  </div>
</section>

<section id="why-native-wins">
  <h2>為何原生標準終將勝出</h2>
  <p>
    歷史反復證明，當瀏覽器平台提供足夠好的原生解決方案時，
    第三方框架要麼逐漸退場，要麼演化為薄薄的一層封裝。
  </p>
  <h3>框架的本質成本</h3>
  <p>
    每一個 JavaScript 框架都帶來了額外的成本：
  </p>
  <ul>
    <li><strong>包大小</strong>：React + ReactDOM 約 44KB gzipped，Angular 框架核心更大</li>
    <li><strong>Runtime 開銷</strong>：Virtual DOM diff、響應式系統、依賴追蹤等都有計算成本</li>
    <li><strong>框架鎖定</strong>：用 React 寫的元件無法在 Vue 或 Angular 中直接使用</li>
    <li><strong>版本升級成本</strong>：Angular 1.x 到 2.x 的遷移是業界著名的痛苦經歷</li>
  </ul>

  <h3>Web Components 的優勢</h3>
  <p>
    Web Components 基於瀏覽器平台，享有：
  </p>
  <ul>
    <li><strong>零 Runtime 成本</strong>：Custom Elements、Shadow DOM 是瀏覽器原生功能，無需額外 JavaScript</li>
    <li><strong>跨框架相容</strong>：Web Components 在 React、Vue、Angular、Svelte 中都能使用</li>
    <li><strong>長期穩定</strong>：瀏覽器 API 的向後相容性遠比框架穩定——2010 年寫的 HTML 今天仍然有效</li>
    <li><strong>逐步採用</strong>：可以在現有應用中逐漸引入，無需完全重寫</li>
  </ul>

  <div class="callout callout-tip">
    <div class="callout-title">設計系統的完美用例</div>
    <p>
      Salesforce、Adobe、Microsoft 等大型企業都選擇用 Web Components 建構設計系統。
      原因很簡單：企業的技術棧是多元的，需要跨團隊、跨框架共享 UI 元件。
      Web Components 是目前唯一真正跨框架的解決方案。
    </p>
  </div>

  <h3>現實的平衡點</h3>
  <p>
    Web Components 不是框架的終結者，而是基礎設施。
    React、Vue、Angular 依然在應用層面提供更豐富的工具：
    狀態管理、路由、表單處理、Server-Side Rendering 生態等。
  </p>
  <p>
    Lit 的聰明之處在於它找到了完美的定位：
    一個<strong>建立 Web Components 的輕量層</strong>，
    而不是試圖成為下一個「全家桶框架」。
    它讓你享受 Web Components 的所有優勢，同時消除了直接使用原生 API 的繁瑣。
  </p>
  <p>
    這就是為什麼在框架百花齊放的今天，
    理解 Lit 和 Web Components 是每個前端工程師都應該掌握的基礎知識。
    它不是在競爭，它是在填補框架之下的那一層。
  </p>
</section>
`};export{t as default};
