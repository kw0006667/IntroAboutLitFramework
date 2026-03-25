export default {
  id: 3,
  slug: 'chapter-3',
  title: '環境建置與第一個 Lit Component',
  part: 1,
  intro: '從 TypeScript + Vite 的現代工具鏈開始，建立第一個 Custom Element，理解 Shadow DOM、Template 和 Custom Elements 三大支柱。',
  sections: [
    { slug: 'prerequisites', title: '前置需求與工具鏈' },
    { slug: 'project-setup', title: '建立 Vite + TypeScript 專案' },
    { slug: 'typescript-configuration', title: 'TypeScript 進階配置與裝飾器設定' },
    { slug: 'first-component', title: '撰寫第一個 Custom Element' },
    { slug: 'production-component', title: '生產級元件範例' },
    { slug: 'shadow-dom-intro', title: 'Shadow DOM 是什麼？' },
    { slug: 'templates-slots', title: 'Templates 與 Slots' },
    { slug: 'monorepo-setup', title: 'Monorepo 設定與多套件管理' },
    { slug: 'library-publishing', title: '函式庫發布：package.json exports 欄位' },
    { slug: 'dev-workflow', title: '開發工作流與除錯技巧' },
  ],
  content: `
<section id="prerequisites">
  <h2>前置需求與工具鏈</h2>
  <p>
    在開始之前，確保你的開發環境已準備好以下工具：
  </p>
  <ul>
    <li><strong>Node.js 20+</strong>：建議使用最新 LTS 版本，v20 引入了原生 Test Runner，對測試工作流有正面影響</li>
    <li><strong>pnpm 8+</strong>：pnpm 在大型 monorepo 中特別高效，透過硬連結共享依賴，顯著節省磁碟空間</li>
    <li><strong>VS Code</strong>（推薦）：搭配 Lit Plugin 提供模板語法高亮和補全</li>
    <li><strong>Chrome / Edge</strong>：Web Components DevTools 支援最佳</li>
  </ul>

  <h3>推薦的 VS Code 擴充套件</h3>
  <pre data-lang="bash"><code class="language-bash"># 安裝 Lit 官方 VS Code 插件
code --install-extension runem.lit-plugin

# TypeScript 官方語言支援（通常已內建）
code --install-extension vscode.typescript-language-features

# 額外推薦：用於開發 Web Components 的輔助工具
code --install-extension andys8.jest-snippets  # 測試輔助
code --install-extension bradlc.vscode-tailwindcss  # 如果搭配 Tailwind</code></pre>

  <p>
    <strong>lit-plugin</strong> 是 Lit 開發的必備工具，提供：
  </p>
  <ul>
    <li>HTML 模板（Tagged Template Literals）中的語法高亮</li>
    <li>HTML 屬性和事件的自動補全</li>
    <li>自訂元素的 TypeScript 型別檢查</li>
    <li>點擊元件定義的「跳轉至定義」功能</li>
    <li>偵測常見錯誤（如使用不存在的屬性、事件名稱拼錯等）</li>
  </ul>

  <h3>為什麼選 pnpm 而非 npm/yarn？</h3>
  <p>
    對於 Lit 元件庫開發，pnpm 有幾個工程優勢：
  </p>
  <ul>
    <li><strong>嚴格的依賴隔離</strong>：pnpm 的 node_modules 結構防止「幽靈依賴」（Ghost Dependencies）——
      只能使用在 package.json 中明確宣告的依賴，這對函式庫開發尤其重要</li>
    <li><strong>Workspace 支援</strong>：<code>pnpm-workspace.yaml</code> 讓 monorepo 管理更簡潔</li>
    <li><strong>磁碟效率</strong>：透過 content-addressable store 硬連結，多個專案共享相同依賴只存一份</li>
  </ul>
</section>

<section id="project-setup">
  <h2>建立 Vite + TypeScript 專案</h2>
  <p>
    Vite 是目前最適合 Lit 開發的構建工具：原生 ES Modules 開發伺服器、
    極快的 HMR（Hot Module Replacement）、輕量的生產構建。
  </p>

  <pre data-lang="bash"><code class="language-bash"># 建立新專案（使用 vanilla-ts 模板，不使用 React/Vue 模板）
npm create vite@latest my-lit-app -- --template vanilla-ts

# 進入目錄並安裝依賴
cd my-lit-app
npm install

# 安裝 Lit 與常用開發依賴
npm install lit
npm install -D @web/test-runner @web/dev-server-esbuild

# 啟動開發伺服器
npm run dev</code></pre>

  <h3>進階 Vite 配置</h3>
  <p>
    對於 Lit 元件庫開發，需要額外的 Vite 插件配置：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // 開發伺服器配置
  server: {
    port: 3000,
    open: true,
  },

  // 函式庫模式：用於發布 npm 套件
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],       // Web Components 只需要 ES Module 格式
      fileName: 'index',
    },
    rollupOptions: {
      // 將 Lit 標記為外部依賴（消費者自行提供）
      external: ['lit', 'lit/decorators.js', 'lit/directives/'],
    },
    // 生成型別宣告（需要 vite-plugin-dts）
    sourcemap: true,
  },

  // 開發時的 HMR 優化
  esbuild: {
    // Lit 裝飾器使用 stage 3 規格，esbuild 需要此設定
    target: 'es2022',
  },
});</code></pre>

  <h3>專案結構（元件庫模式）</h3>
  <pre data-lang="bash"><code class="language-bash">my-lit-app/
├── index.html              # 開發預覽頁面
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── index.ts            # 套件入口，統一匯出所有元件
│   ├── components/
│   │   ├── my-button/
│   │   │   ├── my-button.ts        # 元件實作
│   │   │   ├── my-button.stories.ts  # Storybook 故事
│   │   │   └── my-button.test.ts   # 單元測試
│   │   └── my-card/
│   │       └── ...
│   └── utils/              # 共用工具函數
└── dist/                   # 構建輸出（不提交到 git）</code></pre>
</section>

<section id="typescript-configuration">
  <h2>TypeScript 進階配置與裝飾器設定</h2>
  <p>
    Lit 的裝飾器配置是初學者最常遇到的混淆點之一。
    根本原因在於 TypeScript 的裝飾器演進史：舊版的 <code>experimentalDecorators</code>
    和新的 TC39 標準裝飾器有不同的語義，而 Lit 3.x 同時支援兩者，設定方式不同。
  </p>

  <h3>兩種裝飾器系統的差異</h3>
  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>experimentalDecorators（TypeScript 舊版）</h4>
      <ul>
        <li>TypeScript 自 1.5 版引入的早期實作</li>
        <li>基於 ES2015 Decorator Proposal（stage 1-2）</li>
        <li>裝飾器在類別定義階段執行</li>
        <li>需要 <code>experimentalDecorators: true</code> 和 <code>useDefineForClassFields: false</code></li>
        <li>Lit 2.x 預設使用此系統</li>
      </ul>
    </div>
    <div class="comparison-card">
      <h4>TC39 Standard Decorators（Stage 3）</h4>
      <ul>
        <li>ECMAScript 語言層面的正式提案，TypeScript 5.0+ 支援</li>
        <li>不需要任何 tsconfig 特殊設定</li>
        <li>語義與 experimentalDecorators 有所不同（影響 accessor 的行為）</li>
        <li>Lit 3.x 同時支援兩種裝飾器</li>
        <li>未來的標準方向，建議新專案採用</li>
      </ul>
    </div>
  </div>

  <h3>tsconfig.json：舊版裝飾器（Lit 2.x 相容）</h3>
  <pre data-lang="json"><code class="language-json">{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Lit 2.x 裝飾器必須設定
    "experimentalDecorators": true,
    "useDefineForClassFields": false,

    // 生成型別宣告（元件庫必要）
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // 確保匯入路徑包含副檔名（ESM 要求）
    "verbatimModuleSyntax": true
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}</code></pre>

  <h3>tsconfig.json：TC39 標準裝飾器（Lit 3.x，推薦）</h3>
  <pre data-lang="json"><code class="language-json">{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // TC39 標準裝飾器：不需要 experimentalDecorators
    // 也不需要 useDefineForClassFields（預設 true 即可）

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">useDefineForClassFields 深度解析</div>
    <p>
      這個設定是最常見的混淆源。TypeScript 2.7 引入了類別欄位（Class Fields）支援，
      但當時 TC39 的類別欄位提案還未確定語義。
      TypeScript 的早期實作使用了「assign 語義」（等同於在建構函數中賦值），
      而 ES2022 正式標準使用「define 語義」（使用 <code>Object.defineProperty</code>）。
    </p>
    <p>
      <code>useDefineForClassFields: true</code>（TypeScript 5+ 的新預設值）：
      使用 ES2022 define 語義。問題在於：Lit 的 <code>@property</code> 裝飾器在類別定義時
      用 <code>Object.defineProperty</code> 安裝 getter/setter，
      但 ES2022 的 define 語義會<em>覆蓋</em>這些 getter/setter，
      導致響應式系統失效。
    </p>
    <p>
      解決方案（選其一）：
      使用 Lit 3.x + TC39 Standard Decorators（自動處理此問題）；
      或使用 Lit 2.x 且設定 <code>useDefineForClassFields: false</code>。
    </p>
  </div>

  <h3>自訂元素的 TypeScript 型別宣告</h3>
  <p>
    為讓 TypeScript 和 HTML 模板分析工具正確識別你的自訂元素，
    需要宣告 <code>HTMLElementTagNameMap</code> 介面：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// src/my-button.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-button')
export class MyButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @property({ type: Boolean }) disabled = false;

  render() {
    return html\`&lt;button ?disabled=\${this.disabled}&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;\`;
  }
}

// 關鍵：宣告到全域型別映射
// 這讓 HTML 中的 &lt;my-button&gt; 有完整的 TypeScript 型別支援
// 也讓 lit-plugin 能夠提供型別安全的模板補全
declare global {
  interface HTMLElementTagNameMap {
    'my-button': MyButton;
  }
}</code></pre>

  <h3>tsconfig 的 paths 配置（單一 Repo 中的路徑別名）</h3>
  <pre data-lang="json"><code class="language-json">{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@tokens/*": ["src/design-tokens/*"]
    }
  }
}</code></pre>
  <p>
    搭配 Vite 的 <code>resolve.alias</code> 配置，讓開發時和構建時的路徑解析一致。
    注意：路徑別名在元件庫發布時需要特別注意——別名路徑在 <code>dist/</code> 中不會自動解析，
    需要在 <code>vite.config.ts</code> 中正確配置 Rollup 的外部依賴處理。
  </p>
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
    if (this.count &lt; this.max) {
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
    if (this.count &gt; this.min) {
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
}

declare global {
  interface HTMLElementTagNameMap {
    'my-counter': MyCounter;
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

<section id="production-component">
  <h2>生產級元件範例</h2>
  <p>
    以下是一個符合生產環境標準的 Lit 元件，包含完整的 TypeScript 型別、
    JSDoc 文檔、ARIA 無障礙屬性、CSS Custom Properties 主題化、
    以及適當的錯誤處理。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">/**
 * @element my-badge
 * @summary 用於顯示狀態標籤的徽章元件，支援多種語意變體和尺寸。
 *
 * @slot - 徽章的文字內容
 *
 * @cssproperty --badge-bg - 背景顏色（預設由 variant 決定）
 * @cssproperty --badge-color - 文字顏色（預設由 variant 決定）
 * @cssproperty --badge-border-radius - 圓角大小（預設 9999px）
 * @cssproperty --badge-font-size - 字體大小（預設 0.75rem）
 *
 * @fires badge-dismiss - 當使用者點擊關閉按鈕時觸發，detail: { label: string }
 *
 * @example
 * &lt;my-badge variant="success"&gt;已完成&lt;/my-badge&gt;
 * &lt;my-badge variant="warning" dismissible&gt;待審核&lt;/my-badge&gt;
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

/** 徽章的語意變體 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/** 徽章的尺寸 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/** badge-dismiss 事件的詳細資料 */
export interface BadgeDismissEventDetail {
  /** 被關閉的徽章的文字內容 */
  label: string;
}

@customElement('my-badge')
export class MyBadge extends LitElement {
  static styles = css\`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      /* 允許外部透過 CSS Custom Properties 覆蓋樣式 */
      background: var(--badge-bg, var(--_badge-bg));
      color: var(--badge-color, var(--_badge-color));
      border-radius: var(--badge-border-radius, 9999px);
      font-size: var(--badge-font-size, var(--_badge-font-size, 0.75rem));
      font-weight: 500;
      line-height: 1;
      padding: var(--_badge-padding, 4px 8px);
      white-space: nowrap;
    }

    /* 透過 CSS 自訂屬性實作變體，避免重複的 :host() 選擇器 */
    :host([variant="success"]) {
      --_badge-bg: #dcfce7;
      --_badge-color: #166534;
    }
    :host([variant="warning"]) {
      --_badge-bg: #fef9c3;
      --_badge-color: #854d0e;
    }
    :host([variant="error"]) {
      --_badge-bg: #fee2e2;
      --_badge-color: #991b1b;
    }
    :host([variant="info"]) {
      --_badge-bg: #dbeafe;
      --_badge-color: #1e40af;
    }
    :host(:not([variant])),
    :host([variant="default"]) {
      --_badge-bg: #f3f4f6;
      --_badge-color: #374151;
    }

    :host([size="sm"]) { --_badge-font-size: 0.65rem; --_badge-padding: 2px 6px; }
    :host([size="lg"]) { --_badge-font-size: 0.875rem; --_badge-padding: 6px 12px; }

    .dismiss-btn {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      opacity: 0.7;
      transition: opacity 0.15s;
      line-height: 1;
    }

    .dismiss-btn:hover { opacity: 1; }
    .dismiss-btn:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
    }
  \`;

  /**
   * 徽章的語意變體，決定背景和文字顏色。
   * 可被 CSS Custom Properties 覆蓋。
   */
  @property({ reflect: true })
  variant: BadgeVariant = 'default';

  /**
   * 徽章的尺寸。
   * - sm: 小型（適合密集資訊展示）
   * - md: 標準（預設）
   * - lg: 大型（適合突出顯示）
   */
  @property({ reflect: true })
  size: BadgeSize = 'md';

  /**
   * 是否顯示關閉按鈕。
   * 顯示後，使用者可以點擊關閉徽章，同時會觸發 badge-dismiss 事件。
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /** 直接查詢 Shadow DOM 中的關閉按鈕元素（用於焦點管理） */
  @query('.dismiss-btn')
  private _dismissBtn?: HTMLButtonElement;

  private _handleDismiss() {
    const label = this.textContent?.trim() ?? '';

    const event = new CustomEvent&lt;BadgeDismissEventDetail&gt;('badge-dismiss', {
      detail: { label },
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    // 允許父元素取消 dismiss 行為
    if (this.dispatchEvent(event)) {
      this.remove();
    }
  }

  render() {
    return html\`
      &lt;slot&gt;&lt;/slot&gt;
      \${this.dismissible
        ? html\`
          &lt;button
            class="dismiss-btn"
            aria-label="關閉"
            @click=\${this._handleDismiss}
          &gt;
            &amp;times;
          &lt;/button&gt;
        \`
        : nothing
      }
    \`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-badge': MyBadge;
  }
}</code></pre>

  <h3>使用範例</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- 基本用法 --&gt;
&lt;my-badge variant="success"&gt;已完成&lt;/my-badge&gt;
&lt;my-badge variant="warning" size="lg"&gt;需要審核&lt;/my-badge&gt;

&lt;!-- 可關閉的徽章 --&gt;
&lt;my-badge variant="info" dismissible&gt;新功能&lt;/my-badge&gt;

&lt;!-- 透過 CSS Custom Properties 自訂主題 --&gt;
&lt;my-badge style="--badge-bg: #7c3aed; --badge-color: white;"&gt;
  紫色標籤
&lt;/my-badge&gt;</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// 監聽 dismiss 事件
document.querySelector('my-badge')?.addEventListener('badge-dismiss', (e) =&gt; {
  const { label } = (e as CustomEvent&lt;BadgeDismissEventDetail&gt;).detail;
  console.log(\`徽章 "\${label}" 已被關閉\`);
});</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">生產元件的檢核清單</div>
    <p>在發布元件到設計系統之前，確認以下幾點：</p>
    <ul>
      <li>所有 <code>@property</code> 屬性都有明確的 TypeScript 型別和 JSDoc</li>
      <li>所有自訂事件都有型別安全的 <code>CustomEvent&lt;T&gt;</code> 定義</li>
      <li>互動元素有適當的 <code>aria-label</code> 或 <code>aria-describedby</code></li>
      <li>樣式支援透過 CSS Custom Properties 進行主題化</li>
      <li><code>:focus-visible</code> 而非 <code>:focus</code> 管理焦點樣式（鍵盤導覽）</li>
      <li>宣告了 <code>HTMLElementTagNameMap</code> 介面</li>
      <li>JSDoc 的 <code>@element</code>、<code>@slot</code>、<code>@cssproperty</code> 標籤完整</li>
    </ul>
  </div>
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
      <tr>
        <td>CSS Part（<code>::part()</code>）</td>
        <td>元件可以用 <code>part="..."</code> 暴露部分內部結構供外部樣式化</td>
      </tr>
    </tbody>
  </table>

  <h3>CSS ::part() 進階用法</h3>
  <p>
    <code>::part()</code> 是 Shadow DOM 樣式系統中的重要補充，
    讓元件作者可以有選擇地暴露內部結構給外部樣式：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 元件內部：用 part 屬性標記可樣式化的部位
@customElement('my-input')
class MyInput extends LitElement {
  render() {
    return html\`
      &lt;div part="wrapper"&gt;
        &lt;label part="label"&gt;&lt;slot name="label"&gt;&lt;/slot&gt;&lt;/label&gt;
        &lt;input part="input" /&gt;
        &lt;span part="helper"&gt;&lt;slot name="helper"&gt;&lt;/slot&gt;&lt;/span&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <pre data-lang="css"><code class="language-css">/* 使用端（外部 CSS）：透過 ::part() 樣式化元件內部 */
my-input::part(label) {
  font-weight: 600;
  color: #1a1a2e;
}

my-input::part(input) {
  border: 2px solid #6c63ff;
  border-radius: 6px;
  padding: 8px 12px;
}

/* 甚至可以使用偽類（但有限制，如 :hover 可用，::before 不可用）*/
my-input::part(input):focus {
  outline: 3px solid #6c63ff;
  outline-offset: 2px;
}</code></pre>

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

  <h3>slotchange 事件：動態回應投影內容的變化</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-tabs')
class MyTabs extends LitElement {
  @queryAssignedElements({ slot: 'tab' })
  private _tabs!: Array&lt;HTMLElement&gt;;

  private _handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const assignedElements = slot.assignedElements();
    console.log(\`目前有 \${assignedElements.length} 個 tab 被投影\`);
    // 可在此更新 ARIA roles 或其他依賴投影元素數量的邏輯
  }

  render() {
    return html\`
      &lt;div role="tablist"&gt;
        &lt;slot name="tab" @slotchange=\${this._handleSlotChange}&gt;&lt;/slot&gt;
      &lt;/div&gt;
      &lt;div&gt;
        &lt;slot name="panel"&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="monorepo-setup">
  <h2>Monorepo 設定與多套件管理</h2>
  <p>
    當你的設計系統包含多個元件套件時，Monorepo 架構能夠大幅提升開發效率。
    以下是一個適合 Lit 元件庫的 pnpm Workspace Monorepo 設定。
  </p>

  <h3>Monorepo 目錄結構</h3>
  <pre data-lang="bash"><code class="language-bash">design-system/
├── pnpm-workspace.yaml
├── package.json             # 根目錄 package.json（工作區配置）
├── tsconfig.base.json       # 共用 tsconfig 基礎配置
├── packages/
│   ├── tokens/              # 設計令牌套件
│   │   ├── package.json     # @design-system/tokens
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   ├── components/          # 核心元件套件
│   │   ├── package.json     # @design-system/components
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── button/
│   │   │   └── input/
│   │   └── tsconfig.json
│   └── react/               # React Wrapper 套件
│       ├── package.json     # @design-system/react
│       └── src/
│           └── index.ts
├── apps/
│   └── storybook/           # Storybook 開發環境
│       ├── package.json
│       └── .storybook/
└── tools/
    └── build/               # 共用構建腳本</code></pre>

  <h3>pnpm-workspace.yaml</h3>
  <pre data-lang="yaml"><code class="language-yaml">packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'</code></pre>

  <h3>根目錄 package.json</h3>
  <pre data-lang="json"><code class="language-json">{
  "name": "design-system",
  "private": true,
  "scripts": {
    "build": "pnpm -r --filter './packages/*' run build",
    "dev": "pnpm --filter storybook run dev",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "clean": "pnpm -r run clean"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.0.0"
  }
}</code></pre>

  <h3>套件間的依賴管理</h3>
  <pre data-lang="json"><code class="language-json">// packages/components/package.json
{
  "name": "@design-system/components",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@design-system/tokens": "workspace:*",
    "lit": "^3.0.0"
  },
  "devDependencies": {
    "@web/test-runner": "^0.18.0",
    "typescript": "^5.4.0"
  }
}</code></pre>

  <p>
    <code>workspace:*</code> 是 pnpm 的 Workspace 協定，
    它讓 <code>@design-system/tokens</code> 在開發時直接連結到本地的 <code>packages/tokens</code>，
    無需每次修改後手動 <code>npm link</code> 或發布。
    在正式發布時，pnpm 會將 <code>workspace:*</code> 替換為具體的版本號。
  </p>

  <h3>共用 TypeScript 基礎配置</h3>
  <pre data-lang="json"><code class="language-json">// tsconfig.base.json（根目錄）
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}</code></pre>

  <pre data-lang="json"><code class="language-json">// packages/components/tsconfig.json（繼承基礎配置）
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "references": [
    { "path": "../tokens" }
  ]
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">TypeScript Project References</div>
    <p>
      <code>composite: true</code> 和 <code>references</code> 啟用了 TypeScript 的
      Project References 功能。這讓 <code>tsc --build</code> 能夠追蹤套件間的依賴關係，
      只重新編譯真正改變的套件，顯著加快大型 Monorepo 的型別檢查速度。
    </p>
  </div>

  <h3>Changesets：版本管理與 Changelog</h3>
  <pre data-lang="bash"><code class="language-bash"># 安裝 Changesets
pnpm add -D @changesets/cli -w

# 初始化
pnpm changeset init

# 開發時：記錄變更
pnpm changeset

# 發布前：更新版本號
pnpm changeset version

# 發布
pnpm -r publish --filter './packages/*'</code></pre>
  <p>
    Changesets 是 Monorepo 版本管理的最佳實踐工具。
    它允許每個套件有獨立的版本號，並自動生成 CHANGELOG.md，
    是 Turborepo 和大型開源設計系統（如 Radix UI、shadcn/ui）的標準配備。
  </p>
</section>

<section id="library-publishing">
  <h2>函式庫發布：package.json exports 欄位</h2>
  <p>
    現代 npm 套件應使用 <code>exports</code> 欄位取代舊式的 <code>main</code> 欄位，
    以支援條件式匯出（Conditional Exports）和 Tree Shaking 優化。
  </p>

  <h3>完整的 package.json 配置</h3>
  <pre data-lang="json"><code class="language-json">{
  "name": "@design-system/components",
  "version": "1.0.0",
  "description": "企業設計系統 Web Components 元件庫",
  "type": "module",
  "keywords": ["web-components", "lit", "design-system"],
  "license": "MIT",

  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./button": {
      "types": "./dist/button/my-button.d.ts",
      "import": "./dist/button/my-button.js"
    },
    "./badge": {
      "types": "./dist/badge/my-badge.d.ts",
      "import": "./dist/badge/my-badge.js"
    }
  },

  "files": [
    "dist",
    "!dist/**/*.test.*",
    "!dist/**/*.stories.*"
  ],

  "peerDependencies": {
    "lit": "^3.0.0"
  },

  "scripts": {
    "build": "tsc --build && vite build",
    "typecheck": "tsc --noEmit",
    "test": "web-test-runner src/**/*.test.ts",
    "clean": "rm -rf dist"
  }
}</code></pre>

  <h3>exports 欄位的工程意義</h3>
  <ul>
    <li>
      <strong>子路徑匯出（Subpath Exports）</strong>：
      <code>"./button"</code> 允許消費者用 <code>import '@design-system/components/button'</code>
      只引入所需的元件，而非整個套件。這對 Tree Shaking 非常關鍵。
    </li>
    <li>
      <strong>條件式匯出</strong>：
      <code>types</code> 欄位讓 TypeScript 知道型別宣告的位置；
      <code>import</code> 欄位指向 ES Module 構建產物。
      如果需要支援 CommonJS（Node.js 環境），可以加上 <code>require</code> 欄位。
    </li>
    <li>
      <strong>封包（Barrel）vs 個別匯入</strong>：
      提供根路徑 <code>"."</code>（匯入所有元件）和個別子路徑是最佳實踐。
      消費者可以根據需要選擇，搭配構建工具的 Tree Shaking 使用。
    </li>
  </ul>

  <h3>Custom Elements Manifest</h3>
  <p>
    <code>custom-elements.json</code> 是一個機器可讀的元件描述文件，
    讓工具（Storybook、IDE 插件、文檔生成器）能夠自動識別元件的屬性、事件和 Slot：
  </p>
  <pre data-lang="bash"><code class="language-bash"># 安裝 Custom Elements Manifest Analyzer
npm install -D @custom-elements-manifest/analyzer

# 在 package.json 加入腳本
# "analyze": "cem analyze --globs 'src/**/*.ts'"

# 執行分析
npm run analyze</code></pre>
  <pre data-lang="json"><code class="language-json">{
  "name": "@design-system/components",
  "customElements": "custom-elements.json",
  "exports": {
    ...
  }
}</code></pre>
  <p>
    將 <code>customElements</code> 欄位加入 <code>package.json</code>，
    讓 Storybook 和其他工具能自動讀取元件的 API 文檔。
  </p>
</section>

<section id="dev-workflow">
  <h2>開發工作流與除錯技巧</h2>

  <h3>Chrome DevTools：深度檢查 Shadow DOM</h3>
  <p>
    Chrome DevTools 提供了完整的 Web Components 除錯支援，以下是資深工程師應掌握的進階技巧：
  </p>
  <ul>
    <li>
      <strong>Elements 面板 → Shadow DOM 展開</strong>：
      點擊 <code>#shadow-root (open)</code> 展開後，可以直接在 Elements 面板中修改 Shadow DOM 內的樣式。
      注意：<code>closed</code> 模式的 Shadow Root 在 DevTools 中是不可見的。
    </li>
    <li>
      <strong>Console 中訪問 Shadow Root</strong>：
      <code>$0.shadowRoot</code>——<code>$0</code> 是 Elements 面板中當前選中的元素，
      <code>.shadowRoot</code> 返回其 Shadow Root，讓你可以在 Console 中查詢 Shadow DOM 內部的元素。
    </li>
    <li>
      <strong>Reactive Properties 的即時修改</strong>：
      在 Console 中，選中元素後執行 <code>$0.count = 42</code>，
      Lit 的響應式系統會立即觸發重新渲染，非常適合快速驗證 UI 狀態。
    </li>
    <li>
      <strong>Performance 面板中的更新追蹤</strong>：
      錄製 Performance Profile 時，Lit 的更新會顯示為 <code>LitElement.performUpdate</code> 的 JavaScript Task。
      可以用此追蹤不必要的重新渲染。
    </li>
  </ul>

  <pre data-lang="javascript"><code class="language-javascript">// 在 DevTools Console 中常用的除錯命令

// 查詢 Shadow DOM 內部的元素
$0.shadowRoot.querySelector('.count')

// 檢查元件的所有 Reactive Properties
const el = document.querySelector('my-counter');
el.count;  // 當前值
el.min;
el.max;

// 手動觸發更新（用於除錯排程問題）
el.requestUpdate();
await el.updateComplete;
console.log('更新完成');

// 查詢元件的 Shadow Root 並修改樣式（暫時性調試）
el.shadowRoot.querySelector('button').style.background = 'red';</code></pre>

  <h3>Web Components DevTools 擴充套件</h3>
  <p>
    「Web Components DevTools」Chrome Extension（由 Matias Hämäläinen 開發）
    提供了比原生 DevTools 更強大的元件除錯功能：
  </p>
  <ul>
    <li>元件樹視圖，清楚顯示 Custom Element 的巢狀結構</li>
    <li>即時查看和修改每個元件的 Properties（包括私有屬性）</li>
    <li>事件記錄器：追蹤哪些元件觸發了哪些自訂事件</li>
    <li>直接在 Panel 中觸發元件事件（測試事件監聽器）</li>
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

  <pre data-lang="typescript"><code class="language-typescript">// vite.config.ts（生產環境優化配置）
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      usePolling: false,
    },
  },
  build: {
    // 讓每個元件單獨成為一個 chunk（提升 Tree Shaking）
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lit')) return 'lit-vendor';
        },
      },
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
      <tr>
        <td>裝飾器不作用（屬性值不是響應式的）</td>
        <td><code>useDefineForClassFields: true</code> 覆蓋了裝飾器的 getter/setter</td>
        <td>設定 <code>useDefineForClassFields: false</code> 或升級至 Lit 3 + TC39 裝飾器</td>
      </tr>
      <tr>
        <td>React 中傳遞複雜物件 Prop 無效</td>
        <td>React 將所有 JSX Prop 視為 HTML Attribute（字串）</td>
        <td>使用 <code>@lit/react</code> 的 <code>createComponent</code> 或 React 19+</td>
      </tr>
      <tr>
        <td>Shadow DOM 內元素無法被外部 CSS 選中</td>
        <td>這是 Shadow DOM 封裝的預期行為</td>
        <td>使用 CSS Custom Properties 或 <code>::part()</code> 暴露可樣式化的部分</td>
      </tr>
    </tbody>
  </table>
</section>
`,
};
