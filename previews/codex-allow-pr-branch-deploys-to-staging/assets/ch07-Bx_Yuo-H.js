const t={id:7,slug:"chapter-7",title:"Directives：擴展模板的超能力",part:2,intro:"內建 Directives（repeat、until、classMap、styleMap）的使用，以及如何撰寫自訂 Directive 來封裝複雜的 DOM 操作邏輯。",sections:[{slug:"what-are-directives",title:"Directive 是什麼？"},{slug:"repeat-directive",title:"repeat：高效列表渲染"},{slug:"class-style-map",title:"classMap 與 styleMap"},{slug:"until-async-directive",title:"until 與非同步資料"},{slug:"cache-guard-directives",title:"cache 與 guard 的效能優化"},{slug:"custom-directives",title:"撰寫自訂 Directive"}],content:`
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
        <td>拖曳重排（Drag & Drop）</td>
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
</section>
`};export{t as default};
