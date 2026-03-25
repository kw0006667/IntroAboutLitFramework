export default {
  id: 4,
  slug: 'chapter-4',
  title: 'Reactive Properties 與更新週期',
  part: 2,
  intro: '深入 @property、@state 裝飾器，理解 Lit 的 reactive update cycle，以及如何與瀏覽器的 microtask queue 協作。本章同時涵蓋 Reactive Controller 模式、自訂 Property Accessor、與進階的 PropertyValues 應用。',
  sections: [
    { slug: 'property-decorator', title: '@property 裝飾器深探' },
    { slug: 'state-decorator', title: '@state 內部狀態管理' },
    { slug: 'reactive-update-cycle', title: 'Reactive Update Cycle 原理' },
    { slug: 'microtask-queue', title: '與 Microtask Queue 的協作' },
    { slug: 'property-options', title: 'Property Options 進階配置' },
    { slug: 'observed-attributes', title: 'Observed Attributes 與 HTML Attributes' },
    { slug: 'custom-property-accessors', title: '自訂 Property Accessor 與攔截' },
    { slug: 'reactive-controller-pattern', title: 'Reactive Controller 模式深度解析' },
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

  <h3>Lit 內部如何使用 WeakMap 追蹤屬性變更</h3>
  <p>
    對於 React / Vue 開發者來說，Lit 的響應式系統看起來像「魔法」——屬性賦值自動觸發重新渲染，沒有任何 <code>setState()</code>。
    其背後的機制是 <strong>WeakMap + getter/setter 攔截</strong>。
  </p>
  <p>
    當 <code>@property()</code> 裝飾器被應用於一個類別屬性時，Lit 在類別原型（prototype）上定義了一對 getter/setter，以<strong>替換</strong>原本的直接屬性存取。
    實際的值不存放在 <code>this.name</code> 這個「槽」上，而是存放在一個以元素實例（<code>this</code>）為 key 的 <code>WeakMap</code> 中。
  </p>
  <p>
    使用 WeakMap 有兩個關鍵優勢：
  </p>
  <ul>
    <li><strong>記憶體安全</strong>：當元件實例被 GC 回收時，WeakMap 中對應的 entry 也會自動消失，不會造成記憶體洩漏。</li>
    <li><strong>原型共享</strong>：getter/setter 定義在原型上，由所有實例共享，而每個實例的值則獨立存放在 WeakMap 中。這比在每個實例上各自定義 getter/setter 更有效率。</li>
  </ul>

  <pre data-lang="typescript"><code class="language-typescript">// 概念性的 Lit 內部實作（簡化版）
// 實際程式碼更複雜，但核心概念如此：

const propertyStorage = new WeakMap&lt;LitElement, Map&lt;PropertyKey, unknown&gt;&gt;();

function defineReactiveProperty(
  proto: LitElement,
  name: PropertyKey,
  options: PropertyDeclaration
) {
  Object.defineProperty(proto, name, {
    get() {
      // 從 WeakMap 中取出此實例的屬性值
      return propertyStorage.get(this)?.get(name);
    },
    set(newValue: unknown) {
      const instanceProps = propertyStorage.get(this) ?? new Map();
      const oldValue = instanceProps.get(name);

      // 使用 hasChanged 函數判斷是否真的有變更
      const hasChanged = options.hasChanged ?? notEqual;
      if (hasChanged(newValue, oldValue)) {
        instanceProps.set(name, newValue);
        propertyStorage.set(this, instanceProps);
        // 通知 Lit 排程更新，傳入屬性名稱和舊值
        this.requestUpdate(name, oldValue);
      }
    },
    configurable: true,
    enumerable: true,
  });
}

// notEqual 是 Lit 預設的 hasChanged 實作
function notEqual(value: unknown, old: unknown): boolean {
  // NaN !== NaN 是 JavaScript 的特殊行為
  // Lit 利用這一點正確處理 NaN 的比較
  return old !== value &amp;&amp; (old === old || value === value);
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">與 Vue 3 的 Proxy 比較</div>
    <p>
      Vue 3 使用 <code>Proxy</code> 攔截整個物件的所有屬性存取，可以動態追蹤任意屬性（包含在宣告後新增的）。
      Lit 使用 <code>Object.defineProperty</code> 在原型上針對<em>已宣告</em>的屬性定義攔截。
      這意味著 Lit 的追蹤範圍是靜態的（只追蹤 <code>@property</code> 和 <code>@state</code> 宣告的屬性），
      而 Vue 3 的追蹤是動態的。Lit 的方式效能更可預測，但靈活性略低。
    </p>
  </div>
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

    if (this._query.length &gt;= 2) {
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

  <h3>@state vs @property 安全考量</h3>
  <p>
    對於有安全意識的 Senior 工程師，選擇 <code>@state</code> 還是 <code>@property</code>，以及是否加上 <code>reflect: true</code>，有深遠的安全影響：
  </p>
  <table>
    <thead>
      <tr>
        <th>情境</th>
        <th>建議</th>
        <th>原因</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>使用者 token / session id</td>
        <td><code>@state()</code>，絕不 <code>reflect</code></td>
        <td>避免 token 出現在 DOM 上，可被 CSS 選擇器或 <code>getAttribute</code> 存取，增加 XSS 洩漏面</td>
      </tr>
      <tr>
        <td>表單的密碼欄位值</td>
        <td><code>@state()</code></td>
        <td>敏感值不應序列化到 attribute，DevTools Element 面板不應顯示</td>
      </tr>
      <tr>
        <td>UI 顯示狀態（如 <code>disabled</code>）</td>
        <td><code>@property({ type: Boolean, reflect: true })</code></td>
        <td>需要讓 CSS 用 <code>[disabled]</code> 選擇器設定樣式，合理反映到 attribute</td>
      </tr>
      <tr>
        <td>複雜物件（如完整的使用者資料）</td>
        <td><code>@property()</code>，不 <code>reflect</code></td>
        <td>序列化複雜物件到 attribute 效能差，且無實際益處</td>
      </tr>
      <tr>
        <td>computed / 衍生值</td>
        <td>普通 private 屬性，在 <code>willUpdate()</code> 計算</td>
        <td>不需要響應式追蹤，<code>willUpdate</code> 在每次相關屬性變更時自動重算</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">reflect: true 的安全風險</div>
    <p>
      <code>reflect: true</code> 會將屬性值序列化並寫入 DOM attribute，任何可以存取 DOM 的程式碼（包含第三方腳本）都能用 <code>element.getAttribute('my-prop')</code> 讀取。
      如果你的元件接收來自外部的資料（如 API 回應），請謹慎評估哪些資料應該被 reflect。
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

  <h3>PropertyValues Map：深度解析</h3>
  <p>
    <code>willUpdate()</code>、<code>updated()</code>、<code>firstUpdated()</code> 和 <code>shouldUpdate()</code> 都接收一個 <code>changedProperties</code> 參數。
    在 Lit 3.x 中，這個參數的型別是 <code>PropertyValues</code>，它是 <code>Map&lt;PropertyKey, unknown&gt;</code> 的型別別名。
  </p>
  <p>
    這個 Map 儲存的是<strong>舊值</strong>（old values），以屬性名稱為 key。你可以用它做精準的條件判斷，避免不必要的計算：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('smart-chart')
class SmartChart extends LitElement {
  @property({ type: Array }) data: number[] = [];
  @property({ type: String }) chartType: 'bar' | 'line' = 'bar';
  @property({ type: Object }) options: ChartOptions = {};

  private _chartInstance: ChartLibrary | null = null;

  // 使用 PropertyValues 泛型來獲得更精確的型別
  willUpdate(changed: PropertyValues&lt;this&gt;) {
    // 第一種：用 has() 檢查屬性是否改變
    if (changed.has('data') || changed.has('chartType')) {
      // 當 data 或 chartType 改變時，重新計算處理後的資料集
      this._processedDataset = this._processData(this.data, this.chartType);
    }
  }

  updated(changed: PropertyValues&lt;this&gt;) {
    if (changed.has('chartType')) {
      // 從 Map 中取出舊值
      const prevType = changed.get('chartType') as string | undefined;
      console.log(\`圖表類型從 \${prevType} 改變為 \${this.chartType}\`);

      // 銷毀舊圖表實例，重建新的
      this._chartInstance?.destroy();
      this._initChart();
    } else if (changed.has('data')) {
      // 只有資料改變時，更新現有圖表（避免重建）
      this._chartInstance?.updateData(this._processedDataset);
    }

    if (changed.has('options')) {
      this._chartInstance?.setOptions(this.options);
    }
  }

  private _processedDataset: ProcessedData = [];

  private _processData(data: number[], type: string): ProcessedData {
    // 資料處理邏輯...
    return data.map((v, i) =&gt; ({ x: i, y: v }));
  }

  private _initChart() {
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (canvas) {
      this._chartInstance = new ChartLibrary(canvas, {
        type: this.chartType,
        data: this._processedDataset,
      });
    }
  }

  render() {
    return html\`&lt;canvas&gt;&lt;/canvas&gt;\`;
  }
}</code></pre>

  <h3>進階模式：computed properties 使用 willUpdate</h3>
  <p>
    來自 Vue 背景的開發者可能習慣使用 <code>computed()</code>。Lit 的等效模式是在 <code>willUpdate()</code> 中計算並存到普通 private 屬性中——而非使用 <code>@state()</code>，因為衍生值本身不需要響應式追蹤。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('cart-summary')
class CartSummary extends LitElement {
  @property({ type: Array }) items: CartItem[] = [];
  @property({ type: Number }) discountPercent = 0;

  // 衍生值：使用普通 private 屬性，在 willUpdate 中計算
  // 不使用 @state，因為它們完全由其他 @property 決定
  private _subtotal = 0;
  private _discount = 0;
  private _tax = 0;
  private _total = 0;

  willUpdate(changed: PropertyValues&lt;this&gt;) {
    if (changed.has('items') || changed.has('discountPercent')) {
      // 只在相關屬性改變時重算，避免每次更新都執行
      this._subtotal = this.items.reduce(
        (sum, item) =&gt; sum + item.price * item.quantity,
        0
      );
      this._discount = this._subtotal * (this.discountPercent / 100);
      this._tax = (this._subtotal - this._discount) * 0.05;
      this._total = this._subtotal - this._discount + this._tax;
    }
  }

  render() {
    return html\`
      &lt;dl&gt;
        &lt;dt&gt;小計&lt;/dt&gt;&lt;dd&gt;\${this._subtotal.toFixed(2)}&lt;/dd&gt;
        &lt;dt&gt;折扣 (\${this.discountPercent}%)&lt;/dt&gt;&lt;dd&gt;-\${this._discount.toFixed(2)}&lt;/dd&gt;
        &lt;dt&gt;稅金 (5%)&lt;/dt&gt;&lt;dd&gt;\${this._tax.toFixed(2)}&lt;/dd&gt;
        &lt;dt&gt;&lt;strong&gt;總計&lt;/strong&gt;&lt;/dt&gt;&lt;dd&gt;&lt;strong&gt;\${this._total.toFixed(2)}&lt;/strong&gt;&lt;/dd&gt;
      &lt;/dl&gt;
    \`;
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

  <h3>requestUpdate() 的內部機制</h3>
  <p>
    當你設定一個 <code>@property</code> 時，setter 會呼叫 <code>this.requestUpdate(name, oldValue)</code>。
    這個方法的邏輯大致如下：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 概念性實作（Lit 內部簡化版）
class ReactiveElement extends HTMLElement {
  // 追蹤目前這次更新週期中所有已改變的屬性
  private __changedProperties: Map&lt;PropertyKey, unknown&gt; = new Map();
  // 標記是否已排程更新
  private __updateScheduled = false;

  requestUpdate(name?: PropertyKey, oldValue?: unknown) {
    if (name !== undefined) {
      // 記錄改變的屬性和它的舊值
      // 如果同一屬性在同一週期改變多次，保留第一次的舊值
      if (!this.__changedProperties.has(name)) {
        this.__changedProperties.set(name, oldValue);
      }
    }

    // 只排程一次 microtask，避免重複
    if (!this.__updateScheduled) {
      this.__updateScheduled = true;
      // 這是整個機制的核心：Promise microtask
      this.__updatePromise = Promise.resolve().then(() =&gt; {
        this.__updateScheduled = false;
        this.__performUpdate();
      });
    }

    return this.__updatePromise;
  }

  private __performUpdate() {
    if (this.shouldUpdate(this.__changedProperties)) {
      this.willUpdate(this.__changedProperties);
      this.update(this.__changedProperties);    // 呼叫 render()
      this.__changedProperties = new Map();     // 清空已處理的變更
      this.updated(this.__changedProperties);
    }
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">為什麼第一次的舊值最重要</div>
    <p>
      注意上面的 <code>if (!this.__changedProperties.has(name))</code>。
      如果在同一個 microtask 週期中，同一個屬性被設定了多次，
      Lit 只記錄「第一次改變前的舊值」。
      這樣在 <code>updated()</code> 中，你拿到的 <code>changedProperties.get('value')</code>
      是這個更新週期開始前的最原始值，而 <code>this.value</code> 是最終值。
    </p>
  </div>

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

  <h3>深度解析：converter（fromAttribute / toAttribute）</h3>
  <p>
    <code>converter</code> 選項是控制 attribute ↔ property 轉換的關鍵。
    Lit 內建的 <code>type</code> 選項（<code>Number</code>、<code>Boolean</code> 等）本質上也是 converter 的快捷方式。
    對於複雜格式，自訂 converter 讓你精確控制序列化/反序列化邏輯：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 進階 converter 範例：支援 JSON 格式的 attribute
@customElement('config-panel')
class ConfigPanel extends LitElement {
  @property({
    // fromAttribute: HTML attribute 字串 → JS property 值
    converter: {
      fromAttribute(value: string | null): Record&lt;string, unknown&gt; {
        if (!value) return {};
        try {
          return JSON.parse(value);
        } catch {
          console.warn(\`[config-panel] 無效的 JSON attribute: \${value}\`);
          return {};
        }
      },
      // toAttribute: JS property 值 → HTML attribute 字串（用於 reflect）
      toAttribute(value: Record&lt;string, unknown&gt;): string {
        return JSON.stringify(value);
      },
    },
    reflect: true, // 若需要反映到 attribute
  })
  config: Record&lt;string, unknown&gt; = {};

  // 使用方式：
  // &lt;config-panel config='{"theme":"dark","lang":"zh-TW"}'&gt;&lt;/config-panel&gt;
  // 或透過 JS: element.config = { theme: 'dark', lang: 'zh-TW' };
}

// 日期型別的 converter（ISO 8601 字串 ↔ Date 物件）
const dateConverter = {
  fromAttribute: (value: string | null) =&gt;
    value ? new Date(value) : null,
  toAttribute: (value: Date | null) =&gt;
    value?.toISOString() ?? null,
};

@customElement('event-item')
class EventItem extends LitElement {
  @property({ converter: dateConverter, reflect: true })
  startDate: Date | null = null;
}</code></pre>

  <h3>深度解析：hasChanged（自訂變更偵測）</h3>
  <p>
    Lit 預設使用嚴格不等式（<code>!==</code>）判斷屬性是否改變。
    對於陣列和物件，每次賦值都會觸發更新（即使內容相同）。
    <code>hasChanged</code> 讓你控制這個行為：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 問題場景：陣列內容相同，但參考不同時不應觸發更新
@customElement('tag-list')
class TagList extends LitElement {
  @property({
    type: Array,
    // 只在陣列內容真正改變時才更新
    hasChanged(newTags: string[], oldTags: string[]): boolean {
      if (newTags.length !== oldTags.length) return true;
      return newTags.some((tag, i) =&gt; tag !== oldTags[i]);
    },
  })
  tags: string[] = [];
}

// 更通用的深度比較（注意：有效能成本，只用在確實需要的場合）
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return false; // Lit 的 hasChanged：true = 有變更
  // 若 a、b 不相等（=== false），才繼續深度比較
  // ...使用 structuredClone、lodash isEqual 等
  return JSON.stringify(a) === JSON.stringify(b)
    ? false  // 深度相等 → 沒有變更
    : true;  // 深度不等 → 有變更
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

  <div class="callout callout-warning">
    <div class="callout-title">reflect 的效能陷阱</div>
    <p>
      當一個有 <code>reflect: true</code> 的屬性改變時，Lit 呼叫 <code>setAttribute()</code>，
      這會再次觸發 <code>attributeChangedCallback</code>。Lit 內部有防護機制避免無限迴圈，
      但仍有額外的 DOM 操作成本。
      對於高頻更新的屬性（如動畫進度值），避免使用 <code>reflect: true</code>。
    </p>
  </div>
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

  <h3>屬性驗證模式</h3>
  <p>
    Lit 本身不提供屬性驗證機制，但有幾種模式可以在不違反 Lit 設計哲學的前提下實現驗證：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 模式 1：使用 hasChanged 阻止無效值觸發更新
@customElement('rating-widget')
class RatingWidget extends LitElement {
  @property({
    type: Number,
    hasChanged(newVal: number, oldVal: number): boolean {
      // 拒絕無效範圍的值：不更新、不渲染
      if (newVal &lt; 0 || newVal &gt; 5 || !Number.isInteger(newVal)) {
        console.warn(\`[rating-widget] 無效的 rating 值：\${newVal}，必須是 0-5 的整數\`);
        return false; // 告訴 Lit：沒有變更，不要更新
      }
      return newVal !== oldVal;
    },
  })
  rating = 0;
}

// 模式 2：使用自訂 setter（搭配 requestUpdate 手動控制）
@customElement('validated-input')
class ValidatedInput extends LitElement {
  private _maxLength = 100;

  get maxLength() { return this._maxLength; }

  // 注意：當使用自訂 getter/setter 時，
  // 需要手動呼叫 requestUpdate()
  set maxLength(value: number) {
    const old = this._maxLength;
    this._maxLength = Math.max(1, Math.min(1000, value)); // 夾在有效範圍內
    this.requestUpdate('maxLength', old);
  }
}

// 模式 3：在 willUpdate 中進行驗證和修正
@customElement('page-selector')
class PageSelector extends LitElement {
  @property({ type: Number }) currentPage = 1;
  @property({ type: Number }) totalPages = 1;

  willUpdate(changed: PropertyValues&lt;this&gt;) {
    // 確保 currentPage 在有效範圍內
    if (changed.has('currentPage') || changed.has('totalPages')) {
      if (this.currentPage &lt; 1) {
        this.currentPage = 1; // 這會再觸發一次 requestUpdate，但在同一 microtask 中合併
      } else if (this.currentPage &gt; this.totalPages) {
        this.currentPage = this.totalPages;
      }
    }
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

<section id="custom-property-accessors">
  <h2>自訂 Property Accessor 與攔截</h2>
  <p>
    有時候 <code>@property</code> 的預設行為不夠用——你需要在屬性設定時執行自訂邏輯、實作 computed property、或整合第三方程式庫。
    這時可以手動定義 getter/setter，完全控制屬性存取行為。
  </p>

  <h3>基本模式：自訂 getter/setter</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('color-picker')
class ColorPicker extends LitElement {
  // 宣告此屬性為響應式，但不使用裝飾器自動生成 accessor
  static properties = {
    color: { type: String },
  };

  // 手動管理屬性儲存
  private _color = '#ffffff';
  private _parsedColor: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 };

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    const old = this._color;
    // 驗證和正規化
    const normalized = value.startsWith('#') ? value.toLowerCase() : \`#\${value}\`.toLowerCase();

    if (normalized !== old) {
      this._color = normalized;
      // 同時更新解析後的 RGB 值（同步計算，避免在 render() 中重複計算）
      this._parsedColor = this._hexToRgb(normalized);
      // 手動觸發響應式更新
      this.requestUpdate('color', old);
    }
  }

  private _hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  render() {
    const { r, g, b } = this._parsedColor;
    return html\`
      &lt;div
        class="swatch"
        style="background-color: \${this._color}"
        title="RGB(\${r}, \${g}, \${b})"
      &gt;&lt;/div&gt;
      &lt;span&gt;\${this._color}&lt;/span&gt;
    \`;
  }
}</code></pre>

  <h3>進階模式：攔截屬性設定以觸發 Side Effects</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('video-player')
class VideoPlayer extends LitElement {
  private _videoEl: HTMLVideoElement | null = null;

  // 使用 @state 追蹤內部狀態，但用自訂 setter 攔截
  @state() private _isPlaying = false;

  // 代理屬性：設定時同步到真實 video 元素
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  set isPlaying(value: boolean) {
    if (value !== this._isPlaying) {
      this._isPlaying = value;
      // 當屬性改變時，同步到底層 DOM API
      if (this._videoEl) {
        if (value) {
          this._videoEl.play().catch(console.error);
        } else {
          this._videoEl.pause();
        }
      }
      // 不需要手動呼叫 requestUpdate，因為 _isPlaying 是 @state
    }
  }

  firstUpdated() {
    this._videoEl = this.shadowRoot?.querySelector('video') ?? null;
  }

  render() {
    return html\`
      &lt;video src=\${this.src}&gt;&lt;/video&gt;
      &lt;button @click=\${() =&gt; { this.isPlaying = !this.isPlaying; }}&gt;
        \${this._isPlaying ? '暫停' : '播放'}
      &lt;/button&gt;
    \`;
  }

  @property() src = '';
}</code></pre>

  <h3>與 @property 裝飾器並用的正確方式</h3>
  <p>
    如果你想同時享有 <code>@property</code> 的 attribute 同步功能，又需要自訂 setter，
    需要使用 <code>noAccessor: true</code> 選項，告訴 Lit 不要自動生成 accessor：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">@customElement('clamped-value')
class ClampedValue extends LitElement {
  // noAccessor: true → Lit 不會自動生成 getter/setter
  // 但仍會處理 attribute 同步（observedAttributes、attributeChangedCallback）
  @property({ type: Number, noAccessor: true })
  get value(): number {
    return this._value;
  }
  set value(v: number) {
    const old = this._value;
    // 自訂邏輯：夾在 0-100 之間
    this._value = Math.max(0, Math.min(100, v));
    this.requestUpdate('value', old);
  }

  private _value = 0;

  render() {
    return html\`&lt;progress value=\${this._value} max="100"&gt;&lt;/progress&gt;\`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">選擇正確的攔截層</div>
    <p>
      大多數「在屬性改變時執行邏輯」的需求，應該放在 <code>updated()</code> 或 <code>willUpdate()</code>，而非自訂 setter。
      自訂 setter 適合：值的正規化/驗證、同步到外部 API（如 DOM API）、或需要在<em>設定當下</em>（而非下一個 microtask）執行的邏輯。
    </p>
  </div>
</section>

<section id="reactive-controller-pattern">
  <h2>Reactive Controller 模式深度解析</h2>
  <p>
    <strong>Reactive Controller</strong> 是 Lit 3.x 引入的一種<em>行為共用機制</em>，
    用來解決「多個元件共用相同的響應式邏輯」的問題。
    它相當於 React Hooks 或 Vue Composables 的 Lit 版本，但更底層、更靈活。
  </p>

  <h3>ReactiveController 介面</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Lit 定義的 Controller 介面
interface ReactiveController {
  hostConnected?(): void;        // host 連接到 DOM 時
  hostDisconnected?(): void;     // host 從 DOM 斷開時
  hostUpdate?(): void;           // host 即將更新（在 willUpdate 之前）
  hostUpdated?(): void;          // host 更新完成（在 updated 之後）
}

// ReactiveControllerHost 介面（LitElement 已實作）
interface ReactiveControllerHost {
  addController(controller: ReactiveController): void;
  removeController(controller: ReactiveController): void;
  requestUpdate(): void;
  readonly updateComplete: Promise&lt;boolean&gt;;
}</code></pre>

  <h3>實作 1：Fetch Controller（資料載入控制器）</h3>
  <p>
    這是一個生產品質的 Fetch Controller，封裝了 fetch 的生命週期、取消機制、和錯誤處理：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// fetch-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export interface FetchState&lt;T&gt; {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export class FetchController&lt;T&gt; implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _abortController: AbortController | null = null;
  private _url: string | null = null;

  // Controller 自己維護狀態，透過 requestUpdate() 通知 host 重新渲染
  state: FetchState&lt;T&gt; = {
    data: null,
    loading: false,
    error: null,
  };

  constructor(host: ReactiveControllerHost) {
    this._host = host;
    // 向 host 登記此 controller
    host.addController(this);
  }

  // 在 host 連接到 DOM 時（什麼都不做，等待 fetch() 被呼叫）
  hostConnected() {}

  // 在 host 從 DOM 斷開時，取消進行中的請求
  hostDisconnected() {
    this._abortController?.abort();
    this._abortController = null;
  }

  // 公開 API：觸發 fetch 請求
  async fetch(url: string, options?: RequestInit): Promise&lt;void&gt; {
    // 取消上一個請求（如果還在進行中）
    this._abortController?.abort();
    this._abortController = new AbortController();

    this._url = url;
    this.state = { data: null, loading: true, error: null };
    // 通知 host 重新渲染（顯示 loading 狀態）
    this._host.requestUpdate();

    try {
      const response = await fetch(url, {
        ...options,
        signal: this._abortController.signal,
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const data: T = await response.json();
      this.state = { data, loading: false, error: null };
    } catch (err) {
      if (err instanceof Error &amp;&amp; err.name === 'AbortError') {
        // 被取消的請求：不更新狀態
        return;
      }
      this.state = {
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    } finally {
      this._abortController = null;
      // 通知 host 重新渲染（顯示最終狀態）
      this._host.requestUpdate();
    }
  }

  // 重試：使用上次的 URL
  retry() {
    if (this._url) {
      this.fetch(this._url);
    }
  }
}

// ─── 在元件中使用 ───
@customElement('user-profile')
class UserProfile extends LitElement {
  @property() userId = '';

  // 建立 FetchController，傳入 this（host）
  private _userFetch = new FetchController&lt;User&gt;(this);

  // 當 userId 改變時，觸發新的 fetch
  updated(changed: PropertyValues&lt;this&gt;) {
    if (changed.has('userId') &amp;&amp; this.userId) {
      this._userFetch.fetch(\`/api/users/\${this.userId}\`);
    }
  }

  render() {
    const { data, loading, error } = this._userFetch.state;

    if (loading) return html\`&lt;loading-spinner&gt;&lt;/loading-spinner&gt;\`;
    if (error) return html\`
      &lt;error-banner .message=\${error.message}&gt;&lt;/error-banner&gt;
      &lt;button @click=\${() =&gt; this._userFetch.retry()}&gt;重試&lt;/button&gt;
    \`;
    if (!data) return html\`&lt;p&gt;請輸入使用者 ID&lt;/p&gt;\`;

    return html\`
      &lt;h2&gt;\${data.name}&lt;/h2&gt;
      &lt;p&gt;\${data.email}&lt;/p&gt;
    \`;
  }
}</code></pre>

  <h3>實作 2：Form Controller（表單狀態控制器）</h3>
  <p>
    封裝表單驗證、髒值追蹤、和提交邏輯的 Controller：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// form-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export type ValidationRule&lt;T&gt; = (value: T) =&gt; string | null;

export interface FieldConfig&lt;T&gt; {
  initialValue: T;
  rules?: ValidationRule&lt;T&gt;[];
}

export class FormController&lt;T extends Record&lt;string, unknown&gt;&gt;
  implements ReactiveController
{
  private _host: ReactiveControllerHost;

  // 表單狀態
  values: T;
  errors: Partial&lt;Record&lt;keyof T, string&gt;&gt; = {};
  touched: Partial&lt;Record&lt;keyof T, boolean&gt;&gt; = {};
  submitting = false;

  private _initialValues: T;
  private _rules: Partial&lt;Record&lt;keyof T, ValidationRule&lt;unknown&gt;[]&gt;&gt;;

  constructor(
    host: ReactiveControllerHost,
    config: { fields: { [K in keyof T]: FieldConfig&lt;T[K]&gt; } }
  ) {
    this._host = host;
    host.addController(this);

    // 從 config 提取初始值和驗證規則
    const initialValues = {} as T;
    this._rules = {};

    for (const key in config.fields) {
      const field = config.fields[key];
      initialValues[key] = field.initialValue;
      if (field.rules) {
        this._rules[key] = field.rules as ValidationRule&lt;unknown&gt;[];
      }
    }

    this._initialValues = { ...initialValues };
    this.values = { ...initialValues };
  }

  hostConnected() {}
  hostDisconnected() {}

  // 設定欄位值
  setValue&lt;K extends keyof T&gt;(field: K, value: T[K]) {
    this.values = { ...this.values, [field]: value };
    this.touched = { ...this.touched, [field]: true };
    // 即時驗證
    this._validateField(field, value);
    this._host.requestUpdate();
  }

  // 驗證單一欄位
  private _validateField&lt;K extends keyof T&gt;(field: K, value: T[K]) {
    const rules = this._rules[field];
    if (!rules) return;

    for (const rule of rules) {
      const error = rule(value as unknown);
      if (error) {
        this.errors = { ...this.errors, [field]: error };
        return;
      }
    }
    // 所有規則通過：清除錯誤
    const { [field]: _, ...rest } = this.errors;
    this.errors = rest as typeof this.errors;
  }

  // 驗證所有欄位
  private _validateAll(): boolean {
    let isValid = true;
    for (const key in this.values) {
      this._validateField(key as keyof T, this.values[key as keyof T]);
      if (this.errors[key as keyof T]) isValid = false;
    }
    return isValid;
  }

  // 取得欄位的 isDirty 狀態
  isDirty(field?: keyof T): boolean {
    if (field) {
      return this.values[field] !== this._initialValues[field];
    }
    return (Object.keys(this.values) as (keyof T)[]).some(
      key =&gt; this.values[key] !== this._initialValues[key]
    );
  }

  // 提交表單
  async submit(handler: (values: T) =&gt; Promise&lt;void&gt;): Promise&lt;void&gt; {
    // 標記所有欄位為 touched
    this.touched = Object.keys(this.values).reduce(
      (acc, key) =&gt; ({ ...acc, [key]: true }),
      {} as typeof this.touched
    );

    if (!this._validateAll()) {
      this._host.requestUpdate();
      return;
    }

    this.submitting = true;
    this._host.requestUpdate();

    try {
      await handler(this.values);
      // 重設表單到初始值
      this.values = { ...this._initialValues };
      this.errors = {};
      this.touched = {};
    } finally {
      this.submitting = false;
      this._host.requestUpdate();
    }
  }

  // 重設表單
  reset() {
    this.values = { ...this._initialValues };
    this.errors = {};
    this.touched = {};
    this.submitting = false;
    this._host.requestUpdate();
  }
}

// ─── 在元件中使用 ───
interface LoginForm {
  email: string;
  password: string;
}

@customElement('login-form')
class LoginFormElement extends LitElement {
  private _form = new FormController&lt;LoginForm&gt;(this, {
    fields: {
      email: {
        initialValue: '',
        rules: [
          v =&gt; (!v ? 'Email 為必填' : null),
          v =&gt; (!/^[^@]+@[^@]+$/.test(String(v)) ? '請輸入有效的 Email' : null),
        ],
      },
      password: {
        initialValue: '',
        rules: [
          v =&gt; (!v ? '密碼為必填' : null),
          v =&gt; (String(v).length &lt; 8 ? '密碼至少需要 8 個字元' : null),
        ],
      },
    },
  });

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    await this._form.submit(async (values) =&gt; {
      await authService.login(values.email, values.password);
      this.dispatchEvent(new CustomEvent('login-success'));
    });
  }

  render() {
    const { values, errors, touched, submitting } = this._form;

    return html\`
      &lt;form @submit=\${this._handleSubmit}&gt;
        &lt;div&gt;
          &lt;input
            type="email"
            .value=\${values.email}
            @input=\${(e: InputEvent) =&gt;
              this._form.setValue('email', (e.target as HTMLInputElement).value)}
          /&gt;
          \${touched.email &amp;&amp; errors.email
            ? html\`&lt;span class="error"&gt;\${errors.email}&lt;/span&gt;\`
            : ''}
        &lt;/div&gt;
        &lt;div&gt;
          &lt;input
            type="password"
            .value=\${values.password}
            @input=\${(e: InputEvent) =&gt;
              this._form.setValue('password', (e.target as HTMLInputElement).value)}
          /&gt;
          \${touched.password &amp;&amp; errors.password
            ? html\`&lt;span class="error"&gt;\${errors.password}&lt;/span&gt;\`
            : ''}
        &lt;/div&gt;
        &lt;button type="submit" ?disabled=\${submitting}&gt;
          \${submitting ? '登入中...' : '登入'}
        &lt;/button&gt;
      &lt;/form&gt;
    \`;
  }
}</code></pre>

  <h3>Reactive Controller vs React Hooks vs Vue Composables</h3>
  <table>
    <thead>
      <tr>
        <th>特性</th>
        <th>React Hooks</th>
        <th>Vue Composables</th>
        <th>Lit Reactive Controller</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>依賴框架</td>
        <td>強依賴 React（只在函數元件中使用）</td>
        <td>強依賴 Vue（需要 setup() 上下文）</td>
        <td>輕依賴 Lit（透過介面解耦）</td>
      </tr>
      <tr>
        <td>狀態觸發</td>
        <td>setState 觸發整個元件重新渲染</td>
        <td>reactive refs 自動追蹤</td>
        <td>手動呼叫 host.requestUpdate()</td>
      </tr>
      <tr>
        <td>生命週期存取</td>
        <td>useEffect 統一處理</td>
        <td>onMounted、onUnmounted 等</td>
        <td>hostConnected、hostDisconnected、hostUpdated 等</td>
      </tr>
      <tr>
        <td>可測試性</td>
        <td>需要 React 測試環境</td>
        <td>需要 Vue 測試環境</td>
        <td>可獨立測試（mock host 即可）</td>
      </tr>
      <tr>
        <td>共享性</td>
        <td>只能在 React 元件中使用</td>
        <td>只能在 Vue 元件中使用</td>
        <td>可在任何實作 ReactiveControllerHost 的類別中使用</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">Controller 組合</div>
    <p>
      多個 Controller 可以在同一個元件中共存，也可以互相組合。
      例如，一個 <code>AuthController</code> 可以在內部使用 <code>FetchController</code>，
      實現更高階的抽象。這種組合模式比 React 的 Hook 組合更明確，因為依賴關係是顯式的。
    </p>
  </div>
</section>
`,
};
