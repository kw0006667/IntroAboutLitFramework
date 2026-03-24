const t={id:14,slug:"chapter-14",title:"SSR 與 Hydration：Lit 的伺服器端渲染之路",part:4,intro:"@lit-labs/ssr 的運作原理，Declarative Shadow DOM 的角色，以及與 Node.js / Edge Runtime 的整合。",sections:[{slug:"why-ssr",title:"為何需要 SSR？"},{slug:"declarative-shadow-dom",title:"Declarative Shadow DOM"},{slug:"lit-ssr-package",title:"@lit-labs/ssr 運作原理"},{slug:"node-integration",title:"Node.js 整合實踐"},{slug:"edge-runtime",title:"Edge Runtime 部署"},{slug:"hydration-strategies",title:"Hydration 策略比較"}],content:`
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

  <h3>瀏覽器支援</h3>
  <table>
    <thead>
      <tr><th>瀏覽器</th><th>Declarative Shadow DOM 支援</th></tr>
    </thead>
    <tbody>
      <tr><td>Chrome 111+</td><td>完整支援</td></tr>
      <tr><td>Firefox 123+</td><td>完整支援</td></tr>
      <tr><td>Safari 16.4+</td><td>完整支援</td></tr>
      <tr><td>Edge 111+</td><td>完整支援（基於 Chromium）</td></tr>
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

  // render() 返回一個 AsyncIterable
  const result = render(template);
  return await collectResult(result);
}

// 輸出的 HTML 會包含 Declarative Shadow DOM
console.log(await renderPage());</code></pre>

  <h3>Streaming SSR</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 Streaming 逐步傳送 HTML（更快的 TTFB）
import { render } from '@lit-labs/ssr';
import { Readable } from 'stream';

app.get('/page', (req, res) =&gt; {
  res.setHeader('Content-Type', 'text/html');

  const result = render(html\`&lt;my-page .data=\${pageData}&gt;&lt;/my-page&gt;\`);

  const readable = Readable.from(result);
  readable.pipe(res);
  // HTML 塊會逐步傳送到客戶端，不需等待整個頁面渲染完成
});</code></pre>
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
</section>

<section id="edge-runtime">
  <h2>Edge Runtime 部署</h2>
  <p>
    Edge Runtime（Cloudflare Workers、Vercel Edge Functions、Deno Deploy）
    不是完整的 Node.js 環境，缺少許多全域 API。
    Lit SSR 需要特別的 polyfill 設定。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// Cloudflare Workers 設定
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';

// Edge Runtime 專用：更小的 DOM Shim
import { installWindowOnGlobal } from '@lit-labs/ssr/lib/lit-element-renderer.js';
installWindowOnGlobal();

export default {
  async fetch(request: Request): Promise&lt;Response&gt; {
    const url = new URL(request.url);
    const data = await fetchData(url.pathname);

    const template = html\`&lt;my-page .data=\${data}&gt;&lt;/my-page&gt;\`;
    const rendered = await collectResult(render(template));

    return new Response(rendered, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Edge Runtime 的優勢</div>
    <p>
      部署在邊緣節點的 SSR 可以讓使用者從地理位置最近的服務器取得 HTML，
      大幅降低延遲。對於全球用戶的應用，這能帶來顯著的效能提升。
    </p>
  </div>
</section>

<section id="hydration-strategies">
  <h2>Hydration 策略比較</h2>
  <p>
    Hydration 是讓伺服器渲染的靜態 HTML 「復活」成為互動式 UI 的過程。
    不同的 Hydration 策略有不同的效能特性。
  </p>

  <h3>Lit 的 Hydration 流程</h3>
  <pre data-lang="typescript"><code class="language-typescript">// client.ts（Hydration 腳本）
// 1. 引入 Lit 的 hydration 支援
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';

// 2. 引入元件（確保 customElements 已定義）
import './components/index.js';

// 3. Lit 會自動找到 SSR 渲染的元件並 hydrate
// 不需要額外的程式碼！
// Lit 識別 DSD 中的 <!—?lit...?—> 標記，直接接管 DOM</code></pre>

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
        <td>簡單</td>
        <td>初始 JS 載入量大</td>
      </tr>
      <tr>
        <td>漸進式 Hydration</td>
        <td>元件可見時才 hydrate（IntersectionObserver）</td>
        <td>首屏效能好</td>
        <td>實作複雜</td>
      </tr>
      <tr>
        <td>Island Architecture</td>
        <td>只有互動區域需要 JS，靜態區域保持純 HTML</td>
        <td>JS 最小化</td>
        <td>需要框架支援</td>
      </tr>
      <tr>
        <td>Resumability（Qwik 模式）</td>
        <td>序列化應用狀態，無需重跑初始化邏輯</td>
        <td>最快的可互動時間</td>
        <td>複雜，需特殊框架</td>
      </tr>
    </tbody>
  </table>
</section>
`};export{t as default};
