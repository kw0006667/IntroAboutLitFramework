const t={id:21,slug:"chapter-21",title:"Lit 生態全景：Labs、工具鏈與社群",part:6,intro:"@lit-labs 的各項實驗性套件（Task、Motion、Virtualizer 等），以及 Open Web Components 社群資源。",sections:[{slug:"lit-labs-overview",title:"@lit-labs 套件總覽"},{slug:"task-package",title:"@lit-labs/task 非同步任務"},{slug:"motion-package",title:"@lit-labs/motion 動畫"},{slug:"virtualizer",title:"@lit-labs/virtualizer 虛擬滾動"},{slug:"open-wc",title:"Open Web Components 社群資源"},{slug:"toolchain-ecosystem",title:"工具鏈生態系統"}],content:`
<section id="lit-labs-overview">
  <h2>@lit-labs 套件總覽</h2>
  <p>
    <code>@lit-labs</code> 是 Lit 官方的實驗性套件命名空間。
    這些套件處於「孵化」狀態：功能完整但 API 可能在正式版中改變。
    使用時需要了解這個風險。
  </p>

  <h3>穩定的實驗性套件</h3>
  <table>
    <thead>
      <tr><th>套件</th><th>功能</th><th>穩定度</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>@lit-labs/task</code></td>
        <td>非同步任務管理（載入狀態、錯誤處理）</td>
        <td>高</td>
      </tr>
      <tr>
        <td><code>@lit-labs/motion</code></td>
        <td>FLIP 動畫、元素轉場</td>
        <td>中</td>
      </tr>
      <tr>
        <td><code>@lit-labs/virtualizer</code></td>
        <td>虛擬滾動（大量列表效能）</td>
        <td>中</td>
      </tr>
      <tr>
        <td><code>@lit-labs/react</code></td>
        <td>React Wrapper 生成器</td>
        <td>高（現已移至 <code>@lit/react</code>）</td>
      </tr>
      <tr>
        <td><code>@lit-labs/ssr</code></td>
        <td>Server-Side Rendering</td>
        <td>中（積極開發中）</td>
      </tr>
      <tr>
        <td><code>@lit-labs/context</code></td>
        <td>Context API</td>
        <td>高（現已移至 <code>@lit/context</code>）</td>
      </tr>
      <tr>
        <td><code>@lit-labs/signals</code></td>
        <td>TC39 Signals 整合</td>
        <td>低（早期實驗）</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="task-package">
  <h2>@lit-labs/task 非同步任務</h2>
  <p>
    <code>@lit-labs/task</code>（已穩定為 <code>@lit/task</code>）
    提供了優雅的非同步任務管理，處理載入狀態、錯誤狀態和資料更新。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit/task</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">import { Task } from '@lit/task';

@customElement('user-profile')
class UserProfile extends LitElement {
  @property({ type: String }) userId = '';

  // Task：自動管理非同步請求的狀態
  private _userTask = new Task(this, {
    // task 函數：返回 Promise
    task: async ([userId]: [string]) =&gt; {
      if (!userId) throw new Error('需要 userId');
      const response = await fetch(\`/api/users/\${userId}\`);
      if (!response.ok) throw new Error(\`HTTP 錯誤：\${response.status}\`);
      return response.json() as Promise&lt;User&gt;;
    },
    // args：當這些值改變時，自動重新執行 task
    args: () =&gt; [this.userId],
  });

  render() {
    return this._userTask.render({
      // 初始狀態（args 尚未提供）
      initial: () =&gt; html\`&lt;p&gt;請提供使用者 ID&lt;/p&gt;\`,
      // 待處理狀態
      pending: () =&gt; html\`
        &lt;div class="loading"&gt;
          &lt;loading-spinner&gt;&lt;/loading-spinner&gt;
          &lt;p&gt;載入使用者資料...&lt;/p&gt;
        &lt;/div&gt;
      \`,
      // 成功狀態
      complete: (user) =&gt; html\`
        &lt;div class="profile"&gt;
          &lt;img src=\${user.avatar} alt=\${user.name}&gt;
          &lt;h2&gt;\${user.name}&lt;/h2&gt;
          &lt;p&gt;\${user.bio}&lt;/p&gt;
        &lt;/div&gt;
      \`,
      // 錯誤狀態
      error: (err) =&gt; html\`
        &lt;div class="error"&gt;
          &lt;p&gt;載入失敗：\${(err as Error).message}&lt;/p&gt;
          &lt;button @click=\${() =&gt; this._userTask.run()}&gt;重試&lt;/button&gt;
        &lt;/div&gt;
      \`,
    });
  }
}

// 更複雜的場景：手動觸發、帶參數
@customElement('search-results')
class SearchResults extends LitElement {
  @state() private _query = '';

  private _searchTask = new Task(this, {
    task: async ([query]: [string], { signal }) =&gt; {
      // AbortController signal：元件卸載或任務重新執行時自動取消
      const response = await fetch(\`/api/search?q=\${query}\`, { signal });
      return response.json();
    },
    args: () =&gt; [this._query],
    autoRun: false, // 不自動執行
  });

  render() {
    return html\`
      &lt;input
        @input=\${(e: InputEvent) =&gt; {
          this._query = (e.target as HTMLInputElement).value;
        }}
        placeholder="搜尋..."
      &gt;
      &lt;button @click=\${() =&gt; this._searchTask.run()}&gt;搜尋&lt;/button&gt;

      \${this._searchTask.render({
        pending: () =&gt; html\`&lt;p&gt;搜尋中...&lt;/p&gt;\`,
        complete: (results) =&gt; html\`
          &lt;ul&gt;\${results.map((r: any) =&gt; html\`&lt;li&gt;\${r.title}&lt;/li&gt;\`)}&lt;/ul&gt;
        \`,
        error: (e) =&gt; html\`&lt;p&gt;錯誤：\${(e as Error).message}&lt;/p&gt;\`,
      })}
    \`;
  }
}</code></pre>
</section>

<section id="motion-package">
  <h2>@lit-labs/motion 動畫</h2>
  <p>
    <code>@lit-labs/motion</code> 提供了基於 FLIP 技術（First, Last, Invert, Play）的動畫系統，
    讓 DOM 位置或大小的過渡自然流暢。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit-labs/motion</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">import { animate } from '@lit-labs/motion';

@customElement('animated-list')
class AnimatedList extends LitElement {
  @state() private _items = ['A', 'B', 'C', 'D', 'E'];

  private _shuffle() {
    this._items = [...this._items].sort(() =&gt; Math.random() - 0.5);
  }

  render() {
    return html\`
      &lt;button @click=\${this._shuffle}&gt;隨機排序&lt;/button&gt;
      &lt;ul&gt;
        \${this._items.map(item =&gt; html\`
          &lt;li
            \${animate()}  &lt;!-- animate directive：自動 FLIP 動畫 --&gt;
          &gt;
            \${item}
          &lt;/li&gt;
        \`)}
      &lt;/ul&gt;
    \`;
  }
}

// animate() 的選項
animate({
  keyframeOptions: {
    duration: 300,
    easing: 'ease-in-out',
    fill: 'both',
  },
  // 元素進入時的動畫
  in: [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'scale(1)' }],
  // 元素離開時的動畫
  out: [{ opacity: 1 }, { opacity: 0 }],
})</code></pre>
</section>

<section id="virtualizer">
  <h2>@lit-labs/virtualizer 虛擬滾動</h2>
  <p>
    當列表有數千個項目時，同時渲染所有 DOM 節點會嚴重影響效能。
    <code>@lit-labs/virtualizer</code> 只渲染視口中可見的項目，
    其他項目的 DOM 節點不存在（或被回收）。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit-labs/virtualizer</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">import { virtualize } from '@lit-labs/virtualizer/virtualize.js';
import '@lit-labs/virtualizer'; // 或直接使用 &lt;lit-virtualizer&gt; 元素

@customElement('large-list')
class LargeList extends LitElement {
  @property({ type: Array }) items: Item[] = [];

  render() {
    return html\`
      &lt;!-- 方式一：使用 lit-virtualizer 元素 --&gt;
      &lt;lit-virtualizer
        .items=\${this.items}
        .renderItem=\${(item: Item) =&gt; html\`
          &lt;div class="item"&gt;
            &lt;strong&gt;\${item.name}&lt;/strong&gt;
            &lt;span&gt;\${item.description}&lt;/span&gt;
          &lt;/div&gt;
        \`}
        style="height: 600px; overflow: auto;"
      &gt;&lt;/lit-virtualizer&gt;

      &lt;!-- 方式二：使用 virtualize directive --&gt;
      &lt;div style="height: 600px; overflow: auto;"&gt;
        \${virtualize({
          items: this.items,
          renderItem: (item: Item, i: number) =&gt; html\`
            &lt;div class="item \${i % 2 ? 'even' : 'odd'}"&gt;\${item.name}&lt;/div&gt;
          \`,
        })}
      &lt;/div&gt;
    \`;
  }
}

// 效能比較：
// 10,000 項目，不使用虛擬滾動：~3 秒初始渲染，~50MB 記憶體
// 10,000 項目，使用虛擬滾動：&lt;100ms 初始渲染，~5MB 記憶體</code></pre>
</section>

<section id="open-wc">
  <h2>Open Web Components 社群資源</h2>
  <p>
    Open Web Components（open-wc.org）是圍繞 Web Components 的重要社群，
    提供工具、最佳實踐和測試框架。
  </p>

  <h3>核心工具</h3>
  <ul>
    <li>
      <strong><code>@open-wc/testing</code></strong>：
      Web Components 測試工具，包含 <code>fixture()</code> 工具函數
    </li>
    <li>
      <strong><code>@web/test-runner</code></strong>：
      在真實瀏覽器中執行測試
    </li>
    <li>
      <strong><code>@web/dev-server</code></strong>：
      無構建步驟的開發伺服器（用於傳統 Web Components 開發）
    </li>
    <li>
      <strong><code>@web/rollup-plugin-html</code></strong>：
      HTML 入口點的 Rollup 插件
    </li>
  </ul>

  <h3>創建新的 Web Components 專案</h3>
  <pre data-lang="bash"><code class="language-bash"># 使用 Open WC 腳手架建立新專案
npm init @open-wc

# 互動式選單：選擇應用/元件、TypeScript、測試框架等</code></pre>
</section>

<section id="toolchain-ecosystem">
  <h2>工具鏈生態系統</h2>

  <h3>構建工具</h3>
  <ul>
    <li>
      <strong>Vite</strong>（推薦）：快速的 HMR、ES Modules 原生支援、簡單配置
    </li>
    <li>
      <strong>Rollup</strong>：適合 Library 發布，Tree-shaking 最佳
    </li>
    <li>
      <strong>esbuild</strong>：極快的轉譯器，通常作為 Vite 和 Rollup 的後端
    </li>
  </ul>

  <h3>TypeScript 工具</h3>
  <ul>
    <li>
      <strong>Custom Elements Manifest（CEM）</strong>：
      <code>@custom-elements-manifest/analyzer</code> 自動生成元件 API 文件
    </li>
    <li>
      <strong>lit-plugin</strong>（VS Code）：
      模板語法高亮、型別檢查、自動補全
    </li>
  </ul>

  <h3>生成 Custom Elements Manifest</h3>
  <pre data-lang="json"><code class="language-json">// package.json
{
  "scripts": {
    "analyze": "cem analyze --globs src/**/*.ts"
  },
  "devDependencies": {
    "@custom-elements-manifest/analyzer": "^0.9.0"
  },
  "customElements": "custom-elements.json"
}</code></pre>
  <pre data-lang="bash"><code class="language-bash">npm run analyze
# 生成 custom-elements.json，包含所有元件的 API 文件
# Storybook、IDE、文件工具都可以使用這個文件</code></pre>
</section>
`};export{t as default};
