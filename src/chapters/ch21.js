export default {
  id: 21,
  slug: 'chapter-21',
  title: 'Lit 生態全景：Labs、工具鏈與社群',
  part: 6,
  intro: '@lit-labs 的各項實驗性套件（Task、Motion、Virtualizer 等），以及 Open Web Components 社群資源。',
  sections: [
    { slug: 'lit-labs-overview', title: '@lit-labs 套件總覽' },
    { slug: 'task-package', title: '@lit-labs/task 非同步任務' },
    { slug: 'motion-package', title: '@lit-labs/motion 動畫' },
    { slug: 'virtualizer', title: '@lit-labs/virtualizer 虛擬滾動' },
    { slug: 'open-wc', title: 'Open Web Components 社群資源' },
    { slug: 'toolchain-ecosystem', title: '工具鏈生態系統' },
    { slug: 'custom-elements-manifest', title: 'Custom Elements Manifest：自動化 API 文件生成' },
    { slug: 'eslint-lit-rules', title: 'ESLint for Lit：靜態分析與程式碼規範' },
    { slug: 'lit-localize', title: '@lit/localize：國際化與多語言支援' },
  ],
  content: `
<section id="lit-labs-overview">
  <h2>@lit-labs 套件總覽</h2>
  <p>
    <code>@lit-labs</code> 是 Lit 官方的實驗性套件命名空間。
    這些套件處於「孵化」狀態：功能完整但 API 可能在正式版中改變。
    部分套件在成熟後會升級到 <code>@lit/</code> 命名空間（例如 <code>@lit/task</code>、<code>@lit/context</code>、<code>@lit/react</code>），
    代表它們已進入穩定維護周期。
  </p>

  <div class="callout callout-info">
    <div class="callout-title">命名空間策略</div>
    <p>
      <code>@lit-labs/*</code> 代表實驗性、API 可能破壞性變更的套件。
      <code>@lit/*</code> 代表已穩定、語義版本化（semver）的套件。
      在生產環境中，優先使用 <code>@lit/*</code> 套件；
      <code>@lit-labs/*</code> 適合用於探索和非關鍵路徑的功能。
    </p>
  </div>

  <h3>完整套件清單與狀態</h3>
  <table>
    <thead>
      <tr><th>套件</th><th>功能</th><th>狀態</th><th>週下載量（約）</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>@lit/task</code>（原 @lit-labs/task）</td>
        <td>非同步任務管理（載入/錯誤狀態）</td>
        <td>✅ 穩定（已升級）</td>
        <td>~80,000</td>
      </tr>
      <tr>
        <td><code>@lit/context</code>（原 @lit-labs/context）</td>
        <td>Context API，跨元件共享狀態</td>
        <td>✅ 穩定（已升級）</td>
        <td>~70,000</td>
      </tr>
      <tr>
        <td><code>@lit/react</code>（原 @lit-labs/react）</td>
        <td>React Wrapper 生成器</td>
        <td>✅ 穩定（已升級）</td>
        <td>~120,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/motion</code></td>
        <td>FLIP 動畫、元素轉場</td>
        <td>🔶 Preview</td>
        <td>~15,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/virtualizer</code></td>
        <td>虛擬滾動（大量列表效能）</td>
        <td>🔶 Preview</td>
        <td>~25,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/observers</code></td>
        <td>ResizeObserver、IntersectionObserver、MutationObserver 的 Reactive Controller 封裝</td>
        <td>🔶 Preview</td>
        <td>~30,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/ssr</code></td>
        <td>Node.js Server-Side Rendering</td>
        <td>🔶 Preview（積極開發）</td>
        <td>~18,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/router</code></td>
        <td>用於 SPA 的客戶端路由</td>
        <td>🔶 Preview</td>
        <td>~10,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/eleventy-plugin-lit-ssr</code></td>
        <td>Eleventy 靜態網站生成器的 Lit SSR 插件</td>
        <td>🔶 Preview</td>
        <td>~2,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/scoped-registry-mixin</code></td>
        <td>Custom Elements Registry 作用域隔離（解決元件名稱衝突）</td>
        <td>🔶 Preview</td>
        <td>~8,000</td>
      </tr>
      <tr>
        <td><code>@lit-labs/signals</code></td>
        <td>TC39 Signals Proposal 早期整合</td>
        <td>🧪 Experimental</td>
        <td>~5,000</td>
      </tr>
    </tbody>
  </table>

  <h3>套件成熟度決策框架</h3>
  <p>資深工程師在選用 <code>@lit-labs</code> 套件時，應考慮以下維度：</p>
  <ul>
    <li><strong>破壞性變更風險</strong>：查看 CHANGELOG 和 GitHub Issues 中 <code>breaking-change</code> 標籤的頻率</li>
    <li><strong>開發活躍度</strong>：最近三個月是否有 commit；issues 回應速度</li>
    <li><strong>替代方案</strong>：如果套件被廢棄，遷移到其他方案的成本</li>
    <li><strong>使用者基數</strong>：npm 週下載量越高，被廢棄的可能性越低</li>
  </ul>

  <div class="callout callout-warning">
    <div class="callout-title">@lit-labs/signals 的使用建議</div>
    <p>
      <code>@lit-labs/signals</code> 目前依賴於 TC39 Signals Proposal 的 polyfill（<code>signal-polyfill</code>），
      而該提案仍在 Stage 1。這意味著 API 隨時可能改變。
      建議只在 PoC 或技術評估專案中使用，不要用於生產程式碼。
    </p>
  </div>
</section>

<section id="task-package">
  <h2>@lit-labs/task 非同步任務</h2>
  <p>
    <code>@lit/task</code>（已從 <code>@lit-labs/task</code> 升級）
    提供了優雅的非同步任務管理，完整處理載入狀態、錯誤狀態、取消（AbortSignal）和重試邏輯。
    它是 Lit 生態中最成熟、應用最廣的 Reactive Controller。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit/task</code></pre>

  <h3>TaskStatus 的四種狀態</h3>
  <p>
    Task 的核心是一個狀態機，包含四個明確的狀態：
  </p>
  <table>
    <thead>
      <tr><th>狀態</th><th>TaskStatus 常數</th><th>觸發時機</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>初始</td>
        <td><code>TaskStatus.INITIAL</code></td>
        <td>Task 建立後、尚未執行（通常 args 尚未提供）</td>
      </tr>
      <tr>
        <td>待處理</td>
        <td><code>TaskStatus.PENDING</code></td>
        <td>async 函數正在執行中</td>
      </tr>
      <tr>
        <td>完成</td>
        <td><code>TaskStatus.COMPLETE</code></td>
        <td>async 函數成功 resolve</td>
      </tr>
      <tr>
        <td>錯誤</td>
        <td><code>TaskStatus.ERROR</code></td>
        <td>async 函數 reject 或拋出例外</td>
      </tr>
    </tbody>
  </table>

  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Task, TaskStatus } from '@lit/task';

interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

@customElement('user-profile')
class UserProfile extends LitElement {
  @property({ type: String }) userId = '';

  // 完整的 Task 設定，展示所有狀態
  private _userTask = new Task(this, {
    // task 函數接收 args 陣列和 { signal } 物件
    task: async ([userId]: [string], { signal }) =&gt; {
      if (!userId) throw new Error('需要 userId');

      const response = await fetch(\`/api/users/\${userId}\`, { signal });
      if (!response.ok) {
        throw new Error(\`HTTP 錯誤：\${response.status} \${response.statusText}\`);
      }
      return response.json() as Promise&lt;User&gt;;
    },
    // args 是一個函數，返回依賴值的陣列
    // 當任何依賴值改變時，task 自動重新執行
    args: () =&gt; [this.userId],
    // autoRun: true（預設）：args 改變時自動執行
    // autoRun: false：只能手動呼叫 task.run()
    autoRun: true,
    // onComplete/onError 鉤子（Task v1.1+）
    onComplete: (user) =&gt; console.log('載入完成：', user.name),
    onError: (err) =&gt; console.error('載入失敗：', err),
  });

  render() {
    // 方式一：使用 render() 方法（推薦，涵蓋所有狀態）
    return this._userTask.render({
      initial: () =&gt; html\`&lt;p class="hint"&gt;請提供使用者 ID&lt;/p&gt;\`,
      pending: () =&gt; html\`
        &lt;div class="loading" aria-live="polite"&gt;
          &lt;div class="spinner"&gt;&lt;/div&gt;
          &lt;p&gt;載入使用者資料...&lt;/p&gt;
        &lt;/div&gt;
      \`,
      complete: (user) =&gt; html\`
        &lt;div class="profile"&gt;
          &lt;img src=\${user.avatar} alt=\${user.name} width="80" height="80"&gt;
          &lt;h2&gt;\${user.name}&lt;/h2&gt;
          &lt;p&gt;\${user.bio}&lt;/p&gt;
          &lt;button @click=\${() =&gt; this._userTask.run()}&gt;重新整理&lt;/button&gt;
        &lt;/div&gt;
      \`,
      error: (err) =&gt; html\`
        &lt;div class="error" role="alert"&gt;
          &lt;p&gt;載入失敗：\${(err as Error).message}&lt;/p&gt;
          &lt;button @click=\${() =&gt; this._userTask.run()}&gt;重試&lt;/button&gt;
        &lt;/div&gt;
      \`,
    });
  }
}

// 方式二：直接讀取 task.status 和 task.value（更靈活）
@customElement('user-badge')
class UserBadge extends LitElement {
  private _task = new Task(this, {
    task: async ([id]: [string]) =&gt; fetchUser(id),
    args: () =&gt; [this.userId],
  });

  @property({ type: String }) userId = '';

  render() {
    // 可以在模板的任何位置讀取狀態
    const isPending = this._task.status === TaskStatus.PENDING;
    const user = this._task.value; // 最後一次成功的值

    return html\`
      &lt;div class=\${isPending ? 'loading' : ''}&gt;
        &lt;span&gt;\${user?.name ?? '...'}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>手動執行（autoRun: false）與帶參數執行</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('search-results')
class SearchResults extends LitElement {
  @state() private _query = '';

  private _searchTask = new Task(this, {
    task: async ([query]: [string], { signal }) =&gt; {
      if (!query.trim()) return [];
      // AbortController signal：元件卸載或任務重新執行時自動取消前一個請求
      const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, { signal });
      return response.json() as Promise&lt;SearchResult[]&gt;;
    },
    args: () =&gt; [this._query],
    autoRun: false, // 不自動執行，等待使用者操作
  });

  render() {
    return html\`
      &lt;div class="search-bar"&gt;
        &lt;input
          type="search"
          .value=\${this._query}
          @input=\${(e: InputEvent) =&gt; {
            this._query = (e.target as HTMLInputElement).value;
          }}
          placeholder="輸入搜尋關鍵字..."
        &gt;
        &lt;button
          @click=\${() =&gt; this._searchTask.run()}
          ?disabled=\${this._searchTask.status === TaskStatus.PENDING}
        &gt;
          \${this._searchTask.status === TaskStatus.PENDING ? '搜尋中...' : '搜尋'}
        &lt;/button&gt;
      &lt;/div&gt;

      \${this._searchTask.render({
        pending: () =&gt; html\`&lt;p&gt;搜尋中...&lt;/p&gt;\`,
        complete: (results) =&gt; results.length === 0
          ? html\`&lt;p&gt;找不到相關結果&lt;/p&gt;\`
          : html\`
            &lt;ul&gt;
              \${results.map(r =&gt; html\`
                &lt;li&gt;
                  &lt;a href=\${r.url}&gt;\${r.title}&lt;/a&gt;
                  &lt;p&gt;\${r.snippet}&lt;/p&gt;
                &lt;/li&gt;
              \`)}
            &lt;/ul&gt;
          \`,
        error: (e) =&gt; html\`&lt;p class="error"&gt;搜尋失敗：\${(e as Error).message}&lt;/p&gt;\`,
      })}
    \`;
  }
}</code></pre>

  <h3>Task 鏈式執行（依賴另一個 Task 的結果）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 場景：先載入使用者，再根據使用者的 teamId 載入團隊資料
@customElement('user-team-view')
class UserTeamView extends LitElement {
  @property({ type: String }) userId = '';

  // Task 1：載入使用者
  private _userTask = new Task(this, {
    task: async ([id]: [string]) =&gt; fetchUser(id),
    args: () =&gt; [this.userId],
  });

  // Task 2：依賴 Task 1 的結果
  // 透過在 args 中讀取 _userTask.value 建立依賴鏈
  private _teamTask = new Task(this, {
    task: async ([teamId]: [string | undefined]) =&gt; {
      if (!teamId) throw new Error('使用者尚未載入');
      return fetchTeam(teamId);
    },
    args: () =&gt; [this._userTask.value?.teamId],
    // 只有在 userTask 完成後才執行
    autoRun: true,
  });

  render() {
    // 當 _userTask 的結果改變（userId 改變），
    // _teamTask 的 args 也會改變，自動觸發重新執行
    return html\`
      &lt;div class="layout"&gt;
        &lt;aside&gt;
          \${this._userTask.render({
            pending: () =&gt; html\`&lt;p&gt;載入使用者...&lt;/p&gt;\`,
            complete: (u) =&gt; html\`&lt;h3&gt;\${u.name}&lt;/h3&gt;\`,
            error: (e) =&gt; html\`&lt;p&gt;錯誤：\${e}&lt;/p&gt;\`,
          })}
        &lt;/aside&gt;
        &lt;main&gt;
          \${this._teamTask.render({
            initial: () =&gt; html\`&lt;p&gt;等待使用者資料...&lt;/p&gt;\`,
            pending: () =&gt; html\`&lt;p&gt;載入團隊資料...&lt;/p&gt;\`,
            complete: (team) =&gt; html\`&lt;h2&gt;\${team.name}&lt;/h2&gt;\`,
            error: (e) =&gt; html\`&lt;p&gt;錯誤：\${e}&lt;/p&gt;\`,
          })}
        &lt;/main&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>手動取消與防抖（Debounce）模式</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 實作 debounced search：使用者停止輸入後才發送請求
@customElement('debounced-search')
class DebouncedSearch extends LitElement {
  @state() private _inputValue = '';
  @state() private _debouncedQuery = '';
  private _debounceTimer?: ReturnType&lt;typeof setTimeout&gt;;

  private _searchTask = new Task(this, {
    task: async ([query]: [string], { signal }) =&gt; {
      if (!query) return [];
      const res = await fetch(\`/api/search?q=\${query}\`, { signal });
      return res.json();
    },
    args: () =&gt; [this._debouncedQuery],
    autoRun: true,
  });

  private _onInput(e: InputEvent) {
    this._inputValue = (e.target as HTMLInputElement).value;
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() =&gt; {
      // 300ms 後才更新 _debouncedQuery，觸發 task 執行
      // 如果 task 正在執行，AbortSignal 會取消前一個請求
      this._debouncedQuery = this._inputValue;
    }, 300);
  }

  render() {
    return html\`
      &lt;input @input=\${this._onInput} .value=\${this._inputValue}&gt;
      \${this._searchTask.render({
        pending: () =&gt; html\`&lt;p&gt;搜尋中...&lt;/p&gt;\`,
        complete: (results) =&gt; html\`&lt;p&gt;找到 \${results.length} 筆結果&lt;/p&gt;\`,
        error: (e) =&gt; html\`&lt;p&gt;錯誤&lt;/p&gt;\`,
      })}
    \`;
  }
}</code></pre>
</section>

<section id="motion-package">
  <h2>@lit-labs/motion 動畫</h2>
  <p>
    <code>@lit-labs/motion</code> 提供了基於 FLIP 技術（First, Last, Invert, Play）的動畫系統。
    FLIP 技術的核心思想是：記錄元素動畫<em>前</em>的位置（First），
    讓 DOM 更新後記錄<em>後</em>的位置（Last），
    再<em>反轉</em>（Invert）讓它回到初始位置，
    最後<em>播放</em>（Play）動畫讓它滑向最終位置。
    這樣瀏覽器只需處理 transform，效能極佳。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit-labs/motion</code></pre>

  <h3>基礎 FLIP 動畫：列表重新排序</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from '@lit-labs/motion';

@customElement('animated-list')
class AnimatedList extends LitElement {
  static styles = css\`
    ul { list-style: none; padding: 0; }
    li {
      padding: 12px 16px;
      background: #f0f4ff;
      border-radius: 8px;
      margin: 4px 0;
      cursor: pointer;
      user-select: none;
    }
  \`;

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
            \${animate({
              keyframeOptions: {
                duration: 400,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'both',
              },
            })}
          &gt;
            \${item}
          &lt;/li&gt;
        \`)}
      &lt;/ul&gt;
    \`;
  }
}</code></pre>

  <h3>進場（Enter）與離場（Leave）動畫</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { animate } from '@lit-labs/motion';

@customElement('notification-list')
class NotificationList extends LitElement {
  @state() private _notifications: Notification[] = [];

  private _addNotification(msg: string) {
    this._notifications = [
      { id: Date.now(), message: msg },
      ...this._notifications,
    ];
  }

  private _removeNotification(id: number) {
    this._notifications = this._notifications.filter(n =&gt; n.id !== id);
  }

  render() {
    return html\`
      &lt;button @click=\${() =&gt; this._addNotification('新通知 ' + Date.now())}&gt;
        新增通知
      &lt;/button&gt;
      &lt;div class="notifications"&gt;
        \${this._notifications.map(n =&gt; html\`
          &lt;div
            class="notification"
            \${animate({
              // 進場動畫：從透明+向右平移 滑入
              in: [
                { opacity: 0, transform: 'translateX(100%)' },
                { opacity: 1, transform: 'translateX(0)' },
              ],
              // 離場動畫：淡出+縮小
              out: [
                { opacity: 1, transform: 'scale(1)', maxHeight: '60px' },
                { opacity: 0, transform: 'scale(0.8)', maxHeight: '0px' },
              ],
              keyframeOptions: {
                duration: 300,
                easing: 'ease-out',
                fill: 'both',
              },
            })}
          &gt;
            \${n.message}
            &lt;button @click=\${() =&gt; this._removeNotification(n.id)}&gt;✕&lt;/button&gt;
          &lt;/div&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>交錯動畫（Stagger）：依序出現的列表項目</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { animate, options as motionOptions } from '@lit-labs/motion';

@customElement('stagger-list')
class StaggerList extends LitElement {
  @state() private _items = Array.from({ length: 8 }, (_, i) =&gt; \`項目 \${i + 1}\`);
  @state() private _visible = false;

  private _show() { this._visible = true; }
  private _hide() { this._visible = false; }

  render() {
    return html\`
      &lt;button @click=\${this._show}&gt;顯示列表&lt;/button&gt;
      &lt;button @click=\${this._hide}&gt;隱藏列表&lt;/button&gt;
      &lt;ul&gt;
        \${this._visible ? this._items.map((item, index) =&gt; html\`
          &lt;li
            \${animate({
              in: [
                { opacity: 0, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              out: [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-20px)' },
              ],
              keyframeOptions: {
                duration: 400,
                // 關鍵：delay 根據 index 遞增，實現交錯效果
                delay: index * 60,
                easing: 'ease-out',
                fill: 'both',
              },
            })}
          &gt;\${item}&lt;/li&gt;
        \`) : nothing}
      &lt;/ul&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">FLIP 動畫的效能優勢</div>
    <p>
      FLIP 動畫只使用 <code>transform</code> 和 <code>opacity</code> 屬性，
      這兩個屬性不會觸發 Layout 或 Paint，只在合成（Composite）步驟執行，
      可以在 GPU 上處理。這使得即使在低端裝置上，動畫也能保持 60fps。
      避免在 <code>animate()</code> 中改變 <code>width</code>、<code>height</code>、
      <code>top</code>、<code>left</code> 等會觸發 Layout 的屬性。
    </p>
  </div>
</section>

<section id="virtualizer">
  <h2>@lit-labs/virtualizer 虛擬滾動</h2>
  <p>
    當列表有數千個項目時，同時渲染所有 DOM 節點會嚴重影響效能。
    <code>@lit-labs/virtualizer</code> 只渲染視口中可見的項目（加上緩衝區），
    其他項目的 DOM 節點不存在或被回收再利用。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit-labs/virtualizer</code></pre>

  <h3>效能比較</h3>
  <table>
    <thead>
      <tr><th>指標</th><th>不使用虛擬滾動（10,000 項）</th><th>使用虛擬滾動（10,000 項）</th></tr>
    </thead>
    <tbody>
      <tr><td>初始渲染時間</td><td>~3,000ms</td><td>&lt;100ms</td></tr>
      <tr><td>記憶體使用</td><td>~50MB DOM 節點</td><td>~5MB（只有可見項目）</td></tr>
      <tr><td>滾動 FPS</td><td>15-30 fps（卡頓）</td><td>55-60 fps</td></tr>
      <tr><td>DOM 節點數</td><td>10,000+</td><td>約 20-40（視口高度決定）</td></tr>
    </tbody>
  </table>

  <h3>方式一：使用 &lt;lit-virtualizer&gt; 元素</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lit-labs/virtualizer'; // 引入元素定義

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

@customElement('product-list')
class ProductList extends LitElement {
  static styles = css\`
    lit-virtualizer {
      height: 600px;
      overflow: auto;
      contain: strict; /* 重要：隔離渲染上下文，提升效能 */
    }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      /* 重要：固定高度讓 virtualizer 能準確計算位置 */
      height: 60px;
      box-sizing: border-box;
    }
  \`;

  @property({ type: Array }) items: Product[] = [];

  render() {
    return html\`
      &lt;lit-virtualizer
        .items=\${this.items}
        .renderItem=\${(item: Product, index: number) =&gt; html\`
          &lt;div class="item" data-index=\${index}&gt;
            &lt;span&gt;\${item.name}&lt;/span&gt;
            &lt;span&gt;NT$\${item.price.toLocaleString()}&lt;/span&gt;
          &lt;/div&gt;
        \`}
      &gt;&lt;/lit-virtualizer&gt;
    \`;
  }
}</code></pre>

  <h3>方式二：使用 virtualize directive（用於現有 scrollable 容器）</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

@customElement('data-grid')
class DataGrid extends LitElement {
  @property({ type: Array }) rows: DataRow[] = [];

  render() {
    return html\`
      &lt;div class="grid-container" style="height: 500px; overflow: auto;"&gt;
        \${virtualize({
          items: this.rows,
          renderItem: (row: DataRow, index: number) =&gt; html\`
            &lt;div class="row \${index % 2 === 0 ? 'even' : 'odd'}"&gt;
              &lt;span&gt;\${row.id}&lt;/span&gt;
              &lt;span&gt;\${row.name}&lt;/span&gt;
              &lt;span&gt;\${row.status}&lt;/span&gt;
            &lt;/div&gt;
          \`,
        })}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>Layout 選項：Flow vs Grid</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitVirtualizer } from '@lit-labs/virtualizer';
import { grid } from '@lit-labs/virtualizer/layouts/grid.js';
import { flow } from '@lit-labs/virtualizer/layouts/flow.js';

// Grid 佈局：顯示圖片牆
@customElement('photo-gallery')
class PhotoGallery extends LitElement {
  @property({ type: Array }) photos: Photo[] = [];

  render() {
    return html\`
      &lt;lit-virtualizer
        .items=\${this.photos}
        .layout=\${grid({
          itemSize: { width: 200, height: 200 },
          gap: 8,
          justify: 'start',
        })}
        .renderItem=\${(photo: Photo) =&gt; html\`
          &lt;div class="photo-card"&gt;
            &lt;img src=\${photo.thumbnail} alt=\${photo.title} loading="lazy"&gt;
            &lt;p&gt;\${photo.title}&lt;/p&gt;
          &lt;/div&gt;
        \`}
        style="height: 800px; overflow: auto;"
      &gt;&lt;/lit-virtualizer&gt;
    \`;
  }
}

// 捲動到特定項目
@customElement('jump-to-item')
class JumpToItem extends LitElement {
  private _virtualizerRef = createRef&lt;LitVirtualizer&gt;();

  private _jumpToIndex(index: number) {
    this._virtualizerRef.value?.scrollToIndex(index, {
      behavior: 'smooth',
      block: 'start',
    });
  }

  render() {
    return html\`
      &lt;button @click=\${() =&gt; this._jumpToIndex(500)}&gt;跳到第 500 項&lt;/button&gt;
      &lt;lit-virtualizer
        \${ref(this._virtualizerRef)}
        .items=\${this.items}
        .renderItem=\${(item: Item) =&gt; html\`&lt;div&gt;\${item.name}&lt;/div&gt;\`}
        style="height: 600px; overflow: auto;"
      &gt;&lt;/lit-virtualizer&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">virtualizer 的已知限制</div>
    <p>
      <code>@lit-labs/virtualizer</code> 目前對可變高度項目的支援有限；
      若列表項目高度差異很大，可能導致滾動位置計算不準確。
      固定高度項目可獲得最佳效能和準確度。
      另外，<code>lit-virtualizer</code> 內部使用 <code>ResizeObserver</code> 監聽容器大小，
      必須確保容器有明確的高度（<code>height: Npx</code> 或 <code>height: 100vh</code>），
      否則 virtualizer 無法正常運作。
    </p>
  </div>
</section>

<section id="open-wc">
  <h2>Open Web Components 社群資源</h2>
  <p>
    Open Web Components（<a href="https://open-wc.org" target="_blank" rel="noopener">open-wc.org</a>）
    是圍繞 Web Components 的重要社群，
    提供一套完整的工具鏈、最佳實踐和設定預設（opinionated defaults）。
    它的目標是讓開發者不需要從頭設定測試、Linting、Storybook 等環境。
  </p>

  <h3>使用腳手架建立新專案</h3>
  <pre data-lang="bash"><code class="language-bash"># 互動式腳手架：引導你選擇所有設定
npm init @open-wc

# 選項包括：
# - 建立應用（Application）或元件庫（Web Component）
# - TypeScript 支援
# - 測試（@web/test-runner + @open-wc/testing）
# - 展示（Storybook）
# - Linting（ESLint + Prettier）
# - Demo（demo/index.html）
#
# 建立完成後的專案結構：
# my-element/
# ├── src/
# │   └── MyElement.ts
# ├── test/
# │   └── my-element.test.ts
# ├── stories/
# │   └── my-element.stories.ts
# ├── .eslintrc.js
# ├── web-test-runner.config.mjs
# ├── tsconfig.json
# └── package.json</code></pre>

  <h3>@web/test-runner：在真實瀏覽器中測試</h3>
  <pre data-lang="typescript"><code class="language-typescript">// test/my-button.test.ts
import { html, fixture, expect, aTimeout } from '@open-wc/testing';
import type { MyButton } from '../src/MyButton.js';
import '../src/MyButton.js';

describe('MyButton', () =&gt; {
  it('渲染預設狀態', async () =&gt; {
    const el = await fixture&lt;MyButton&gt;(html\`&lt;my-button&gt;點擊&lt;/my-button&gt;\`);
    expect(el).to.exist;
    expect(el.shadowRoot).to.exist;

    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.textContent?.trim()).to.equal('點擊');
  });

  it('disabled 屬性正確傳遞', async () =&gt; {
    const el = await fixture&lt;MyButton&gt;(html\`&lt;my-button disabled&gt;停用&lt;/my-button&gt;\`);
    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.disabled).to.be.true;
  });

  it('點擊觸發 custom event', async () =&gt; {
    const el = await fixture&lt;MyButton&gt;(html\`&lt;my-button&gt;點擊&lt;/my-button&gt;\`);

    let eventFired = false;
    el.addEventListener('my-button-click', () =&gt; { eventFired = true; });

    const button = el.shadowRoot!.querySelector('button')!;
    button.click();

    expect(eventFired).to.be.true;
  });

  it('符合可存取性標準（a11y）', async () =&gt; {
    const el = await fixture&lt;MyButton&gt;(html\`
      &lt;my-button aria-label="儲存"&gt;💾&lt;/my-button&gt;
    \`);
    // @open-wc/testing 內建 axe-core 自動化 a11y 檢查
    await expect(el).to.be.accessible();
  });
});
</code></pre>

  <h3>web-test-runner.config.mjs：設定真實瀏覽器測試</h3>
  <pre data-lang="typescript"><code class="language-typescript">// web-test-runner.config.mjs
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'test/**/*.test.ts',
  nodeResolve: true,
  // 在多個真實瀏覽器中執行測試
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }), // Safari
  ],
  // TypeScript 轉譯
  plugins: [
    // @web/dev-server-esbuild 用於 TypeScript 轉譯
  ],
};
</code></pre>

  <h3>ESLint 設定（open-wc 預設）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// .eslintrc.cjs
module.exports = {
  extends: [
    '@open-wc',          // open-wc 的 ESLint 基礎規則
    '@open-wc/eslint-config', // Web Components 特定規則
  ],
  rules: {
    // 根據團隊需求調整
    'no-unused-vars': 'error',
    'import/no-unresolved': 'error',
  },
};
</code></pre>

  <h3>Storybook 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">// stories/my-button.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../src/my-button.js';

const meta: Meta = {
  title: 'Components/MyButton',
  component: 'my-button',
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};
export default meta;

type Story = StoryObj;

export const Primary: Story = {
  render: (args) =&gt; html\`
    &lt;my-button
      ?disabled=\${args.disabled}
      variant=\${args.variant}
    &gt;\${args.label}&lt;/my-button&gt;
  \`,
  args: {
    label: '點擊我',
    disabled: false,
    variant: 'primary',
  },
};
</code></pre>
</section>

<section id="toolchain-ecosystem">
  <h2>工具鏈生態系統</h2>

  <h3>@web/dev-server：零構建的開發環境</h3>
  <p>
    <code>@web/dev-server</code> 是 open-wc 生態的開發伺服器，
    支援 ES Modules 原生解析（node_modules 路徑轉換），
    不需要 Webpack 或 Vite 即可開發 Web Components。
  </p>
  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @web/dev-server @web/dev-server-hmr</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// web-dev-server.config.mjs
import { hmrPlugin, presets } from '@web/dev-server-hmr';

export default {
  port: 3000,
  open: true,
  watch: true,
  nodeResolve: true, // 解析 node_modules 中的 ES modules
  plugins: [
    // HMR（Hot Module Replacement）：修改原始碼後即時更新，不重整頁面
    hmrPlugin({
      exclude: ['**/node_modules/**'],
      presets: [presets.litElement],
    }),
  ],
};
</code></pre>

  <h3>Lit Library 打包工具比較</h3>
  <table>
    <thead>
      <tr><th>工具</th><th>適合場景</th><th>優勢</th><th>劣勢</th><th>輸出格式</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Rollup</strong></td>
        <td>發布 npm 套件庫</td>
        <td>最佳 Tree-shaking；輸出乾淨；支援多種格式</td>
        <td>設定複雜；速度較慢</td>
        <td>ESM、CJS、UMD、IIFE</td>
      </tr>
      <tr>
        <td><strong>esbuild</strong></td>
        <td>快速打包；CI/CD</td>
        <td>極快（Go 編寫）；API 簡單</td>
        <td>Tree-shaking 較弱；外掛生態較少</td>
        <td>ESM、CJS、IIFE</td>
      </tr>
      <tr>
        <td><strong>tsup</strong>（基於 esbuild）</td>
        <td>TypeScript 套件庫發布</td>
        <td>零設定；自動生成 .d.ts；速度快</td>
        <td>彈性較低</td>
        <td>ESM、CJS，自動 .d.ts</td>
      </tr>
      <tr>
        <td><strong>Vite</strong></td>
        <td>應用程式；設計系統 Demo</td>
        <td>最佳 DX；HMR 快；外掛豐富</td>
        <td>Library 模式的 CSS 處理較複雜</td>
        <td>ESM、UMD（library mode）</td>
      </tr>
    </tbody>
  </table>

  <h3>推薦的 Lit Library 發布設定（tsup）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],          // Web Components 主要用 ESM
  dts: true,                // 生成 TypeScript 宣告檔
  sourcemap: true,
  clean: true,
  external: ['lit'],        // 重要：不要把 lit 打包進去！
  // Lit 的 CSS 模板會被轉換成 CSSResult，
  // 確保不要把這些 CSS 當作外部資源提取
  injectStyle: false,
});
</code></pre>

  <pre data-lang="json"><code class="language-json">// package.json - 正確的 exports 設定
{
  "name": "my-lit-library",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "lit": "^3.0.0"
  },
  "customElements": "custom-elements.json"
}</code></pre>

  <h3>lit-analyzer：IDE 靜態分析</h3>
  <p>
    <code>lit-analyzer</code>（也稱 <code>ts-lit-plugin</code>）
    為 Lit 的 HTML 模板提供 TypeScript 語言服務：
    語法高亮、型別檢查、屬性/事件的自動補全、未知元素警告。
  </p>
  <pre data-lang="bash"><code class="language-bash"># VS Code 安裝 lit-plugin 擴充套件
# 搜尋："lit-plugin" by runem

# 或使用命令列進行型別檢查
npm install --save-dev lit-analyzer
npx lit-analyzer src/**/*.ts</code></pre>

  <pre data-lang="json"><code class="language-json">// tsconfig.json - 啟用 lit-plugin
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-lit-plugin",
        "rules": {
          "no-unknown-tag-name": "error",
          "no-missing-import": "error",
          "no-unclosed-tag": "error",
          "no-unknown-attribute": "warn",
          "no-unknown-property": "warn",
          "no-unknown-event": "warn",
          "no-invalid-boolean-binding": "error"
        }
      }
    ]
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">IntelliJ / WebStorm 的 Lit 支援</div>
    <p>
      IntelliJ 系列 IDE 從 2023.2 版起內建了 Lit 模板的語法支援（HTML 高亮和基礎補全）。
      若需要完整的型別檢查，需搭配 <code>custom-elements.json</code>（CEM）和
      WebStorm 的「Web Types」機制。
      在 <code>package.json</code> 中加入 <code>"customElements": "custom-elements.json"</code>，
      IntelliJ 會自動讀取並提供元件屬性的補全。
    </p>
  </div>
</section>

<section id="custom-elements-manifest">
  <h2>Custom Elements Manifest：自動化 API 文件生成</h2>
  <p>
    Custom Elements Manifest（CEM）是一個 JSON 格式的規格，
    用於描述 Web Components 的 API：屬性（attributes/properties）、
    事件（events）、插槽（slots）、CSS 自訂屬性（CSS custom properties）、
    CSS Parts 等。
    許多工具（Storybook、IDE、文件網站）都能讀取 CEM 自動生成 UI。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install --save-dev @custom-elements-manifest/analyzer

# 分析所有 TypeScript 原始碼，生成 custom-elements.json
npx cem analyze --globs "src/**/*.ts" --outdir .

# 或加入 package.json scripts
# "analyze": "cem analyze --globs \"src/**/*.ts\""</code></pre>

  <h3>JSDoc 標註：提供豐富的 API 描述</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * 一個可自訂的按鈕元件，支援多種視覺變體。
 *
 * @element my-button
 *
 * @fires my-button-click - 使用者點擊按鈕時觸發（不含 disabled 狀態）
 *   detail: { originalEvent: MouseEvent }
 *
 * @fires my-button-focus - 按鈕獲得焦點時觸發
 *
 * @slot - 按鈕的主要內容（文字或圖示）
 * @slot icon-start - 按鈕左側的圖示插槽
 * @slot icon-end - 按鈕右側的圖示插槽
 *
 * @csspart button - 內部的原生 &lt;button&gt; 元素
 * @csspart label - 包裹插槽內容的 &lt;span&gt;
 *
 * @cssproperty --my-button-bg - 按鈕背景色（預設：#0070f3）
 * @cssproperty --my-button-color - 按鈕文字色（預設：#ffffff）
 * @cssproperty --my-button-radius - 按鈕圓角（預設：6px）
 * @cssproperty --my-button-padding - 內距（預設：8px 16px）
 */
@customElement('my-button')
export class MyButton extends LitElement {
  static styles = css\`
    :host {
      display: inline-block;
    }
    button {
      background: var(--my-button-bg, #0070f3);
      color: var(--my-button-color, #fff);
      border: none;
      border-radius: var(--my-button-radius, 6px);
      padding: var(--my-button-padding, 8px 16px);
      cursor: pointer;
      font-size: 14px;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  \`;

  /**
   * 按鈕的視覺變體。
   * @type {"primary" | "secondary" | "danger"}
   * @default "primary"
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'danger' = 'primary';

  /**
   * 停用按鈕，阻止使用者互動。
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  private _onClick(e: MouseEvent) {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent('my-button-click', {
      detail: { originalEvent: e },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html\`
      &lt;button
        part="button"
        ?disabled=\${this.disabled}
        @click=\${this._onClick}
      &gt;
        &lt;slot name="icon-start"&gt;&lt;/slot&gt;
        &lt;span part="label"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/span&gt;
        &lt;slot name="icon-end"&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`;
  }
}</code></pre>

  <h3>生成的 custom-elements.json 結構（摘要）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// custom-elements.json（自動生成，不需手寫）
{
  "schemaVersion": "1.0.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/my-button.js",
      "declarations": [
        {
          "kind": "class",
          "name": "MyButton",
          "tagName": "my-button",
          "description": "一個可自訂的按鈕元件...",
          "members": [
            {
              "kind": "field",
              "name": "variant",
              "type": { "text": "'primary' | 'secondary' | 'danger'" },
              "default": "'primary'"
            }
          ],
          "events": [
            { "name": "my-button-click", "description": "使用者點擊按鈕時觸發..." }
          ],
          "slots": [
            { "name": "", "description": "按鈕的主要內容" },
            { "name": "icon-start", "description": "按鈕左側的圖示插槽" }
          ],
          "cssProperties": [
            { "name": "--my-button-bg", "default": "#0070f3" }
          ],
          "cssParts": [
            { "name": "button", "description": "內部的原生 button 元素" }
          ]
        }
      ]
    }
  ]
}
</code></pre>

  <h3>Storybook Args 自動生成（基於 CEM）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// .storybook/main.ts - 啟用 CEM 整合
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: ['../src/**/*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',
    // @storybook/addon-docs 會自動讀取 custom-elements.json
    // 在 Docs 分頁顯示完整 API 表格
  ],
};
export default config;

// package.json 中指定 CEM 路徑
// "customElements": "./custom-elements.json"

// 現在 Storybook 會自動：
// 1. 為 variant、disabled 等屬性生成 Controls
// 2. 在 Docs 頁面顯示屬性/事件/插槽/CSS 屬性的完整表格
// 3. 根據型別自訂控制項（布林值 → toggle、字串 union → select）
</code></pre>

  <h3>VSCode HTML 擴充套件整合</h3>
  <pre data-lang="json"><code class="language-json">// .vscode/settings.json
{
  // VS Code 的 HTML Language Service 會讀取 CEM
  // 提供自訂元素的屬性補全和 hover 說明
  "html.customData": [
    "./custom-elements.json"
  ],
  // 也支援 web-types 格式（JetBrains IDE）
  // "html.customData": ["./web-types.json"]
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">將 CEM 加入 CI/CD 流程</div>
    <p>
      在 PR 流程中執行 <code>cem analyze</code> 並比較輸出差異，
      可以偵測意外的 API 破壞性變更（如移除 attribute、修改 event name）。
      部分團隊會將 <code>custom-elements.json</code> 加入 git 版本控制，
      並在 PR Review 時檢查 API 差異，作為公共 API 審查的一部分。
    </p>
  </div>
</section>

<section id="eslint-lit-rules">
  <h2>ESLint for Lit：靜態分析與程式碼規範</h2>
  <p>
    Lit 的 HTML 模板是字串，TypeScript 編譯器無法直接分析其中的錯誤。
    <code>eslint-plugin-lit</code> 和 <code>eslint-plugin-wc</code>
    透過 AST 解析和模板字串分析，在編輯器中即時提示常見的 Lit 和 Web Components 錯誤。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install --save-dev eslint eslint-plugin-lit eslint-plugin-wc

# 如果使用 ESLint v9 flat config
npm install --save-dev @eslint/js typescript-eslint</code></pre>

  <h3>ESLint 設定（Flat Config 格式，ESLint v9+）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import litPlugin from 'eslint-plugin-lit';
import wcPlugin from 'eslint-plugin-wc';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Lit 特定規則
  {
    plugins: { lit: litPlugin },
    rules: {
      // 禁止在 Lit 模板中使用 className（應使用 class）
      'lit/no-classname-bindings': 'error',

      // 禁止在模板中使用原生字串連接（應使用 html 模板標籤）
      'lit/no-native-attributes': 'warn',

      // 偵測模板中使用的 value 屬性是否正確綁定（.value vs @input）
      'lit/binding-positions': 'error',

      // 禁止在 html 模板中的屬性使用大寫（HTML 屬性不區分大小寫）
      'lit/attribute-value-entities': 'error',

      // 確保 no-legacy-template-syntax（Lit 1.x 的舊語法）
      'lit/no-legacy-template-syntax': 'error',

      // 確保 @property 的 attribute 選項使用小寫
      'lit/no-invalid-html': 'error',
    },
  },

  // Web Components 通用規則
  {
    plugins: { wc: wcPlugin },
    rules: {
      // Custom Element 名稱必須包含連字號
      'wc/tag-name-matches-class': 'error',

      // 不要在 constructor 中操作 DOM（應在 connectedCallback 或 firstUpdated）
      'wc/no-constructor-attributes': 'error',

      // 必須定義 observedAttributes（如果在 attributeChangedCallback 中用到）
      'wc/no-invalid-element-name': 'error',

      // 確保 customElements.define 的 tag name 格式正確
      'wc/define-tag-after-class-definition': 'warn',

      // 在 disconnectedCallback 中清理 event listeners（防止記憶體洩漏）
      'wc/attach-shadow-constructor': 'warn',

      // 屬性名稱必須為小寫（HTML 規範）
      'wc/no-typos': 'error',
    },
  },
);</code></pre>

  <h3>eslint-plugin-lit 常見規則說明</h3>
  <table>
    <thead>
      <tr><th>規則</th><th>問題範例</th><th>正確寫法</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>no-classname-bindings</code></td>
        <td><code>&lt;div className="foo"&gt;</code></td>
        <td><code>&lt;div class="foo"&gt;</code></td>
      </tr>
      <tr>
        <td><code>binding-positions</code></td>
        <td><code>&lt;div .style="color:red"&gt;</code></td>
        <td><code>&lt;div style="color:red"&gt;</code> 或使用 styleMap</td>
      </tr>
      <tr>
        <td><code>no-invalid-html</code></td>
        <td>未關閉的標籤 <code>&lt;br&gt;</code>（在某些嚴格模式）</td>
        <td><code>&lt;br /&gt;</code> 或 <code>&lt;br&gt;&lt;/br&gt;</code></td>
      </tr>
      <tr>
        <td><code>no-value-attribute</code></td>
        <td><code>&lt;input value=\${this.val}&gt;</code></td>
        <td><code>&lt;input .value=\${this.val}&gt;</code>（property 綁定）</td>
      </tr>
      <tr>
        <td><code>no-this-in-template</code></td>
        <td>template 中的 <code>\${this}</code></td>
        <td>提取到區域變數再使用</td>
      </tr>
    </tbody>
  </table>

  <h3>eslint-plugin-wc 常見規則說明</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 常見錯誤案例

// ❌ no-constructor-attributes：constructor 中不應操作 DOM
class BadElement extends HTMLElement {
  constructor() {
    super();
    this.setAttribute('role', 'button'); // ESLint 警告
    this.innerHTML = '...';             // ESLint 錯誤
  }
}

// ✅ 正確：在 connectedCallback 中操作
class GoodElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'button'); // OK
  }
}

// ❌ 在 Lit 中應使用 firstUpdated
@customElement('my-el')
class MyEl extends LitElement {
  constructor() {
    super();
    this.shadowRoot!.querySelector('button'); // 此時 shadowRoot 尚未渲染
  }
}

// ✅ 正確：在 firstUpdated 中
@customElement('my-el')
class MyEl extends LitElement {
  firstUpdated() {
    const button = this.shadowRoot!.querySelector('button'); // OK
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">與 lit-analyzer（TypeScript 外掛）的分工</div>
    <p>
      <code>eslint-plugin-lit</code> 在 ESLint 層面分析語法和常見模式錯誤，
      適合在 CI/CD 中作為 lint check。
      <code>ts-lit-plugin</code>（VSCode 的 lit-plugin）在 TypeScript Language Service 層面，
      提供即時的型別檢查和自動補全。
      兩者互補，建議同時使用：ESLint 用於 CI，lit-plugin 用於開發時的即時回饋。
    </p>
  </div>
</section>

<section id="lit-localize">
  <h2>@lit/localize：國際化與多語言支援</h2>
  <p>
    <code>@lit/localize</code> 是 Lit 官方的國際化（i18n）解決方案，
    支援 XLIFF 和 JSON 格式，提供靜態（build-time）和動態（runtime）兩種切換模式，
    並與 Lit 的響應式更新緊密整合——切換語言時，所有使用 <code>msg()</code> 的元件自動重新渲染。
  </p>

  <pre data-lang="bash"><code class="language-bash">npm install @lit/localize
npm install --save-dev @lit/localize-tools</code></pre>

  <h3>基礎設定：lit-localize.json</h3>
  <pre data-lang="json"><code class="language-json">// lit-localize.json
{
  "$schema": "https://raw.githubusercontent.com/lit/lit/main/packages/localize-tools/config.schema.json",
  "sourceLocale": "zh-TW",
  "targetLocales": ["en", "ja", "ko"],
  "tsConfig": "./tsconfig.json",
  "output": {
    "mode": "runtime",
    "outputDir": "./src/locales",
    "localeCodesModule": "./src/locale-codes.ts"
  },
  "interchange": {
    "format": "xliff",
    "xliffDir": "./xliff"
  }
}
</code></pre>

  <h3>在元件中使用 msg() 標記翻譯字串</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { localized, msg, str, html as htmlMsg } from '@lit/localize';

// @localized 裝飾器：讓元件在語言切換時自動重新渲染
@localized()
@customElement('product-card')
class ProductCard extends LitElement {
  @property({ type: String }) productName = '';
  @property({ type: Number }) price = 0;
  @property({ type: Number }) reviewCount = 0;

  render() {
    return html\`
      &lt;div class="product-card"&gt;
        &lt;h2&gt;
          \${msg('商品資訊', { id: 'product-card-title' })}
        &lt;/h2&gt;

        &lt;p class="name"&gt;
          \${msg(str\`商品名稱：\${this.productName}\`, {
            id: 'product-name-label',
            desc: '顯示商品名稱的標籤，productName 是商品名稱變數',
          })}
        &lt;/p&gt;

        &lt;p class="price"&gt;
          \${msg(str\`售價：NT$ \${this.price.toLocaleString()}\`, {
            id: 'product-price-label',
          })}
        &lt;/p&gt;

        \${this.reviewCount &gt; 0 ? html\`
          &lt;p class="reviews"&gt;
            \${msg(str\`\${this.reviewCount} 則評論\`, {
              id: 'review-count',
              desc: '評論數量，reviewCount 是數字',
            })}
          &lt;/p&gt;
        \` : html\`
          &lt;p&gt;\${msg('尚無評論', { id: 'no-reviews' })}&lt;/p&gt;
        \`}

        &lt;button&gt;
          \${msg('加入購物車', { id: 'add-to-cart-button' })}
        &lt;/button&gt;

        &lt;!-- html msg：包含 HTML 的翻譯字串 --&gt;
        \${msg(htmlMsg\`閱讀
          &lt;a href="/terms"&gt;服務條款&lt;/a&gt;
          與
          &lt;a href="/privacy"&gt;隱私政策&lt;/a&gt;\`, {
          id: 'terms-and-privacy',
        })}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>提取翻譯字串到 XLIFF 格式</h3>
  <pre data-lang="bash"><code class="language-bash"># 分析原始碼，提取所有 msg() 呼叫到 XLIFF 格式
npx lit-localize extract

# 生成的 XLIFF 檔案結構（xliff/en.xlf）：
# &lt;?xml version="1.0" encoding="UTF-8"?&gt;
# &lt;xliff version="1.2"&gt;
#   &lt;file source-language="zh-TW" target-language="en"&gt;
#     &lt;body&gt;
#       &lt;trans-unit id="product-card-title"&gt;
#         &lt;source&gt;商品資訊&lt;/source&gt;
#         &lt;target&gt;&lt;/target&gt;  &lt;-- 翻譯人員填寫
#       &lt;/trans-unit&gt;
#       &lt;trans-unit id="add-to-cart-button"&gt;
#         &lt;source&gt;加入購物車&lt;/source&gt;
#         &lt;target&gt;&lt;/target&gt;
#       &lt;/trans-unit&gt;
#     &lt;/body&gt;
#   &lt;/file&gt;
# &lt;/xliff&gt;</code></pre>

  <h3>編譯翻譯並切換語言（Runtime 模式）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 翻譯人員填寫 XLIFF 後，執行編譯
// npx lit-localize build
// 生成 src/locales/en.ts、src/locales/ja.ts 等

// src/locales/en.ts（自動生成）
export const templates = {
  'product-card-title': 'Product Info',
  'add-to-cart-button': 'Add to Cart',
  // ...
};

// main.ts - 應用程式初始化
import { configureLocalization } from '@lit/localize';

// 設定 localization（一次設定，全局生效）
const { getLocale, setLocale } = configureLocalization({
  sourceLocale: 'zh-TW',
  targetLocales: ['en', 'ja', 'ko'],
  // 動態 import：只載入需要的語言
  loadLocale: (locale: string) =&gt; import(\`./locales/\${locale}.js\`),
});

// 根據使用者偏好設定初始語言
const userLocale = localStorage.getItem('locale')
  ?? navigator.language.substring(0, 2)
  ?? 'zh-TW';

await setLocale(userLocale);

// 語言切換 UI
@customElement('locale-switcher')
class LocaleSwitcher extends LitElement {
  private _locales = [
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
  ];

  private async _switchLocale(code: string) {
    await setLocale(code);
    localStorage.setItem('locale', code);
  }

  render() {
    const current = getLocale();
    return html\`
      &lt;select
        .value=\${current}
        @change=\${(e: Event) =&gt;
          this._switchLocale((e.target as HTMLSelectElement).value)
        }
      &gt;
        \${this._locales.map(l =&gt; html\`
          &lt;option value=\${l.code} ?selected=\${l.code === current}&gt;
            \${l.label}
          &lt;/option&gt;
        \`)}
      &lt;/select&gt;
    \`;
  }
}</code></pre>

  <h3>Runtime vs Transform 模式比較</h3>
  <table>
    <thead>
      <tr><th>特性</th><th>Runtime 模式</th><th>Transform 模式</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>語言切換</td>
        <td>動態，無需重新載入頁面</td>
        <td>需要載入不同的 JS bundle</td>
      </tr>
      <tr>
        <td>Bundle 大小</td>
        <td>略大（含 runtime 邏輯）</td>
        <td>每個語言的 bundle 最小</td>
      </tr>
      <tr>
        <td>首次載入</td>
        <td>需要非同步載入語言包</td>
        <td>語言 bundle 直接包含翻譯</td>
      </tr>
      <tr>
        <td>適合場景</td>
        <td>需要即時切換語言的應用</td>
        <td>靜態網站、SEO 優先</td>
      </tr>
      <tr>
        <td>設定複雜度</td>
        <td>低（單一 bundle 部署）</td>
        <td>高（每個語言各一個 bundle）</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info">
    <div class="callout-title">與 i18next、FormatJS 的比較</div>
    <p>
      <code>@lit/localize</code> 與 Lit 的響應式系統深度整合，
      切換語言時無需手動觸發重渲染。
      但它的功能相對基礎：不支援複數形（plural）和日期/數字格式化等複雜場景。
      若需要完整的 ICU Message Format 支援（複數、性別等），
      可以考慮搭配 <code>@messageformat/core</code> 或 <code>@formatjs/intl</code>，
      並手動在 <code>msg()</code> 的翻譯結果中套用。
    </p>
  </div>
</section>
`,
};
