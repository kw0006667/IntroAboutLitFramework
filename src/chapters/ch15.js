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
  ],
  content: `
<section id="testing-philosophy">
  <h2>測試哲學與策略</h2>
  <p>
    測試 Web Components 與測試 React 元件有幾個關鍵差異：
    Shadow DOM 需要特殊的查詢方式，Custom Events 需要正確監聽，
    非同步更新需要等待 <code>updateComplete</code>。
  </p>

  <h3>測試金字塔</h3>
  <ul>
    <li>
      <strong>單元測試（70%）</strong>：測試個別元件的行為
      — 屬性更新、事件發送、條件渲染
    </li>
    <li>
      <strong>整合測試（20%）</strong>：測試元件組合
      — 父子元件互動、Context 傳遞
    </li>
    <li>
      <strong>E2E 測試（10%）</strong>：測試完整使用者流程
      — 使用 Playwright 在真實瀏覽器中執行
    </li>
  </ul>
</section>

<section id="web-test-runner-setup">
  <h2>Web Test Runner 環境設定</h2>
  <p>
    <a href="https://modern-web.dev/docs/test-runner/overview/" target="_blank">Web Test Runner</a>
    是 Open Web Components 社群推薦的測試工具，
    直接在真實瀏覽器中執行測試，完整支援 Web Components。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @web/test-runner @open-wc/testing chai</code></pre>

  <pre data-lang="javascript"><code class="language-javascript">// web-test-runner.config.js
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: 5000,
    },
  },
};</code></pre>

  <pre data-lang="json"><code class="language-json">// package.json scripts
{
  "scripts": {
    "test": "web-test-runner",
    "test:watch": "web-test-runner --watch",
    "test:coverage": "web-test-runner --coverage"
  }
}</code></pre>
</section>

<section id="unit-testing-components">
  <h2>元件單元測試</h2>

  <pre data-lang="typescript"><code class="language-typescript">// my-counter.test.ts
import { expect, fixture, html } from '@open-wc/testing';
import './my-counter.js';
import type { MyCounter } from './my-counter.js';

describe('MyCounter', () =&gt; {
  it('renders with default count of 0', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);

    // 等待 Lit 完成渲染（fixture 已自動等待，但顯式等待更安全）
    await el.updateComplete;

    expect(el.count).to.equal(0);
  });

  it('increments count when + button is clicked', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(html\`&lt;my-counter count="5"&gt;&lt;/my-counter&gt;\`);

    // 查詢 Shadow DOM 內的按鈕
    const incrementBtn = el.shadowRoot!.querySelector('button[aria-label="增加"]') as HTMLButtonElement;
    incrementBtn.click();

    await el.updateComplete;

    expect(el.count).to.equal(6);
  });

  it('does not exceed max value', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(
      html\`&lt;my-counter count="10" max="10"&gt;&lt;/my-counter&gt;\`
    );

    const incrementBtn = el.shadowRoot!.querySelector('button[aria-label="增加"]') as HTMLButtonElement;
    expect(incrementBtn.disabled).to.be.true;

    incrementBtn.click();
    await el.updateComplete;

    expect(el.count).to.equal(10); // 沒有改變
  });

  it('dispatches count-change event', async () =&gt; {
    const el = await fixture&lt;MyCounter&gt;(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);

    let eventDetail: { count: number } | null = null;
    el.addEventListener('count-change', (e: Event) =&gt; {
      eventDetail = (e as CustomEvent).detail;
    });

    el.shadowRoot!.querySelector&lt;HTMLButtonElement&gt;('button[aria-label="增加"]')!.click();
    await el.updateComplete;

    expect(eventDetail).to.deep.equal({ count: 1 });
  });
});</code></pre>
</section>

<section id="shadow-dom-querying">
  <h2>Shadow DOM 查詢技巧</h2>
  <p>
    在 Shadow DOM 環境下查詢元素需要一些額外技巧：
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

  <h3>穿越多層 Shadow DOM</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 如果元件有巢狀 Web Components，需要逐層穿越
const el = await fixture(html\`&lt;my-form&gt;&lt;/my-form&gt;\`);

// 第一層 Shadow DOM
const fieldGroup = el.shadowRoot!.querySelector('my-field-group');
// 第二層 Shadow DOM
const input = fieldGroup?.shadowRoot?.querySelector('input');

// 或使用工具函數
function deepQuery(root: Element | ShadowRoot, selector: string): Element | null {
  const el = root.querySelector(selector);
  if (el) return el;

  // 遍歷所有 shadow hosts
  const shadowHosts = root.querySelectorAll('*');
  for (const host of shadowHosts) {
    if (host.shadowRoot) {
      const found = deepQuery(host.shadowRoot, selector);
      if (found) return found;
    }
  }
  return null;
}</code></pre>

  <h3>等待非同步渲染</h3>
  <pre data-lang="typescript"><code class="language-typescript">it('shows data after loading', async () =&gt; {
  const el = await fixture(html\`&lt;async-data-list userId="123"&gt;&lt;/async-data-list&gt;\`);

  // 等待初始渲染
  await el.updateComplete;

  // 如果元件有非同步資料載入，需要等待額外的更新
  // 方法一：等待特定 DOM 元素出現
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
    Playwright 支援 Shadow DOM 查詢，是 Web Components E2E 測試的最佳選擇。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @playwright/test</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () =&gt; {
  test.beforeEach(async ({ page }) =&gt; {
    await page.goto('http://localhost:5173/shop');
  });

  test('can add item to cart', async ({ page }) =&gt; {
    // Playwright 支援 CSS :host 和 Shadow DOM 穿透
    // 使用 >> 符號穿透 Shadow DOM（Playwright 舊語法）
    // 使用 locator() 的新語法更推薦
    const addButton = page.locator('product-card').first()
      .locator('button[data-action="add-to-cart"]');

    await addButton.click();

    // 驗證購物車圖示更新
    const cartBadge = page.locator('shopping-cart').locator('.badge');
    await expect(cartBadge).toHaveText('1');
  });

  test('can complete checkout', async ({ page }) =&gt; {
    // 1. 加入商品
    await page.locator('product-card').first()
      .locator('button[data-action="add-to-cart"]').click();

    // 2. 開啟購物車
    await page.locator('shopping-cart button.open-cart').click();

    // 3. 填寫結帳表單
    await page.locator('checkout-form').locator('input[name="email"]')
      .fill('test@example.com');

    // 4. 提交
    await page.locator('checkout-form').locator('button[type="submit"]').click();

    // 5. 驗證成功頁面
    await expect(page.locator('order-confirmation')).toBeVisible();
  });
});</code></pre>

  <h3>Playwright 的 Shadow DOM 支援</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Playwright 自動穿透 Shadow DOM
// 大多數 locator 方法都能找到 Shadow DOM 內的元素

// ✓ 這會找到所有 Shadow DOM 中的按鈕
const buttons = page.locator('button');

// ✓ 這也能找到 Shadow DOM 內的元素
await page.getByRole('button', { name: '提交' }).click();
await page.getByText('成功').waitFor();</code></pre>
</section>

<section id="ci-integration">
  <h2>CI/CD 整合</h2>
  <pre data-lang="yaml"><code class="language-yaml"># .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/</code></pre>
</section>
`,
};
