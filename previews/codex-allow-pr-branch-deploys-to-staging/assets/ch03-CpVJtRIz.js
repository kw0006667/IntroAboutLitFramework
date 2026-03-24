const t={id:3,slug:"chapter-3",title:"環境建置與第一個 Lit Component",part:1,intro:"從 TypeScript + Vite 的現代工具鏈開始，建立第一個 Custom Element，理解 Shadow DOM、Template 和 Custom Elements 三大支柱。",sections:[{slug:"prerequisites",title:"前置需求與工具鏈"},{slug:"project-setup",title:"建立 Vite + TypeScript 專案"},{slug:"first-component",title:"撰寫第一個 Custom Element"},{slug:"shadow-dom-intro",title:"Shadow DOM 是什麼？"},{slug:"templates-slots",title:"Templates 與 Slots"},{slug:"dev-workflow",title:"開發工作流與除錯技巧"}],content:`
<section id="prerequisites">
  <h2>前置需求與工具鏈</h2>
  <p>
    在開始之前，確保你的開發環境已準備好以下工具：
  </p>
  <ul>
    <li><strong>Node.js 18+</strong>：建議使用 LTS 版本</li>
    <li><strong>npm 或 pnpm</strong>：pnpm 在大型 monorepo 中特別高效</li>
    <li><strong>VS Code</strong>（推薦）：搭配 Lit Plugin 提供模板語法高亮和補全</li>
    <li><strong>Chrome / Edge</strong>：Web Components DevTools 支援最佳</li>
  </ul>

  <h3>推薦的 VS Code 擴充套件</h3>
  <pre data-lang="bash"><code class="language-bash"># 安裝 Lit 官方 VS Code 插件
code --install-extension lit-plugin

# TypeScript 官方語言支援（通常已內建）
code --install-extension vscode.typescript-language-features</code></pre>

  <p>
    <strong>lit-plugin</strong> 是 Lit 開發的必備工具，提供：
  </p>
  <ul>
    <li>HTML 模板（Tagged Template Literals）中的語法高亮</li>
    <li>HTML 屬性和事件的自動補全</li>
    <li>自訂元素的 TypeScript 型別檢查</li>
    <li>點擊元件定義的「跳轉至定義」功能</li>
  </ul>
</section>

<section id="project-setup">
  <h2>建立 Vite + TypeScript 專案</h2>
  <p>
    Vite 是目前最適合 Lit 開發的構建工具：原生 ES Modules 開發伺服器、
    極快的 HMR（Hot Module Replacement）、輕量的生產構建。
  </p>

  <pre data-lang="bash"><code class="language-bash"># 建立新專案
npm create vite@latest my-lit-app -- --template vanilla-ts

# 進入目錄並安裝依賴
cd my-lit-app
npm install

# 安裝 Lit
npm install lit

# 啟動開發伺服器
npm run dev</code></pre>

  <h3>專案結構</h3>
  <pre data-lang="bash"><code class="language-bash">my-lit-app/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts          # 入口點
    ├── my-element.ts    # 第一個 Lit 元件
    └── vite-env.d.ts    # Vite 型別宣告</code></pre>

  <h3>tsconfig.json 配置</h3>
  <p>
    Lit 的裝飾器需要特定的 TypeScript 設定：
  </p>
  <pre data-lang="json"><code class="language-json">{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"]
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">關於 useDefineForClassFields</div>
    <p>
      <code>useDefineForClassFields: false</code> 是必須的。
      否則 TypeScript 會以 ES2022 的語義定義類別欄位，
      與 Lit 的裝飾器系統產生衝突。
      Lit 4.x 已透過內部調整解決這個問題，但舊版本仍需此設定。
    </p>
  </div>
</section>

<section id="first-component">
  <h2>撰寫第一個 Custom Element</h2>
  <p>讓我們從一個簡單但完整的計數器元件開始：</p>

  <pre data-lang="typescript"><code class="language-typescript">// src/my-counter.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-counter')
export class MyCounter extends LitElement {
  // 靜態 styles：CSS 字串，自動封裝在 Shadow DOM 中
  static styles = css\`
    :host {
      display: inline-block;
      font-family: system-ui, sans-serif;
    }

    .container {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 20px;
      background: #f0f2f5;
      border-radius: 8px;
    }

    .count {
      font-size: 1.5rem;
      font-weight: 700;
      min-width: 3ch;
      text-align: center;
    }

    button {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: #FF6D00;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    button:hover { opacity: 0.85; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
  \`;

  // 響應式屬性：改變時自動觸發重新渲染
  @property({ type: Number }) count = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = Infinity;

  private _increment() {
    if (this.count < this.max) {
      this.count++;
      // 發送自訂事件，通知父元素
      this.dispatchEvent(new CustomEvent('count-change', {
        detail: { count: this.count },
        bubbles: true,
        composed: true, // 允許事件穿越 Shadow DOM 邊界
      }));
    }
  }

  private _decrement() {
    if (this.count > this.min) {
      this.count--;
      this.dispatchEvent(new CustomEvent('count-change', {
        detail: { count: this.count },
        bubbles: true,
        composed: true,
      }));
    }
  }

  render() {
    return html\`
      &lt;div class="container"&gt;
        &lt;button
          @click=\${this._decrement}
          ?disabled=\${this.count &lt;= this.min}
          aria-label="減少"
        &gt;−&lt;/button&gt;

        &lt;span class="count" aria-live="polite"&gt;\${this.count}&lt;/span&gt;

        &lt;button
          @click=\${this._increment}
          ?disabled=\${this.count &gt;= this.max}
          aria-label="增加"
        &gt;+&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <p>在 HTML 中使用：</p>
  <pre data-lang="html"><code class="language-html">&lt;!-- index.html --&gt;
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;script type="module" src="/src/main.ts"&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;my-counter count="5" min="0" max="10"&gt;&lt;/my-counter&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// src/main.ts
import './my-counter.ts';</code></pre>

  <h3>解析關鍵語法</h3>
  <ul>
    <li>
      <code>@customElement('my-counter')</code>：
      等同於 <code>customElements.define('my-counter', MyCounter)</code>
    </li>
    <li>
      <code>@property({ type: Number })</code>：
      宣告響應式屬性，type 指定如何從 HTML Attribute 字串轉換
    </li>
    <li>
      <code>@click=\${this._increment}</code>：
      事件綁定，<code>@</code> 是 <code>addEventListener</code> 的語法糖
    </li>
    <li>
      <code>?disabled=\${...}</code>：
      布林 Attribute 綁定，<code>?</code> 前綴表示條件性存在
    </li>
    <li>
      <code>composed: true</code>：
      讓自訂事件能夠穿越 Shadow DOM 邊界冒泡
    </li>
  </ul>
</section>

<section id="shadow-dom-intro">
  <h2>Shadow DOM 是什麼？</h2>
  <p>
    Shadow DOM 是 Lit 最重要的特性之一，也是最容易讓初學者感到困惑的部分。
    讓我們透過視覺化的方式理解它。
  </p>

  <h3>DOM 的封裝問題</h3>
  <p>
    在沒有 Shadow DOM 的情況下，頁面中所有的 CSS 和 JavaScript 都共享同一個全域命名空間。
    這意味著：
  </p>
  <ul>
    <li>你為按鈕寫的 <code>button { color: red; }</code> 樣式，
      可能意外影響到第三方套件的按鈕</li>
    <li>第三方套件的全域樣式，可能覆蓋你的元件樣式</li>
    <li>使用 <code>querySelector</code> 查詢元素時，會意外選中元件內部的元素</li>
  </ul>

  <h3>Shadow DOM 的解決方案</h3>
  <p>
    Shadow DOM 為元素建立了一個<strong>封裝的 DOM 子樹</strong>（Shadow Tree），
    有自己的樣式作用域：
  </p>
  <pre data-lang="javascript"><code class="language-javascript">// 原生 Shadow DOM API
const host = document.querySelector('#my-element');
const shadow = host.attachShadow({ mode: 'open' });

shadow.innerHTML = \`
  &lt;style&gt;
    /* 這個樣式只影響 shadow tree 內部 */
    p { color: blue; font-weight: bold; }
  &lt;/style&gt;
  &lt;p&gt;我是藍色的，但不會影響外部的 &lt;p&gt; 元素&lt;/p&gt;
\`;</code></pre>

  <h3>Shadow DOM 的邊界規則</h3>
  <table>
    <thead>
      <tr><th>場景</th><th>行為</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Shadow DOM 內部的 CSS 選擇器</td>
        <td>只匹配 Shadow Tree 內部的元素</td>
      </tr>
      <tr>
        <td>外部頁面的 CSS 選擇器</td>
        <td>不能穿透 Shadow Boundary（除非使用 CSS Custom Properties）</td>
      </tr>
      <tr>
        <td><code>document.querySelector()</code></td>
        <td>不能查詢到 Shadow DOM 內部的元素</td>
      </tr>
      <tr>
        <td>事件冒泡</td>
        <td>預設情況下事件不穿越 Shadow Boundary；<code>composed: true</code> 可改變此行為</td>
      </tr>
      <tr>
        <td>CSS Custom Properties</td>
        <td>可以從外部穿透 Shadow Boundary，是主題化的主要機制</td>
      </tr>
    </tbody>
  </table>

  <h3>:host 選擇器</h3>
  <p>
    在 Shadow DOM 的 CSS 中，<code>:host</code> 選擇器代表宿主元素（Shadow Host）本身：
  </p>
  <pre data-lang="css"><code class="language-css">/* 在 Lit 元件的 static styles 中 */
:host {
  display: block; /* 讓自訂元素預設為 block 而非 inline */
}

/* 根據宿主元素的屬性或狀態變化樣式 */
:host([variant="primary"]) .button {
  background: #FF6D00;
}

:host(:hover) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* 根據宿主元素所在的上下文 */
:host-context(.dark-theme) {
  color: white;
}</code></pre>
</section>

<section id="templates-slots">
  <h2>Templates 與 Slots</h2>
  <p>
    Slots 是 Web Components 的內容投影機制，類似 Vue 的 <code>&lt;slot&gt;</code>
    或 Angular 的 <code>&lt;ng-content&gt;</code>。
    它讓使用者可以將自定義內容投影到元件內部。
  </p>

  <h3>預設 Slot</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-card')
class MyCard extends LitElement {
  static styles = css\`
    .card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
    }
  \`;

  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;!-- 預設 Slot：接收所有未指定名稱的投影內容 --&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <pre data-lang="html"><code class="language-html">&lt;!-- 使用者端 --&gt;
&lt;my-card&gt;
  &lt;p&gt;這段內容會被投影到 slot 中&lt;/p&gt;
&lt;/my-card&gt;</code></pre>

  <h3>具名 Slot</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-article')
class MyArticle extends LitElement {
  render() {
    return html\`
      &lt;article&gt;
        &lt;header&gt;
          &lt;slot name="title"&gt;
            &lt;!-- 後備內容：沒有投影時顯示 --&gt;
            &lt;h2&gt;未命名文章&lt;/h2&gt;
          &lt;/slot&gt;
        &lt;/header&gt;

        &lt;div class="body"&gt;
          &lt;slot&gt;&lt;/slot&gt;  &lt;!-- 預設 slot --&gt;
        &lt;/div&gt;

        &lt;footer&gt;
          &lt;slot name="footer"&gt;&lt;/slot&gt;
        &lt;/footer&gt;
      &lt;/article&gt;
    \`;
  }
}</code></pre>

  <pre data-lang="html"><code class="language-html">&lt;my-article&gt;
  &lt;!-- slot="title" 投影到具名 slot --&gt;
  &lt;h1 slot="title"&gt;Lit 入門指南&lt;/h1&gt;

  &lt;!-- 無 slot 屬性的內容投影到預設 slot --&gt;
  &lt;p&gt;本文介紹如何開始使用 Lit...&lt;/p&gt;

  &lt;!-- 投影到 footer slot --&gt;
  &lt;div slot="footer"&gt;作者：Tim Chang&lt;/div&gt;
&lt;/my-article&gt;</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Slotted 內容的 CSS</div>
    <p>
      投影內容（Slotted Content）仍然屬於外部 Light DOM，
      可以用 <code>::slotted()</code> 選擇器在 Shadow DOM 內部對其套用有限的樣式：
    </p>
    <p><code>::slotted(p) { margin: 0; }</code> — 對投影進來的 &lt;p&gt; 元素套用樣式。</p>
  </div>
</section>

<section id="dev-workflow">
  <h2>開發工作流與除錯技巧</h2>

  <h3>Chrome DevTools 的 Web Components 支援</h3>
  <p>
    Chrome DevTools 提供了專屬的 Web Components 除錯工具：
  </p>
  <ul>
    <li>
      <strong>Elements 面板</strong>：Shadow DOM 會以 <code>#shadow-root</code>
      的形式展開，可以直接檢查和修改 Shadow DOM 內的元素
    </li>
    <li>
      <strong>Properties 面板</strong>：顯示元素的 JavaScript 屬性值，
      包括 Lit 的 @property 定義的屬性
    </li>
    <li>
      <strong>Custom Elements Panel</strong>（需安裝擴充套件）：
      「Web Components DevTools」Chrome Extension 提供元件樹視圖
    </li>
  </ul>

  <h3>Lit Playground 快速實驗</h3>
  <p>
    Lit 官方提供 <a href="https://lit.dev/playground/" target="_blank">Lit Playground</a>，
    可以在瀏覽器中直接實驗，無需本地設定。
    非常適合快速驗證想法或分享問題場景。
  </p>

  <h3>HMR 注意事項</h3>
  <p>
    Vite 提供 Hot Module Replacement，但 Custom Elements 有個限制：
    <code>customElements.define()</code> 只能呼叫一次。
    HMR 更新時需要重新整理頁面（Vite 通常會自動處理這個問題）。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 開發時的 HMR 友好模式
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // 這個配置讓 Lit 元件在 HMR 時正確更新
  server: {
    watch: {
      usePolling: false,
    },
  },
});</code></pre>

  <h3>常見錯誤與解決方案</h3>
  <table>
    <thead>
      <tr><th>錯誤</th><th>原因</th><th>解決方案</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>Failed to execute 'define' on 'CustomElementRegistry'</code></td>
        <td>同一個標籤名稱被 define 兩次</td>
        <td>確保每個標籤名稱只 define 一次，使用 HMR 時注意</td>
      </tr>
      <tr>
        <td>樣式不生效</td>
        <td>忘記 Shadow DOM 的 CSS 封裝，或選擇器錯誤</td>
        <td>使用 <code>:host</code> 選擇宿主，<code>::slotted()</code> 選擇投影內容</td>
      </tr>
      <tr>
        <td>屬性不更新</td>
        <td>直接修改物件屬性（非 reactive）</td>
        <td>需要 <code>this.items = [...this.items, newItem]</code> 觸發響應式更新</td>
      </tr>
      <tr>
        <td>事件未冒泡到外部</td>
        <td>事件沒有設定 <code>composed: true</code></td>
        <td>自訂事件加上 <code>{ bubbles: true, composed: true }</code></td>
      </tr>
    </tbody>
  </table>
</section>
`};export{t as default};
