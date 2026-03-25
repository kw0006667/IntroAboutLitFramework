export default {
  id: 7,
  slug: 'chapter-7',
  title: 'Directives：擴展模板的超能力',
  part: 2,
  intro: '內建 Directives（repeat、until、classMap、styleMap）的使用，以及如何撰寫自訂 Directive 來封裝複雜的 DOM 操作邏輯。',
  sections: [
    { slug: 'what-are-directives', title: 'Directive 是什麼？' },
    { slug: 'repeat-directive', title: 'repeat：高效列表渲染' },
    { slug: 'class-style-map', title: 'classMap 與 styleMap' },
    { slug: 'until-async-directive', title: 'until 與非同步資料' },
    { slug: 'cache-guard-directives', title: 'cache 與 guard 的效能優化' },
    { slug: 'custom-directives', title: '撰寫自訂 Directive' },
    { slug: 'async-directive', title: 'AsyncDirective 深度解析' },
    { slug: 'directive-performance', title: 'Directive 效能分析與最佳化' },
    { slug: 'real-world-directives', title: '實戰 Directive：tooltip、intersection、animate' },
  ],
  content: `
<section id="what-are-directives">
  <h2>Directive 是什麼？</h2>
  <p>
    Directive（指令）是 lit-html 的擴展機制，
    允許你在模板的動態位置（<code>\${...}</code>）中放入特殊行為，
    而不僅僅是值。Directive 可以存取底層的 Part 物件，
    直接操作 DOM 節點，並在元件更新時維護自己的狀態。
  </p>
  <p>
    你可以把 Directive 想像成「模板中的小型元件」：
    它有自己的生命週期，可以在第一次渲染和後續更新之間區分處理邏輯。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// Directive 的基本使用方式：就像一個函數調用
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

render() {
  return html\`
    &lt;ul&gt;
      \${repeat(this.items, item =&gt; item.id, item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`)}
    &lt;/ul&gt;
    &lt;div class=\${classMap({ active: this.isActive, error: this.hasError })}&gt;&lt;/div&gt;
  \`;
}</code></pre>

  <h3>Directive 的 Part 類型</h3>
  <p>
    Directive 能放置的位置取決於它所繫結的 <strong>Part 類型</strong>。
    lit-html 定義了六種 Part，分別對應模板中不同的動態插槽位置：
  </p>
  <table>
    <thead>
      <tr><th>Part 類型</th><th>對應的模板語法</th><th>說明</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>ChildPart</code></td>
        <td><code>\${...}</code>（在元素內容位置）</td>
        <td>最常見，渲染子節點、字串、TemplateResult</td>
      </tr>
      <tr>
        <td><code>AttributePart</code></td>
        <td><code>attr=\${...}</code></td>
        <td>設定 HTML Attribute 值</td>
      </tr>
      <tr>
        <td><code>PropertyPart</code></td>
        <td><code>.prop=\${...}</code></td>
        <td>設定 DOM Property（JS 物件屬性）</td>
      </tr>
      <tr>
        <td><code>EventPart</code></td>
        <td><code>@event=\${...}</code></td>
        <td>綁定事件監聽器</td>
      </tr>
      <tr>
        <td><code>BooleanAttributePart</code></td>
        <td><code>?attr=\${...}</code></td>
        <td>根據布林值加/移除 Attribute</td>
      </tr>
      <tr>
        <td><code>ElementPart</code></td>
        <td><code>\${directive()}</code>（放在開始標籤內）</td>
        <td>存取元素本身（最強大，可存取整個 DOM 節點）</td>
      </tr>
    </tbody>
  </table>

  <pre data-lang="typescript"><code class="language-typescript">import { Directive, directive, PartType, PartInfo } from 'lit/directive.js';

class MyDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    // 在建構時即可知道 Part 類型，可以做型別檢查
    switch (partInfo.type) {
      case PartType.CHILD:      // 0
      case PartType.ATTRIBUTE:  // 1
      case PartType.PROPERTY:   // 2
      case PartType.BOOLEAN_ATTRIBUTE: // 3
      case PartType.EVENT:      // 4
      case PartType.ELEMENT:    // 5
        break;
      default:
        throw new Error(\`不支援的 Part 類型: \${partInfo.type}\`);
    }
  }

  render(...args: unknown[]) { return undefined; }
}

export const myDirective = directive(MyDirective);</code></pre>
</section>

<section id="repeat-directive">
  <h2>repeat：高效列表渲染</h2>
  <p>
    雖然 <code>Array.map()</code> 通常已經足夠，但 <code>repeat</code> directive
    在以下場景提供顯著的效能優勢：列表項目頻繁重新排序、過濾、插入或刪除。
  </p>

  <h3>為什麼 repeat 比 map 快？</h3>
  <p>
    <code>map()</code> 在列表重排時，會讓 lit-html 認為每個位置的模板都改變了，
    觸發不必要的 DOM 重建。<code>repeat</code> 透過 Key Function 追蹤每個項目的身份，
    在重排時移動 DOM 節點而非重建。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { repeat } from 'lit/directives/repeat.js';

@customElement('sorted-list')
class SortedList extends LitElement {
  @property({ type: Array }) items: { id: number; name: string }[] = [];
  @state() private _sortAsc = true;

  get _sorted() {
    return [...this.items].sort((a, b) =&gt;
      this._sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }

  render() {
    return html\`
      &lt;button @click=\${() =&gt; { this._sortAsc = !this._sortAsc; }}&gt;
        切換排序
      &lt;/button&gt;
      &lt;ul&gt;
        \${repeat(
          this._sorted,
          item =&gt; item.id,           // Key Function：唯一識別每個項目
          item =&gt; html\`              // Item Template
            &lt;li class="item"&gt;
              \${item.name}
            &lt;/li&gt;
          \`
        )}
      &lt;/ul&gt;
    \`;
  }
}</code></pre>

  <h3>何時用 map，何時用 repeat？</h3>
  <table>
    <thead>
      <tr><th>場景</th><th>建議</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>列表只新增項目（不重排）</td>
        <td>map() 足夠</td>
      </tr>
      <tr>
        <td>靜態列表（幾乎不變）</td>
        <td>map() 足夠</td>
      </tr>
      <tr>
        <td>頻繁排序、過濾的列表</td>
        <td>repeat() 效能較好</td>
      </tr>
      <tr>
        <td>拖曳重排（Drag &amp; Drop）</td>
        <td>repeat() 必要</td>
      </tr>
      <tr>
        <td>列表項目有複雜的局部狀態（聚焦、選中）</td>
        <td>repeat() 保留 DOM 狀態</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="class-style-map">
  <h2>classMap 與 styleMap</h2>
  <p>
    這兩個 directive 提供了優雅的方式來動態設定 CSS class 和 inline style。
  </p>

  <h3>classMap</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { classMap } from 'lit/directives/class-map.js';

@customElement('toggle-button')
class ToggleButton extends LitElement {
  @property({ type: Boolean }) active = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) disabled = false;

  render() {
    // classMap 接受一個物件，值為 true 的 key 會被加到 class 列表
    const classes = {
      'btn': true,
      'btn--active': this.active,
      'btn--loading': this.loading,
      'btn--disabled': this.disabled,
    };

    return html\`
      &lt;button
        class=\${classMap(classes)}
        ?disabled=\${this.disabled || this.loading}
      &gt;
        \${this.loading ? '載入中...' : '點擊我'}
      &lt;/button&gt;
    \`;
  }
}</code></pre>

  <h3>styleMap</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { styleMap } from 'lit/directives/style-map.js';

@customElement('progress-bar')
class ProgressBar extends LitElement {
  @property({ type: Number }) value = 0;   // 0-100
  @property({ type: String }) color = '#FF6D00';

  render() {
    const barStyles = {
      width: \`\${this.value}%\`,
      backgroundColor: this.color,
      transition: 'width 0.3s ease',
    };

    return html\`
      &lt;div class="track"&gt;
        &lt;div class="bar" style=\${styleMap(barStyles)}&gt;&lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">classMap vs 字串插值</div>
    <p>
      <code>class=\${classMap(...)}</code> 比 <code>class="\${...}"</code> 更高效：
      它只更新改變的 class，而不是替換整個 class 字串。
      這在有動畫 class 時特別重要，避免不必要的 CSS transition 重置。
    </p>
  </div>
</section>

<section id="until-async-directive">
  <h2>until 與非同步資料</h2>
  <p>
    <code>until</code> directive 讓你可以在模板中優雅地處理 Promise，
    在資料載入完成前顯示 placeholder。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { until } from 'lit/directives/until.js';

@customElement('async-user-profile')
class AsyncUserProfile extends LitElement {
  @property({ type: String }) userId = '';

  get _userPromise() {
    return fetch(\`/api/users/\${this.userId}\`).then(r =&gt; r.json());
  }

  render() {
    return html\`
      \${until(
        this._userPromise.then(user =&gt; html\`
          &lt;div class="profile"&gt;
            &lt;img src=\${user.avatar} alt=\${user.name}&gt;
            &lt;h2&gt;\${user.name}&lt;/h2&gt;
          &lt;/div&gt;
        \`),
        html\`&lt;div class="skeleton"&gt;載入中...&lt;/div&gt;\`  // Placeholder
      )}
    \`;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">until 的限制</div>
    <p>
      <code>until</code> 無法處理 Promise rejection（錯誤）。
      對於需要錯誤處理的場景，建議使用 <code>@lit-labs/task</code>
      或將非同步邏輯抽離到 Reactive Controller 中。
    </p>
  </div>
</section>

<section id="cache-guard-directives">
  <h2>cache 與 guard 的效能優化</h2>

  <h3>cache：保留隱藏節點</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { cache } from 'lit/directives/cache.js';

// 適合 Tab 切換：保留每個 tab 的 DOM 狀態（滾動位置、表單輸入等）
render() {
  return html\`
    \${cache(
      this.activeTab === 'home'
        ? html\`&lt;home-tab&gt;&lt;/home-tab&gt;\`
        : html\`&lt;settings-tab&gt;&lt;/settings-tab&gt;\`
    )}
  \`;
}</code></pre>

  <h3>guard：跳過不必要的重新計算</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { guard } from 'lit/directives/guard.js';

@customElement('expensive-render')
class ExpensiveRender extends LitElement {
  @property({ type: Array }) items: Item[] = [];
  @property({ type: String }) theme = 'light';

  render() {
    return html\`
      &lt;!-- guard 只有在 [this.items] 陣列參考改變時才重新執行回調 --&gt;
      \${guard([this.items], () =&gt;
        // 昂貴的計算：只在 items 改變時執行
        expensiveTransform(this.items).map(item =&gt; html\`
          &lt;complex-item .data=\${item}&gt;&lt;/complex-item&gt;
        \`)
      )}
      &lt;!-- theme 改變不會觸發 guard 內部的重新計算 --&gt;
      &lt;div class=\${this.theme}&gt;...&lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="custom-directives">
  <h2>撰寫自訂 Directive</h2>
  <p>
    當內建 Directives 無法滿足需求時，你可以建立自訂 Directive。
    自訂 Directive 適合封裝需要直接操作 DOM 的複雜邏輯。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { Directive, directive, PartInfo, PartType } from 'lit/directive.js';
import { ElementPart } from 'lit';

// 自訂 Directive：自動聚焦
class AutoFocusDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('autofocus directive 只能用在元素上');
    }
  }

  render(shouldFocus: boolean) {
    return undefined; // Element directives 不渲染值
  }

  update(part: ElementPart, [shouldFocus]: [boolean]) {
    if (shouldFocus) {
      // 在下一個 microtask 中聚焦（確保 DOM 已更新）
      Promise.resolve().then(() =&gt; {
        (part.element as HTMLElement).focus();
      });
    }
    return this.render(shouldFocus);
  }
}

export const autofocus = directive(AutoFocusDirective);

// 使用自訂 directive
render() {
  return html\`
    &lt;input \${autofocus(this.isFirstField)}&gt;
  \`;
}</code></pre>

  <h3>有狀態的 Directive</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 一個追蹤渲染次數的 Directive
class RenderCountDirective extends Directive {
  private _count = 0;

  render() {
    this._count++;
    return this._count;
  }
}

export const renderCount = directive(RenderCountDirective);

// 每次元件渲染時，這個 directive 會返回累計的渲染次數
render() {
  return html\`
    &lt;p&gt;這個元件已渲染 \${renderCount()} 次&lt;/p&gt;
  \`;
}</code></pre>

  <h3>何時不該使用 Directive（vs Reactive Properties）</h3>
  <div class="callout callout-warning">
    <div class="callout-title">Directive 的使用邊界</div>
    <p>
      Directive 是強大的工具，但過度使用會讓程式碼難以閱讀與測試。
      以下情境應優先考慮其他方案：
    </p>
    <ul>
      <li><strong>只是計算衍生值</strong>：用 getter 或 <code>computed</code>，而非 directive</li>
      <li><strong>需要跨多個元件共享邏輯</strong>：用 Reactive Controller，封裝更完整的生命週期</li>
      <li><strong>邏輯與 DOM 結構無關</strong>：純業務邏輯應在 directive 之外處理</li>
      <li><strong>需要觸發元件重新渲染</strong>：directive 本身無法呼叫 <code>requestUpdate()</code>，應改用 Controller 或 property</li>
    </ul>
  </div>
  <p>
    Directive 最適合的場景是：需要<strong>直接且精準地操作特定 DOM 節點</strong>，
    並且這個操作邏輯可以被封裝成無狀態或輕狀態的函數介面。
  </p>
</section>

<section id="async-directive">
  <h2>AsyncDirective 深度解析</h2>
  <p>
    普通的 <code>Directive</code> 在元素從 DOM 中移除後並不會收到通知。
    <code>AsyncDirective</code> 則提供了完整的連接/斷開生命週期，
    讓你可以安全地管理訂閱、計時器或其他需要清理的資源。
  </p>

  <h3>AsyncDirective 生命週期</h3>
  <p>
    <code>AsyncDirective</code> 繼承自 <code>Directive</code>，額外提供以下生命週期方法：
  </p>
  <table>
    <thead>
      <tr><th>方法</th><th>觸發時機</th><th>典型用途</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>render(...args)</code></td>
        <td>每次模板更新時</td>
        <td>返回要渲染的值（SSR 也會調用）</td>
      </tr>
      <tr>
        <td><code>update(part, args)</code></td>
        <td>每次模板更新時（DOM 可存取）</td>
        <td>存取 DOM 元素、設定事件監聽器</td>
      </tr>
      <tr>
        <td><code>disconnected()</code></td>
        <td>元素從 DOM 移除時，或被 <code>cache</code> directive 隱藏時</td>
        <td>清理訂閱、取消計時器</td>
      </tr>
      <tr>
        <td><code>reconnected()</code></td>
        <td>元素重新連接到 DOM 時（從 cache 中恢復）</td>
        <td>重新建立訂閱</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info">
    <div class="callout-title">disconnected 的觸發場景</div>
    <p>
      <code>disconnected()</code> 不僅在元素被從 DOM 完全移除時觸發，
      還會在 <code>cache</code> directive 切換時觸發（因為元素被暫存起來，
      從渲染樹中暫時移出）。這讓你可以在不可見時暫停昂貴的操作（如動畫、訂閱）。
      當元素透過 <code>cache</code> 恢復時，<code>reconnected()</code> 會被調用。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ChildPart, DirectiveParameters } from 'lit/directive.js';

// 實戰範例：訂閱 Observable（如 RxJS）的 Directive
class ObserveDirective extends AsyncDirective {
  private _subscription: { unsubscribe(): void } | undefined;

  // 接受一個 Observable 並訂閱它
  render(observable: { subscribe(cb: (v: unknown) => void): { unsubscribe(): void } }) {
    // render 在 SSR 也會執行，不能在這裡訂閱
    return undefined;
  }

  update(
    part: ChildPart,
    [observable]: DirectiveParameters&lt;this&gt;
  ) {
    // 如果 observable 物件參考改變，重新訂閱
    if (this._subscription) {
      this._subscription.unsubscribe();
    }

    this._subscription = observable.subscribe((value) =&gt; {
      // 非同步地更新渲染結果，不依賴元件的 render 週期
      this.setValue(value);
    });

    return this.render(observable);
  }

  disconnected() {
    // 元素從 DOM 移除時，暫停訂閱以避免記憶體洩漏
    this._subscription?.unsubscribe();
    this._subscription = undefined;
  }

  reconnected() {
    // 元素重新連接時（例如從 cache 中恢復），重新訂閱
    // 注意：需要重新取得 observable 參考
    // 這裡簡化處理，實際上需要儲存上一次的 observable
  }
}

export const observe = directive(ObserveDirective);</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">// 更完整的實作：儲存 observable 參考以支援 reconnected
class ObserveDirective extends AsyncDirective {
  private _subscription: { unsubscribe(): void } | undefined;
  private _observable: Observable&lt;unknown&gt; | undefined;

  render(observable: Observable&lt;unknown&gt;) {
    return undefined;
  }

  update(part: ChildPart, [observable]: [Observable&lt;unknown&gt;]) {
    if (observable !== this._observable) {
      this._subscription?.unsubscribe();
      this._observable = observable;
      this._subscribe(observable);
    }
    return this.render(observable);
  }

  private _subscribe(observable: Observable&lt;unknown&gt;) {
    this._subscription = observable.subscribe({
      next: (value) =&gt; this.setValue(value),
      error: (err) =&gt; this.setValue(html\`&lt;span class="error"&gt;錯誤：\${err.message}&lt;/span&gt;\`),
    });
  }

  disconnected() {
    this._subscription?.unsubscribe();
    this._subscription = undefined;
  }

  reconnected() {
    if (this._observable) {
      this._subscribe(this._observable);
    }
  }
}

export const observe = directive(ObserveDirective);

// 使用方式
// import { interval } from 'rxjs';
// const timer$ = interval(1000);
// render() {
//   return html\`&lt;p&gt;計時：\${observe(timer$)}&lt;/p&gt;\`;
// }</code></pre>

  <h3>setValue()：從 Directive 外部觸發更新</h3>
  <p>
    <code>AsyncDirective</code> 的核心能力是 <code>this.setValue()</code>，
    它讓 Directive 可以在任何時間點（不依賴元件的 <code>render</code> 週期）
    主動更新模板中的值。這對於處理 WebSocket、Server-Sent Events、
    或任何事件驅動的資料來源非常關鍵。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// WebSocket 即時資料 Directive
class WebSocketDirective extends AsyncDirective {
  private _ws: WebSocket | undefined;
  private _url: string | undefined;

  render(url: string) {
    return html\`&lt;span class="connecting"&gt;連接中...&lt;/span&gt;\`;
  }

  update(part: ChildPart, [url]: [string]) {
    if (url !== this._url) {
      this._cleanup();
      this._url = url;
      this._connect(url);
    }
    return this.render(url);
  }

  private _connect(url: string) {
    this._ws = new WebSocket(url);

    this._ws.onmessage = (event) =&gt; {
      const data = JSON.parse(event.data);
      // 即時更新，不等待父元件的下一次渲染
      this.setValue(html\`&lt;span class="live-data"&gt;\${data.value}&lt;/span&gt;\`);
    };

    this._ws.onerror = () =&gt; {
      this.setValue(html\`&lt;span class="error"&gt;連線錯誤&lt;/span&gt;\`);
    };
  }

  private _cleanup() {
    this._ws?.close();
    this._ws = undefined;
  }

  disconnected() { this._cleanup(); }
  reconnected() {
    if (this._url) this._connect(this._url);
  }
}

export const webSocket = directive(WebSocketDirective);

// 使用
render() {
  return html\`
    &lt;p&gt;即時股價：\${webSocket('wss://api.example.com/stock/AAPL')}&lt;/p&gt;
  \`;
}</code></pre>
</section>

<section id="directive-performance">
  <h2>Directive 效能分析與最佳化</h2>

  <h3>Directive 的執行成本模型</h3>
  <p>
    理解 Directive 的執行路徑有助於避免效能陷阱。
    每次元件渲染（<code>render()</code> 被調用）時，Directive 的行為如下：
  </p>
  <ol>
    <li>lit-html 比較靜態模板字串（不同模板）→ 如果不同，重建整個 DOM</li>
    <li>靜態模板相同 → 只更新動態 Part</li>
    <li>對於有 Directive 的 Part → 調用 <code>directive.update()</code></li>
    <li>如果 <code>update()</code> 返回 <code>noChange</code> → 跳過 DOM 操作</li>
  </ol>
  <p>
    關鍵最佳化點在於：<strong>在 <code>update()</code> 中主動返回 <code>noChange</code></strong>
    來告知 lit-html 不需要更新這個 Part。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { Directive, directive, noChange } from 'lit/directive.js';
import { ChildPart } from 'lit';

// 效能最佳化：只有在值真正改變時才更新
class MemoDirective extends Directive {
  private _cachedValue: unknown = undefined;
  private _cachedResult: unknown = noChange;

  render(value: unknown, computeFn: (v: unknown) =&gt; unknown) {
    // render 方法在 SSR 中使用，不能做 DOM 操作
    return computeFn(value);
  }

  update(part: ChildPart, [value, computeFn]: [unknown, (v: unknown) =&gt; unknown]) {
    // 深度比較或參考比較
    if (value === this._cachedValue) {
      // 返回 noChange 告知 lit-html：這個 Part 不需要更新
      return noChange;
    }
    this._cachedValue = value;
    this._cachedResult = computeFn(value);
    return this._cachedResult;
  }
}

export const memo = directive(MemoDirective);

// 使用：只有 items 陣列參考改變時才執行昂貴的轉換
render() {
  return html\`
    \${memo(this.items, (items) =&gt; {
      // 只有在 items 改變時才執行，不是每次 render 都執行
      return (items as Item[]).flatMap(item =&gt; processExpensive(item))
        .map(item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`);
    })}
  \`;
}</code></pre>

  <h3>Directive 的記憶體管理</h3>
  <p>
    每個 Directive 實例與其對應的 Part 綁定，<strong>Part 銷毀時 Directive 也會被回收</strong>。
    但如果 Directive 持有外部資源（事件監聽器、計時器、訂閱），
    必須在 <code>disconnected()</code> 中清理。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 記憶體洩漏範例（錯誤做法）
class LeakyDirective extends AsyncDirective {
  render() {
    // 每次渲染都新增一個事件監聽器，永遠不清理！
    window.addEventListener('resize', this._handleResize);
    return undefined;
  }

  private _handleResize = () =&gt; {
    this.setValue(window.innerWidth);
  };
}

// 正確做法
class SafeResizeDirective extends AsyncDirective {
  private _handleResize = () =&gt; {
    this.setValue(window.innerWidth);
  };

  update(part: ChildPart, args: []) {
    // update() 只在第一次（或重新連接後）設定監聽器
    if (!this._listening) {
      window.addEventListener('resize', this._handleResize);
      this._listening = true;
    }
    return this.render();
  }

  private _listening = false;

  render() {
    return window.innerWidth;
  }

  disconnected() {
    window.removeEventListener('resize', this._handleResize);
    this._listening = false;
  }

  reconnected() {
    window.addEventListener('resize', this._handleResize);
    this._listening = true;
  }
}

export const windowWidth = directive(SafeResizeDirective);</code></pre>

  <h3>Directive vs Reactive Controller：效能對比</h3>
  <table>
    <thead>
      <tr><th>面向</th><th>Directive</th><th>Reactive Controller</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>適用範圍</td>
        <td>單一模板位置（Part）</td>
        <td>整個元件生命週期</td>
      </tr>
      <tr>
        <td>觸發重新渲染</td>
        <td>只能更新自己的 Part（<code>setValue</code>）</td>
        <td>可以呼叫 <code>host.requestUpdate()</code></td>
      </tr>
      <tr>
        <td>DOM 存取</td>
        <td>只能存取綁定的 Part 對應節點</td>
        <td>可存取整個元件 DOM</td>
      </tr>
      <tr>
        <td>測試難度</td>
        <td>需要 Lit 環境</td>
        <td>可以獨立單元測試</td>
      </tr>
      <tr>
        <td>複用性</td>
        <td>在任何 Lit 模板中複用</td>
        <td>在任何 ReactiveElement 中複用</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">選擇準則</div>
    <p>
      如果你的邏輯需要「更新整個元件的狀態並觸發完整重新渲染」，
      用 <strong>Reactive Controller</strong>。
      如果你的邏輯只需要「精準地更新模板中的一個節點」，
      用 <strong>AsyncDirective</strong>（效能更佳，因為繞過了元件的渲染週期）。
    </p>
  </div>
</section>

<section id="real-world-directives">
  <h2>實戰 Directive：tooltip、intersection、animate</h2>

  <h3>1. Tooltip Directive</h3>
  <p>
    Tooltip 是 Directive 的經典使用案例：需要在元素上建立懸停行為，
    管理全域的 tooltip 節點，並在元素移除時清理。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// tooltip.directive.ts
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ElementPart, PartInfo, PartType } from 'lit/directive.js';

interface TooltipOptions {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

class TooltipDirective extends AsyncDirective {
  private _element: HTMLElement | undefined;
  private _tooltipEl: HTMLElement | undefined;
  private _showTimer: ReturnType&lt;typeof setTimeout&gt; | undefined;
  private _options: TooltipOptions = { content: '' };

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('tooltip directive 必須用在元素上：\${tooltip(...)}');
    }
  }

  render(options: TooltipOptions) {
    return undefined;
  }

  update(part: ElementPart, [options]: [TooltipOptions]) {
    this._options = { placement: 'top', delay: 200, ...options };

    if (!this._element) {
      this._element = part.element as HTMLElement;
      this._element.addEventListener('mouseenter', this._handleEnter);
      this._element.addEventListener('mouseleave', this._handleLeave);
      this._element.addEventListener('focus', this._handleEnter);
      this._element.addEventListener('blur', this._handleLeave);
      // 確保 ARIA 無障礙
      this._element.setAttribute('aria-describedby', this._getTooltipId());
    }

    // 如果 tooltip 已顯示，更新內容
    if (this._tooltipEl) {
      this._tooltipEl.textContent = options.content;
    }

    return this.render(options);
  }

  private _getTooltipId() {
    return \`tooltip-\${Math.random().toString(36).slice(2)}\`;
  }

  private _handleEnter = () =&gt; {
    clearTimeout(this._showTimer);
    this._showTimer = setTimeout(() =&gt; {
      this._show();
    }, this._options.delay ?? 200);
  };

  private _handleLeave = () =&gt; {
    clearTimeout(this._showTimer);
    this._hide();
  };

  private _show() {
    if (!this._element) return;

    if (!this._tooltipEl) {
      this._tooltipEl = document.createElement('div');
      this._tooltipEl.className = 'lit-tooltip';
      this._tooltipEl.setAttribute('role', 'tooltip');
      this._tooltipEl.id = this._element.getAttribute('aria-describedby') ?? '';
      Object.assign(this._tooltipEl.style, {
        position: 'fixed',
        zIndex: '9999',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        pointerEvents: 'none',
      });
      document.body.appendChild(this._tooltipEl);
    }

    this._tooltipEl.textContent = this._options.content;
    this._position();
  }

  private _position() {
    if (!this._element || !this._tooltipEl) return;
    const rect = this._element.getBoundingClientRect();
    const tooltipRect = this._tooltipEl.getBoundingClientRect();

    let top = 0, left = 0;
    switch (this._options.placement) {
      case 'bottom':
        top = rect.bottom + 4;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 4;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 4;
        break;
      default: // 'top'
        top = rect.top - tooltipRect.height - 4;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
    }

    this._tooltipEl.style.top = \`\${top}px\`;
    this._tooltipEl.style.left = \`\${left}px\`;
  }

  private _hide() {
    this._tooltipEl?.remove();
    this._tooltipEl = undefined;
  }

  private _cleanup() {
    clearTimeout(this._showTimer);
    this._hide();
    if (this._element) {
      this._element.removeEventListener('mouseenter', this._handleEnter);
      this._element.removeEventListener('mouseleave', this._handleLeave);
      this._element.removeEventListener('focus', this._handleEnter);
      this._element.removeEventListener('blur', this._handleLeave);
    }
  }

  disconnected() { this._cleanup(); }

  reconnected() {
    if (this._element) {
      this._element.addEventListener('mouseenter', this._handleEnter);
      this._element.addEventListener('mouseleave', this._handleLeave);
      this._element.addEventListener('focus', this._handleEnter);
      this._element.addEventListener('blur', this._handleLeave);
    }
  }
}

export const tooltip = directive(TooltipDirective);

// 使用方式
render() {
  return html\`
    &lt;button \${tooltip({ content: '點擊以儲存', placement: 'top', delay: 300 })}&gt;
      儲存
    &lt;/button&gt;
    &lt;span \${tooltip({ content: '此功能即將推出' })}&gt;
      Beta 功能
    &lt;/span&gt;
  \`;
}</code></pre>

  <h3>2. Intersection Observer Directive</h3>
  <p>
    Intersection Observer 用於懶載入圖片、無限捲動、進入視窗時觸發動畫等場景。
    封裝成 Directive 後，複用性極高且不洩漏 Observer 資源。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// intersection.directive.ts
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ElementPart, PartInfo, PartType } from 'lit/directive.js';

interface IntersectionOptions {
  onEnter?: (entry: IntersectionObserverEntry) =&gt; void;
  onLeave?: (entry: IntersectionObserverEntry) =&gt; void;
  threshold?: number | number[];
  rootMargin?: string;
  once?: boolean; // 只觸發一次後自動停止觀察
}

// 全域共用一個 Observer（效能最佳化）
const observerMap = new Map&lt;string, IntersectionObserver&gt;();
const callbackMap = new WeakMap&lt;Element, IntersectionOptions&gt;();

function getObserver(threshold: number | number[], rootMargin: string): IntersectionObserver {
  const key = \`\${JSON.stringify(threshold)}_\${rootMargin}\`;
  if (!observerMap.has(key)) {
    const observer = new IntersectionObserver((entries) =&gt; {
      for (const entry of entries) {
        const options = callbackMap.get(entry.target);
        if (!options) continue;
        if (entry.isIntersecting) {
          options.onEnter?.(entry);
          if (options.once) observer.unobserve(entry.target);
        } else {
          options.onLeave?.(entry);
        }
      }
    }, { threshold, rootMargin });
    observerMap.set(key, observer);
  }
  return observerMap.get(key)!;
}

class IntersectionDirective extends AsyncDirective {
  private _element: Element | undefined;
  private _observer: IntersectionObserver | undefined;
  private _options: IntersectionOptions = {};

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('intersection directive 必須用在元素上');
    }
  }

  render(options: IntersectionOptions) { return undefined; }

  update(part: ElementPart, [options]: [IntersectionOptions]) {
    const merged = { threshold: 0, rootMargin: '0px', ...options };
    this._options = merged;
    this._element = part.element;
    callbackMap.set(this._element, merged);

    this._observer = getObserver(merged.threshold!, merged.rootMargin!);
    this._observer.observe(this._element);

    return this.render(options);
  }

  disconnected() {
    if (this._element) {
      this._observer?.unobserve(this._element);
      callbackMap.delete(this._element);
    }
  }

  reconnected() {
    if (this._element) {
      callbackMap.set(this._element, this._options);
      this._observer?.observe(this._element);
    }
  }
}

export const intersection = directive(IntersectionDirective);

// 使用方式
@customElement('lazy-image')
class LazyImage extends LitElement {
  @property() src = '';
  @state() private _loaded = false;
  @state() private _visible = false;

  render() {
    return html\`
      &lt;div
        class="image-wrapper"
        \${intersection({
          onEnter: () =&gt; { this._visible = true; },
          once: true,
          rootMargin: '100px', // 提前 100px 開始載入
          threshold: 0.1,
        })}
      &gt;
        \${this._visible ? html\`
          &lt;img
            src=\${this.src}
            @load=\${() =&gt; { this._loaded = true; }}
            style=\${styleMap({ opacity: this._loaded ? '1' : '0', transition: 'opacity 0.3s' })}
          &gt;
        \` : html\`&lt;div class="placeholder"&gt;&lt;/div&gt;\`}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>3. Animate-In Directive（Web Animations API）</h3>
  <p>
    使用 Web Animations API（WAAPI）實作進入動畫，
    比 CSS class 切換更精準，比 JS 手動修改 style 更高效。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// animate.directive.ts
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ElementPart, PartInfo, PartType } from 'lit/directive.js';

interface AnimateOptions {
  keyframes: Keyframe[];
  options?: KeyframeAnimationOptions;
  trigger?: 'enter' | 'always'; // enter: 只在第一次進入時播放；always: 每次更新都播放
}

const defaultOptions: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'ease-out',
  fill: 'forwards',
};

class AnimateDirective extends AsyncDirective {
  private _element: HTMLElement | undefined;
  private _hasAnimated = false;
  private _currentAnimation: Animation | undefined;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('animate directive 必須用在元素上');
    }
  }

  render(options: AnimateOptions) { return undefined; }

  update(part: ElementPart, [options]: [AnimateOptions]) {
    this._element = part.element as HTMLElement;
    const { keyframes, options: animOptions = {}, trigger = 'enter' } = options;
    const mergedOptions = { ...defaultOptions, ...animOptions };

    const shouldAnimate = trigger === 'always' || !this._hasAnimated;

    if (shouldAnimate) {
      // 取消現有動畫
      this._currentAnimation?.cancel();

      // 使用 Web Animations API
      this._currentAnimation = this._element.animate(keyframes, mergedOptions);
      this._hasAnimated = true;

      // 動畫結束後清理
      this._currentAnimation.finished.catch(() =&gt; {
        // 動畫被取消（正常情況）
      });
    }

    return this.render(options);
  }

  disconnected() {
    this._currentAnimation?.cancel();
    this._hasAnimated = false; // 重置，讓 reconnected 後重新播放
  }
}

export const animate = directive(AnimateDirective);

// 預設動畫效果輔助函數
export const fadeIn = (duration = 300) =&gt; animate({
  keyframes: [
    { opacity: 0, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  options: { duration, easing: 'ease-out', fill: 'forwards' },
  trigger: 'enter',
});

export const slideIn = (direction: 'left' | 'right' = 'left', duration = 300) =&gt; animate({
  keyframes: [
    { transform: \`translateX(\${direction === 'left' ? '-100%' : '100%'})\`, opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 },
  ],
  options: { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
  trigger: 'enter',
});

// 使用方式
@customElement('animated-list')
class AnimatedList extends LitElement {
  @property({ type: Array }) items: { id: number; name: string }[] = [];

  render() {
    return html\`
      &lt;ul&gt;
        \${repeat(
          this.items,
          item =&gt; item.id,
          (item, index) =&gt; html\`
            &lt;li \${animate({
              keyframes: [
                { opacity: 0, transform: 'translateY(16px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              options: {
                duration: 250,
                delay: index * 50, // 交錯動畫
                easing: 'ease-out',
                fill: 'forwards',
              },
              trigger: 'enter',
            })}&gt;
              \${item.name}
            &lt;/li&gt;
          \`
        )}
      &lt;/ul&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Web Animations API vs CSS Animations</div>
    <p>
      Web Animations API 的優勢在於可以透過 JavaScript 精確控制動畫的播放、暫停、
      和完成時機（<code>animation.finished</code> 是 Promise），
      並且可以動態計算 keyframes。
      相對地，CSS Animations 更適合簡單的、純宣告式的動畫效果。
      在 Directive 中使用 WAAPI 讓你可以完美地與 Lit 的生命週期整合，
      在元素移除時自動取消動畫，避免樣式殘留。
    </p>
  </div>
</section>
`,
};
