export default {
  id: 1,
  slug: 'chapter-1',
  title: 'Web Components 的前世今生',
  part: 1,
  intro: '從 jQuery 到 Angular、React、Vue 的框架演化史，解釋為什麼瀏覽器原生標準（Web Components）的誕生是必然的，以及 Polymer → LitElement → Lit 的技術傳承脈絡。',
  sections: [
    { slug: 'pre-framework-era', title: '框架戰爭前夜' },
    { slug: 'jquery-dominance', title: 'jQuery 的稱霸時代' },
    { slug: 'spa-revolution', title: 'SPA 框架的崛起' },
    { slug: 'wc-spec-birth', title: 'Web Components 規格誕生' },
    { slug: 'browser-spec-process', title: 'W3C 與 WHATWG 規格制定過程' },
    { slug: 'polymer-to-lit', title: 'Polymer → LitElement → Lit' },
    { slug: 'enterprise-adoption', title: '企業採用 Web Components 的案例分析' },
    { slug: 'why-native-wins', title: '為何原生標準終將勝出' },
  ],
  content: `
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
  <h3>那個年代的工程挑戰</h3>
  <p>
    對資深工程師而言，理解當時的工程困境尤為重要：IE6 對 CSS Box Model 的實作與 W3C 標準相悖（著名的 IE Box Model Bug），
    導致工程師需要為每個佈局元素撰寫額外的條件注釋（Conditional Comments）。
    XMLHttpRequest 在不同瀏覽器中的行為差異迫使團隊維護複雜的相容層。
    甚至 <code>Array.prototype.forEach</code> 和 <code>String.prototype.trim</code>
    都並非所有瀏覽器都支援，開發者必須手動 Polyfill 最基礎的語言功能。
  </p>
  <p>
    這種碎片化的環境讓「可復用元件」的概念幾乎無從落地：
    你無法確保一個「元件」在不同環境中有一致的行為，更遑論封裝樣式或隔離 DOM。
    每個「元件」不過是一組函數和 jQuery 選擇器的習慣性組合，沒有真正的封裝邊界。
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
  <h3>jQuery Plugin 體系的元件化嘗試</h3>
  <p>
    jQuery 生態嘗試透過 Plugin 機制提供元件化。
    <code>$.fn.myWidget = function(options) { ... }</code> 的模式讓開發者能封裝互動邏輯，
    jQuery UI 和 Bootstrap 的 JS 插件都基於此模式。
    然而這種「偽元件化」有致命缺陷：
  </p>
  <ul>
    <li><strong>樣式污染</strong>：Plugin 的 CSS 與頁面全域樣式共享命名空間，需要 BEM 或命名前綴來避免衝突</li>
    <li><strong>狀態不透明</strong>：元件狀態存在 DOM 的 <code>data-*</code> 屬性或閉包變數中，除錯困難</li>
    <li><strong>組合困難</strong>：巢狀 Plugin 之間的互動需要繁瑣的事件委派，且無法進行型別安全的 Prop 傳遞</li>
    <li><strong>記憶體洩漏</strong>：事件監聽器若沒有在元素移除時正確 unbind，容易造成記憶體洩漏</li>
  </ul>
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
    Backbone 的 View 透過 <code>listenTo</code> 監聽 Model 的 <code>change</code> 事件，
    再手動呼叫 <code>this.render()</code> 更新 DOM——開發者仍需管理整個更新流程。
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
  <div class="callout callout-info">
    <div class="callout-title">Dirty Checking 的工程代價</div>
    <p>
      AngularJS 的 Dirty Checking 機制（<code>$digest</code> cycle）是其效能瓶頸的根源。
      每次用戶互動或非同步事件後，AngularJS 會遍歷所有被追蹤的 Watcher（<code>$watch</code>），
      比較當前值與上次值。在一個有 2000+ Watcher 的大型表單頁面，
      單次 <code>$digest</code> 可能需要數十毫秒，造成明顯的 UI 卡頓。
      Google 自己的工程師在 AngularJS 的 Issues 上記錄了這個問題，
      這也是 Angular 2（完整重寫）放棄 Dirty Checking、改用 Zone.js 的根本原因。
    </p>
  </div>
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
  <h3>React 的工程決策分析</h3>
  <p>
    從工程角度看，React 的 Virtual DOM 是一個刻意的取捨，而非「最優解」：
    它引入了額外的記憶體使用（維護兩棵 VDOM 樹）和 diff 計算開銷，
    換取的是開發者不需要手動追蹤「哪些 DOM 需要更新」的心智負擔。
    React 的賭注是：對大多數應用而言，VDOM diff 的開銷遠小於開發者手動操作 DOM 的錯誤率。
    這個賭注在 2013 年的應用場景下是正確的。
  </p>
  <p>
    但 Virtual DOM 本身也有其架構侷限。React Fiber（2017）重寫了 VDOM 調度器，
    引入「可中斷渲染」（Interruptible Rendering）來解決長時間 diff 造成的主線程阻塞問題。
    這說明 VDOM 並非天然高效——它的效能特性需要持續的底層工程投入來維護。
  </p>
  <h3>Vue.js（2014）</h3>
  <p>
    尤雨溪（Evan You）在汲取 AngularJS 和 React 的優點後，創造了 Vue.js。
    它保留了模板語法的直覺性，同時引入了響應式資料系統和元件化架構。
    Vue 的漸進式設計讓它可以從簡單的 HTML 增強到複雜的 SPA。
    Vue 3 的 Proxy-based 響應式系統（相比 Vue 2 的 <code>Object.defineProperty</code>）
    解決了陣列和動態新增屬性無法追蹤的長期痛點，也讓響應式追蹤的粒度更精細。
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
    對資深工程師而言，最深刻的問題不是「哪個框架更好」，
    而是「為什麼每個框架都要重新發明 <strong>UI 元件的基本抽象</strong>？」
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
    Custom Elements v1 規格（相對於最初的 v0）帶來了關鍵改進：
    <code>connectedCallback</code>、<code>disconnectedCallback</code>、<code>adoptedCallback</code>
    和 <code>attributeChangedCallback</code> 的生命週期語義更加清晰，
    且支援 <code>extends</code> 繼承現有 HTML 元素（Customized Built-in Elements）。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">class MyButton extends HTMLElement {
  // 告知瀏覽器監聽哪些 Attribute 的變化
  static observedAttributes = ['disabled', 'variant'];

  connectedCallback() {
    this.innerHTML = '&lt;button&gt;Click me&lt;/button&gt;';
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // 當 disabled 或 variant 屬性改變時自動呼叫
    if (name === 'disabled') {
      this.querySelector('button').disabled = newValue !== null;
    }
  }
}
customElements.define('my-button', MyButton);</code></pre>

  <h4>2. Shadow DOM</h4>
  <p>
    為元素提供封裝的 DOM 子樹。Shadow DOM 內的 CSS 不會洩漏到外部，
    外部的 CSS 也不會意外影響 Shadow DOM 內部（除非透過 CSS Custom Properties）。
    <code>mode: 'open'</code> 讓外部 JavaScript 可以透過 <code>element.shadowRoot</code>
    訪問 Shadow Root；<code>mode: 'closed'</code> 則完全封閉——即使是元素自身也只能在建構時保存引用。
    Lit 預設使用 <code>open</code> 模式，以便 DevTools 能夠檢查 Shadow DOM。
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
    <code>&lt;template&gt;</code> 的解析成本很低——瀏覽器解析 HTML 但不渲染，
    不載入圖片，不執行腳本。<code>template.content.cloneNode(true)</code>
    是比 <code>innerHTML</code> 更高效的批量 DOM 建立方式，
    因為它避免了字串解析的開銷。
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
    無需任何構建工具。ES Modules 的靜態分析特性讓 Tree Shaking 成為可能，
    也讓 Import Maps 這樣的新機制能夠在瀏覽器層面解決套件管理問題。
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
      <tr><td>2024</td><td>CSS @scope 和 CSS Nesting 進一步增強 Shadow DOM 的可組合性</td></tr>
    </tbody>
  </table>

  <h3>瀏覽器現行支援狀況（2024）</h3>
  <table>
    <thead>
      <tr><th>功能</th><th>Chrome</th><th>Firefox</th><th>Safari</th><th>Edge</th><th>全球覆蓋率</th></tr>
    </thead>
    <tbody>
      <tr><td>Custom Elements v1</td><td>67+</td><td>63+</td><td>10.1+</td><td>79+</td><td>~97%</td></tr>
      <tr><td>Shadow DOM v1</td><td>53+</td><td>63+</td><td>10.1+</td><td>79+</td><td>~97%</td></tr>
      <tr><td>HTML Templates</td><td>26+</td><td>22+</td><td>8+</td><td>13+</td><td>~99%</td></tr>
      <tr><td>Declarative Shadow DOM</td><td>111+</td><td>123+</td><td>16.4+</td><td>111+</td><td>~90%</td></tr>
      <tr><td>CSS @scope</td><td>118+</td><td>128+</td><td>17.4+</td><td>118+</td><td>~85%</td></tr>
    </tbody>
  </table>
</section>

<section id="browser-spec-process">
  <h2>W3C 與 WHATWG 規格制定過程</h2>
  <p>
    Web Components 的標準化過程充滿了技術與政治的角力，理解這個過程能讓你對規格的設計決策有更深的認識。
    對資深工程師而言，了解「為什麼 API 是現在這個樣子」往往比「API 是什麼」更有價值。
  </p>

  <h3>雙軌標準化：W3C vs WHATWG</h3>
  <p>
    Web Components 的標準化橫跨兩個主要組織，這本身就是矛盾的根源：
  </p>
  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>W3C（World Wide Web Consortium）</h4>
      <ul>
        <li>正式的國際標準組織，成員包括 Google、Apple、Microsoft、Mozilla</li>
        <li>規格透過工作組（Working Group）制定，需要達成共識</li>
        <li>流程嚴謹但緩慢：Working Draft → Candidate Recommendation → Recommendation</li>
        <li>Shadow DOM 最初是 W3C 的 Web Applications Working Group 負責</li>
      </ul>
    </div>
    <div class="comparison-card">
      <h4>WHATWG（Web Hypertext Application Technology Working Group）</h4>
      <ul>
        <li>由瀏覽器廠商主導的「Living Standard」組織</li>
        <li>規格持續更新，沒有版本號——永遠是最新版本</li>
        <li>HTML、DOM、URL 等核心規格都已移交 WHATWG</li>
        <li>Custom Elements 規格最終在 HTML Living Standard 中定稿</li>
      </ul>
    </div>
  </div>

  <h3>瀏覽器廠商之間的技術張力</h3>
  <div class="callout callout-warning">
    <div class="callout-title">標準化過程中的政治博弈</div>
    <p>
      Web Components 的標準化是近年來瀏覽器廠商分歧最大的一次規格討論。
      以下幾個衝突點值得資深工程師了解：
    </p>
    <ul>
      <li>
        <strong>HTML Imports（已廢棄）</strong>：Chrome 最初包含 HTML Imports 作為 Web Components 的第四個支柱規格——一種將 HTML 文件作為模組引入的機制。
        Mozilla 和 Apple 拒絕實作，理由是 ES Modules 應該成為模組化的統一解決方案。
        最終 HTML Imports 在 Chrome 70（2018）中廢棄，Google 承認這是一個失敗的押注。
        這個爭議導致了整整三年的生態碎片化。
      </li>
      <li>
        <strong>Customized Built-in Elements</strong>：允許繼承 <code>&lt;button&gt;</code>、<code>&lt;input&gt;</code> 等內建元素
        （如 <code>is="my-button"</code>）。Chrome 和 Firefox 支援，但 Apple（WebKit）至今拒絕實作，
        理由是其與 WebKit 的內部架構不相容。這造成了一個持續的標準碎片：
        <code>customElements.define('my-button', MyButton, { extends: 'button' })</code>
        需要 Polyfill 才能在 Safari 上運行。
      </li>
      <li>
        <strong>Shadow DOM v0 vs v1</strong>：Chrome 最早實作的 Shadow DOM v0 有多個設計缺陷
        （如使用 <code>createShadowRoot()</code> 而非 <code>attachShadow()</code>，
        以及不同的 Slot 機制名為「Content Insertion Points」）。
        修訂為 v1 的過程需要所有廠商重新協商 API 設計，Google 不得不在 Chrome 中
        同時維護 v0 和 v1 長達四年，直到 Chrome 70 移除 v0 支援。
      </li>
    </ul>
  </div>

  <h3>規格制定的工程意義</h3>
  <p>
    這些歷史衝突留下了至今可見的痕跡：
  </p>
  <ul>
    <li>
      <strong>為什麼 Lit 不使用 Customized Built-in Elements</strong>：
      Lit 選擇只使用 Autonomous Custom Elements（自主自訂元素），部分原因是 Safari 長期不支援 Customized Built-in，
      使得跨瀏覽器一致性難以保證。
    </li>
    <li>
      <strong>為什麼 Shadow DOM 只有 <code>open</code> 和 <code>closed</code> 兩種模式</strong>：
      更精細的存取控制（如「只允許特定腳本訪問」）被認為實作複雜度過高，
      規格討論中被多次推遲，最終簡化為二元選擇。
    </li>
    <li>
      <strong>Declarative Shadow DOM 的延遲</strong>：
      允許在 HTML 中宣告式地定義 Shadow DOM（用於 SSR）的提案在 2019 年就提出，
      但因 Safari 的反對（認為 API 設計不夠優雅）而延遲至 2023 年才在三大瀏覽器中全面落地。
    </li>
  </ul>

  <h3>如何追蹤規格進展</h3>
  <p>
    對有意深入的工程師，以下資源提供了一手的規格討論：
  </p>
  <ul>
    <li><strong>WICG（Web Incubator Community Group）</strong>：新提案的孵化地，GitHub Issues 記錄了所有討論</li>
    <li><strong>web-platform-tests</strong>：跨瀏覽器的規格一致性測試庫，可以查看各功能的實際支援狀況</li>
    <li><strong>TC39（ECMAScript 標準委員會）</strong>：JavaScript 語言功能（如裝飾器）在此討論，Lit 的裝飾器隨 TC39 進展而演化</li>
    <li><strong>Can I Use</strong>：每個 Web Components 相關功能的瀏覽器支援數據</li>
  </ul>
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
  <h3>lit-html 的技術突破（2017）</h3>
  <p>
    在 Polymer 團隊內部，Justin Fagnani 提出了一個全新的模板方案：
    使用 JavaScript 的 Tagged Template Literals 作為 HTML 模板引擎。
    這個想法的核心洞見是：Tagged Template Literals 的解析是<strong>一次性的</strong>——
    瀏覽器在第一次遇到模板時解析字串，後續更新只需追蹤動態部分（Expressions）的變化。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">// lit-html 的核心機制（簡化版）
// 第一次呼叫：字串部分 ['&lt;p&gt;Hello, ', '!&lt;/p&gt;'] 只解析一次
// 後續更新：只更新 expressions[0] 對應的 DOM 節點
const template = (name) =&gt; html\`&lt;p&gt;Hello, \${name}!&lt;/p&gt;\`;

// 這個機制讓 lit-html 在更新時比 innerHTML 快得多：
// innerHTML 每次都重新解析整個字串並重建 DOM
// lit-html 只更新真正改變的 Text Node</code></pre>
  <p>
    這個技術突破讓 lit-html 既有模板語法的可讀性，又有接近手寫 DOM 操作的效能。
    它成為了整個 Lit 生態的核心引擎。
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
      &lt;button @click=\${() =&gt; this.count++}&gt;
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

<section id="enterprise-adoption">
  <h2>企業採用 Web Components 的案例分析</h2>
  <p>
    Web Components 不只是一個學術概念，它已在全球最大的企業設計系統中經過生產環境驗證。
    以下案例對理解 Web Components 的實際工程價值至關重要。
  </p>

  <h3>Google：Material Web Components</h3>
  <p>
    Google 自己的 Material Design 元件庫（MWC）完全基於 Lit 構建。
    最具說服力的是：Google 的內部產品（包括 Google Workspace 中的部分元件）使用相同的元件庫，
    跨越 Angular、Polymer、純 HTML 等不同技術棧的頁面。
    這直接體現了 Web Components 跨框架復用的核心價值主張。
  </p>
  <div class="callout callout-info">
    <div class="callout-title">Material Web 的架構決策</div>
    <p>
      Material Web（@material/web）在 2023 年完成了從 MWC（基於 lit-element）到完整 Lit 的遷移。
      值得注意的是：Google 選擇不提供 React Wrapper 作為一等公民，
      強調直接使用 Web Components 的原生整合。
      這個決策反映了 Google 對 Web Components 長期標準地位的押注。
    </p>
  </div>

  <h3>Adobe：Spectrum Web Components</h3>
  <p>
    Adobe 的 Spectrum 設計系統（服務於 Photoshop、Illustrator、XD 等產品的 Web 版本）
    選擇 Lit 作為核心實作技術，原因相當工程化：
  </p>
  <ul>
    <li>
      <strong>跨產品線共享</strong>：Adobe 旗下有超過 20 個 Creative Cloud 產品，
      各自使用不同的前端框架（部分是遺留的 Backbone、部分是 React、部分是 Angular）。
      Web Components 是唯一可以在這些環境中零成本共享的方案。
    </li>
    <li>
      <strong>無障礙（Accessibility）的嚴格要求</strong>：Spectrum 元件需要滿足 WCAG 2.1 AA 標準。
      Web Components 的封裝特性讓每個元件的可訪問性可以獨立測試和保證，
      不會因頁面的全域 CSS 而被破壞。
    </li>
    <li>
      <strong>WebAssembly 整合</strong>：部分 Adobe 產品的核心邏輯透過 WASM 運行，
      Web Components 的原生事件系統讓 WASM 模組和 UI 的通訊更加直接。
    </li>
  </ul>

  <h3>Salesforce：Lightning Web Components</h3>
  <p>
    Salesforce 的 Lightning Web Components（LWC）是 Web Components 企業採用中最複雜的案例之一。
    Salesforce 有數百萬個由第三方 ISV（獨立軟體廠商）建立的元件在其平台上運行，
    Web Components 的標準化讓 ISV 可以不依賴 Salesforce 的私有 Framework API 開發元件。
  </p>
  <p>
    LWC 的架構選擇了一條與 Lit 不同的路：它使用<strong>編譯時轉換</strong>而非 Runtime 庫，
    將類 HTML 的 LWC 模板編譯成原生 Web Components。這讓 LWC 元件在 Salesforce 環境外
    幾乎無法直接運行，但在 Salesforce 平台內部獲得了更強的安全性和效能保證。
    這是企業平台在「平台控制」vs「開放標準」之間取捨的典型案例。
  </p>

  <h3>SAP：UI5 Web Components</h3>
  <p>
    SAP 將其企業 UI 框架 SAPUI5（歷史超過 10 年、基於 jQuery 的龐然大物）
    逐步遷移到 Web Components 標準。
    SAP 的工程師公開的遷移數據顯示：
    同等功能的元件，Web Components 版本的 Bundle Size 約為 SAPUI5 版本的 30-40%，
    首次渲染時間（Time to First Paint）改善了約 40%。
  </p>
  <p>
    SAP 的案例對於「企業遺留系統現代化」的場景具有參考價值：
    Web Components 允許他們<strong>漸進式遷移</strong>——在同一個頁面上，
    新的 Web Components 元件和舊的 SAPUI5 元件可以共存，
    無需完整重寫就能逐步現代化龐大的代碼庫。
  </p>

  <h3>Microsoft：FAST</h3>
  <p>
    Microsoft 的 FAST 框架（Fluent UI 的底層）採用了與 Lit 非常相似的設計哲學，
    但在幾個關鍵技術點上做出了不同的選擇：
  </p>
  <table>
    <thead>
      <tr><th>特性</th><th>Lit</th><th>Microsoft FAST</th></tr>
    </thead>
    <tbody>
      <tr><td>模板引擎</td><td>Tagged Template Literals（lit-html）</td><td>Arrow functions（FASTElement Template）</td></tr>
      <tr><td>包大小（核心）</td><td>~5KB gzipped</td><td>~8KB gzipped</td></tr>
      <tr><td>設計令牌系統</td><td>依賴 CSS Custom Properties</td><td>內建 Design Token 系統</td></tr>
      <tr><td>主要使用場景</td><td>通用 Web Components 開發</td><td>Fluent Design System 元件</td></tr>
      <tr><td>TypeScript 整合</td><td>裝飾器 + 型別推斷</td><td>強型別 Observable 系統</td></tr>
    </tbody>
  </table>
  <p>
    Microsoft 的 VS Code、Teams 和 Edge 瀏覽器 UI 的部分元件都使用 FAST 構建。
    FAST 的存在說明即使在微軟生態系內部，Web Components 也被視為跨產品共享 UI 的最佳機制。
  </p>
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
    <li><strong>逐步採用</strong>：可以在現有應用中逐漸引入，無需完整重寫</li>
  </ul>

  <div class="callout callout-tip">
    <div class="callout-title">設計系統的完美用例</div>
    <p>
      Salesforce、Adobe、Microsoft、SAP 等大型企業都選擇用 Web Components 建構設計系統。
      原因很簡單：企業的技術棧是多元的，需要跨團隊、跨框架共享 UI 元件。
      Web Components 是目前唯一真正跨框架的解決方案。
    </p>
  </div>

  <h3>「瀏覽器原生」的長期押注</h3>
  <p>
    從更宏觀的角度看，Web 標準化的趨勢是明確的：
    過去需要 JavaScript 框架的功能，正在逐步被納入瀏覽器標準。
    CSS Grid、CSS Custom Properties、CSS Container Queries、Popover API、View Transitions API——
    每一個功能的標準化，都在縮小框架與原生平台之間的差距。
  </p>
  <p>
    Web Components 是這個趨勢在 UI 元件層面的體現。
    押注 Web Components，本質上是押注 Web 平台本身的持續演進，
    而不是押注任何一個公司的框架路線圖。
  </p>

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
`,
};
