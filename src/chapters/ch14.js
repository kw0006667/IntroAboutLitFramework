export default {
  id: 14,
  slug: 'chapter-14',
  title: 'SSR 與 Hydration：Lit 的伺服器端渲染之路',
  part: 4,
  intro: '@lit-labs/ssr 的運作原理，Declarative Shadow DOM 的角色，Streaming SSR、Island 架構、SSR 效能優化，以及與 Node.js / Edge Runtime 的整合。',
  sections: [
    { slug: 'why-ssr', title: '為何需要 SSR？' },
    { slug: 'declarative-shadow-dom', title: 'Declarative Shadow DOM' },
    { slug: 'lit-ssr-package', title: '@lit-labs/ssr 運作原理' },
    { slug: 'streaming-ssr', title: 'Streaming SSR 與 Suspense-like 體驗' },
    { slug: 'node-integration', title: 'Node.js 整合實踐' },
    { slug: 'island-architecture', title: 'Island 架構：選擇性 Hydration' },
    { slug: 'edge-runtime', title: 'Edge Runtime 部署' },
    { slug: 'ssr-performance-patterns', title: 'SSR 效能優化：快取、CDN、Edge' },
    { slug: 'hydration-strategies', title: 'Hydration 策略比較' },
  ],
  content: `
<section id="why-ssr">
  <h2>為何需要 SSR？</h2>
  <p>
    純客戶端渲染（CSR）的 Web Components 在以下場景面臨挑戰：
  </p>
  <ul>
    <li>
      <strong>首次內容渲染時間（FCP）</strong>：使用者看到空白頁面，等待 JS 下載、解析和執行
    </li>
    <li>
      <strong>搜尋引擎最佳化（SEO）</strong>：爬蟲可能無法執行 JavaScript 渲染
    </li>
    <li>
      <strong>無 JavaScript 環境</strong>：網路不穩定、使用者禁用 JS
    </li>
    <li>
      <strong>社群媒體預覽</strong>：Open Graph 圖片需要伺服器端 HTML
    </li>
  </ul>
  <p>
    SSR 讓伺服器預先渲染 HTML，使用者立即看到有意義的內容，
    然後 JavaScript 再接管（Hydration）添加互動性。
  </p>

  <h3>SSR 安全模型：什麼在伺服器執行，什麼在客戶端執行</h3>
  <p>
    在設計 Lit SSR 架構時，必須清楚區分伺服器端與客戶端的邊界：
  </p>
  <table>
    <thead>
      <tr>
        <th>行為</th>
        <th>伺服器端（SSR 時）</th>
        <th>客戶端（Hydration 後）</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>connectedCallback</code></td>
        <td>執行（DOM Shim 環境）</td>
        <td>執行（真實瀏覽器）</td>
      </tr>
      <tr>
        <td><code>render()</code></td>
        <td>執行，輸出靜態 HTML</td>
        <td>執行，比較 DOM 差異</td>
      </tr>
      <tr>
        <td>事件監聽器</td>
        <td>不執行（無互動）</td>
        <td>Hydration 後才生效</td>
      </tr>
      <tr>
        <td><code>window</code>、<code>document</code></td>
        <td>Dom Shim 模擬（有限支援）</td>
        <td>完整瀏覽器 API</td>
      </tr>
      <tr>
        <td>fetch / HTTP 請求</td>
        <td>可以（Node.js 原生支援）</td>
        <td>可以（瀏覽器 fetch）</td>
      </tr>
      <tr>
        <td>localStorage / Cookie</td>
        <td>不可用（需手動傳入）</td>
        <td>完整支援</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">SSR 安全注意事項</div>
    <p>
      SSR 程式碼在伺服器端執行，攻擊面比客戶端更敏感。
      永遠不要在元件的 <code>render()</code> 中直接使用原始用戶輸入——必須先做 HTML 轉義。
      Lit 的 <code>html\`\`</code> 模板標記會自動轉義插值的字串，但直接使用
      <code>unsafeHTML()</code> 或 <code>unsafeSVG()</code> 時需格外小心。
    </p>
  </div>
</section>

<section id="declarative-shadow-dom">
  <h2>Declarative Shadow DOM</h2>
  <p>
    傳統 Shadow DOM 只能用 JavaScript 創建，這是 Web Components SSR 的根本障礙。
    <strong>Declarative Shadow DOM</strong>（DSD）解決了這個問題，
    讓 Shadow DOM 可以用純 HTML 表示。
  </p>

  <pre data-lang="html"><code class="language-html">&lt;!-- Declarative Shadow DOM：伺服器直接輸出 Shadow DOM HTML --&gt;
&lt;my-card&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;
      .card { border-radius: 8px; padding: 16px; }
    &lt;/style&gt;
    &lt;div class="card"&gt;
      &lt;slot&gt;&lt;/slot&gt;
    &lt;/div&gt;
  &lt;/template&gt;
  &lt;!-- Light DOM 內容 --&gt;
  &lt;p&gt;卡片內容&lt;/p&gt;
&lt;/my-card&gt;</code></pre>

  <p>
    瀏覽器解析到 <code>&lt;template shadowrootmode="open"&gt;</code> 時，
    會自動建立 Shadow Root，並將模板內容放入其中，
    <strong>完全不需要 JavaScript</strong>。
  </p>

  <h3>DSD 的詳細工作原理</h3>
  <p>
    DSD 是 HTML 解析器（parser）層面的功能，與 JavaScript 執行無關。
    這意味著即使瀏覽器禁用 JavaScript，DSD 仍然有效——這對
    SEO 爬蟲、電子郵件客戶端、PDF 渲染等場景非常重要。
  </p>

  <pre data-lang="html"><code class="language-html">&lt;!-- shadowrootmode 值 --&gt;
&lt;my-el&gt;
  &lt;!-- "open"：shadowRoot 屬性對外可存取 --&gt;
  &lt;template shadowrootmode="open"&gt;...&lt;/template&gt;
&lt;/my-el&gt;

&lt;my-el&gt;
  &lt;!-- "closed"：shadowRoot 屬性返回 null --&gt;
  &lt;template shadowrootmode="closed"&gt;...&lt;/template&gt;
&lt;/my-el&gt;

&lt;my-el&gt;
  &lt;!-- shadowrootdelegatesfocus：焦點委派給第一個可聚焦元素 --&gt;
  &lt;template shadowrootmode="open" shadowrootdelegatesfocus&gt;
    &lt;input type="text" /&gt;
  &lt;/template&gt;
&lt;/my-el&gt;</code></pre>

  <h3>DSD Polyfill：舊瀏覽器支援</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在頁面 &lt;head&gt; 最早載入，確保解析器 polyfill 生效
// 注意：這必須是同步腳本（非 defer/async），才能在解析時生效

// dsd-polyfill.ts（inline 到 &lt;head&gt; 的腳本）
(function() {
  // 偵測是否支援 DSD
  if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
    return; // 原生支援，不需要 polyfill
  }

  // Polyfill：將已解析的 template[shadowrootmode] 手動附加
  function attachShadowRoots(root: Document | Element) {
    root.querySelectorAll&lt;HTMLTemplateElement&gt;('template[shadowrootmode]').forEach(template =&gt; {
      const mode = template.getAttribute('shadowrootmode') as ShadowRootMode;
      const delegatesFocus = template.hasAttribute('shadowrootdelegatesfocus');
      const parent = template.parentElement;
      if (parent) {
        const shadowRoot = parent.attachShadow({ mode, delegatesFocus });
        shadowRoot.appendChild(template.content);
        template.remove();
        // 遞迴處理 shadow root 內部的巢狀 DSD
        attachShadowRoots(shadowRoot as unknown as Element);
      }
    });
  }

  // 在 DOMContentLoaded 後執行，此時 HTML 已完全解析
  document.addEventListener('DOMContentLoaded', () =&gt; {
    attachShadowRoots(document);
  });

  // 若腳本在 DOMContentLoaded 之後才執行
  if (document.readyState !== 'loading') {
    attachShadowRoots(document);
  }
})();</code></pre>

  <h3>瀏覽器支援</h3>
  <table>
    <thead>
      <tr><th>瀏覽器</th><th>Declarative Shadow DOM 支援</th><th>備註</th></tr>
    </thead>
    <tbody>
      <tr><td>Chrome 111+</td><td>完整支援</td><td>最早支援的主流瀏覽器</td></tr>
      <tr><td>Firefox 123+</td><td>完整支援</td><td>2024 年 2 月加入支援</td></tr>
      <tr><td>Safari 16.4+</td><td>完整支援</td><td>2023 年 3 月加入支援</td></tr>
      <tr><td>Edge 111+</td><td>完整支援</td><td>基於 Chromium</td></tr>
      <tr><td>更舊版本</td><td>需要 Polyfill</td><td>見上方 polyfill 程式碼</td></tr>
    </tbody>
  </table>
</section>

<section id="lit-ssr-package">
  <h2>@lit-labs/ssr 運作原理</h2>
  <p>
    <code>@lit-labs/ssr</code> 在 Node.js 環境中模擬瀏覽器 API，
    將 Lit 元件渲染為 HTML 字串（包含 Declarative Shadow DOM）。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit-labs/ssr</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// server.ts
import { render } from '@lit-labs/ssr';
import { html } from 'lit';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';

// 必須在 Node.js 中安裝 DOM Shim
import '@lit-labs/ssr/lib/install-global-dom-shim.js';

// 引入元件（確保 customElements.define 被呼叫）
import './my-card.js';

async function renderPage() {
  const template = html\`
    &lt;html&gt;
    &lt;head&gt;
      &lt;title&gt;SSR Demo&lt;/title&gt;
    &lt;/head&gt;
    &lt;body&gt;
      &lt;my-card title="SSR 測試"&gt;
        &lt;p&gt;這段內容在伺服器端渲染&lt;/p&gt;
      &lt;/my-card&gt;
      &lt;script type="module" src="/client.js"&gt;&lt;/script&gt;
    &lt;/body&gt;
    &lt;/html&gt;
  \`;

  // render() 返回一個 AsyncIterable&lt;string&gt;
  const result = render(template);
  return await collectResult(result);
}

// 輸出的 HTML 會包含 Declarative Shadow DOM
console.log(await renderPage());</code></pre>

  <h3>SSR 輸出結果解析</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- @lit-labs/ssr 輸出的 HTML，包含 Lit 的標記注解 --&gt;
&lt;my-card title="SSR 測試"&gt;
  &lt;!--?lit$123456$--&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;
      /* 元件的 static styles */
      .card { border-radius: 8px; padding: 16px; }
    &lt;/style&gt;
    &lt;!--?lit$123456$--&gt;
    &lt;div class="card"&gt;
      &lt;!--?lit$123456$--&gt;&lt;h2&gt;SSR 測試&lt;/h2&gt;
      &lt;div class="body"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/template&gt;
  &lt;p&gt;這段內容在伺服器端渲染&lt;/p&gt;
&lt;/my-card&gt;
&lt;!--
  Lit 使用 !--?lit$...$-- 注解標記模板綁定位置
  Hydration 時，客戶端 Lit 讀取這些標記，直接接管 DOM
  而不需要重新渲染（避免閃爍）
--&gt;</code></pre>
</section>

<section id="streaming-ssr">
  <h2>Streaming SSR 與 Suspense-like 體驗</h2>
  <p>
    傳統 SSR 需要等待整個頁面渲染完成才能開始傳送 HTML，
    對於有非同步資料載入的頁面，這會導致高 TTFB（Time to First Byte）。
    Streaming SSR 利用 HTTP chunked transfer encoding，
    讓瀏覽器在接收到第一個 HTML 片段時就開始渲染，
    大幅改善感知效能。
  </p>

  <h3>基礎 Streaming：Readable Stream</h3>
  <pre data-lang="typescript"><code class="language-typescript">// streaming-server.ts
import { render } from '@lit-labs/ssr';
import { html } from 'lit';
import { Readable } from 'node:stream';
import express from 'express';
import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import './components/index.js';

const app = express();

app.get('/page', async (req, res) =&gt; {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  // 伺服器立即傳送 &lt;head&gt; 和頁首 HTML
  // 讓瀏覽器盡早開始載入 CSS、字體等資源
  res.write(\`&lt;!DOCTYPE html&gt;
&lt;html lang="zh-TW"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;title&gt;Streaming SSR Demo&lt;/title&gt;
  &lt;link rel="stylesheet" href="/styles.css"&gt;
  &lt;!-- 頁面尚未渲染完，但瀏覽器已開始下載 CSS --&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;app-header&gt;&lt;/app-header&gt;\`);

  // 同時在背景取得資料
  const dataPromise = fetchPageData(req.params.id);

  // 立即 stream 靜態部分（導航、骨架）
  const staticPart = render(html\`
    &lt;nav-sidebar&gt;&lt;/nav-sidebar&gt;
    &lt;main&gt;
  \`);

  const readable = Readable.from(staticPart);
  await new Promise&lt;void&gt;(resolve =&gt; readable.pipe(res, { end: false }).on('finish', resolve));

  // 等待資料，然後 stream 動態內容
  const data = await dataPromise;
  const dynamicPart = render(html\`
    &lt;product-detail .product=\${data}&gt;&lt;/product-detail&gt;
    &lt;/main&gt;
    &lt;script type="module" src="/hydrate.js"&gt;&lt;/script&gt;
    &lt;/body&gt;
    &lt;/html&gt;
  \`);

  const dynamicReadable = Readable.from(dynamicPart);
  dynamicReadable.pipe(res); // end: true（預設）
});</code></pre>

  <h3>Web Streams API（Edge Runtime 相容）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 Web Streams API（瀏覽器標準，相容 Cloudflare Workers、Deno 等）
import { render } from '@lit-labs/ssr';
import { html } from 'lit';

async function handleRequest(request: Request): Promise&lt;Response&gt; {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '1';

  // 建立 ReadableStream，逐塊傳送 HTML
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // 傳送頁頭
      controller.enqueue(encoder.encode(\`&lt;!DOCTYPE html&gt;
&lt;html lang="zh-TW"&gt;&lt;head&gt;
  &lt;title&gt;商品詳情&lt;/title&gt;
  &lt;link rel="stylesheet" href="/styles.css"&gt;
&lt;/head&gt;&lt;body&gt;\`));

      // 取得資料（資料取得期間，已傳送的頭部正在被瀏覽器處理）
      const product = await fetchProduct(id);

      // 用 @lit-labs/ssr render() 生成元件 HTML
      const result = render(html\`
        &lt;product-detail .product=\${product}&gt;&lt;/product-detail&gt;
        &lt;script type="module" src="/client.js"&gt;&lt;/script&gt;
        &lt;/body&gt;&lt;/html&gt;
      \`);

      // 將 AsyncIterable 逐塊寫入 stream
      for await (const chunk of result) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}</code></pre>

  <h3>Suspense-like 延遲載入：Out-of-Order Streaming</h3>
  <p>
    React 18 的 Suspense 可以讓慢速資料的部分在資料就緒後才「填入」頁面。
    在 Lit SSR 中，可以用 Server-Sent Events 或 inline script 實現類似效果：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 技術：先傳送佔位符（skeleton），資料就緒後用 inline script 替換
async function renderWithDeferredContent(res: Response): Promise&lt;void&gt; {
  const encoder = new TextEncoder();

  // 傳送結構和骨架畫面
  const skeleton = render(html\`
    &lt;!DOCTYPE html&gt;
    &lt;html&gt;&lt;body&gt;
    &lt;page-header&gt;&lt;/page-header&gt;
    &lt;div id="main-content"&gt;
      &lt;!-- 骨架佔位符 --&gt;
      &lt;content-skeleton&gt;&lt;/content-skeleton&gt;
    &lt;/div&gt;
  \`);

  // ... 傳送骨架

  // 資料就緒後，傳送替換腳本
  const data = await fetchSlowData();
  const contentHtml = await collectResult(render(html\`
    &lt;article-list .items=\${data}&gt;&lt;/article-list&gt;
  \`));

  // 使用 inline script 替換佔位符（out-of-order streaming 技術）
  const replacement = \`&lt;template id="deferred-content"&gt;\${contentHtml}&lt;/template&gt;
&lt;script&gt;
  const target = document.getElementById('main-content');
  const template = document.getElementById('deferred-content');
  target.replaceWith(template.content.cloneNode(true));
&lt;/script&gt;\`;

  // ... 傳送 replacement 並結束 stream
}</code></pre>
</section>

<section id="node-integration">
  <h2>Node.js 整合實踐</h2>

  <h3>與 Express 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">// express-ssr.ts
import express from 'express';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import './components/index.js'; // 載入所有元件

const app = express();

app.get('/product/:id', async (req, res) =&gt; {
  const product = await fetchProduct(req.params.id);

  const page = html\`
    &lt;!DOCTYPE html&gt;
    &lt;html lang="zh-TW"&gt;
    &lt;head&gt;
      &lt;title&gt;\${product.name} | 我的商店&lt;/title&gt;
      &lt;link rel="stylesheet" href="/styles.css"&gt;
    &lt;/head&gt;
    &lt;body&gt;
      &lt;product-detail .product=\${product}&gt;&lt;/product-detail&gt;
      &lt;script type="module" src="/hydrate.js"&gt;&lt;/script&gt;
    &lt;/body&gt;
    &lt;/html&gt;
  \`;

  const html = await collectResult(render(page));
  res.send(html);
});

app.listen(3000);</code></pre>

  <h3>複雜狀態的脫水（Dehydration）與再水化（Rehydration）</h3>
  <p>
    當元件依賴複雜的應用狀態時，需要將伺服器端的狀態序列化到頁面中，
    客戶端 Hydration 時再反序列化還原。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 伺服器端：序列化狀態（Dehydration）
app.get('/dashboard', async (req, res) =&gt; {
  const user = await getUserFromSession(req);
  const dashboardData = await fetchDashboardData(user.id);

  // 只序列化客戶端需要的資料，不要暴露敏感欄位
  const dehydratedState = {
    user: { id: user.id, name: user.name, role: user.role },
    // 注意：不序列化 user.passwordHash、user.securityToken 等敏感欄位
    data: dashboardData,
    timestamp: Date.now(),
  };

  const pageHtml = await collectResult(render(html\`
    &lt;!DOCTYPE html&gt;&lt;html&gt;&lt;head&gt;...&lt;/head&gt;&lt;body&gt;
    &lt;!-- 將狀態嵌入頁面 --&gt;
    &lt;script id="__INITIAL_STATE__" type="application/json"&gt;
      \${JSON.stringify(dehydratedState)}
    &lt;/script&gt;
    &lt;dashboard-app .user=\${dehydratedState.user} .data=\${dehydratedState.data}&gt;&lt;/dashboard-app&gt;
    &lt;script type="module" src="/hydrate.js"&gt;&lt;/script&gt;
    &lt;/body&gt;&lt;/html&gt;
  \`));

  res.send(pageHtml);
});

// 客戶端：讀取並恢復狀態（Rehydration）
// hydrate.ts
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import './components/index.js';

// 讀取伺服器嵌入的初始狀態
const stateEl = document.getElementById('__INITIAL_STATE__');
if (stateEl) {
  const initialState = JSON.parse(stateEl.textContent ?? '{}');
  // 初始化應用狀態 store（如 Zustand、MobX、Redux 等）
  appStore.hydrate(initialState);
}

// Lit 會自動識別 DSD 並進行 hydration
// 不需要手動呼叫任何 hydrate 函數</code></pre>

  <h3>Astro + Lit 整合</h3>
  <p>
    <a href="https://astro.build" target="_blank">Astro</a> 是目前與 Lit 整合最流暢的框架之一。
    Astro 原生支援 Web Components，並提供精細的 hydration 控制指令。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm create astro@latest my-site
npx astro add lit</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// src/components/ProductCard.ts（Lit 元件）
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('product-card')
export class ProductCard extends LitElement {
  @property({ attribute: false }) product!: Product;

  static styles = css\`
    :host { display: block; }
    .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
  \`;

  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;h3&gt;\${this.product.name}&lt;/h3&gt;
        &lt;p&gt;\${this.product.price} 元&lt;/p&gt;
        &lt;button @click=\${() =&gt; this._addToCart()}&gt;加入購物車&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }

  private _addToCart() {
    this.dispatchEvent(new CustomEvent('add-to-cart', {
      detail: { productId: this.product.id },
      bubbles: true, composed: true,
    }));
  }
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">---
// src/pages/products.astro
import { ProductCard } from '../components/ProductCard.ts';
const products = await fetchProducts();
---
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;body&gt;
  &lt;h1&gt;商品列表&lt;/h1&gt;
  \{products.map(product =&gt; (
    &lt;!--
      client:load   — 頁面載入立即 hydrate
      client:idle   — 瀏覽器空閒時 hydrate
      client:visible — 元件進入視口時 hydrate（最推薦用於長列表）
      client:only   — 完全不 SSR，只在客戶端渲染
    --&gt;
    &lt;product-card
      client:visible
      product={product}
    /&gt;
  ))}
&lt;/body&gt;
&lt;/html&gt;</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Astro 的 Island 架構</div>
    <p>
      Astro 的每個帶有 <code>client:*</code> 指令的元件都是一個獨立的 Island。
      沒有 <code>client:*</code> 指令的元件只做 SSR，不傳送任何 JavaScript 到客戶端。
      這讓你可以精確控制每個元件是否需要客戶端 JavaScript，
      對效能最佳化非常有效。
    </p>
  </div>
</section>

<section id="island-architecture">
  <h2>Island 架構：選擇性 Hydration</h2>
  <p>
    Island 架構（也稱為 Partial Hydration）的核心理念是：
    頁面中大部分內容是靜態的，只有少數互動元素（Islands）需要客戶端 JavaScript。
    透過只對這些 Islands 進行 Hydration，可以大幅減少客戶端的 JavaScript 負擔。
  </p>

  <h3>手動實現 Island 架構</h3>
  <pre data-lang="typescript"><code class="language-typescript">// island-loader.ts：延遲載入互動 Islands
class IslandLoader {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) =&gt; {
        entries.forEach(entry =&gt; {
          if (entry.isIntersecting) {
            this._hydrateIsland(entry.target as HTMLElement);
            this.observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' } // 提前 200px 開始載入
    );
  }

  // 掃描頁面中標記為 island 的元素
  init() {
    document.querySelectorAll&lt;HTMLElement&gt;('[data-island]').forEach(el =&gt; {
      const strategy = el.dataset.island;
      if (strategy === 'visible') {
        this.observer.observe(el);
      } else if (strategy === 'idle') {
        requestIdleCallback(() =&gt; this._hydrateIsland(el));
      } else if (strategy === 'load') {
        this._hydrateIsland(el);
      }
    });
  }

  private async _hydrateIsland(el: HTMLElement) {
    const component = el.dataset.component;
    if (!component) return;

    // 動態載入元件模組
    await import(\`/components/\${component}.js\`);
    // 元件定義後，自訂元素升級（upgrade）會自動觸發
    // Lit 的 hydration 支援也會自動接管 DSD 渲染的 DOM
  }
}

// 掛載到 island-loader 模組
export const islandLoader = new IslandLoader();</code></pre>

  <pre data-lang="html"><code class="language-html">&lt;!-- 伺服器輸出的 HTML：靜態內容不需要 JS --&gt;
&lt;article&gt;
  &lt;!-- 靜態內容：沒有 data-island，不需要任何客戶端 JS --&gt;
  &lt;hero-banner&gt;
    &lt;template shadowrootmode="open"&gt;
      &lt;img src="/hero.jpg" alt="Banner" /&gt;
    &lt;/template&gt;
  &lt;/hero-banner&gt;

  &lt;!-- Island：只有這個元件需要 hydration --&gt;
  &lt;add-to-cart-button
    data-island="visible"
    data-component="add-to-cart-button"
    product-id="123"
  &gt;
    &lt;template shadowrootmode="open"&gt;
      &lt;button&gt;加入購物車&lt;/button&gt;
    &lt;/template&gt;
  &lt;/add-to-cart-button&gt;

  &lt;!-- 靜態內容：評論列表，讀取多於寫入，不需要 JS --&gt;
  &lt;comment-list&gt;
    &lt;template shadowrootmode="open"&gt;
      &lt;ul&gt;...&lt;/ul&gt;
    &lt;/template&gt;
  &lt;/comment-list&gt;
&lt;/article&gt;

&lt;script type="module"&gt;
  // 只載入 island loader，不載入所有元件
  import { islandLoader } from '/island-loader.js';
  islandLoader.init();
&lt;/script&gt;</code></pre>

  <h3>Service Worker 預快取 Island 模組</h3>
  <pre data-lang="typescript"><code class="language-typescript">// sw.ts（Service Worker）
// 預快取常用的 Island 元件模組
const ISLANDS_CACHE = 'islands-v1';
const ISLAND_COMPONENTS = [
  '/components/add-to-cart-button.js',
  '/components/product-gallery.js',
  '/components/review-form.js',
];

self.addEventListener('install', (event: ExtendableEvent) =&gt; {
  event.waitUntil(
    caches.open(ISLANDS_CACHE).then(cache =&gt; cache.addAll(ISLAND_COMPONENTS))
  );
});

self.addEventListener('fetch', (event: FetchEvent) =&gt; {
  // 對 Island 模組使用 Cache First 策略
  if (ISLAND_COMPONENTS.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        cached =&gt; cached || fetch(event.request)
      )
    );
  }
});</code></pre>
</section>

<section id="edge-runtime">
  <h2>Edge Runtime 部署</h2>
  <p>
    Edge Runtime（Cloudflare Workers、Vercel Edge Functions、Deno Deploy）
    不是完整的 Node.js 環境，缺少許多全域 API。
    Lit SSR 需要特別的 polyfill 設定。
  </p>

  <h3>Cloudflare Workers 完整範例</h3>
  <pre data-lang="typescript"><code class="language-typescript">// worker.ts — Cloudflare Workers + Lit SSR
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html } from 'lit';

// Edge Runtime 專用 DOM Shim（比 Node.js 版本更輕量）
import '@lit-labs/ssr/lib/install-global-dom-shim.js';

// 預先導入元件（Worker 初始化時執行一次，非請求時）
import './components/product-card.js';
import './components/page-header.js';

// 使用 KV 或 R2 作為 SSR 快取
interface Env {
  SSR_CACHE: KVNamespace;
  PRODUCTS_API: string;
}

export default {
  async fetch(request: Request, env: Env): Promise&lt;Response&gt; {
    const url = new URL(request.url);
    const cacheKey = url.pathname + url.search;

    // 嘗試從 KV 快取讀取
    const cached = await env.SSR_CACHE.get(cacheKey, 'text');
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      });
    }

    // 快取未命中，從 API 取得資料並 SSR
    const productId = url.pathname.replace('/product/', '');
    const product = await fetch(\`\${env.PRODUCTS_API}/\${productId}\`)
      .then(r =&gt; r.json());

    const template = html\`
      &lt;!DOCTYPE html&gt;
      &lt;html lang="zh-TW"&gt;
      &lt;head&gt;
        &lt;title&gt;\${product.name}&lt;/title&gt;
        &lt;meta property="og:title" content="\${product.name}"&gt;
        &lt;meta property="og:image" content="\${product.imageUrl}"&gt;
        &lt;link rel="stylesheet" href="/styles.css"&gt;
      &lt;/head&gt;
      &lt;body&gt;
        &lt;page-header&gt;&lt;/page-header&gt;
        &lt;product-card .product=\${product}&gt;&lt;/product-card&gt;
        &lt;script type="module" src="/hydrate.js"&gt;&lt;/script&gt;
      &lt;/body&gt;&lt;/html&gt;
    \`;

    const rendered = await collectResult(render(template));

    // 寫入 KV 快取（TTL 5 分鐘）
    await env.SSR_CACHE.put(cacheKey, rendered, { expirationTtl: 300 });

    return new Response(rendered, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  },
} satisfies ExportedHandler&lt;Env&gt;;</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Edge Runtime 的優勢</div>
    <p>
      部署在邊緣節點的 SSR 可以讓使用者從地理位置最近的服務器取得 HTML，
      大幅降低延遲。對於全球用戶的應用，這能帶來顯著的效能提升。
      Cloudflare Workers 擁有 300+ 個全球節點，請求延遲通常低於 10ms。
    </p>
  </div>
</section>

<section id="ssr-performance-patterns">
  <h2>SSR 效能優化：快取、CDN、Edge</h2>
  <p>
    SSR 效能優化的核心原則：<strong>把能快取的都快取起來</strong>。
    SSR 的主要成本是 HTML 生成時間，透過多層快取策略可以大幅降低伺服器負擔。
  </p>

  <h3>多層快取架構</h3>

  <pre data-lang="typescript"><code class="language-typescript">// ssr-cache.ts：多層快取管理器
interface CacheOptions {
  ttl?: number;      // 秒數
  staleWhileRevalidate?: number; // 允許使用過期快取的時間視窗（秒）
  tags?: string[];   // 用於精確清除快取的 tag
}

class SsrCacheManager {
  // Layer 1：記憶體快取（同 Node.js 進程，最快）
  private memCache = new Map&lt;string, { html: string; expiresAt: number; }&gt;();

  // Layer 2：Redis 分散式快取（跨進程/節點共享）
  constructor(private redis: RedisClient) {}

  async get(key: string): Promise&lt;string | null&gt; {
    // L1：記憶體
    const mem = this.memCache.get(key);
    if (mem &amp;&amp; mem.expiresAt &gt; Date.now()) {
      return mem.html;
    }

    // L2：Redis
    const redis = await this.redis.get(key);
    if (redis) {
      // 回填記憶體快取
      this.memCache.set(key, { html: redis, expiresAt: Date.now() + 30_000 });
      return redis;
    }

    return null;
  }

  async set(key: string, html: string, options: CacheOptions = {}) {
    const ttl = options.ttl ?? 300;
    // L1
    this.memCache.set(key, { html, expiresAt: Date.now() + ttl * 1000 });
    // L2
    await this.redis.set(key, html, 'EX', ttl);
    // 記錄 tags，用於後續的 tag-based cache invalidation
    if (options.tags?.length) {
      await Promise.all(
        options.tags.map(tag =&gt; this.redis.sadd(\`tag:\${tag}\`, key))
      );
    }
  }

  // 按 tag 批量清除快取（如商品更新時清除所有商品相關頁面）
  async invalidateByTag(tag: string) {
    const keys = await this.redis.smembers(\`tag:\${tag}\`);
    if (keys.length) {
      await this.redis.del(...keys);
      keys.forEach(k =&gt; this.memCache.delete(k));
      await this.redis.del(\`tag:\${tag}\`);
    }
  }
}</code></pre>

  <h3>Stale-While-Revalidate 模式</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 SWR 模式：立即返回舊快取，同時在背景重新生成
app.get('/page/:slug', async (req, res) =&gt; {
  const key = \`page:\${req.params.slug}\`;
  const cached = await redis.get(key);

  if (cached) {
    // 立即返回快取（即使可能過期）
    res.send(cached);

    // 在背景非同步重新生成（不阻塞當前請求）
    const ttl = await redis.ttl(key);
    if (ttl &lt; 60) { // 快取快過期了，提前刷新
      generateAndCache(key, req.params.slug).catch(console.error);
    }
    return;
  }

  // 快取完全不存在，必須同步生成
  const html = await generateAndCache(key, req.params.slug);
  res.send(html);
});

async function generateAndCache(key: string, slug: string): Promise&lt;string&gt; {
  const data = await fetchPageData(slug);
  const html = await collectResult(render(html\`&lt;page-content .data=\${data}&gt;&lt;/page-content&gt;\`));
  await redis.set(key, html, 'EX', 300);
  return html;
}</code></pre>

  <h3>HTTP 快取標頭最佳實踐</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 根據頁面類型設定不同的快取策略
function getCacheHeaders(pageType: 'product' | 'category' | 'user-profile') {
  switch (pageType) {
    case 'product':
      return {
        // CDN 快取 5 分鐘，允許使用 1 小時的過期快取
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'Vary': 'Accept-Encoding, Accept-Language',
      };
    case 'category':
      return {
        // 分類頁更新較少，快取更長
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      };
    case 'user-profile':
      return {
        // 個人化頁面不能被 CDN 快取
        'Cache-Control': 'private, no-store',
      };
  }
}</code></pre>
</section>

<section id="hydration-strategies">
  <h2>Hydration 策略比較</h2>
  <p>
    Hydration 是讓伺服器渲染的靜態 HTML「復活」成為互動式 UI 的過程。
    不同的 Hydration 策略有不同的效能特性。
  </p>

  <h3>Lit 的 Hydration 流程</h3>
  <pre data-lang="typescript"><code class="language-typescript">// client.ts（Hydration 腳本）
// 1. 引入 Lit 的 hydration 支援（必須最先載入）
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';

// 2. 引入元件（確保 customElements 已定義）
import './components/index.js';

// 3. Lit 會自動找到 SSR 渲染的元件並 hydrate
// 不需要額外的程式碼！
// Lit 識別 DSD 中的 &lt;!--?lit...?--&gt; 標記，直接接管 DOM

// Hydration 是增量的：只有視口中的元件才會被立即處理
// 螢幕外的元件會在需要時才 hydrate</code></pre>

  <h3>四種 Hydration 模式比較</h3>
  <table>
    <thead>
      <tr>
        <th>模式</th>
        <th>運作方式</th>
        <th>優點</th>
        <th>缺點</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>全頁 Hydration</td>
        <td>頁面載入後立即 hydrate 所有元件</td>
        <td>簡單、互動性立即可用</td>
        <td>初始 JS 載入量大，TTI 延遲</td>
      </tr>
      <tr>
        <td>漸進式 Hydration</td>
        <td>元件可見時才 hydrate（IntersectionObserver）</td>
        <td>首屏效能好，JS 按需載入</td>
        <td>實作複雜，滾動時有短暫延遲</td>
      </tr>
      <tr>
        <td>Island Architecture</td>
        <td>只有互動區域需要 JS，靜態區域保持純 HTML</td>
        <td>JS Bundle 最小化，效能最優</td>
        <td>需要框架（Astro）或手動實作</td>
      </tr>
      <tr>
        <td>Resumability（Qwik 模式）</td>
        <td>序列化應用狀態，無需重跑初始化邏輯</td>
        <td>最快的可互動時間（O(1) hydration）</td>
        <td>極度複雜，Lit 原生不支援</td>
      </tr>
    </tbody>
  </table>

  <h3>選擇合適的 Hydration 策略</h3>
  <div class="callout callout-tip">
    <div class="callout-title">實務建議</div>
    <p>
      對於大多數內容型網站（電商、媒體、部落格），
      <strong>Island Architecture + Astro</strong> 是最佳組合：
      靜態內容完全不需要 JS，互動 Islands 按需 hydrate。
      對於高度互動的 SPA（管理後台、協作工具），
      傳統<strong>全頁 Hydration + Streaming SSR</strong> 更簡單實用。
      在決定策略之前，先用 Lighthouse 或 Core Web Vitals 量測實際瓶頸。
    </p>
  </div>
</section>
`,
};
