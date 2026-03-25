export default {
  id: 12,
  slug: 'chapter-12',
  title: '互通性：在 React 應用中使用 Lit，或反之',
  part: 3,
  intro: '如何在 React、Angular、Vue 3、Next.js App Router 專案中引入 Lit Web Components。涵蓋框架特定配置、Module Federation 微前端架構、跨框架狀態共享，以及現代瀏覽器支援策略。',
  sections: [
    { slug: 'web-components-in-react', title: '在 React 中使用 Web Components' },
    { slug: 'lit-react-wrapper', title: '@lit/react Wrapper 詳解' },
    { slug: 'angular-integration', title: 'Angular + Lit：CUSTOM_ELEMENTS_SCHEMA' },
    { slug: 'vue3-integration', title: 'Vue 3 + Lit：compilerOptions.isCustomElement' },
    { slug: 'nextjs-integration', title: 'Next.js App Router + Lit 整合' },
    { slug: 'event-interop', title: '事件系統互通' },
    { slug: 'module-federation', title: 'Module Federation 與 Web Components' },
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

  <div class="callout callout-info">
    <div class="callout-title">TypeScript：補充 JSX 型別定義</div>
    <p>
      即使在 React 19，TypeScript 也需要明確宣告自訂元素的 JSX 型別，
      否則會出現 <code>Property does not exist on JSX.IntrinsicElements</code> 錯誤。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">// custom-elements.d.ts（放在 src/ 目錄）
import type { MyProductCard } from 'my-design-system';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'my-product-card': React.DetailedHTMLProps&lt;
        React.HTMLAttributes&lt;MyProductCard&gt; &amp; {
          product?: Product;
          'sku-code'?: string;          // attribute（kebab-case）
        },
        MyProductCard
      &gt;;
      'my-button': React.DetailedHTMLProps&lt;
        React.HTMLAttributes&lt;HTMLElement&gt; &amp; {
          variant?: 'primary' | 'secondary';
          disabled?: boolean;
        },
        HTMLElement
      &gt;;
    }
  }
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

<section id="angular-integration">
  <h2>Angular + Lit：CUSTOM_ELEMENTS_SCHEMA</h2>
  <p>
    Angular 的範本編譯器預設會對未知的 HTML 元素報錯。
    要在 Angular 中使用 Web Components，需要正確配置 <code>CUSTOM_ELEMENTS_SCHEMA</code>
    並處理型別宣告。
  </p>

  <h3>方法一：NgModule 級別配置</h3>
  <pre data-lang="typescript"><code class="language-typescript">// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

// 確保 Lit 元件在 Angular bootstrap 前已定義
import 'my-design-system';  // 副作用 import：定義所有 custom elements

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,   // 告訴 Angular 允許未知 HTML 元素
    // 注意：這會讓 Angular 無法捕獲真正的元素拼寫錯誤
    // 更精確的替代方案是使用 NO_ERRORS_SCHEMA（允許所有未知屬性）
    // 但 CUSTOM_ELEMENTS_SCHEMA 是專為 Web Components 設計的
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

// Standalone API（Angular 14+，推薦）
// app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Standalone 元件層級的 schema
  template: \`
    &lt;my-button
      variant="primary"
      [disabled]="isLoading"
      (my-button-click)="handleClick($event)"
    &gt;
      儲存
    &lt;/my-button&gt;
  \`,
})
export class AppComponent {
  isLoading = false;
  handleClick(event: CustomEvent) {
    console.log(event.detail);
  }
}</code></pre>

  <h3>Angular 與 Web Components 的屬性綁定語法</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Angular 的三種綁定方式在 Web Components 中的行為：

// 1. [property]="value" — 設定 DOM property（推薦，支援複雜型別）
// &lt;my-table [data]="tableRows" [columns]="columnConfig"&gt;&lt;/my-table&gt;
// 等同於：el.data = tableRows; el.columns = columnConfig;

// 2. attribute="value" 或 [attr.name]="value" — 設定 HTML attribute（只能是字串）
// &lt;my-input [attr.placeholder]="placeholderText"&gt;&lt;/my-input&gt;

// 3. (eventName)="handler($event)" — 監聽事件
// &lt;my-select (selection-change)="onSelectionChange($event)"&gt;&lt;/my-select&gt;
// 注意：Angular 事件綁定支援 kebab-case 事件名稱

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    &lt;!-- 傳遞複雜物件：使用 property 綁定 --&gt;
    &lt;my-data-grid
      [rows]="filteredRows"
      [config]="gridConfig"
      (row-click)="onRowClick($event)"
      (sort-change)="onSortChange($event)"
    &gt;
    &lt;/my-data-grid&gt;
  \`,
})
export class DataPageComponent {
  filteredRows: Row[] = [];
  gridConfig: GridConfig = { pageSize: 20, sortable: true };

  onRowClick(event: CustomEvent&lt;{ row: Row }&gt;) {
    console.log('Row clicked:', event.detail.row);
  }

  onSortChange(event: CustomEvent&lt;{ key: string; dir: 'asc' | 'desc' }&gt;) {
    this.filteredRows = [...this.filteredRows].sort(/* ... */);
  }
}</code></pre>

  <h3>Angular 的 Web Components 型別補充</h3>
  <pre data-lang="typescript"><code class="language-typescript">// custom-elements.d.ts
// 補充 Angular 範本編譯器需要的型別資訊
// Angular 的 CUSTOM_ELEMENTS_SCHEMA 雖然允許未知元素，
// 但有了型別補充，IDE 可以提供自動完成

declare namespace HTMLElementTagNameMap {
  'my-button': import('my-design-system').MyButton;
  'my-data-grid': import('my-design-system').MyDataGrid;
  'my-modal': import('my-design-system').MyModal;
}

// 搭配 @angular/elements 發布 Angular 元件為 Web Components：
// 這是反向整合——把 Angular 元件輸出為 Web Components
import { createCustomElement } from '@angular/elements';
import { Injector } from '@angular/core';

// 在 AppModule 中：
export class AppModule {
  constructor(private injector: Injector) {}
  ngDoBootstrap() {
    const el = createCustomElement(MyAngularComponent, { injector: this.injector });
    customElements.define('my-angular-widget', el);
    // 現在 &lt;my-angular-widget&gt; 可以在任何框架中使用
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">CUSTOM_ELEMENTS_SCHEMA 的代價</div>
    <p>
      <code>CUSTOM_ELEMENTS_SCHEMA</code> 讓 Angular 跳過對自訂元素的驗證，
      這意味著範本中的元素名稱拼寫錯誤（例如 <code>&lt;my-buttton&gt;</code>）
      不會在編譯時被捕獲。建議在 CI 中加入端對端測試驗證關鍵 UI 元件的存在。
    </p>
  </div>
</section>

<section id="vue3-integration">
  <h2>Vue 3 + Lit：compilerOptions.isCustomElement</h2>
  <p>
    Vue 3 的範本編譯器預設也會對未知元素發出警告。
    透過配置 <code>compilerOptions.isCustomElement</code>，
    可以告訴 Vue 哪些元素是 Web Components，不需要 Vue 解析。
  </p>

  <h3>Vite + Vue 3 配置</h3>
  <pre data-lang="typescript"><code class="language-typescript">// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 方法一：前綴匹配（推薦）
          isCustomElement: (tag) =&gt; tag.startsWith('ds-'),

          // 方法二：精確列表
          // isCustomElement: (tag) =&gt;
          //   ['ds-button', 'ds-input', 'ds-modal', 'ds-table'].includes(tag),

          // 方法三：排除所有包含連字符的標籤（符合 Custom Elements 命名規範）
          // isCustomElement: (tag) =&gt; tag.includes('-'),
        },
      },
    }),
  ],
});</code></pre>

  <h3>Vue 3 中使用 Web Components</h3>
  <pre data-lang="typescript"><code class="language-typescript">// main.ts：確保 Lit 元件在 Vue 掛載前定義
import 'my-design-system';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">&lt;!-- ProductCard.vue --&gt;
&lt;script setup lang="ts"&gt;
import { ref, onMounted, onUnmounted } from 'vue';
import type { MyProductCard } from 'my-design-system';

interface Props {
  product: Product;
}
const props = defineProps&lt;Props&gt;();
const emit = defineEmits&lt;{ addToCart: [item: CartItem] }&gt;();

const cardRef = ref&lt;MyProductCard | null&gt;(null);

// Vue 3 的 v-bind 支援 .prop 修飾符傳遞 DOM property
// 對於複雜物件（非基本型別），必須使用 .prop 修飾符
// 否則 Vue 會嘗試設定 HTML attribute（只支援字串）
&lt;/script&gt;

&lt;template&gt;
  &lt;!--
    Vue 3 Web Components 綁定語法：
    :product.prop="product"  →  el.product = product（property 綁定）
    :sku-code="skuCode"     →  el.setAttribute('sku-code', ...)（attribute 綁定）
    @add-to-cart="..."      →  addEventListener('add-to-cart', ...)（事件監聽）
  --&gt;
  &lt;ds-product-card
    ref="cardRef"
    :product.prop="props.product"
    :loading="false"
    @add-to-cart="emit('addToCart', $event.detail)"
  /&gt;
&lt;/template&gt;</code></pre>

  <h3>Vue 3 defineCustomElement：Vue 元件轉 Web Components</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 反向：把 Vue 3 元件輸出為 Web Components
import { defineCustomElement } from 'vue';

// 將 Vue SFC 轉換為 Web Component
const MyVueWidget = defineCustomElement({
  props: {
    title: String,
    count: Number,
  },
  emits: ['update'],
  setup(props, { emit }) {
    return () =&gt; (
      &lt;div&gt;
        {props.title}: {props.count}
        &lt;button onClick={() =&gt; emit('update', props.count! + 1)}&gt;+1&lt;/button&gt;
      &lt;/div&gt;
    );
  },
  // CSS 會被自動注入 Shadow DOM
  styles: [\`div { padding: 16px; }\`],
});

customElements.define('my-vue-widget', MyVueWidget);
// 現在 &lt;my-vue-widget&gt; 可以在任何框架中使用</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Vue 3 的 Web Components 支援最為友好</div>
    <p>
      相比 React 18 和 Angular，Vue 3 對 Web Components 的支援是三大框架中最完善的。
      <code>.prop</code> 修飾符明確指定 property 綁定，<code>@event-name</code> 直接監聽 CustomEvent，
      且 <code>compilerOptions.isCustomElement</code> 的粒度配置讓 Vue 的範本編譯器能保留對 Vue 元件的完整型別檢查。
    </p>
  </div>
</section>

<section id="nextjs-integration">
  <h2>Next.js App Router + Lit 整合</h2>
  <p>
    Next.js App Router（Next.js 13+）引入了 React Server Components（RSC）。
    Web Components 因為需要瀏覽器 API，<strong>只能在 Client Components 中使用</strong>。
    理解這個邊界是在 Next.js 中正確使用 Lit 的關鍵。
  </p>

  <h3>Server Component vs Client Component 邊界</h3>
  <pre data-lang="typescript"><code class="language-typescript">// app/products/page.tsx — Server Component（預設）
// ✓ 可以直接 fetch 資料
// ✗ 不能使用 Web Components（無瀏覽器 API）
import { ProductGridClient } from './product-grid-client';

export default async function ProductsPage() {
  // 在伺服器端抓取資料
  const products = await fetch('https://api.example.com/products').then(r =&gt; r.json());

  return (
    &lt;main&gt;
      &lt;h1&gt;商品列表&lt;/h1&gt;
      {/* 將資料傳給 Client Component */}
      &lt;ProductGridClient initialProducts={products} /&gt;
    &lt;/main&gt;
  );
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// app/products/product-grid-client.tsx — Client Component
'use client';  // 這個指令讓此元件成為 Client Component

import { useEffect, useRef } from 'react';

// 動態匯入 Lit 元件，確保只在瀏覽器端執行
// 這避免了在 SSR 時嘗試執行需要 DOM API 的程式碼
let litLoaded = false;

interface Props {
  initialProducts: Product[];
}

export function ProductGridClient({ initialProducts }: Props) {
  useEffect(() =&gt; {
    // 在 useEffect 中動態匯入，確保只在客戶端執行
    if (!litLoaded) {
      import('my-design-system').then(() =&gt; {
        litLoaded = true;
      });
    }
  }, []);

  return (
    &lt;div className="product-grid"&gt;
      {initialProducts.map(product =&gt; (
        &lt;ds-product-card
          key={product.id}
          // React 19：直接支援 property 傳遞
          // React 18：需要 ref workaround 或 @lit/react
          product={product as any}
        /&gt;
      ))}
    &lt;/div&gt;
  );
}</code></pre>

  <h3>使用 @lit/react 在 Next.js 中的正確姿勢</h3>
  <pre data-lang="typescript"><code class="language-typescript">// lib/design-system-client.ts — 統一的客戶端匯入點
'use client';

// 集中管理所有 Web Component 的動態匯入和 React wrapper
import dynamic from 'next/dynamic';

// 建立懶載入的 React wrapper
// 注意：@lit/react 的 createComponent 需要在瀏覽器環境執行
// 使用 dynamic() + ssr: false 確保這一點
export const DsButton = dynamic(
  async () =&gt; {
    const { createComponent } = await import('@lit/react');
    const React = await import('react');
    const { DsButton: DsButtonElement } = await import('my-design-system');
    return createComponent({
      tagName: 'ds-button',
      elementClass: DsButtonElement,
      react: React.default,
      events: { onDsClick: 'ds-click' },
    });
  },
  { ssr: false }  // 關鍵：禁止 SSR
);

export const DsDataGrid = dynamic(
  async () =&gt; {
    const { createComponent } = await import('@lit/react');
    const React = await import('react');
    const { DsDataGrid: DsDataGridElement } = await import('my-design-system');
    return createComponent({
      tagName: 'ds-data-grid',
      elementClass: DsDataGridElement,
      react: React.default,
      events: {
        onRowClick: 'row-click',
        onSortChange: 'sort-change',
      },
    });
  },
  { ssr: false, loading: () =&gt; &lt;div className="skeleton-grid" /&gt; }
);</code></pre>

  <h3>Declarative Shadow DOM：Next.js SSR 的未來</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Declarative Shadow DOM（DSD）讓 Web Components 可以 SSR
// Lit SSR 支援輸出 DSD HTML
// 目前 Next.js App Router 尚未原生整合 Lit SSR，
// 但可以透過 @lit-labs/ssr 自訂 renderToString

// server-render.ts（Node.js 環境）
import { render, collectResultSync } from '@lit-labs/ssr';
import { html } from 'lit';

export async function renderLitComponent(data: ProductData) {
  const result = render(html\`
    &lt;ds-product-card .product=\${data}&gt;&lt;/ds-product-card&gt;
  \`);

  // 輸出包含 DSD 的 HTML 字串
  // &lt;ds-product-card&gt;
  //   &lt;template shadowrootmode="open"&gt;
  //     &lt;style&gt;...&lt;/style&gt;
  //     &lt;div class="card"&gt;...&lt;/div&gt;
  //   &lt;/template&gt;
  // &lt;/ds-product-card&gt;
  return collectResultSync(result);
}

// 在 Next.js Route Handler 中使用：
// app/api/render/route.ts
export async function GET(request: Request) {
  const data = await getProductData();
  const html = await renderLitComponent(data);
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">Next.js + Lit 的當前限制</div>
    <p>
      截至 2025 年，Next.js App Router 與 Lit SSR 的整合仍需手動配置。
      主要挑戰是 React 的 hydration 機制與 Declarative Shadow DOM 的互動。
      如果你的 Lit 元件只作為「葉節點」UI 元件（無需 SSR），
      使用 <code>dynamic(... , &#123; ssr: false &#125;)</code> 是最可靠的方案。
    </p>
  </div>

  <h3>跨框架狀態共享：React Server State → Lit</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在 Next.js 中：Server Component 抓資料，透過 JSON 傳給 Lit
// app/dashboard/page.tsx（Server Component）
export default async function DashboardPage() {
  const metrics = await fetchMetrics();  // 伺服器端抓取

  return (
    &lt;div&gt;
      {/*
        把伺服器資料序列化為 JSON attribute 傳給 Lit 元件
        Lit 元件在客戶端水合時讀取這個初始狀態
      */}
      &lt;ds-metrics-dashboard
        // attribute 只支援字串，需要 JSON.stringify
        initial-data={JSON.stringify(metrics)}
      /&gt;
    &lt;/div&gt;
  );
}

// Lit 元件接收序列化的初始資料
@customElement('ds-metrics-dashboard')
class DsMetricsDashboard extends LitElement {
  @property({ attribute: 'initial-data' })
  set initialData(jsonStr: string) {
    try {
      this._metrics = JSON.parse(jsonStr);
    } catch {
      this._metrics = null;
    }
  }

  @state() private _metrics: MetricsData | null = null;

  // 客戶端可以繼續更新
  private _queryCtrl = new QueryController&lt;MetricsData&gt;(this, () =&gt; ({
    queryKey: ['metrics'],
    queryFn: () =&gt; fetch('/api/metrics').then(r =&gt; r.json()),
    initialData: this._metrics ?? undefined,
    staleTime: 30_000,
  }));
}</code></pre>
</section>

<section id="event-interop">
  <h2>事件系統互通</h2>

  <h3>Custom Event Detail 的型別安全</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 元件：定義明確的事件型別
@customElement('quantity-input')
class QuantityInput extends LitElement {
  @property({ type: Number }) value = 1;

  private _emit(newValue: number) {
    this.dispatchEvent(
      new CustomEvent&lt;{ value: number; prevValue: number }&gt;('quantity-change', {
        detail: { value: newValue, prevValue: this.value },
        bubbles: true,
        composed: true,   // 穿透 Shadow DOM 邊界，讓祖先框架能監聽
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

  <h3>bubbles + composed 的語義</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 四種事件傳播組合：

// 1. bubbles: false, composed: false（預設）
// 只在 Shadow DOM 內傳播，不冒泡
// 適合：Shadow DOM 內部的元件間通訊
dispatchEvent(new CustomEvent('internal-event'));

// 2. bubbles: true, composed: false
// 在 Shadow DOM 內冒泡，但不穿透到 light DOM
// 極少使用
dispatchEvent(new CustomEvent('shadow-bubble', { bubbles: true }));

// 3. bubbles: false, composed: true
// 穿透到 light DOM，但不冒泡
// 適合：通知直接父元素的一次性事件
dispatchEvent(new CustomEvent('did-close', { composed: true }));

// 4. bubbles: true, composed: true（跨框架最常用）
// 穿透 Shadow DOM 並在 light DOM 中冒泡
// 適合：設計系統元件對外發出的所有業務事件
// 任何祖先框架（React/Angular/Vue）都能在 document 層級監聽
dispatchEvent(new CustomEvent('value-change', {
  detail: { value: newValue },
  bubbles: true,
  composed: true,
}));</code></pre>
</section>

<section id="module-federation">
  <h2>Module Federation 與 Web Components</h2>
  <p>
    Webpack 5 的 Module Federation 讓多個獨立部署的應用可以在執行時共享模組。
    結合 Lit Web Components，這是構建大規模微前端架構的強大工具。
  </p>

  <h3>架構概念</h3>
  <pre data-lang="typescript"><code class="language-typescript">/*
  微前端架構示意圖：

  ┌─────────────────────────────────────────────────────┐
  │  Shell App（主應用，負責路由和頁面組裝）              │
  │  webpack.config.js：ModuleFederationPlugin (host)    │
  │                                                      │
  │  ┌──────────────┐  ┌──────────────┐                 │
  │  │  MFE: Cart   │  │  MFE: Search │                 │
  │  │  (React)     │  │  (Vue 3)     │                 │
  │  │  Port: 3001  │  │  Port: 3002  │                 │
  │  └──────────────┘  └──────────────┘                 │
  │           ↓                ↓                        │
  │  ┌──────────────────────────────────────────────┐   │
  │  │  Design System MFE（Lit Web Components）      │   │
  │  │  remoteEntry.js  Port: 3000                  │   │
  │  │  exposes: ./Button, ./Table, ./Modal, ...    │   │
  │  └──────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────┘
*/</code></pre>

  <h3>Design System Remote 配置（Webpack 5）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/design-system/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'remoteEntry.js',
    publicPath: 'http://localhost:3000/',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'designSystem',
      filename: 'remoteEntry.js',
      exposes: {
        // 每個元件獨立 expose，讓消費方按需載入
        './Button': './src/components/ds-button.ts',
        './Table': './src/components/ds-table.ts',
        './Modal': './src/components/ds-modal.ts',
        // 或是 expose 整個 bundle 的副作用 import
        './all': './src/index.ts',
      },
      shared: {
        // Lit 的 shared：確保只有一份 lit 在頁面上執行
        lit: { singleton: true, strictVersion: true, requiredVersion: '^3.0.0' },
        '@lit/reactive-element': { singleton: true },
        'lit-html': { singleton: true },
        'lit-element': { singleton: true },
      },
    }),
  ],
};</code></pre>

  <h3>Host App 消費 Design System Remote</h3>
  <pre data-lang="typescript"><code class="language-typescript">// shell-app/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        designSystem: 'designSystem@http://localhost:3000/remoteEntry.js',
        cartMfe: 'cartMfe@http://localhost:3001/remoteEntry.js',
        searchMfe: 'searchMfe@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        // 注意：react 和 lit 不應共享（它們是不同 MFE 的實作細節）
        // 但 Lit 如果被多個 MFE 使用，應標記為 singleton
        lit: { singleton: true, strictVersion: false },
      },
    }),
  ],
};</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// shell-app/src/bootstrap.ts
// Module Federation 的非同步邊界：動態匯入確保 shared modules 解析完成
import('./app');

// shell-app/src/app.ts
async function loadDesignSystem() {
  // 動態匯入 remote module
  // 這讓 Webpack 知道要從 designSystem remote 載入
  await import('designSystem/all');
  // 現在 ds-button, ds-table, ds-modal 等 custom elements 已定義
}

// 懶加載特定頁面的 MFE
async function loadCartPage() {
  const { CartApp } = await import('cartMfe/CartApp');
  // CartApp 是一個 Web Component，直接插入 DOM
  const container = document.getElementById('mfe-container')!;
  container.innerHTML = '&lt;cart-app&gt;&lt;/cart-app&gt;';
}</code></pre>

  <h3>Vite 的 Module Federation（vite-plugin-federation）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// vite.config.ts（設計系統 remote）
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'designSystem',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/ds-button.ts',
        './all': './src/index.ts',
      },
      shared: ['lit'],
    }),
  ],
  build: {
    target: 'esnext',  // Module Federation 需要 ESM
    minify: false,
  },
});</code></pre>

  <h3>微前端狀態共享策略</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在 Module Federation 中，跨 MFE 共享狀態的推薦方式是：
// 1. CustomEvent（輕量，事件驅動）
// 2. SharedWorker（Worker 執行緒中的共享狀態）
// 3. @preact/signals-core（如果所有 MFE 都使用且版本一致）

// 方案 1：透過 document 的 CustomEvent 跨 MFE 通訊
// design-system 發出 token 更新事件
export function broadcastAuthToken(token: string) {
  document.dispatchEvent(
    new CustomEvent('mfe:auth-token-changed', {
      detail: { token },
      bubbles: false,
    })
  );
}

// cart MFE 監聽
document.addEventListener('mfe:auth-token-changed', (e: any) =&gt; {
  const { token } = e.detail;
  cartApiClient.setAuthToken(token);
});

// 方案 2：使用 SharedWorker 作為跨 MFE 的狀態總線
// shared-state-worker.ts
const connections: MessagePort[] = [];

self.addEventListener('connect', (event: MessageEvent) =&gt; {
  const port = event.ports[0];
  connections.push(port);

  port.addEventListener('message', (msg) =&gt; {
    // 廣播給所有其他 MFE
    connections
      .filter(p =&gt; p !== port)
      .forEach(p =&gt; p.postMessage(msg.data));
  });

  port.start();
});

// 在 MFE 中使用：
const worker = new SharedWorker('/shared-state-worker.js');
worker.port.onmessage = (e) =&gt; {
  if (e.data.type === 'CART_UPDATED') {
    cartSignal.value = e.data.payload;
  }
};
worker.port.postMessage({ type: 'CART_UPDATED', payload: newCart });</code></pre>
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

  <h3>瀏覽器支援策略</h3>
  <div class="callout callout-info">
    <div class="callout-title">放棄 IE11：毫無疑問</div>
    <p>
      IE11 已於 2022 年 6 月結束支援。所有主流框架（React 18+、Vue 3、Angular 15+）
      都已放棄 IE11 支援。Lit 從一開始就基於現代瀏覽器標準設計，不支援 IE11。
      如果你的專案仍需支援 IE11，Web Components 和 Lit 不是合適的選擇——
      但這幾乎不可能是 2025 年新專案的需求。
    </p>
  </div>

  <table>
    <thead>
      <tr>
        <th>瀏覽器</th>
        <th>Web Components 支援</th>
        <th>Lit 支援</th>
        <th>備註</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Chrome 67+</td>
        <td>完整</td>
        <td>完整</td>
        <td>參考實作</td>
      </tr>
      <tr>
        <td>Firefox 63+</td>
        <td>完整</td>
        <td>完整</td>
        <td>2018 年起原生支援</td>
      </tr>
      <tr>
        <td>Safari 10.1+</td>
        <td>完整（2022 年後）</td>
        <td>完整</td>
        <td>Safari 16.4+ 支援 Declarative Shadow DOM</td>
      </tr>
      <tr>
        <td>Edge (Chromium) 79+</td>
        <td>完整</td>
        <td>完整</td>
        <td>2020 年起基於 Chromium</td>
      </tr>
      <tr>
        <td>IE 11</td>
        <td>不支援</td>
        <td>不支援</td>
        <td>已結束支援，不應考慮</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">Safari 的注意事項</div>
    <p>
      Safari 對 Web Components 的支援在 2022 年後才趨於完整。
      Declarative Shadow DOM（DSD，SSR 所需）在 Safari 16.4（2023 年 3 月）才支援。
      如果你需要支援更舊的 Safari 版本，SSR 相關功能需要 polyfill。
      對於一般 CSR 場景，Safari 14+ 已足夠。
    </p>
  </div>
</section>
`,
};
