export default {
  id: 4,
  slug: 'chapter-4',
  title: 'Reactive Properties 與更新週期',
  part: 2,
  intro: '深入 @property、@state 裝飾器，理解 Lit 的 reactive update cycle，以及如何與瀏覽器的 microtask queue 協作。',
  sections: [
    { slug: 'property-decorator', title: '@property 裝飾器深探' },
    { slug: 'state-decorator', title: '@state 內部狀態管理' },
    { slug: 'reactive-update-cycle', title: 'Reactive Update Cycle 原理' },
    { slug: 'microtask-queue', title: '與 Microtask Queue 的協作' },
    { slug: 'property-options', title: 'Property Options 進階配置' },
    { slug: 'observed-attributes', title: 'Observed Attributes 與 HTML Attributes' },
  ],
  content: `
<section id="property-decorator">
  <h2>@property 裝飾器深探</h2>
  <p>
    <code>@property</code> 裝飾器是 Lit 的核心機制之一，
    它將一個類別屬性轉換為<strong>響應式公開屬性</strong>：
    當屬性值改變時，元件自動排程重新渲染。
  </p>
  <p>
    <code>@property</code> 同時處理兩件事：
    JavaScript Property（JS 屬性）和 HTML Attribute（HTML 屬性）的同步。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('user-card')
class UserCard extends LitElement {
  // 類型：String（預設）
  @property() name = '';

  // 類型：Number（自動從 attribute 字串轉換）
  @property({ type: Number }) age = 0;

  // 類型：Boolean
  @property({ type: Boolean }) active = false;

  // 類型：Array（複雜物件不自動與 attribute 同步）
  @property({ type: Array }) tags: string[] = [];

  render() {
    return html\`
      &lt;div class=\${this.active ? 'active' : ''}&gt;
        \${this.name}, \${this.age} 歲
        \${this.tags.map(t =&gt; html\`&lt;span class="tag"&gt;\${t}&lt;/span&gt;\`)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>JS Property vs HTML Attribute</h3>
  <p>
    理解 Property 和 Attribute 的區別是關鍵：
  </p>
  <ul>
    <li>
      <strong>HTML Attribute</strong>：HTML 標籤上的屬性，只能是字串。
      例如 <code>&lt;user-card name="Tim" age="30"&gt;</code>
    </li>
    <li>
      <strong>JS Property</strong>：JavaScript 物件的屬性，可以是任何型別。
      例如 <code>element.tags = ['js', 'web']</code>
    </li>
  </ul>
  <p>
    <code>@property({ type: Number })</code> 告訴 Lit：
    當 HTML Attribute <code>age="30"</code> 被設定時，
    自動將字串 <code>"30"</code> 轉換為數字 <code>30</code>，
    並賦值給 JS Property <code>this.age</code>。
  </p>
</section>

<section id="state-decorator">
  <h2>@state 內部狀態管理</h2>
  <p>
    <code>@state</code> 裝飾器用於<strong>元件的私有內部狀態</strong>。
    它與 <code>@property</code> 的主要差異：
  </p>
  <ul>
    <li>不與 HTML Attribute 同步（不能從外部 HTML 設定）</li>
    <li>不反映到 Attribute（不會出現在 HTML 上）</li>
    <li>改變時同樣觸發響應式重新渲染</li>
    <li>本質上是 <code>@property({ state: true, attribute: false })</code> 的語法糖</li>
  </ul>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('search-box')
class SearchBox extends LitElement {
  // 公開屬性：外部可設定
  @property() placeholder = '搜尋...';

  // 私有狀態：只在內部使用
  @state() private _query = '';
  @state() private _results: string[] = [];
  @state() private _loading = false;

  private async _handleInput(e: InputEvent) {
    this._query = (e.target as HTMLInputElement).value;

    if (this._query.length >= 2) {
      this._loading = true;
      this._results = await fetchResults(this._query);
      this._loading = false;
    } else {
      this._results = [];
    }
  }

  render() {
    return html\`
      &lt;div class="search"&gt;
        &lt;input
          .value=\${this._query}
          placeholder=\${this.placeholder}
          @input=\${this._handleInput}
        /&gt;
        \${this._loading
          ? html\`&lt;span&gt;搜尋中...&lt;/span&gt;\`
          : html\`
            &lt;ul&gt;
              \${this._results.map(r =&gt; html\`&lt;li&gt;\${r}&lt;/li&gt;\`)}
            &lt;/ul&gt;
          \`}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">慣例</div>
    <p>
      一個廣泛使用的慣例：用底線前綴（<code>_query</code>）表示私有狀態，
      搭配 TypeScript 的 <code>private</code> 關鍵字，
      讓程式碼的意圖更清晰。
    </p>
  </div>
</section>

<section id="reactive-update-cycle">
  <h2>Reactive Update Cycle 原理</h2>
  <p>
    Lit 的響應式更新週期是一個精心設計的<strong>批次更新機制</strong>。
    理解它有助於優化效能，避免不必要的渲染。
  </p>

  <h3>更新週期的五個階段</h3>

  <h4>1. 觸發（Trigger）</h4>
  <p>
    當 Reactive Property 改變時，Lit 呼叫 <code>requestUpdate()</code>，
    標記元件為「需要更新」。
    多個屬性在同一個同步程式碼塊中改變，只會觸發<strong>一次</strong>更新排程。
  </p>

  <h4>2. 排程（Schedule）</h4>
  <p>
    Lit 使用 <code>Promise.resolve().then()</code>（Microtask）排程更新，
    而非 <code>setTimeout</code>（Macrotask）。
    這意味著更新發生在當前同步程式碼完成後，但在下一個瀏覽器渲染幀之前。
  </p>

  <h4>3. 準備（Prepare — willUpdate）</h4>
  <p>
    Lit 呼叫 <code>willUpdate(changedProperties)</code>，
    這是在渲染前最後一個可以計算衍生值（derived values）的時機。
  </p>

  <h4>4. 渲染（Render）</h4>
  <p>
    Lit 呼叫 <code>render()</code>，
    使用 lit-html 的 Part 系統更新 DOM 中實際改變的部分。
  </p>

  <h4>5. 完成（Complete — updated）</h4>
  <p>
    Lit 呼叫 <code>updated(changedProperties)</code>，
    並解析 <code>updateComplete</code> Promise，
    讓外部程式碼可以等待更新完成。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('update-demo')
class UpdateDemo extends LitElement {
  @property({ type: Number }) value = 0;

  // willUpdate：渲染前的計算
  willUpdate(changedProperties: Map&lt;string, unknown&gt;) {
    if (changedProperties.has('value')) {
      this._doubled = this.value * 2;
    }
  }

  private _doubled = 0;

  render() {
    return html\`
      &lt;p&gt;Value: \${this.value}&lt;/p&gt;
      &lt;p&gt;Doubled: \${this._doubled}&lt;/p&gt;
    \`;
  }

  // updated：渲染後的副作用
  updated(changedProperties: Map&lt;string, unknown&gt;) {
    if (changedProperties.has('value')) {
      console.log('Value 已更新到：', this.value);
    }
  }
}</code></pre>

  <h3>批次更新的展示</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 這三個屬性改變只會觸發一次渲染
element.firstName = 'Tim';
element.lastName = 'Chang';
element.age = 30;
// Lit 批次這些改變為一次 microtask 更新</code></pre>
</section>

<section id="microtask-queue">
  <h2>與 Microtask Queue 的協作</h2>
  <p>
    Lit 使用 Microtask（微任務）排程更新，這個選擇有深刻的原因。
  </p>

  <h3>Macrotask vs Microtask</h3>
  <table>
    <thead>
      <tr><th>特性</th><th>Macrotask（setTimeout/setInterval）</th><th>Microtask（Promise.then）</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>執行時機</td>
        <td>在當前渲染幀完成後，下一個事件循環迭代</td>
        <td>在當前同步程式碼完成後，立即執行</td>
      </tr>
      <tr>
        <td>延遲</td>
        <td>至少 4ms（瀏覽器最小定時器精度）</td>
        <td>幾乎無延遲</td>
      </tr>
      <tr>
        <td>瀏覽器渲染</td>
        <td>可能在兩個渲染幀之間</td>
        <td>在渲染幀之前完成</td>
      </tr>
    </tbody>
  </table>

  <p>
    Lit 使用 Microtask 的優勢：在同一個事件處理函數中的多個屬性改變，
    都在同一個 Microtask 中批次處理，
    確保使用者看到的是<strong>一致的最終狀態</strong>，而非中間狀態。
  </p>

  <h3>等待更新完成</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 等待 DOM 更新完成後再操作
async function updateAndMeasure(element: MyElement) {
  element.data = newData;

  // DOM 尚未更新
  console.log('更新前', element.shadowRoot?.querySelector('.item'));

  // 等待 Lit 完成 DOM 更新
  await element.updateComplete;

  // DOM 已更新
  console.log('更新後', element.shadowRoot?.querySelector('.item'));
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">避免在 updated() 中修改屬性</div>
    <p>
      在 <code>updated()</code> 鉤子中修改屬性會觸發新一輪更新週期，
      可能導致無限更新循環。如果確實需要，請加上條件判斷，
      確保只在必要時才修改。
    </p>
  </div>
</section>

<section id="property-options">
  <h2>Property Options 進階配置</h2>
  <p>
    <code>@property(options)</code> 接受一個選項物件，提供細粒度的控制：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('advanced-props')
class AdvancedProps extends LitElement {
  // attribute: 控制 HTML attribute 名稱（預設為 camelCase 轉 kebab-case）
  @property({ attribute: 'user-name' }) userName = '';

  // reflect: 將 JS property 反映回 HTML attribute（謹慎使用）
  @property({ type: Boolean, reflect: true }) active = false;

  // converter: 自訂型別轉換邏輯
  @property({
    converter: {
      fromAttribute(value: string | null) {
        return value ? value.split(',').map(s =&gt; s.trim()) : [];
      },
      toAttribute(value: string[]) {
        return value.join(',');
      },
    },
  })
  tags: string[] = [];

  // hasChanged: 自訂變更偵測邏輯
  @property({
    hasChanged(newVal: object, oldVal: object) {
      // 深度比較（預設是淺層 !==）
      return JSON.stringify(newVal) !== JSON.stringify(oldVal);
    },
  })
  config: Record&lt;string, unknown&gt; = {};
}</code></pre>

  <h3>reflect 的謹慎使用</h3>
  <p>
    <code>reflect: true</code> 會在每次屬性改變時將值寫入 HTML Attribute，
    這有額外的效能成本。只在以下情況使用：
  </p>
  <ul>
    <li>需要用 CSS 屬性選擇器（<code>[active]</code>）設定樣式</li>
    <li>需要讓外部程式碼透過 <code>getAttribute()</code> 讀取當前值</li>
    <li>需要在 DevTools 中直觀看到屬性狀態</li>
  </ul>
</section>

<section id="observed-attributes">
  <h2>Observed Attributes 與 HTML Attributes</h2>
  <p>
    當你使用 <code>@property()</code> 時，Lit 在底層自動處理
    <code>observedAttributes</code> 和 <code>attributeChangedCallback</code>：
  </p>

  <pre data-lang="javascript"><code class="language-javascript">// Lit 在底層等效於（不需要手動寫）：
class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'age', 'active'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'age') {
      this.age = Number(newValue); // 型別轉換
    } else if (name === 'active') {
      this.active = newValue !== null; // Boolean 轉換
    } else {
      this[name] = newValue;
    }
    this.requestUpdate(name, oldValue);
  }
}</code></pre>

  <h3>何時需要手動處理 Attributes</h3>
  <p>
    大多數情況下，<code>@property()</code> 足夠了。
    但在以下場景可能需要手動覆寫：
  </p>
  <ul>
    <li>複雜的 attribute 格式（JSON、自訂序列化格式）</li>
    <li>需要在 attribute 改變時執行 side effects（但這更適合放在 <code>updated()</code>）</li>
    <li>繼承自非 LitElement 的基礎類別，且已有自己的 <code>attributeChangedCallback</code></li>
  </ul>
</section>
`,
};
