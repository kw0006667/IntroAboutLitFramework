export default {
  id: 13,
  slug: 'chapter-13',
  title: '設計系統與 Component Library 的建構',
  part: 4,
  intro: '用 Lit 打造跨框架 Design System 的最佳實踐，包含 theming（CSS Custom Properties）、Storybook 整合與版本策略。',
  sections: [
    { slug: 'design-system-why', title: '為何用 Lit 建設計系統？' },
    { slug: 'css-custom-properties-theming', title: 'CSS Custom Properties Theming' },
    { slug: 'token-system', title: 'Design Token 系統設計' },
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
    <li><strong>可主題化</strong>：支援品牌定制、深淺色主題</li>
    <li><strong>可存取性</strong>：符合 WCAG 2.1 AA 標準</li>
    <li><strong>文件完善</strong>：有 Storybook 和 API 文件</li>
    <li><strong>版本穩定</strong>：Breaking Changes 有清晰的遷移路徑</li>
  </ul>
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
</section>

<section id="token-system">
  <h2>Design Token 系統設計</h2>
  <p>
    Design Token 是設計系統的語言，將設計決策（顏色、間距、字體）抽象為命名常數，
    讓設計師和工程師使用同一套詞彙。
  </p>

  <h3>Token 的三個層次</h3>
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
}</code></pre>

  <h3>使用 Style Dictionary 自動化 Token 管理</h3>
  <pre data-lang="json"><code class="language-json">// tokens.json（設計師可編輯）
{
  "color": {
    "primary": { "value": "#FF6D00", "type": "color" },
    "primary-hover": { "value": "#e65100", "type": "color" }
  },
  "spacing": {
    "sm": { "value": "8px", "type": "dimension" },
    "md": { "value": "16px", "type": "dimension" }
  }
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
  }
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
</section>
`,
};
