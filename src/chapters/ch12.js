export default {
  id: 12,
  slug: 'chapter-12',
  title: '互通性：在 React 應用中使用 Lit，或反之',
  part: 3,
  intro: '如何在 React 專案中引入 Lit Web Components，以及 @lit/react wrapper 的使用策略，適合微前端架構的讀者。',
  sections: [
    { slug: 'web-components-in-react', title: '在 React 中使用 Web Components' },
    { slug: 'lit-react-wrapper', title: '@lit/react Wrapper 詳解' },
    { slug: 'event-interop', title: '事件系統互通' },
    { slug: 'microfrontend-patterns', title: '微前端架構應用' },
    { slug: 'migration-strategy', title: '漸進式遷移策略' },
  ],
  content: `
<section id="web-components-in-react">
  <h2>在 React 中使用 Web Components</h2>
  <p>
    理論上，Web Components 是 HTML 標準的一部分，任何框架都應該可以使用。
    實際上，React 與 Web Components 的整合有一些已知的摩擦點，
    主要集中在<strong>屬性傳遞</strong>和<strong>事件處理</strong>兩個方面。
  </p>

  <h3>React 的 Web Components 支援現況</h3>
  <p>React 19 大幅改善了 Web Components 支援，但 React 18 和之前的版本有以下問題：</p>
  <ul>
    <li>
      <strong>屬性 vs 特性（Properties vs Attributes）</strong>：
      React 18 對自訂元素統一使用 setAttribute，無法傳遞複雜物件（陣列、物件）到 Web Components
    </li>
    <li>
      <strong>自訂事件</strong>：React 18 的合成事件系統不能監聽 Web Components 發出的自訂事件，
      需要使用 ref + addEventListener
    </li>
    <li>
      <strong>SSR</strong>：React 的 SSR 渲染 Web Components 時，Shadow DOM 無法正確 hydrate
    </li>
  </ul>

  <h3>React 18 的基本使用（含 Workaround）</h3>
  <pre data-lang="jsx"><code class="language-jsx">import { useRef, useEffect } from 'react';
import 'my-design-system'; // 載入 Web Components

// React 18：需要 ref 處理複雜屬性和自訂事件
function ProductCard({ product, onAddToCart }) {
  const cardRef = useRef(null);

  useEffect(() =&gt; {
    const el = cardRef.current;
    if (!el) return;

    // 設定複雜物件（React 18 無法用 JSX props 傳遞）
    el.product = product;

    // 監聽自訂事件
    const handler = (e) =&gt; onAddToCart(e.detail);
    el.addEventListener('add-to-cart', handler);
    return () =&gt; el.removeEventListener('add-to-cart', handler);
  }, [product, onAddToCart]);

  return &lt;my-product-card ref={cardRef} /&gt;;
}</code></pre>

  <h3>React 19 的改進</h3>
  <pre data-lang="jsx"><code class="language-jsx">// React 19：直接支援 Web Components，無需 workaround
function ProductCard({ product, onAddToCart }) {
  return (
    &lt;my-product-card
      product={product}               // 自動設定為 property
      onAddToCart={onAddToCart}       // 自動監聽自訂事件
    /&gt;
  );
}</code></pre>
</section>

<section id="lit-react-wrapper">
  <h2>@lit/react Wrapper 詳解</h2>
  <p>
    <code>@lit/react</code> 提供了一個 <code>createComponent()</code> 函數，
    將 Web Components 包裝為真正的 React 元件，
    解決 React 18 的所有互通問題，並提供完整的 TypeScript 支援。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit/react</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// my-button/react.ts — 建立 React wrapper
import React from 'react';
import { createComponent } from '@lit/react';
import { MyButton } from './my-button.js'; // Lit 元件

export const MyButtonReact = createComponent({
  tagName: 'my-button',
  elementClass: MyButton,
  react: React,
  events: {
    // 將 Web Component 自訂事件映射到 React 事件 props
    onClick: 'click',                   // 原生 click 事件
    onButtonClick: 'my-button-click',   // 自訂事件 'my-button-click' → onButtonClick
    onValueChange: 'value-change',
  },
});</code></pre>

  <pre data-lang="jsx"><code class="language-jsx">// 在 React 應用中使用
import { MyButtonReact } from '@my-design-system/react';

function App() {
  const handleButtonClick = (e) =&gt; {
    console.log('Custom event detail:', e.detail);
  };

  return (
    &lt;div&gt;
      {/* 完整的 TypeScript 支援，就像原生 React 元件 */}
      &lt;MyButtonReact
        variant="primary"
        disabled={isLoading}
        onButtonClick={handleButtonClick}
      &gt;
        Submit
      &lt;/MyButtonReact&gt;
    &lt;/div&gt;
  );
}</code></pre>

  <h3>設計系統發布策略</h3>
  <p>
    建議為每個主流框架提供對應的 wrapper 套件：
  </p>
  <pre data-lang="bash"><code class="language-bash">my-design-system/
├── package.json         # Web Components（框架無關）
├── react/              # @my-ds/react
│   └── index.ts        # 所有元件的 React wrappers
├── vue/                # @my-ds/vue
│   └── index.ts
└── angular/            # @my-ds/angular
    └── index.ts</code></pre>
</section>

<section id="event-interop">
  <h2>事件系統互通</h2>

  <h3>Custom Event Detail 的型別安全</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 元件：定義明確的事件型別
@customElement('quantity-input')
class QuantityInput extends LitElement {
  @property({ type: Number }) value = 1;

  private _emit(newValue: number) {
    // 使用具名 interface 讓事件型別清晰
    this.dispatchEvent(
      new CustomEvent&lt;{ value: number; prevValue: number }&gt;('quantity-change', {
        detail: { value: newValue, prevValue: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// React Wrapper 中型別安全的事件處理
const QuantityInputReact = createComponent({
  tagName: 'quantity-input',
  elementClass: QuantityInput,
  react: React,
  events: {
    onQuantityChange: 'quantity-change',
  },
});

// React 使用端
function Cart() {
  const handleChange = (e: CustomEvent&lt;{ value: number }&gt;) =&gt; {
    updateQuantity(e.detail.value);
  };

  return &lt;QuantityInputReact value={1} onQuantityChange={handleChange} /&gt;;
}</code></pre>
</section>

<section id="microfrontend-patterns">
  <h2>微前端架構應用</h2>
  <p>
    Web Components 在微前端架構中有天然優勢：
    每個子應用可以用不同框架實作，但共享同一套 Web Components 設計系統。
  </p>

  <h3>典型的微前端設計系統架構</h3>
  <pre data-lang="bash"><code class="language-bash">企業微前端架構：
┌─────────────────────────────────────────────┐
│  主應用 Shell (React)                        │
│  ┌─────────────┐  ┌─────────────┐           │
│  │  子應用 A   │  │  子應用 B   │           │
│  │  (Vue 3)    │  │  (Angular)  │           │
│  └─────────────┘  └─────────────┘           │
│         ↓                ↓                  │
│  ┌───────────────────────────────────────┐  │
│  │  共享設計系統 (Lit Web Components)    │  │
│  │  &lt;ds-button&gt; &lt;ds-table&gt; &lt;ds-modal&gt;  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘</code></pre>

  <h3>跨子應用通訊</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 使用自訂事件跨子應用通訊
// 子應用 A 發出事件
document.dispatchEvent(new CustomEvent('user-logged-in', {
  detail: { userId: '123', name: 'Tim' },
  bubbles: true,
}));

// 子應用 B 監聽事件
document.addEventListener('user-logged-in', (e) =&gt; {
  updateUserDisplay(e.detail);
});</code></pre>
</section>

<section id="migration-strategy">
  <h2>漸進式遷移策略</h2>
  <p>
    有兩個主要的遷移方向，各有不同的策略。
  </p>

  <h3>策略一：React → Web Components（設計系統遷移）</h3>
  <ol>
    <li>
      <strong>識別可抽取的 UI 原子</strong>：Button、Input、Card 等無狀態 UI 元件
    </li>
    <li>
      <strong>用 Lit 重寫這些元件</strong>：確保 API 與現有 React 元件相容
    </li>
    <li>
      <strong>建立 React Wrapper</strong>：用 <code>@lit/react</code> 包裝，讓現有 React 程式碼繼續使用
    </li>
    <li>
      <strong>逐步替換</strong>：在各 React 元件中替換 import，從原生 React 版本換到 Web Components wrapper
    </li>
  </ol>

  <h3>策略二：在 Lit 應用中使用 React 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在 Lit 元件中嵌入 React 元件
import React from 'react';
import ReactDOM from 'react-dom/client';
import { DatePicker } from '@mui/x-date-pickers';

@customElement('react-datepicker-wrapper')
class ReactDatePickerWrapper extends LitElement {
  @property() value = '';

  private _reactRoot?: ReturnType&lt;typeof ReactDOM.createRoot&gt;;
  private _container?: HTMLElement;

  firstUpdated() {
    this._container = this.shadowRoot?.querySelector('.react-mount') as HTMLElement;
    this._reactRoot = ReactDOM.createRoot(this._container!);
    this._renderReact();
  }

  updated() {
    this._renderReact();
  }

  private _renderReact() {
    this._reactRoot?.render(
      React.createElement(DatePicker, {
        value: this.value,
        onChange: (newValue: string) =&gt; {
          this.dispatchEvent(new CustomEvent('change', {
            detail: { value: newValue },
            bubbles: true,
            composed: true,
          }));
        },
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._reactRoot?.unmount();
  }

  render() {
    return html\`&lt;div class="react-mount"&gt;&lt;/div&gt;\`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">謹慎使用 React-in-Lit</div>
    <p>
      在 Lit 元件中嵌入 React 會引入 React runtime（~44KB），
      且兩個框架的生命週期需要仔細協調。
      這只適合在別無選擇時使用特定 React 生態套件的場景。
    </p>
  </div>
</section>
`,
};
