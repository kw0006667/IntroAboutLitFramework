export default {
  id: 13,
  slug: 'chapter-13',
  title: '設計系統與 Component Library 的建構',
  part: 4,
  intro: '用 Lit 打造跨框架 Design System 的最佳實踐，包含 theming（CSS Custom Properties）、Storybook 整合、版本策略、無障礙設計、多主題架構與元件 API 設計哲學。',
  sections: [
    { slug: 'design-system-why', title: '為何用 Lit 建設計系統？' },
    { slug: 'css-custom-properties-theming', title: 'CSS Custom Properties Theming' },
    { slug: 'token-system', title: 'Design Token 系統設計' },
    { slug: 'accessibility-first', title: '無障礙設計優先：ARIA 與 ElementInternals' },
    { slug: 'multi-theme-architecture', title: '多主題架構：Dark Mode、Brand Theming、High Contrast' },
    { slug: 'component-api-design', title: '元件 API 設計哲學：Prop vs Attribute vs Slot' },
    { slug: 'storybook-integration', title: 'Storybook 整合' },
    { slug: 'versioning-strategy', title: '版本策略與 Breaking Changes' },
    { slug: 'publishing-npm', title: '發佈到 npm 的最佳實踐' },
  ],
  content: `
<section id="design-system-why">
  <h2>為何用 Lit 建設計系統？</h2>
  <p>
    設計系統是企業前端基礎設施的核心。
    當組織有多個產品線、多個技術棧時，
    一個能夠跨框架使用的 UI 元件庫是最理想的選擇。
    Lit 是目前建構跨框架設計系統的最佳工具。
  </p>

  <h3>真實世界的採用案例</h3>
  <ul>
    <li><strong>Salesforce Lightning Design System</strong>：使用 LWC（與 Lit 相似的 Web Components 框架）</li>
    <li><strong>Adobe Spectrum</strong>：<code>@spectrum-web-components</code>，基於 Lit</li>
    <li><strong>Microsoft FAST</strong>：Microsoft 的 Web Components 設計系統</li>
    <li><strong>GitHub Primer</strong>：部分元件遷移至 Web Components</li>
    <li><strong>ING Bank Lion</strong>：完整的 Lit Web Components 設計系統</li>
  </ul>

  <h3>設計系統的核心要求</h3>
  <ul>
    <li><strong>跨框架</strong>：React、Vue、Angular 團隊都能使用</li>
    <li><strong>可主題化</strong>：支援品牌定制、深淺色主題、高對比度</li>
    <li><strong>可存取性</strong>：符合 WCAG 2.1 AA 標準，支援鍵盤導航與螢幕閱讀器</li>
    <li><strong>文件完善</strong>：有 Storybook 和 API 文件（Custom Elements Manifest）</li>
    <li><strong>版本穩定</strong>：Breaking Changes 有清晰的遷移路徑</li>
  </ul>

  <div class="callout callout-info">
    <div class="callout-title">為什麼不用 React Component Library？</div>
    <p>
      React 元件庫（如 MUI、Ant Design）只能在 React 專案中使用。
      若組織同時有 React、Vue 3、Angular 產品線，維護三套設計系統成本極高。
      基於 Lit 的 Web Components 設計系統只需維護一套，
      各框架透過原生 HTML 自訂元素語義即可使用。
    </p>
  </div>
</section>

<section id="css-custom-properties-theming">
  <h2>CSS Custom Properties Theming</h2>
  <p>
    CSS Custom Properties 是 Web Components 主題化的官方機制。
    它們可以穿透 Shadow DOM 邊界，讓外部可以定制元件內部的樣式。
  </p>

  <pre data-lang="css"><code class="language-css">/* 設計系統：定義元件的 CSS API */
my-button {
  /* 文件化的 CSS Custom Properties */
  --my-button-bg: #FF6D00;
  --my-button-color: white;
  --my-button-border-radius: 4px;
  --my-button-padding: 8px 16px;
  --my-button-font-size: 0.875rem;
  --my-button-hover-opacity: 0.85;
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-button')
class MyButton extends LitElement {
  static styles = css\`
    :host {
      display: inline-block;
    }

    button {
      /* 使用 CSS Custom Properties，提供合理的預設值 */
      background: var(--my-button-bg, #FF6D00);
      color: var(--my-button-color, white);
      border-radius: var(--my-button-border-radius, 4px);
      padding: var(--my-button-padding, 8px 16px);
      font-size: var(--my-button-font-size, 0.875rem);
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
    }

    button:hover {
      opacity: var(--my-button-hover-opacity, 0.85);
    }

    /* Variant via :host attribute */
    :host([variant="secondary"]) button {
      background: var(--my-button-secondary-bg, transparent);
      color: var(--my-button-secondary-color, #FF6D00);
      border: 1px solid currentColor;
    }

    :host([size="sm"]) button {
      padding: var(--my-button-sm-padding, 4px 12px);
      font-size: var(--my-button-sm-font-size, 0.75rem);
    }
  \`;

  @property() variant: 'primary' | 'secondary' = 'primary';
  @property() size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) disabled = false;

  render() {
    return html\`
      &lt;button ?disabled=\${this.disabled}&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`;
  }
}</code></pre>

  <h3>主題套用方式</h3>
  <pre data-lang="css"><code class="language-css">/* 全域主題：覆蓋所有元件的預設值 */
:root {
  --my-button-bg: #1a73e8;
  --my-button-border-radius: 24px;  /* 圓角主題 */
}

/* 深色主題 */
[data-theme="dark"] {
  --my-button-bg: #4a90d9;
}

/* 局部覆蓋：特定區域的按鈕 */
.danger-zone my-button {
  --my-button-bg: #d32f2f;
}</code></pre>

  <h3>CSS Part：Shadow DOM 樣式穿透的另一種方式</h3>
  <p>
    除了 CSS Custom Properties，<code>::part()</code> 偽元素允許外部 CSS 直接選取 Shadow DOM 中被標記為 <code>part</code> 的元素。
    這對需要完整樣式覆蓋的場景非常有用。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-card')
class MyCard extends LitElement {
  static styles = css\`
    .card {
      border-radius: 8px;
      padding: 16px;
      background: var(--my-card-bg, white);
      box-shadow: var(--my-card-shadow, 0 2px 8px rgba(0,0,0,0.1));
    }
    .card-header {
      font-weight: 600;
      margin-bottom: 8px;
    }
  \`;

  render() {
    return html\`
      &lt;div class="card" part="card"&gt;
        &lt;div class="card-header" part="header"&gt;
          &lt;slot name="header"&gt;&lt;/slot&gt;
        &lt;/div&gt;
        &lt;div class="card-body" part="body"&gt;
          &lt;slot&gt;&lt;/slot&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <pre data-lang="css"><code class="language-css">/* 外部 CSS 直接選取 part */
my-card::part(card) {
  border: 2px solid var(--brand-primary);
}

my-card::part(header) {
  font-size: 1.25rem;
  color: var(--brand-primary);
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">CSS Custom Properties vs ::part()</div>
    <p>
      <strong>CSS Custom Properties</strong> 適合有限的、預定義的樣式定制點——讓作者控制哪些樣式可被修改。<br/>
      <strong>::part()</strong> 適合需要完全樣式自由度的場景，但失去了封裝性。<br/>
      設計系統應優先使用 CSS Custom Properties，只在必要時暴露 part。
    </p>
  </div>
</section>

<section id="token-system">
  <h2>Design Token 系統設計</h2>
  <p>
    Design Token 是設計系統的語言，將設計決策（顏色、間距、字體）抽象為命名常數，
    讓設計師和工程師使用同一套詞彙。
  </p>

  <h3>Token 的四個層次</h3>
  <pre data-lang="css"><code class="language-css">/* 第一層：Primitive Tokens（原始值） */
:root {
  --color-orange-50: #fff3e0;
  --color-orange-100: #ffe0b2;
  --color-orange-500: #FF6D00;
  --color-orange-700: #e65100;

  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-8: 32px;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}

/* 第二層：Semantic Tokens（語意化） */
:root {
  --color-primary: var(--color-orange-500);
  --color-primary-hover: var(--color-orange-700);
  --color-primary-subtle: var(--color-orange-50);

  --spacing-component-gap: var(--spacing-2);
  --spacing-section-gap: var(--spacing-8);

  --font-size-body: var(--font-size-sm);
  --font-size-heading: var(--font-size-lg);
}

/* 第三層：Component Tokens（元件級） */
:root {
  --button-bg: var(--color-primary);
  --button-bg-hover: var(--color-primary-hover);
  --button-padding-x: var(--spacing-4);
  --button-padding-y: var(--spacing-2);
  --button-font-size: var(--font-size-body);
}

/* 第四層：State Tokens（狀態級，覆蓋特定互動狀態） */
:root {
  --button-bg-disabled: var(--color-neutral-300);
  --button-color-disabled: var(--color-neutral-500);
  --button-bg-loading: var(--color-primary);
  --button-opacity-loading: 0.7;
}</code></pre>

  <h3>使用 Style Dictionary 自動化 Token 管理</h3>
  <p>
    <a href="https://amzn.github.io/style-dictionary/" target="_blank">Style Dictionary</a>（Amazon 開源）
    讀取 JSON 或 YAML 格式的 token 定義，輸出 CSS、JavaScript、Android XML、iOS Swift 等多平台格式。
    這讓同一套 token 定義可以在 Web、iOS、Android 平台保持一致。
  </p>

  <pre data-lang="json"><code class="language-json">// tokens/color.json
{
  "color": {
    "primary": {
      "50":  { "value": "#fff3e0", "type": "color" },
      "100": { "value": "#ffe0b2", "type": "color" },
      "500": { "value": "#FF6D00", "type": "color" },
      "700": { "value": "#e65100", "type": "color" }
    },
    "neutral": {
      "100": { "value": "#f5f5f5", "type": "color" },
      "300": { "value": "#e0e0e0", "type": "color" },
      "500": { "value": "#9e9e9e", "type": "color" },
      "900": { "value": "#212121", "type": "color" }
    }
  },
  "semantic": {
    "brand-primary":    { "value": "{color.primary.500}", "type": "color" },
    "brand-primary-hv": { "value": "{color.primary.700}", "type": "color" },
    "text-default":     { "value": "{color.neutral.900}", "type": "color" },
    "text-subtle":      { "value": "{color.neutral.500}", "type": "color" }
  }
}</code></pre>

  <pre data-lang="javascript"><code class="language-javascript">// style-dictionary.config.js
import StyleDictionary from 'style-dictionary';

export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'ds',
      buildPath: 'dist/tokens/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true },
      }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/tokens/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/es6',
      }],
    },
    ios: {
      transformGroup: 'ios-swift',
      buildPath: 'dist/tokens/ios/',
      files: [{
        destination: 'DesignTokens.swift',
        format: 'ios-swift/class.swift',
      }],
    },
    android: {
      transformGroup: 'android',
      buildPath: 'dist/tokens/android/',
      files: [{
        destination: 'colors.xml',
        format: 'android/colors',
      }],
    },
  },
};</code></pre>

  <h3>Figma Token Studio → Style Dictionary 流水線</h3>
  <p>
    現代設計系統工作流的標準做法：設計師在 Figma 中使用
    <a href="https://tokens.studio/" target="_blank">Tokens Studio for Figma</a>
    外掛定義 token，並同步到 GitHub repository，
    觸發 CI/CD 流水線自動執行 Style Dictionary 生成多平台輸出。
  </p>

  <pre data-lang="yaml"><code class="language-yaml"># .github/workflows/tokens.yml
name: Build Design Tokens

on:
  push:
    paths:
      - 'tokens/**'

jobs:
  build-tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx style-dictionary build
      - name: Commit generated tokens
        run: |
          git config --global user.name "tokens-bot"
          git config --global user.email "tokens@company.com"
          git add dist/tokens/
          git diff --staged --quiet || git commit -m "chore: rebuild design tokens"
          git push</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Custom Elements Manifest 文件化 Token</div>
    <p>
      使用 <code>@custom-elements-manifest/analyzer</code> 可以從 JSDoc 注解自動生成
      Custom Elements Manifest（CEM），記錄每個元件支援的 CSS Custom Properties、
      Attributes、Properties、Events 和 Slots。這是設計系統 API 文件的標準格式，
      Storybook、VS Code 等工具可讀取 CEM 提供自動完成和文件預覽。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">/**
 * 主要操作按鈕元件
 *
 * @summary 支援多種尺寸與樣式變體的按鈕元件
 *
 * @csspart button - 內部 &lt;button&gt; 元素，可透過 ::part(button) 覆蓋樣式
 *
 * @cssprop [--my-button-bg=#FF6D00] - 按鈕背景色
 * @cssprop [--my-button-color=white] - 按鈕文字色
 * @cssprop [--my-button-border-radius=4px] - 按鈕圓角
 * @cssprop [--my-button-padding=8px 16px] - 按鈕內距
 *
 * @slot - 按鈕文字或圖示內容
 * @slot icon-start - 文字左側圖示
 * @slot icon-end - 文字右側圖示
 *
 * @fires click - 使用者點擊時觸發（原生事件）
 * @fires my-button-click - 附帶 detail.variant 的自訂事件
 *
 * @attr {string} [variant=primary] - 按鈕樣式：primary | secondary | ghost | danger
 * @attr {string} [size=md] - 按鈕尺寸：sm | md | lg
 * @attr {boolean} [disabled=false] - 是否禁用
 * @attr {boolean} [loading=false] - 是否顯示載入狀態
 */
@customElement('my-button')
export class MyButton extends LitElement {
  // ...
}</code></pre>
</section>

<section id="accessibility-first">
  <h2>無障礙設計優先：ARIA 與 ElementInternals</h2>
  <p>
    無障礙設計（Accessibility，a11y）是企業級設計系統的硬性要求。
    WCAG 2.1 AA 標準要求所有互動元件都必須可用鍵盤操作，
    並提供螢幕閱讀器可理解的語意資訊。
    Web Components 的 Shadow DOM 在無障礙方面有一些特殊挑戰，需要特別處理。
  </p>

  <h3>ARIA 角色與屬性模式</h3>
  <p>
    自訂元素必須手動設定 ARIA 屬性，因為瀏覽器不知道你的元件扮演什麼語意角色。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('my-dialog')
class MyDialog extends LitElement {
  static styles = css\`
    :host {
      display: none;
    }
    :host([open]) {
      display: block;
    }
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dialog {
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 90vw;
    }
  \`;

  @property({ type: Boolean, reflect: true }) open = false;
  @property() label = '';
  @property() describedby = '';

  // 當 dialog 開啟時，焦點應移至 dialog 內部
  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('open') &amp;&amp; this.open) {
      // 確保元素渲染完成後再移動焦點
      requestAnimationFrame(() =&gt; {
        const firstFocusable = this.shadowRoot?.querySelector&lt;HTMLElement&gt;(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
    }
  }

  render() {
    return html\`
      &lt;div
        class="overlay"
        role="dialog"
        aria-modal="true"
        aria-label=\${this.label}
        aria-describedby=\${this.describedby || nothing}
        @keydown=\${this._handleKeydown}
      &gt;
        &lt;div class="dialog"&gt;
          &lt;slot name="header"&gt;&lt;/slot&gt;
          &lt;div id="dialog-body"&gt;
            &lt;slot&gt;&lt;/slot&gt;
          &lt;/div&gt;
          &lt;slot name="footer"&gt;&lt;/slot&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.open = false;
      this.dispatchEvent(new CustomEvent('my-dialog-close'));
    }
    // Trap focus within dialog
    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  }

  private _trapFocus(e: KeyboardEvent) {
    const focusableEls = this.shadowRoot?.querySelectorAll&lt;HTMLElement&gt;(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableEls?.length) return;
    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];
    if (e.shiftKey &amp;&amp; document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey &amp;&amp; document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
}</code></pre>

  <h3>aria-labelledby 與 aria-describedby 的跨 Shadow DOM 挑戰</h3>
  <p>
    IDREF 屬性（<code>aria-labelledby</code>、<code>aria-describedby</code>、<code>aria-controls</code>）
    只能引用同一個 DOM 樹中的 ID。Shadow DOM 邊界會阻斷這些引用。
    有幾種解決方案：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 方案一：將 label 文字直接傳入，使用 aria-label
@customElement('ds-input')
class DsInput extends LitElement {
  @property() label = '';
  @property() helpText = '';
  @property() errorMessage = '';

  render() {
    return html\`
      &lt;label&gt;\${this.label}&lt;/label&gt;
      &lt;input
        type="text"
        aria-label=\${this.label}
        aria-describedby=\${this.helpText ? 'help' : nothing}
        aria-errormessage=\${this.errorMessage ? 'error' : nothing}
        aria-invalid=\${this.errorMessage ? 'true' : 'false'}
      /&gt;
      \${this.helpText ? html\`
        &lt;div id="help" role="note"&gt;\${this.helpText}&lt;/div&gt;
      \` : nothing}
      \${this.errorMessage ? html\`
        &lt;div id="error" role="alert"&gt;\${this.errorMessage}&lt;/div&gt;
      \` : nothing}
    \`;
  }
}

// 方案二：使用 ARIAMixin（Chrome 81+）在宿主元素上設定 ARIA
// 使用 ElementInternals（見下文 Form-Associated 章節）
// internals.ariaLabel = 'Submit form';
// internals.ariaRequired = 'true';</code></pre>

  <h3>ElementInternals：Form-Associated Custom Elements</h3>
  <p>
    <code>ElementInternals</code> API 是 Web Components 無障礙設計的里程碑。
    它讓自訂元素能夠：
  </p>
  <ul>
    <li>參與原生 <code>&lt;form&gt;</code> 表單提交（如同原生 <code>input</code>）</li>
    <li>支援 <code>required</code>、<code>disabled</code> 等表單屬性</li>
    <li>整合表單驗證 API（Constraint Validation API）</li>
    <li>在 <code>FormData</code> 中正確序列化值</li>
    <li>透過 <code>ARIAMixin</code> 設定 ARIA 屬性</li>
  </ul>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('ds-checkbox')
class DsCheckbox extends LitElement {
  // 宣告為 form-associated custom element
  static formAssociated = true;

  private internals: ElementInternals;

  constructor() {
    super();
    // 取得 ElementInternals 實例
    this.internals = this.attachInternals();
  }

  static styles = css\`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
    .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid var(--ds-checkbox-border, #757575);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host([checked]) .checkbox {
      background: var(--ds-checkbox-bg-checked, #1a73e8);
      border-color: var(--ds-checkbox-bg-checked, #1a73e8);
    }
  \`;

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ reflect: true }) name = '';
  @property() value = 'on';
  @property() label = '';

  updated(changed: Map&lt;string, unknown&gt;) {
    if (changed.has('checked') || changed.has('name') || changed.has('value')) {
      // 通知表單此元件的目前值
      this.internals.setFormValue(this.checked ? this.value : null);
    }
    if (changed.has('checked')) {
      this._updateValidity();
    }
    // 使用 ARIAMixin 設定無障礙屬性
    this.internals.ariaChecked = this.checked ? 'true' : 'false';
    this.internals.role = 'checkbox';
    this.internals.ariaLabel = this.label;
  }

  private _updateValidity() {
    const required = this.hasAttribute('required');
    if (required &amp;&amp; !this.checked) {
      // setValidity(validityFlags, message, anchor)
      this.internals.setValidity(
        { valueMissing: true },
        '此欄位為必填',
        this.shadowRoot?.querySelector('.checkbox') as HTMLElement
      );
    } else {
      // 清除驗證錯誤
      this.internals.setValidity({});
    }
  }

  render() {
    return html\`
      &lt;div
        class="checkbox"
        tabindex="0"
        @click=\${this._toggle}
        @keydown=\${this._handleKeydown}
        part="checkbox"
      &gt;
        \${this.checked ? html\`
          &lt;svg width="12" height="10" viewBox="0 0 12 10" fill="none"&gt;
            &lt;path d="M1 5l3.5 3.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round"/&gt;
          &lt;/svg&gt;
        \` : nothing}
      &lt;/div&gt;
      &lt;span part="label"&gt;&lt;slot&gt;\${this.label}&lt;/slot&gt;&lt;/span&gt;
    \`;
  }

  private _toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(new CustomEvent('ds-change', {
      detail: { checked: this.checked },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._toggle();
    }
  }

  // ElementInternals 表單整合 API
  formResetCallback() {
    this.checked = this.hasAttribute('checked');
  }

  formStateRestoreCallback(state: string) {
    this.checked = state === this.value;
  }

  get validity() { return this.internals.validity; }
  get validationMessage() { return this.internals.validationMessage; }
  get willValidate() { return this.internals.willValidate; }

  checkValidity() { return this.internals.checkValidity(); }
  reportValidity() { return this.internals.reportValidity(); }
}</code></pre>

  <pre data-lang="html"><code class="language-html">&lt;!-- 現在 ds-checkbox 可以直接參與表單提交 --&gt;
&lt;form id="settings-form"&gt;
  &lt;ds-checkbox name="newsletter" value="yes" required label="訂閱電子報"&gt;
    我同意訂閱每週電子報
  &lt;/ds-checkbox&gt;
  &lt;ds-checkbox name="terms" value="accepted" required label="同意服務條款"&gt;
    我已閱讀並同意服務條款
  &lt;/ds-checkbox&gt;
  &lt;button type="submit"&gt;提交&lt;/button&gt;
&lt;/form&gt;

&lt;script&gt;
  document.getElementById('settings-form').addEventListener('submit', (e) =&gt; {
    e.preventDefault();
    const data = new FormData(e.target);
    // FormData 會包含 ds-checkbox 的值（使用 setFormValue 設定的）
    console.log(Object.fromEntries(data));
    // { newsletter: 'yes', terms: 'accepted' }
  });
&lt;/script&gt;</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">ElementInternals 瀏覽器支援</div>
    <p>
      <code>ElementInternals</code> 與 <code>static formAssociated = true</code>
      目前在 Chrome 77+、Firefox 98+、Safari 16.4+ 支援。
      如需支援更舊的瀏覽器，可使用
      <a href="https://www.npmjs.com/package/element-internals-polyfill" target="_blank">element-internals-polyfill</a>。
      使用前務必確認目標用戶的瀏覽器分佈。
    </p>
  </div>

  <h3>RTL（Right-to-Left）文字方向支援</h3>
  <p>
    支援阿拉伯語、希伯來語等 RTL 語言是企業級設計系統的重要要求。
    使用 CSS 邏輯屬性（Logical Properties）可以讓元件自動適應文字方向。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('ds-list-item')
class DsListItem extends LitElement {
  static styles = css\`
    :host {
      display: flex;
      align-items: center;
    }

    /* 使用邏輯屬性代替物理屬性 */
    .icon {
      /* margin-right: 8px; ← 不好，RTL 時方向錯誤 */
      margin-inline-end: 8px; /* ✓ RTL 下自動變為 margin-left */
    }

    .text {
      /* text-align: left; ← 不好 */
      text-align: start; /* ✓ RTL 下自動變為 right */
    }

    /* padding-left/right → padding-inline-start/end */
    .content {
      padding-inline: var(--ds-list-item-padding-x, 16px);
      padding-block: var(--ds-list-item-padding-y, 12px);
    }

    /* 邊框方向 */
    .bordered {
      border-inline-start: 3px solid var(--ds-color-primary);
    }
  \`;

  render() {
    return html\`
      &lt;span class="icon"&gt;&lt;slot name="icon"&gt;&lt;/slot&gt;&lt;/span&gt;
      &lt;span class="text content"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/span&gt;
    \`;
  }
}</code></pre>

  <pre data-lang="html"><code class="language-html">&lt;!-- 在 HTML 或特定容器上設定 dir 即可自動適應 --&gt;
&lt;html lang="ar" dir="rtl"&gt;
  &lt;body&gt;
    &lt;ds-list-item&gt;
      &lt;span slot="icon"&gt;★&lt;/span&gt;
      مرحبا بالعالم  &lt;!-- 阿拉伯語文字，圖示會自動移至右側 --&gt;
    &lt;/ds-list-item&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
</section>

<section id="multi-theme-architecture">
  <h2>多主題架構：Dark Mode、Brand Theming、High Contrast</h2>
  <p>
    企業級設計系統通常需要支援多種主題：
    亮色（Light）、暗色（Dark）、品牌主題（Brand）、高對比度（High Contrast）。
    設計良好的 Token 分層架構可以讓主題切換只需修改頂層 CSS Custom Properties，
    不需要修改任何元件程式碼。
  </p>

  <h3>分層 Token 架構（全域 → 品牌 → 元件 → 狀態）</h3>
  <pre data-lang="css"><code class="language-css">/* === 第一層：全域 Token（所有主題共享的原始值） === */
:root {
  /* 顏色調色盤 */
  --primitive-blue-100: #e3f2fd;
  --primitive-blue-500: #2196f3;
  --primitive-blue-900: #0d47a1;
  --primitive-gray-50:  #fafafa;
  --primitive-gray-900: #212121;
  --primitive-white: #ffffff;
  --primitive-black: #000000;

  /* 排版比例 */
  --primitive-font-size-12: 0.75rem;
  --primitive-font-size-14: 0.875rem;
  --primitive-font-size-16: 1rem;
  --primitive-font-size-20: 1.25rem;

  /* 間距比例 */
  --primitive-space-4:  4px;
  --primitive-space-8:  8px;
  --primitive-space-16: 16px;
  --primitive-space-24: 24px;
}

/* === 第二層：品牌 Token（預設品牌，亮色主題） === */
:root,
[data-theme="light"] {
  --brand-color-primary:       var(--primitive-blue-500);
  --brand-color-primary-text:  var(--primitive-white);
  --brand-color-surface:       var(--primitive-white);
  --brand-color-surface-raised: var(--primitive-gray-50);
  --brand-color-on-surface:    var(--primitive-gray-900);
  --brand-color-border:        rgba(0, 0, 0, 0.12);
  --brand-shadow-sm:           0 1px 3px rgba(0,0,0,0.12);
  --brand-shadow-md:           0 4px 12px rgba(0,0,0,0.15);
}

/* 暗色主題 */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --brand-color-primary:       var(--primitive-blue-500);
    --brand-color-primary-text:  var(--primitive-white);
    --brand-color-surface:       #121212;
    --brand-color-surface-raised: #1e1e1e;
    --brand-color-on-surface:    rgba(255, 255, 255, 0.87);
    --brand-color-border:        rgba(255, 255, 255, 0.12);
    --brand-shadow-sm:           0 1px 3px rgba(0,0,0,0.5);
    --brand-shadow-md:           0 4px 12px rgba(0,0,0,0.6);
  }
}

/* 高對比度主題（符合 WCAG 3:1 最低對比度要求） */
[data-theme="high-contrast"],
@media (forced-colors: active) {
  :root {
    --brand-color-primary:       Highlight;
    --brand-color-primary-text:  HighlightText;
    --brand-color-surface:       Canvas;
    --brand-color-on-surface:    CanvasText;
    --brand-color-border:        ButtonBorder;
  }
}

/* === 第三層：元件 Token（引用品牌 Token） === */
:root {
  --ds-button-bg:              var(--brand-color-primary);
  --ds-button-color:           var(--brand-color-primary-text);
  --ds-button-border-radius:   var(--primitive-space-4);
  --ds-card-bg:                var(--brand-color-surface);
  --ds-card-shadow:            var(--brand-shadow-sm);
  --ds-input-border:           var(--brand-color-border);
  --ds-input-bg:               var(--brand-color-surface);
}

/* === 第四層：狀態 Token（覆蓋特定互動狀態） === */
:root {
  --ds-button-bg-hover:        color-mix(in srgb, var(--ds-button-bg) 85%, black);
  --ds-button-bg-active:       color-mix(in srgb, var(--ds-button-bg) 70%, black);
  --ds-button-bg-disabled:     var(--brand-color-border);
  --ds-button-color-disabled:  rgba(0, 0, 0, 0.38);
}</code></pre>

  <h3>JavaScript 主題管理器</h3>
  <pre data-lang="typescript"><code class="language-typescript">// theme-manager.ts
type Theme = 'light' | 'dark' | 'high-contrast' | 'auto';

class ThemeManager {
  private static STORAGE_KEY = 'ds-theme-preference';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.mediaQuery.addEventListener('change', () =&gt; {
      if (this.current === 'auto') {
        this._applyTheme('auto');
      }
    });
  }

  get current(): Theme {
    return (localStorage.getItem(ThemeManager.STORAGE_KEY) as Theme) || 'auto';
  }

  setTheme(theme: Theme) {
    localStorage.setItem(ThemeManager.STORAGE_KEY, theme);
    this._applyTheme(theme);
    document.dispatchEvent(new CustomEvent('ds-theme-change', { detail: { theme } }));
  }

  private _applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'auto') {
      const isDark = this.mediaQuery.matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  init() {
    this._applyTheme(this.current);
  }
}

export const themeManager = new ThemeManager();</code></pre>

  <h3>Lit 元件響應主題變更</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('theme-toggle')
class ThemeToggle extends LitElement {
  @state() private currentTheme: string = 'auto';

  connectedCallback() {
    super.connectedCallback();
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    document.addEventListener('ds-theme-change', this._onThemeChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('ds-theme-change', this._onThemeChange);
  }

  private _onThemeChange = (e: Event) =&gt; {
    this.currentTheme = (e as CustomEvent).detail.theme;
  };

  render() {
    const isDark = this.currentTheme === 'dark';
    return html\`
      &lt;button
        @click=\${() =&gt; themeManager.setTheme(isDark ? 'light' : 'dark')}
        aria-label=\${isDark ? '切換至亮色主題' : '切換至暗色主題'}
        aria-pressed=\${isDark ? 'true' : 'false'}
      &gt;
        \${isDark ? '☀️ 亮色' : '🌙 暗色'}
      &lt;/button&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">color-mix() 函數</div>
    <p>
      CSS <code>color-mix()</code>（現代瀏覽器全面支援）可以用來動態計算 hover、active 狀態的顏色，
      無需為每個狀態定義獨立 token：
      <code>color-mix(in srgb, var(--brand-primary) 85%, black)</code>
      代表「85% 主色 + 15% 黑色」，非常適合用來生成深色 hover 狀態。
    </p>
  </div>
</section>

<section id="component-api-design">
  <h2>元件 API 設計哲學：Prop vs Attribute vs Slot</h2>
  <p>
    設計系統元件的 API 品質直接影響開發者體驗（DX）。
    一個設計不良的 API 會讓使用者困惑，造成錯誤使用。
    以下是資深工程師設計元件 API 時應遵循的原則。
  </p>

  <h3>屬性（Attribute）vs 屬性（Property）的選擇</h3>

  <div class="callout callout-info">
    <div class="callout-title">HTML Attribute vs JavaScript Property</div>
    <p>
      <strong>Attribute</strong>：HTML 標記中的字串，如 <code>&lt;my-btn variant="primary"&gt;</code>。
      只能是字串，可以在 HTML 模板和 CSS 選擇器中使用。<br/>
      <strong>Property</strong>：JavaScript 物件屬性，可以是任何型別（物件、陣列、函數等）。
      只能透過 JS 設定。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('ds-data-table')
class DsDataTable extends LitElement {
  // ✓ 用 Attribute：簡單的原始值，可在 HTML 模板中使用
  @property({ reflect: true }) variant: 'compact' | 'comfortable' = 'comfortable';
  @property({ type: Number }) pageSize = 25;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean, reflect: true }) striped = false;

  // ✓ 用 Property（不設 attribute）：複雜物件/陣列型別
  // 原因：陣列序列化為 attribute 沒有意義，且影響效能
  @property({ attribute: false }) columns: TableColumn[] = [];
  @property({ attribute: false }) data: Record&lt;string, unknown&gt;[] = [];
  @property({ attribute: false }) rowActions?: RowAction[];

  // ✓ 用 Property：函數（回呼函數）
  @property({ attribute: false }) onRowSelect?: (row: unknown) =&gt; void;

  // ✓ 用 Attribute：需要在 CSS 選擇器中使用的狀態
  // :host([empty]) ds-data-table::part(body) { ... }
  @property({ type: Boolean, reflect: true }) empty = false;

  // ✗ 不要這樣做：將大量資料序列化為 attribute
  // @property({ type: Array }) data = [];  ← 每次更新都要 JSON 序列化/反序列化
}</code></pre>

  <h3>何時使用 Slot</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 Slot 的時機：
// 1. 內容是 HTML（而非字串）
// 2. 內容需要框架的模板功能（事件綁定、v-for 等）
// 3. 允許使用者自訂複雜結構

@customElement('ds-page-header')
class DsPageHeader extends LitElement {
  // ✗ 不好的設計：將 HTML 內容作為 property
  // @property() titleHtml = '';
  // @property() actionsHtml = '';

  // ✓ 好的設計：使用 Slot，讓使用者決定內容結構
  render() {
    return html\`
      &lt;header&gt;
        &lt;div class="title-area"&gt;
          &lt;slot name="breadcrumb"&gt;&lt;/slot&gt;
          &lt;h1 part="title"&gt;&lt;slot name="title"&gt;&lt;/slot&gt;&lt;/h1&gt;
          &lt;slot name="subtitle"&gt;&lt;/slot&gt;
        &lt;/div&gt;
        &lt;div class="actions" part="actions"&gt;
          &lt;slot name="actions"&gt;&lt;/slot&gt;
        &lt;/div&gt;
      &lt;/header&gt;
    \`;
  }
}

// 使用側：框架可以自由注入任何模板
// React：
// &lt;DsPageHeader&gt;
//   &lt;span slot="title"&gt;用戶管理&lt;/span&gt;
//   &lt;div slot="actions"&gt;
//     &lt;button onClick={handleCreate}&gt;新增用戶&lt;/button&gt;
//   &lt;/div&gt;
// &lt;/DsPageHeader&gt;</code></pre>

  <h3>API 設計準則表</h3>
  <table>
    <thead>
      <tr>
        <th>場景</th>
        <th>建議方式</th>
        <th>原因</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>字串、數字、布林值</td>
        <td>Attribute + Property（<code>reflect: true</code>）</td>
        <td>可在 HTML 模板和 CSS 選擇器中使用</td>
      </tr>
      <tr>
        <td>物件、陣列</td>
        <td>Property only（<code>attribute: false</code>）</td>
        <td>避免序列化開銷，保持清晰</td>
      </tr>
      <tr>
        <td>HTML 結構內容</td>
        <td>Slot</td>
        <td>讓框架模板系統管理 DOM</td>
      </tr>
      <tr>
        <td>樣式定制</td>
        <td>CSS Custom Properties + <code>::part()</code></td>
        <td>穿透 Shadow DOM，保持封裝</td>
      </tr>
      <tr>
        <td>回呼函數</td>
        <td>Custom Event（<code>bubbles: true, composed: true</code>）</td>
        <td>跨框架相容性，符合 Web 標準</td>
      </tr>
      <tr>
        <td>狀態顯示（loading、empty、error）</td>
        <td>Attribute + reflect（用於 CSS 選擇器）</td>
        <td>允許外部 CSS <code>:host([loading])</code> 選取</td>
      </tr>
      <tr>
        <td>方法調用（open()、close()、reset()）</td>
        <td>Public method on element</td>
        <td>命令式 API，適合非響應式操作</td>
      </tr>
    </tbody>
  </table>

  <h3>事件設計：bubbles 與 composed 的選擇</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 設計系統事件命名慣例
@customElement('ds-select')
class DsSelect extends LitElement {
  private _dispatchChange(value: string) {
    // ✓ bubbles: true — 事件可以冒泡到父元素
    // ✓ composed: true — 事件可以穿越 Shadow DOM 邊界
    // ✓ detail — 附帶結構化的資料，而非裸字串
    this.dispatchEvent(new CustomEvent('ds-change', {
      detail: {
        value,
        previousValue: this._previousValue,
        source: 'user', // 區分用戶操作 vs 程式設定
      },
      bubbles: true,
      composed: true,
    }));

    // 同時觸發原生 change 事件（提高原生相容性）
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 方法命名前綴用設計系統名稱，避免與原生事件衝突
  // 正確：ds-change, ds-select, ds-close
  // 避免：change（與原生 input change 衝突）
}</code></pre>
</section>

<section id="storybook-integration">
  <h2>Storybook 整合</h2>
  <p>
    Storybook 是設計系統文件和開發的標準工具。
    它支援 Web Components，讓你可以在隔離環境中開發和展示每個元件。
  </p>

  <pre data-lang="bash"><code class="language-bash"># 安裝 Storybook（選擇 web-components 框架）
npx storybook@latest init --type web-components

# 啟動 Storybook
npm run storybook</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// my-button.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './my-button.js';

const meta: Meta = {
  title: 'Components/MyButton',
  component: 'my-button',
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: '按鈕樣式變體',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj;

// 預設故事
export const Primary: Story = {
  args: { variant: 'primary', label: '點擊我' },
  render: ({ variant, size, disabled, label }) =&gt; html\`
    &lt;my-button variant=\${variant} size=\${size} ?disabled=\${disabled}&gt;
      \${label}
    &lt;/my-button&gt;
  \`,
};

// 所有尺寸
export const AllSizes: Story = {
  render: () =&gt; html\`
    &lt;div style="display: flex; gap: 12px; align-items: center;"&gt;
      &lt;my-button size="sm"&gt;Small&lt;/my-button&gt;
      &lt;my-button size="md"&gt;Medium&lt;/my-button&gt;
      &lt;my-button size="lg"&gt;Large&lt;/my-button&gt;
    &lt;/div&gt;
  \`,
};

// 主題展示
export const DarkTheme: Story = {
  decorators: [(story) =&gt; html\`
    &lt;div data-theme="dark" style="background:#121212; padding:24px;"&gt;
      \${story()}
    &lt;/div&gt;
  \`],
  render: () =&gt; html\`&lt;my-button&gt;暗色主題按鈕&lt;/my-button&gt;\`,
};</code></pre>
</section>

<section id="versioning-strategy">
  <h2>版本策略與 Breaking Changes</h2>
  <p>
    設計系統的版本策略比普通套件更複雜，因為它影響整個組織的所有產品。
    不謹慎的 Breaking Change 可能造成大量下游修復工作。
  </p>

  <h3>語意化版本（SemVer）規則</h3>
  <ul>
    <li>
      <strong>Patch（1.0.x）</strong>：Bug 修復、視覺微調、文件更新。
      不改變 API，不改變 CSS Custom Properties 名稱。
    </li>
    <li>
      <strong>Minor（1.x.0）</strong>：新增元件、新增 Props/Events/Slots（向後相容）。
      新增 CSS Custom Properties（提供預設值）。
    </li>
    <li>
      <strong>Major（x.0.0）</strong>：移除元件、重命名 Props/Events、移除 CSS Custom Properties、
      改變預設行為。必須提供 Migration Guide。
    </li>
  </ul>

  <h3>Deprecation 週期</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 正確的 Deprecation 流程
@customElement('my-button')
class MyButton extends LitElement {
  // ✓ v2.0：新增 variant prop
  @property() variant: 'primary' | 'secondary' = 'primary';

  // 在 v2.x 保留舊 prop，並在 console 警告
  @property({ attribute: 'type' })
  set type(value: string) {
    console.warn(
      '[my-button] "type" prop 已棄用，請使用 "variant" prop。' +
      '將在 v3.0 移除。'
    );
    this.variant = value as 'primary' | 'secondary';
  }
}</code></pre>
</section>

<section id="publishing-npm">
  <h2>發佈到 npm 的最佳實踐</h2>

  <pre data-lang="json"><code class="language-json">// package.json
{
  "name": "@my-company/design-system",
  "version": "2.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./my-button": "./dist/my-button/index.js",
    "./my-input": "./dist/my-input/index.js",
    "./react": "./dist/react/index.js",
    "./themes/default.css": "./dist/themes/default.css",
    "./themes/dark.css": "./dist/themes/dark.css"
  },
  "files": ["dist"],
  "sideEffects": ["./dist/**/*.js", "./dist/**/*.css"],
  "peerDependencies": {
    "lit": "^3.0.0"
  },
  "customElements": "./dist/custom-elements.json"
}</code></pre>

  <h3>Tree-shaking 友好的出口設計</h3>
  <pre data-lang="typescript"><code class="language-typescript">// dist/index.js — 主入口，自動載入所有元件
export * from './my-button/index.js';
export * from './my-input/index.js';
export * from './my-modal/index.js';

// 使用者可選擇按需引入，減少 bundle 大小
import '@my-company/design-system/my-button';
// 或引入全部
import '@my-company/design-system';</code></pre>

  <h3>自動生成 Custom Elements Manifest</h3>
  <pre data-lang="bash"><code class="language-bash"># 安裝分析工具
npm install --save-dev @custom-elements-manifest/analyzer

# package.json scripts
# "analyze": "cem analyze --globs 'src/**/*.ts' --outdir dist"</code></pre>

  <pre data-lang="json"><code class="language-json">// custom-elements-manifest.config.json
{
  "globs": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"],
  "dev": false,
  "fast": false,
  "plugins": []
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">VS Code 整合</div>
    <p>
      發佈 <code>custom-elements.json</code>（Custom Elements Manifest）後，
      VS Code 可以透過 <a href="https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin" target="_blank">lit-plugin</a>
      外掛讀取 CEM，在編輯器中為你的設計系統元件提供自動完成、類型檢查和文件懸浮提示。
      這大幅提升使用設計系統的開發者體驗。
    </p>
  </div>
</section>
`,
};
