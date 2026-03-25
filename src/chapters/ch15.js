export default {
  id: 15,
  slug: 'chapter-15',
  title: 'Testing 策略：Web Test Runner 與 Playwright',
  part: 4,
  intro: '單元測試、整合測試的完整工作流，重點說明 Shadow DOM 環境下的元素查詢技巧。',
  sections: [
    { slug: 'testing-philosophy', title: '測試哲學與策略' },
    { slug: 'web-test-runner-setup', title: 'Web Test Runner 環境設定' },
    { slug: 'unit-testing-components', title: '元件單元測試' },
    { slug: 'shadow-dom-querying', title: 'Shadow DOM 查詢技巧' },
    { slug: 'playwright-e2e', title: 'Playwright E2E 測試' },
    { slug: 'ci-integration', title: 'CI/CD 整合' },
    { slug: 'accessibility-testing', title: 'Accessibility 自動化測試：axe-core 整合' },
    { slug: 'visual-regression', title: '視覺回歸測試：Percy、Chromatic、Playwright Screenshots' },
    { slug: 'component-contract-testing', title: '元件契約測試：API 穩定性保障' },
  ],
  content: `
<section id="testing-philosophy">
  <h2>測試哲學與策略</h2>
  <p>
    測試 Web Components 與測試 React 元件有幾個關鍵差異：
    Shadow DOM 需要特殊的查詢方式，Custom Events 需要正確監聽，
    非同步更新需要等待 <code>updateComplete</code>。
    然而，更深層的差異在於：Web Components 是真實的平台原語（platform primitives），
    它們在真實瀏覽器環境中運行，JSDOM 模擬環境無法完整重現其行為。
  </p>

  <h3>Testing Trophy：Web Components 的最佳策略</h3>
  <p>
    傳統的「測試金字塔」（Testing Pyramid）強調大量單元測試、少量整合測試、極少 E2E 測試。
    但 Kent C. Dodds 提出的 <strong>Testing Trophy</strong> 更適合 UI 元件：
    把重心放在<em>整合測試</em>，因為它能以最低的代價驗證最接近真實使用情境的行為。
  </p>

  <div class="callout callout-info">
    <div class="callout-title">為什麼整合測試 &gt; 單元測試（對 UI 元件而言）</div>
    <p>
      純單元測試往往需要大量 mock，而 mock 越多，測試就越不能反映真實行為。
      Web Components 的核心價值在於它們在真實 DOM 中的交互行為：
      Shadow DOM 封裝、事件冒泡、slot 傳遞、CSS 繼承邊界。
      這些行為只有在接近真實瀏覽器的環境中才能被正確測試。
    </p>
  </div>

  <table>
    <thead>
      <tr>
        <th>測試類型</th>
        <th>佔比（Trophy）</th>
        <th>工具</th>
        <th>價值</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>靜態分析</td>
        <td>底座（基礎）</td>
        <td>TypeScript、ESLint</td>
        <td>最低成本，捕獲型別錯誤</td>
      </tr>
      <tr>
        <td>單元測試</td>
        <td>~20%</td>
        <td>@open-wc/testing + WTR</td>
        <td>測試純邏輯函式、Utility</td>
      </tr>
      <tr>
        <td>整合測試</td>
        <td>~50%（最重要）</td>
        <td>@open-wc/testing + WTR</td>
        <td>測試元件在真實 DOM 中的行為</td>
      </tr>
      <tr>
        <td>E2E 測試</td>
        <td>~30%</td>
        <td>Playwright</td>
        <td>測試完整使用者流程</td>
      </tr>
    </tbody>
  </table>

  <h3>@open-wc/testing 的設計哲學</h3>
  <p>
    <code>@open-wc/testing</code> 是專為 Web Components 設計的測試工具集，
    它的哲學與 Testing Trophy 一致：提供貼近真實 DOM 的測試環境。
    其核心原則：
  </p>
  <ul>
    <li>
      <strong>真實瀏覽器環境</strong>：測試在真實的 Chromium/Firefox/WebKit 中執行，
      不是 JSDOM 模擬。Shadow DOM、CSS Variables、Custom Elements Registry 全部真實運作。
    </li>
    <li>
      <strong>fixture() 自動清理</strong>：每個測試後自動從 DOM 中移除元件，避免測試間污染。
    </li>
    <li>
      <strong>等待就緒</strong>：<code>await fixture()</code> 已自動等待 <code>updateComplete</code>，
      確保元件完全渲染後才開始斷言。
    </li>
    <li>
      <strong>語義化查詢</strong>：建議優先使用 ARIA 角色查詢（<code>getByRole</code>），
      而非脆弱的 CSS class 選擇器。
    </li>
  </ul>

  <div class="callout callout-tip">
    <div class="callout-title">為什麼不用 Jest + JSDOM？</div>
    <p>
      Jest 搭配 JSDOM 無法完整支援 Web Components：JSDOM 對 Shadow DOM 的支援不完整，
      Custom Elements 的升級機制（upgrading）行為與真實瀏覽器不同，
      且無法測試任何依賴真實 CSS 計算的行為（例如 CSS Custom Properties、<code>getComputedStyle</code>）。
      對於 Lit 元件，Web Test Runner 在真實瀏覽器中執行是唯一可靠的選擇。
    </p>
  </div>
</section>

<section id="web-test-runner-setup">
  <h2>Web Test Runner 環境設定</h2>
  <p>
    <a href="https://modern-web.dev/docs/test-runner/overview/" target="_blank">Web Test Runner</a>
    是 Open Web Components 社群推薦的測試工具，
    直接在真實瀏覽器中執行測試，完整支援 Web Components。
    相較於 Jest + JSDOM，它在真實瀏覽器環境中執行，能正確處理 Shadow DOM 與 Custom Elements。
  </p>

  <h3>安裝相依套件</h3>
  <pre data-lang="bash"><code class="language-bash">npm install --save-dev \\
  @web/test-runner \\
  @web/test-runner-playwright \\
  @web/test-runner-commands \\
  @open-wc/testing \\
  @web/test-runner-coverage-v8 \\
  chai</code></pre>

  <h3>完整的 wtr.config.mjs</h3>
  <pre data-lang="typescript"><code class="language-typescript">// wtr.config.mjs
import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  // 測試檔案 glob
  files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],

  // 使用 esbuild 轉譯 TypeScript
  plugins: [
    esbuildPlugin({
      ts: true,
      // 若有用到裝飾器需啟用
      tsconfig: './tsconfig.json',
    }),
  ],

  // Node.js 模組解析（支援 bare specifiers）
  nodeResolve: true,

  // 並行測試數量（根據 CPU 核心數調整）
  concurrency: 4,

  // 各瀏覽器都要測試（CI 中用 headless 模式）
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],

  // 測試框架設定（Mocha BDD）
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: 8000,
    },
  },

  // 覆蓋率設定
  coverage: true,
  coverageConfig: {
    // 使用 V8 原生覆蓋率（比 Istanbul 更快）
    reporter: ['lcov', 'text', 'html'],
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'node_modules/**'],
    threshold: {
      // 低於此閾值則測試失敗
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },

  // 每次測試前注入全域輔助程式碼（可選）
  // testRunnerHtml: testFramework =&gt; \`
  //   &lt;html&gt;
  //     &lt;head&gt;&lt;/head&gt;
  //     &lt;body&gt;&lt;script type="module" src="\${testFramework}"&gt;&lt;/script&gt;&lt;/body&gt;
  //   &lt;/html&gt;
  // \`,
};</code></pre>

  <h3>package.json 測試腳本</h3>
  <pre data-lang="json"><code class="language-json">{
  "scripts": {
    "test": "web-test-runner --config wtr.config.mjs",
    "test:watch": "web-test-runner --config wtr.config.mjs --watch",
    "test:coverage": "web-test-runner --config wtr.config.mjs --coverage",
    "test:chromium": "web-test-runner --config wtr.config.mjs --browsers chromium",
    "test:ci": "web-test-runner --config wtr.config.mjs --coverage --ci"
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">WTR vs Jest：Web Components 的核心差距</div>
    <p>
      Jest 使用 Node.js + JSDOM，而 WTR 啟動真實瀏覽器程序。
      關鍵差距在於：
    </p>
    <ul>
      <li><strong>Custom Elements Registry</strong>：JSDOM 不完整支援 <code>customElements.define()</code> 的升級流程</li>
      <li><strong>Shadow DOM</strong>：JSDOM 的 Shadow DOM 支援有已知缺陷，<code>slotchange</code> 事件不可靠</li>
      <li><strong>CSS</strong>：JSDOM 無法計算 CSS Custom Properties 的繼承值</li>
      <li><strong>效能</strong>：WTR 的並行多瀏覽器測試在 CI 中比 Jest 的多 worker 模式更快（真實瀏覽器可複用）</li>
    </ul>
  </div>
</section>

<section id="unit-testing-components">
  <h2>元件單元測試</h2>
  <p>
    使用 <code>@open-wc/testing</code> 的 <code>fixture()</code> 函式可以在真實 DOM 中掛載元件，
    每個測試結束後自動清理，確保測試間互相獨立。
  </p>

  <h3>fixture() 與 elementUpdated() 的正確用法</h3>
  <pre data-lang="typescript"><code class="language-typescript">// my-counter.test.ts
import { expect, fixture, html, elementUpdated, oneEvent } from '@open-wc/testing';
import './my-counter.js';
import type { MyCounter } from './my-counter.js';

describe('MyCounter', () =&gt; {
  it('renders with default count of 0', async () =&gt; {
    // fixture() 自動等待 connectedCallback + updateComplete
    const el = await fixture&lt;MyCounter&gt;(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);
    expect(el.count).to.equal(0);
  });

  it('increments count when + button is clicked', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(html\`&lt;my-counter count="5"&gt;&lt;/my-counter&gt;\`);

    const incrementBtn = el.shadowRoot!.querySelector('button[aria-label="增加"]') as HTMLButtonElement;
    incrementBtn.click();

    // elementUpdated() 等待下一次 Lit 更新週期完成
    // 比 el.updateComplete 更語義清晰，且能處理連續更新
    await elementUpdated(el);

    expect(el.count).to.equal(6);
  });

  it('does not exceed max value', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(
      html\`&lt;my-counter count="10" max="10"&gt;&lt;/my-counter&gt;\`
    );

    const incrementBtn = el.shadowRoot!.querySelector('button[aria-label="增加"]') as HTMLButtonElement;
    expect(incrementBtn.disabled).to.be.true;

    incrementBtn.click();
    await elementUpdated(el);
    expect(el.count).to.equal(10);
  });

  it('dispatches count-change event with oneEvent helper', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);

    // oneEvent() 是 Promise-based 的事件等待工具
    // 比手動 addEventListener 更簡潔，且有超時保護（避免測試掛起）
    const eventPromise = oneEvent(el, 'count-change');
    el.shadowRoot!.querySelector&lt;HTMLButtonElement&gt;('button[aria-label="增加"]')!.click();

    const event = await eventPromise as CustomEvent&lt;{ count: number }&gt;;
    expect(event.detail.count).to.equal(1);
  });
});</code></pre>

  <h3>測試 @state 私有屬性</h3>
  <p>
    <code>@state</code> 標記的屬性在 TypeScript 中通常是 <code>private</code>，
    但測試時可透過兩種方式存取：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// my-form.test.ts
import { expect, fixture, html, elementUpdated } from '@open-wc/testing';

describe('MyForm 私有狀態測試', () =&gt; {
  it('shows error state on invalid input', async () =&gt; {
    const el = await fixture(html\`&lt;my-form&gt;&lt;/my-form&gt;\`);

    // 方法 1：透過 (el as any) 存取私有屬性（TypeScript 類型繞過）
    // 適合測試初始狀態
    expect((el as any)._hasError).to.be.false;

    // 方法 2：測試 DOM 反映（更推薦）
    // 測試私有狀態最終呈現在 DOM 上的結果，而非狀態本身
    // 這樣測試更健壯，不受內部實作細節影響
    const errorMsg = el.shadowRoot!.querySelector('.error-message');
    expect(errorMsg).to.be.null;

    // 觸發錯誤狀態
    const submitBtn = el.shadowRoot!.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.click();
    await elementUpdated(el);

    expect(el.shadowRoot!.querySelector('.error-message')).to.not.be.null;
    expect((el as any)._hasError).to.be.true;
  });
});</code></pre>

  <h3>測試 Custom Events 與 Shadow DOM parts</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { expect, fixture, html, oneEvent, elementUpdated } from '@open-wc/testing';

describe('MyDialog Shadow DOM Parts', () =&gt; {
  it('exposes correct CSS parts', async () =&gt; {
    const el = await fixture(html\`&lt;my-dialog open&gt;&lt;/my-dialog&gt;\`);

    // 確認元件有暴露預期的 CSS part
    const dialogPart = el.shadowRoot!.querySelector('[part="dialog"]');
    const headerPart = el.shadowRoot!.querySelector('[part="header"]');
    const bodyPart = el.shadowRoot!.querySelector('[part="body"]');

    expect(dialogPart).to.not.be.null;
    expect(headerPart).to.not.be.null;
    expect(bodyPart).to.not.be.null;
  });

  it('emits close event when backdrop is clicked', async () =&gt; {
    const el = await fixture(html\`&lt;my-dialog open&gt;&lt;/my-dialog&gt;\`);

    const closePromise = oneEvent(el, 'dialog-close');
    const backdrop = el.shadowRoot!.querySelector('[part="backdrop"]') as HTMLElement;
    backdrop.click();

    const event = await closePromise as CustomEvent;
    expect(event.bubbles).to.be.true;
    expect(event.composed).to.be.true; // 必須能穿透 Shadow DOM 邊界
  });
});</code></pre>
</section>

<section id="shadow-dom-querying">
  <h2>Shadow DOM 查詢技巧</h2>
  <p>
    在 Shadow DOM 環境下查詢元素需要一些額外技巧。
    資深工程師需要掌握從基本 shadowRoot 查詢到深層巢狀、Slot 內容以及 CSS Custom Properties 的驗證。
  </p>

  <h3>基本 Shadow DOM 查詢</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 查詢 Shadow Root 內的元素
const button = el.shadowRoot!.querySelector('button');
const inputs = el.shadowRoot!.querySelectorAll('input');

// 使用 @query 裝飾器（在元件內部）
import { query, queryAll } from 'lit/decorators.js';

class MyForm extends LitElement {
  @query('#submit-btn') submitBtn!: HTMLButtonElement;
  @query('input[type="text"]') textInput!: HTMLInputElement;
  @queryAll('.field') fields!: NodeListOf&lt;HTMLElement&gt;;
}</code></pre>

  <h3>queryDeep()：深層巢狀 Shadow DOM 查詢</h3>
  <p>
    當多個 Web Components 相互嵌套時（例如 <code>my-form &gt; my-field-group &gt; my-input</code>），
    需要逐層穿透 Shadow DOM。<code>@open-wc/testing</code> 提供的 <code>queryDeep</code>
    可以自動遞迴查找。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { fixture, html } from '@open-wc/testing';
import { queryDeep } from '@open-wc/testing';

it('can query deeply nested shadow DOM elements', async () =&gt; {
  // 結構：my-form &gt; [shadow] &gt; my-field-group &gt; [shadow] &gt; input
  const el = await fixture(html\`&lt;my-form&gt;&lt;/my-form&gt;\`);

  // queryDeep 自動穿越所有 Shadow DOM 邊界
  const input = queryDeep(el, 'input[name="email"]');
  expect(input).to.not.be.null;
  expect(input).to.be.instanceOf(HTMLInputElement);
});

// 手動實作的遞迴版本（適合需要自訂邏輯的情境）
function deepQueryAll(root: Element | ShadowRoot, selector: string): Element[] {
  const results: Element[] = [...root.querySelectorAll(selector)];

  for (const host of root.querySelectorAll('*')) {
    if (host.shadowRoot) {
      results.push(...deepQueryAll(host.shadowRoot, selector));
    }
  }
  return results;
}</code></pre>

  <h3>測試 Slot（assignedElements）</h3>
  <p>
    測試 slot 內容需要透過 <code>HTMLSlotElement.assignedElements()</code>，
    這是測試 Web Components composition 的關鍵技術。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">it('correctly distributes slotted content', async () =&gt; {
  const el = await fixture(html\`
    &lt;my-card&gt;
      &lt;span slot="title"&gt;測試標題&lt;/span&gt;
      &lt;p&gt;預設 slot 內容&lt;/p&gt;
      &lt;button slot="actions"&gt;確認&lt;/button&gt;
    &lt;/my-card&gt;
  \`);

  // 找到各個 slot 元素
  const titleSlot = el.shadowRoot!.querySelector('slot[name="title"]') as HTMLSlotElement;
  const defaultSlot = el.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement;
  const actionsSlot = el.shadowRoot!.querySelector('slot[name="actions"]') as HTMLSlotElement;

  // assignedElements() 返回分配到此 slot 的元素（不包含後備內容）
  const titleNodes = titleSlot.assignedElements();
  expect(titleNodes).to.have.lengthOf(1);
  expect(titleNodes[0].textContent).to.equal('測試標題');

  const defaultNodes = defaultSlot.assignedElements({ flatten: true });
  expect(defaultNodes).to.have.lengthOf(1);
  expect(defaultNodes[0].tagName).to.equal('P');

  // 驗證後備內容（當 slot 未被填充時）
  const emptyEl = await fixture(html\`&lt;my-card&gt;&lt;/my-card&gt;\`);
  const emptyDefaultSlot = emptyEl.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement;
  expect(emptyDefaultSlot.assignedElements()).to.have.lengthOf(0);
  // 此時應看到後備內容（fallback content）
  const fallback = emptyDefaultSlot.querySelector('.fallback');
  expect(fallback).to.not.be.null;
});</code></pre>

  <h3>測試 CSS Custom Properties</h3>
  <p>
    Web Components 的 CSS Custom Properties（設計 Token）需要在真實瀏覽器中才能正確測試，
    這是 WTR 相對於 JSDOM 的關鍵優勢之一。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">it('respects CSS custom property overrides', async () =&gt; {
  // 注入自訂 CSS 變數來測試主題化
  const el = await fixture(html\`
    &lt;div style="--my-button-bg: #ff0000; --my-button-color: #ffffff;"&gt;
      &lt;my-button&gt;點我&lt;/my-button&gt;
    &lt;/div&gt;
  \`);

  const button = el.querySelector('my-button') as HTMLElement;
  const internalBtn = button.shadowRoot!.querySelector('button')!;

  // getComputedStyle 在真實瀏覽器中才能正確讀取 CSS Custom Properties
  const styles = getComputedStyle(internalBtn);

  // 驗證 CSS 變數值（需在真實瀏覽器環境才能正常運作）
  const bgColor = styles.getPropertyValue('background-color').trim();
  expect(bgColor).to.equal('rgb(255, 0, 0)');
});</code></pre>

  <h3>等待非同步渲染</h3>
  <pre data-lang="typescript"><code class="language-typescript">it('shows data after loading', async () =&gt; {
  const el = await fixture(html\`&lt;async-data-list userId="123"&gt;&lt;/async-data-list&gt;\`);
  await el.updateComplete;

  // 如果元件有非同步資料載入，需要等待額外的更新
  await new Promise(resolve =&gt; {
    const observer = new MutationObserver(() =&gt; {
      if (el.shadowRoot?.querySelector('.data-loaded')) {
        observer.disconnect();
        resolve(undefined);
      }
    });
    observer.observe(el.shadowRoot!, { childList: true, subtree: true });
  });

  const items = el.shadowRoot!.querySelectorAll('.item');
  expect(items.length).to.be.greaterThan(0);
});</code></pre>
</section>

<section id="playwright-e2e">
  <h2>Playwright E2E 測試</h2>
  <p>
    Playwright 是 Web Components E2E 測試的最佳選擇。
    它原生支援 Shadow DOM 穿透（pierce selector），並提供強大的 <code>locator()</code> API
    來定位 Shadow DOM 內部元素。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @playwright/test
npx playwright install</code></pre>

  <h3>page.locator() 與 Web Component 選擇器</h3>
  <pre data-lang="typescript"><code class="language-typescript">// e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () =&gt; {
  test.beforeEach(async ({ page }) =&gt; {
    await page.goto('http://localhost:5173/shop');
  });

  test('can add item to cart', async ({ page }) =&gt; {
    // Playwright 的 locator() 支援鏈式 Shadow DOM 穿透
    // 第一個 locator 找到 Custom Element host
    // 第二個 locator 自動在其 Shadow DOM 內查找
    const addButton = page.locator('product-card').first()
      .locator('button[data-action="add-to-cart"]');

    await addButton.click();

    const cartBadge = page.locator('shopping-cart').locator('.badge');
    await expect(cartBadge).toHaveText('1');
  });

  test('can complete checkout', async ({ page }) =&gt; {
    await page.locator('product-card').first()
      .locator('button[data-action="add-to-cart"]').click();

    await page.locator('shopping-cart button.open-cart').click();

    await page.locator('checkout-form').locator('input[name="email"]')
      .fill('test@example.com');

    await page.locator('checkout-form').locator('button[type="submit"]').click();
    await expect(page.locator('order-confirmation')).toBeVisible();
  });
});</code></pre>

  <h3>pierce: 選擇器語法</h3>
  <p>
    Playwright 提供特殊的 <code>pierce:</code> 選擇器前綴，
    可以強制穿透 Shadow DOM 邊界進行查詢，適合複雜的巢狀場景：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">test('pierce selector for deep shadow DOM', async ({ page }) =&gt; {
  // pierce: 前綴強制穿透所有 Shadow DOM 邊界
  // 適合無法透過鏈式 locator 存取的深層元素
  const deepInput = page.locator('pierce=input[data-testid="deep-input"]');
  await deepInput.fill('測試值');
  await expect(deepInput).toHaveValue('測試值');

  // 結合 CSS selector 進行更精確的查詢
  const shadowButton = page.locator('pierce=button.primary');
  await expect(shadowButton).toBeEnabled();
});</code></pre>

  <h3>測試鍵盤導航</h3>
  <p>
    鍵盤導航測試是 Web Components 可及性（Accessibility）的重要一環，
    需要驗證 Tab 順序、方向鍵操作、Enter/Space 觸發等行為：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">test('keyboard navigation through form fields', async ({ page }) =&gt; {
  await page.goto('http://localhost:5173/form');

  // 點擊第一個輸入框取得焦點
  const firstInput = page.locator('my-form').locator('input').first();
  await firstInput.click();

  // Tab 鍵移到下一個欄位
  await page.keyboard.press('Tab');

  // 驗證焦點移動到 Shadow DOM 內的下一個可聚焦元素
  const secondInput = page.locator('my-form').locator('input').nth(1);
  await expect(secondInput).toBeFocused();

  // 測試 Escape 鍵關閉 Dialog
  await page.locator('my-dialog button.open').click();
  await expect(page.locator('my-dialog [part="overlay"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('my-dialog [part="overlay"]')).toBeHidden();
});

test('arrow key navigation in radio group', async ({ page }) =&gt; {
  await page.goto('http://localhost:5173/radio');

  const radioGroup = page.locator('my-radio-group');

  // Tab 進入 radio group
  await radioGroup.locator('[role="radio"]').first().focus();

  // ArrowDown 應選擇下一個 radio
  await page.keyboard.press('ArrowDown');
  const secondRadio = radioGroup.locator('[role="radio"]').nth(1);
  await expect(secondRadio).toHaveAttribute('aria-checked', 'true');
});</code></pre>
</section>

<section id="ci-integration">
  <h2>CI/CD 整合</h2>
  <p>
    完整的 CI 流水線應包含：單元測試、覆蓋率門檻強制執行、E2E 測試，以及並行執行以縮短等待時間。
  </p>

  <h3>完整 GitHub Actions Workflow</h3>
  <pre data-lang="yaml"><code class="language-yaml"># .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 單元測試 + 覆蓋率（三個瀏覽器並行）
  unit-tests:
    name: Unit Tests (\${{ matrix.browser }})
    runs-on: ubuntu-latest
    strategy:
      # 所有瀏覽器都測，即使某個失敗也繼續其他的
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      # 安裝 Playwright 瀏覽器（WTR Playwright launcher 需要）
      - run: npx playwright install --with-deps \${{ matrix.browser }}
      # 只在 chromium 上執行覆蓋率（避免重複）
      - name: Run tests with coverage (chromium only)
        if: matrix.browser == 'chromium'
        run: npm run test:coverage
      - name: Run tests without coverage (other browsers)
        if: matrix.browser != 'chromium'
        run: npm run test:chromium
        env:
          PLAYWRIGHT_BROWSER: \${{ matrix.browser }}
      # 上傳覆蓋率報告到 Codecov
      - uses: codecov/codecov-action@v4
        if: matrix.browser == 'chromium'
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # 覆蓋率門檻強制執行
  coverage-threshold:
    name: Coverage Threshold Check
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      # --coverage 加上 wtr.config.mjs 中的 threshold 設定
      # 若任何指標低於閾值，此步驟會以非零 exit code 失敗
      - run: npm run test:coverage
        name: Enforce coverage thresholds

  # E2E 測試（需要先 build）
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      # 啟動 preview server 並在背景執行
      - name: Start preview server
        run: npm run preview &amp; npx wait-on http://localhost:4173 --timeout 30000
      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:4173
      # 失敗時上傳截圖和 trace
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/</code></pre>

  <h3>並行測試執行優化</h3>
  <pre data-lang="json"><code class="language-json">{
  "scripts": {
    "test:ci": "web-test-runner --config wtr.config.mjs --coverage --ci",
    "test:parallel": "web-test-runner --config wtr.config.mjs --concurrency 8"
  }
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // 充分利用 CI runner 的 CPU
  workers: process.env.CI ? 4 : '50%',
  // 並行執行測試檔案
  fullyParallel: true,
  // CI 中不重試以節省時間；本地重試一次
  retries: process.env.CI ? 0 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['github'], // GitHub Actions 友好的輸出格式
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // 行動裝置測試
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">加速 CI 的三個關鍵策略</div>
    <ul>
      <li><strong>快取 Playwright 瀏覽器</strong>：在 CI 中快取 <code>~/.cache/ms-playwright</code>，避免每次重新下載</li>
      <li><strong>分離慢速測試</strong>：將 E2E 測試放在獨立 job，讓單元測試先快速回饋</li>
      <li><strong>僅在 chromium 收集覆蓋率</strong>：覆蓋率收集有效能開銷，只需一個瀏覽器即可</li>
    </ul>
  </div>
</section>

<section id="accessibility-testing">
  <h2>Accessibility 自動化測試：axe-core 整合</h2>
  <p>
    可及性（Accessibility, a11y）測試對 Web Components 尤為重要，
    因為 Shadow DOM 邊界會影響 ARIA 屬性的傳遞與螢幕閱讀器的解析。
    <code>axe-core</code> 是業界標準的自動化 a11y 測試引擎，
    能在 WTR 和 Playwright 兩個環境中使用。
  </p>

  <h3>axe-core + @open-wc/testing 整合</h3>
  <pre data-lang="bash"><code class="language-bash">npm install --save-dev axe-core @open-wc/testing</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// my-button.a11y.test.ts
import { expect, fixture, html } from '@open-wc/testing';
// @open-wc/testing 內建 axe-core 整合
// 使用 isAccessible() 或 isInaccessible() 斷言

describe('my-button accessibility', () =&gt; {
  it('passes axe audit in default state', async () =&gt; {
    const el = await fixture(html\`
      &lt;my-button&gt;送出表單&lt;/my-button&gt;
    \`);

    // isAccessible() 使用 axe-core 掃描整個元件（含 Shadow DOM）
    // 如果有 a11y 違規，測試失敗並列出詳細錯誤
    await expect(el).to.be.accessible();
  });

  it('passes axe audit when disabled', async () =&gt; {
    const el = await fixture(html\`
      &lt;my-button disabled&gt;無法點擊&lt;/my-button&gt;
    \`);
    await expect(el).to.be.accessible();
  });

  it('passes axe audit with icon-only button (requires aria-label)', async () =&gt; {
    // 圖示按鈕必須有 aria-label 或 aria-labelledby
    const el = await fixture(html\`
      &lt;my-icon-button aria-label="關閉對話框" icon="close"&gt;&lt;/my-icon-button&gt;
    \`);
    await expect(el).to.be.accessible();
  });

  it('fails without aria-label on icon-only button', async () =&gt; {
    const el = await fixture(html\`
      &lt;my-icon-button icon="close"&gt;&lt;/my-icon-button&gt;
    \`);
    // 預期此案例不通過 axe 審核（button-name 規則）
    await expect(el).not.to.be.accessible();
  });
});</code></pre>

  <h3>@axe-core/playwright：E2E 層級的 a11y 測試</h3>
  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @axe-core/playwright</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('頁面可及性審核', () =&gt; {
  test('首頁通過 WCAG 2.1 AA 標準', async ({ page }) =&gt; {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      // 指定遵循的標準
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // 排除已知的第三方元件問題（謹慎使用）
      .exclude('.third-party-widget')
      .analyze();

    // 如果有違規，輸出詳細資訊
    if (results.violations.length &gt; 0) {
      const violationMessages = results.violations.map(v =&gt;
        \`[\${v.impact}] \${v.id}: \${v.description}\\n\` +
        v.nodes.map(n =&gt; \`  - \${n.html}\`).join('\\n')
      );
      console.log('A11y violations:\\n', violationMessages.join('\\n'));
    }

    expect(results.violations).toHaveLength(0);
  });

  test('表單頁面的 ARIA 標籤完整性', async ({ page }) =&gt; {
    await page.goto('/form');

    const results = await new AxeBuilder({ page })
      // 只檢查 form-related 規則
      .withRules(['label', 'label-content-name-mismatch', 'select-name'])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test('modal dialog 的焦點管理', async ({ page }) =&gt; {
    await page.goto('/');

    // 開啟 Dialog
    await page.locator('button.open-dialog').click();
    await expect(page.locator('my-dialog [part="overlay"]')).toBeVisible();

    // 掃描開啟狀態下的 Dialog
    const dialogResults = await new AxeBuilder({ page })
      .include('my-dialog')
      .analyze();

    expect(dialogResults.violations).toHaveLength(0);

    // 驗證焦點是否正確移入 Dialog（ARIA 最佳實踐）
    const focusedElement = await page.evaluate(() =&gt; {
      const el = document.activeElement;
      // 若焦點在 shadow DOM 內，需用 deepActiveElement
      function deepActiveElement(doc: Document | ShadowRoot): Element | null {
        const active = (doc as Document).activeElement || null;
        if (active?.shadowRoot) return deepActiveElement(active.shadowRoot as unknown as Document);
        return active;
      }
      return deepActiveElement(document)?.tagName;
    });

    // Dialog 開啟後，焦點應移到 Dialog 內的第一個可聚焦元素
    expect(['BUTTON', 'INPUT', 'A']).to.include(focusedElement);
  });
});</code></pre>

  <h3>自動化 ARIA 屬性測試</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 測試 ARIA 屬性的正確設定
describe('my-accordion ARIA attributes', () =&gt; {
  it('correctly manages expanded/collapsed ARIA states', async () =&gt; {
    const el = await fixture(html\`
      &lt;my-accordion&gt;
        &lt;my-accordion-item&gt;
          &lt;span slot="header"&gt;區塊一&lt;/span&gt;
          &lt;p&gt;內容&lt;/p&gt;
        &lt;/my-accordion-item&gt;
      &lt;/my-accordion&gt;
    \`);

    const item = el.querySelector('my-accordion-item')!;
    const trigger = item.shadowRoot!.querySelector('[role="button"]')!;
    const panel = item.shadowRoot!.querySelector('[role="region"]')!;

    // 初始狀態：收起
    expect(trigger.getAttribute('aria-expanded')).to.equal('false');
    expect(panel.getAttribute('aria-hidden')).to.equal('true');
    // trigger 的 aria-controls 應指向 panel 的 id
    const panelId = panel.id;
    expect(trigger.getAttribute('aria-controls')).to.equal(panelId);

    // 展開後
    (trigger as HTMLElement).click();
    await elementUpdated(item);

    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
    expect(panel.getAttribute('aria-hidden')).to.equal('false');
  });
});</code></pre>
</section>

<section id="visual-regression">
  <h2>視覺回歸測試：Percy、Chromatic、Playwright Screenshots</h2>
  <p>
    視覺回歸測試（Visual Regression Testing）確保 UI 元件的外觀不會因程式碼變更而意外改變。
    對於 Web Components 的 Design System，這是保障視覺一致性的關鍵。
    三種主流方案各有優缺點，適合不同的使用場景。
  </p>

  <table>
    <thead>
      <tr>
        <th>方案</th>
        <th>適合場景</th>
        <th>優點</th>
        <th>缺點</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Playwright Screenshots</td>
        <td>自行管理基準線</td>
        <td>免費、整合緊密、可離線</td>
        <td>需手動管理基準圖片、跨平台差異</td>
      </tr>
      <tr>
        <td>Percy（BrowserStack）</td>
        <td>大型團隊、多瀏覽器</td>
        <td>雲端比對、跨瀏覽器</td>
        <td>付費、需網路、CI 速度較慢</td>
      </tr>
      <tr>
        <td>Chromatic（Storybook）</td>
        <td>已有 Storybook 的團隊</td>
        <td>與 Storybook 深度整合、UI Review</td>
        <td>綁定 Storybook、付費</td>
      </tr>
    </tbody>
  </table>

  <h3>Playwright 截圖比對</h3>
  <p>
    Playwright 內建截圖比對功能，首次執行時生成基準圖片，後續執行時與基準比較。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('視覺回歸測試', () =&gt; {
  test('my-button 各狀態截圖', async ({ page }) =&gt; {
    await page.goto('/storybook-static/iframe.html?id=components-button--default');

    // 等待元件完全渲染
    await page.locator('my-button').waitFor();

    // 截取整個頁面（全頁截圖）
    await expect(page).toHaveScreenshot('button-default.png', {
      // 允許 1% 的像素差異（抗 font rendering 差異）
      maxDiffPixelRatio: 0.01,
    });
  });

  test('my-button hover 狀態', async ({ page }) =&gt; {
    await page.goto('/components/button');

    const button = page.locator('my-button').first();

    // hover 狀態截圖
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');

    // focus 狀態截圖
    await button.focus();
    await expect(button).toHaveScreenshot('button-focus.png');
  });

  test('my-card dark mode', async ({ page }) =&gt; {
    // 切換到 dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/components/card');

    await expect(page.locator('my-card').first())
      .toHaveScreenshot('card-dark.png', {
        // 元件截圖（裁切到元件邊界）
        clip: undefined, // 使用元件本身的邊界框
      });
  });
});</code></pre>

  <h3>Storybook + Chromatic 設定</h3>
  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @storybook/web-components-vite chromatic
npx storybook init</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// src/stories/my-button.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../components/my-button.js';

const meta: Meta = {
  title: 'Components/MyButton',
  component: 'my-button',
  // Chromatic 截圖設定
  parameters: {
    // 指定截圖的等待條件（元件動畫完成後）
    chromatic: {
      delay: 300, // 等待 CSS transition 完成
      // 為每個 story 截取不同的視口大小
      viewports: [375, 768, 1280],
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html\`&lt;my-button&gt;預設按鈕&lt;/my-button&gt;\`,
};

export const Variants: Story = {
  render: () => html\`
    &lt;div style="display: flex; gap: 8px; flex-wrap: wrap;"&gt;
      &lt;my-button variant="primary"&gt;主要&lt;/my-button&gt;
      &lt;my-button variant="secondary"&gt;次要&lt;/my-button&gt;
      &lt;my-button variant="danger"&gt;危險&lt;/my-button&gt;
      &lt;my-button disabled&gt;停用&lt;/my-button&gt;
    &lt;/div&gt;
  \`,
  // 這個 story 一次截取多個變體
  parameters: {
    chromatic: { delay: 0 },
  },
};</code></pre>

  <pre data-lang="yaml"><code class="language-yaml"># .github/workflows/chromatic.yml
name: Chromatic Visual Testing

on: [push]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Chromatic 需要完整的 git history
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true # PR 中有視覺變更時不 fail CI，等人工審核
          autoAcceptChanges: main # main branch 自動接受變更</code></pre>

  <h3>截圖策略建議</h3>
  <div class="callout callout-tip">
    <div class="callout-title">視覺測試的最佳實踐</div>
    <ul>
      <li>
        <strong>固定字型與動畫</strong>：截圖前注入 CSS 停用所有動畫（<code>* { animation: none !important; transition: none !important; }</code>），避免時機差異造成的假失敗。
      </li>
      <li>
        <strong>隔離測試環境</strong>：每個視覺測試應在固定的視口大小、固定的字型載入狀態下執行。
      </li>
      <li>
        <strong>只測試視覺關鍵路徑</strong>：不需要對每個元件的每個狀態截圖，聚焦在高風險的視覺元素（如色彩、間距、排版）。
      </li>
      <li>
        <strong>基準圖片版本控制</strong>：Playwright 基準圖片應提交到 git，但建議使用 git-lfs 管理大型二進位檔案。
      </li>
    </ul>
  </div>
</section>

<section id="component-contract-testing">
  <h2>元件契約測試：API 穩定性保障</h2>
  <p>
    元件契約測試（Component Contract Testing）是 Design System 團隊維護 API 穩定性的關鍵實踐。
    它明確定義元件的「公開契約」：Properties、Attributes、Events、Slots、CSS Parts、CSS Custom Properties，
    並確保每次程式碼變更都不會無聲地破壞這個契約。
  </p>

  <div class="callout callout-info">
    <div class="callout-title">什麼是元件公開契約？</div>
    <p>
      Web Component 的公開 API 由以下五個維度構成：
    </p>
    <ul>
      <li><strong>Properties / Attributes</strong>：可由外部設定的輸入</li>
      <li><strong>Events</strong>：元件向外發出的訊號</li>
      <li><strong>Slots</strong>：允許外部注入的內容點</li>
      <li><strong>CSS Parts（<code>::part()</code>）</strong>：允許外部樣式化的內部元素</li>
      <li><strong>CSS Custom Properties</strong>：設計 Token 接口</li>
    </ul>
    <p>任何對以上 API 的破壞性變更都應該觸發 Major Version 升級（Semver）。</p>
  </div>

  <h3>驗證公開 Properties 與 Attributes</h3>
  <pre data-lang="typescript"><code class="language-typescript">// my-button.contract.test.ts
import { expect, fixture, html, elementUpdated } from '@open-wc/testing';
import type { MyButton } from './my-button.js';

describe('my-button 公開 API 契約', () =&gt; {
  // === Properties 契約 ===
  describe('properties', () =&gt; {
    it('exposes "variant" property with default value "primary"', async () =&gt; {
      const el = await fixture&lt;MyButton&gt;(html\`&lt;my-button&gt;&lt;/my-button&gt;\`);
      // 驗證預設值存在且型別正確
      expect(el.variant).to.be.a('string');
      expect(el.variant).to.equal('primary');
    });

    it('accepts all documented variant values', async () =&gt; {
      const validVariants = ['primary', 'secondary', 'danger', 'ghost'];

      for (const variant of validVariants) {
        const el = await fixture&lt;MyButton&gt;(
          html\`&lt;my-button variant=\${variant}&gt;Test&lt;/my-button&gt;\`
        );
        // 驗證 property 被正確設定
        expect(el.variant).to.equal(variant);
        // 驗證對應的 DOM 狀態（attribute reflection）
        expect(el.getAttribute('variant')).to.equal(variant);
      }
    });

    it('reflects "disabled" property to attribute', async () =&gt; {
      const el = await fixture&lt;MyButton&gt;(html\`&lt;my-button&gt;&lt;/my-button&gt;\`);

      el.disabled = true;
      await elementUpdated(el);

      // disabled 屬性應反映到 HTML attribute
      expect(el.hasAttribute('disabled')).to.be.true;
      // 內部 button 也應該是 disabled
      expect(el.shadowRoot!.querySelector('button')!.disabled).to.be.true;
    });
  });

  // === Events 契約 ===
  describe('events', () =&gt; {
    it('dispatches "click" event that bubbles and is composed', async () =&gt; {
      const el = await fixture&lt;MyButton&gt;(html\`&lt;my-button&gt;點擊&lt;/my-button&gt;\`);

      let capturedEvent: Event | null = null;
      // 在 Shadow DOM 外部監聽（驗證 composed: true）
      el.addEventListener('click', (e) =&gt; { capturedEvent = e; });

      el.shadowRoot!.querySelector('button')!.click();

      expect(capturedEvent).to.not.be.null;
      expect(capturedEvent!.bubbles).to.be.true;
      expect(capturedEvent!.composed).to.be.true;
    });

    it('does NOT dispatch click when disabled', async () =&gt; {
      const el = await fixture&lt;MyButton&gt;(
        html\`&lt;my-button disabled&gt;點擊&lt;/my-button&gt;\`
      );

      let clicked = false;
      el.addEventListener('click', () =&gt; { clicked = true; });
      el.shadowRoot!.querySelector('button')!.click();

      expect(clicked).to.be.false;
    });
  });

  // === Slots 契約 ===
  describe('slots', () =&gt; {
    it('provides default slot for button label', async () =&gt; {
      const el = await fixture(html\`
        &lt;my-button&gt;&lt;span class="label"&gt;標籤文字&lt;/span&gt;&lt;/my-button&gt;
      \`);

      const defaultSlot = el.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement;
      expect(defaultSlot).to.not.be.null;

      const assigned = defaultSlot.assignedElements();
      expect(assigned).to.have.lengthOf(1);
      expect(assigned[0].className).to.equal('label');
    });

    it('provides "prefix" named slot for leading icon', async () =&gt; {
      const el = await fixture(html\`
        &lt;my-button&gt;
          &lt;svg slot="prefix" aria-hidden="true"&gt;&lt;/svg&gt;
          送出
        &lt;/my-button&gt;
      \`);

      const prefixSlot = el.shadowRoot!.querySelector('slot[name="prefix"]') as HTMLSlotElement;
      expect(prefixSlot).to.not.be.null;
      expect(prefixSlot.assignedElements()).to.have.lengthOf(1);
    });
  });

  // === CSS Parts 契約 ===
  describe('CSS parts', () =&gt; {
    it('exposes "base" part for the internal button element', async () =&gt; {
      const el = await fixture(html\`&lt;my-button&gt;Test&lt;/my-button&gt;\`);

      const basePart = el.shadowRoot!.querySelector('[part~="base"]');
      expect(basePart).to.not.be.null;
      expect(basePart!.tagName.toLowerCase()).to.equal('button');
    });

    it('exposes "label" part for the text container', async () =&gt; {
      const el = await fixture(html\`&lt;my-button&gt;Test&lt;/my-button&gt;\`);
      const labelPart = el.shadowRoot!.querySelector('[part~="label"]');
      expect(labelPart).to.not.be.null;
    });
  });
});</code></pre>

  <h3>破壞性變更偵測</h3>
  <p>
    透過 <code>@custom-elements-manifest/analyzer</code> 生成 Custom Elements Manifest（CEM），
    並在 CI 中比較 manifest 的差異，可以自動偵測 API 破壞性變更：
  </p>
  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @custom-elements-manifest/analyzer</code></pre>

  <pre data-lang="json"><code class="language-json">{
  "scripts": {
    "analyze": "cem analyze --litelement --globs 'src/**/*.ts'",
    "analyze:check": "cem analyze --litelement --globs 'src/**/*.ts' && node scripts/check-cem-diff.js"
  }
}</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// scripts/check-cem-diff.ts
// 比較新舊 Custom Elements Manifest，偵測破壞性變更
import { readFileSync } from 'fs';

interface CEMDeclaration {
  name: string;
  kind: string;
  members?: Array&lt;{ name: string; kind: string; privacy?: string }&gt;;
  events?: Array&lt;{ name: string }&gt;;
  slots?: Array&lt;{ name: string }&gt;;
  cssParts?: Array&lt;{ name: string }&gt;;
  cssProperties?: Array&lt;{ name: string }&gt;;
}

function detectBreakingChanges(oldCEM: any, newCEM: any): string[] {
  const breakingChanges: string[] = [];

  for (const module of oldCEM.modules || []) {
    for (const decl of (module.declarations || []) as CEMDeclaration[]) {
      if (decl.kind !== 'class') continue;

      const newDecl = findDeclaration(newCEM, decl.name);
      if (!newDecl) {
        breakingChanges.push(\`破壞性變更：元件 \${decl.name} 被移除\`);
        continue;
      }

      // 檢查 public members
      for (const member of decl.members || []) {
        if (member.privacy === 'private') continue;
        const stillExists = newDecl.members?.some(m =&gt; m.name === member.name);
        if (!stillExists) {
          breakingChanges.push(\`破壞性變更：\${decl.name}.\${member.name} 被移除\`);
        }
      }

      // 檢查 events
      for (const event of decl.events || []) {
        const stillExists = newDecl.events?.some(e =&gt; e.name === event.name);
        if (!stillExists) {
          breakingChanges.push(\`破壞性變更：\${decl.name} 的 \${event.name} 事件被移除\`);
        }
      }

      // 檢查 CSS parts
      for (const part of decl.cssParts || []) {
        const stillExists = newDecl.cssParts?.some(p =&gt; p.name === part.name);
        if (!stillExists) {
          breakingChanges.push(\`破壞性變更：\${decl.name} 的 CSS part "\${part.name}" 被移除\`);
        }
      }
    }
  }

  return breakingChanges;
}

function findDeclaration(cem: any, name: string): CEMDeclaration | undefined {
  for (const module of cem.modules || []) {
    const found = (module.declarations || []).find((d: CEMDeclaration) =&gt; d.name === name);
    if (found) return found;
  }
  return undefined;
}

const oldCEM = JSON.parse(readFileSync('custom-elements.baseline.json', 'utf-8'));
const newCEM = JSON.parse(readFileSync('custom-elements.json', 'utf-8'));

const changes = detectBreakingChanges(oldCEM, newCEM);
if (changes.length &gt; 0) {
  console.error('偵測到破壞性 API 變更：');
  changes.forEach(c =&gt; console.error(' -', c));
  process.exit(1); // CI 失敗
} else {
  console.log('✓ 未偵測到破壞性變更');
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">契約測試的維護成本</div>
    <p>
      契約測試需要團隊紀律才能發揮效用。建議：
    </p>
    <ul>
      <li>將 contract tests 與元件的 changelog 連結，每次 major 版本更新時更新契約</li>
      <li>在 PR 模板中加入「是否有 API 破壞性變更」的檢查清單</li>
      <li>使用 CEM analyzer 的 baseline 機制，而非手動維護期望值</li>
    </ul>
  </div>
</section>
`,
};
