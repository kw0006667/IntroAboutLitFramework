export default {
  id: 5,
  slug: 'chapter-5',
  title: 'lit-html 模板引擎：Tagged Template Literals 的威力',
  part: 2,
  intro: '為什麼 Lit 不需要 Virtual DOM？解析 html`` 背後的 Part 系統，以及它如何實現精準的 DOM 更新。本章深入 TemplateResult 編譯原理、進階 Binding 模式、安全性考量，以及 Trusted Types 整合。',
  sections: [
    { slug: 'tagged-template-literals', title: 'Tagged Template Literals 原理' },
    { slug: 'why-no-vdom', title: '為何不需要 Virtual DOM？' },
    { slug: 'part-system', title: 'Part 系統：精準 DOM 更新' },
    { slug: 'binding-types', title: '五種 Binding 類型' },
    { slug: 'dynamic-templates', title: '動態模板與條件渲染' },
    { slug: 'template-caching', title: '模板快取機制' },
    { slug: 'template-internals', title: 'Template 編譯原理：TemplateResult 到 DOM' },
    { slug: 'advanced-binding-patterns', title: '進階 Binding 模式與邊緣案例' },
    { slug: 'trusted-types-csp', title: 'Trusted Types 與 CSP 整合' },
  ],
  content: `
<section id="tagged-template-literals">
  <h2>Tagged Template Literals 原理</h2>
  <p>
    Tagged Template Literals 是 ES2015 的 JavaScript 特性，
    是 lit-html 能夠高效運作的基礎。
    理解它的運作方式，是理解 Lit 為何如此快速的關鍵。
  </p>

  <h3>普通模板字串 vs Tagged 模板字串</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 普通模板字串：返回字串
const greeting = \`Hello, \${name}!\`;  // "Hello, Tim!"

// Tagged 模板字串：呼叫一個標籤函數
const result = html\`Hello, \${name}!\`;
// 等同於：html(['Hello, ', '!'], name)</code></pre>

  <h3>標籤函數接收的參數</h3>
  <pre data-lang="javascript"><code class="language-javascript">function myTag(strings, ...values) {
  console.log(strings); // ['Hello, ', '! You are ', ' years old.']
  console.log(values);  // ['Tim', 30]
  // strings 是靜態部分（不變的 HTML）
  // values 是動態部分（變化的資料）
}

myTag\`Hello, \${'Tim'}! You are \${30} years old.\`;</code></pre>

  <h3>關鍵洞察：strings 陣列是永久不變的</h3>
  <p>
    這是 lit-html 效率的核心秘密。每次 <code>html\`...\`</code> 被執行時，
    JavaScript 引擎保證 <code>strings</code> 陣列（靜態 HTML 部分）
    <strong>永遠是同一個物件參考</strong>。
    只有 <code>values</code>（動態部分）可能改變。
  </p>
  <pre data-lang="javascript"><code class="language-javascript">function render(name, age) {
  return html\`&lt;p&gt;\${name} is \${age} years old.&lt;/p&gt;\`;
}

// 第一次呼叫
const t1 = render('Tim', 30);
// 第二次呼叫
const t2 = render('Alice', 25);

// t1.strings === t2.strings  // true！完全相同的物件
// t1.values  !== t2.values   // false，值不同</code></pre>
  <p>
    lit-html 利用這個特性：只有在第一次看到某個 <code>strings</code> 陣列時，
    才解析 HTML 結構並建立 DOM 節點。
    後續的渲染直接更新動態部分，<strong>跳過 HTML 解析步驟</strong>。
  </p>
</section>

<section id="why-no-vdom">
  <h2>為何不需要 Virtual DOM？</h2>
  <p>
    Virtual DOM 的核心思路是：
    每次更新時建立整個 UI 的虛擬樹，
    與上次的虛擬樹比較（diff），
    找出差異，最小化真實 DOM 操作。
  </p>
  <p>
    這個方法的問題在於：<strong>diff 本身有成本</strong>。
    即使 DOM 不需要任何更新，React 也需要遍歷整個虛擬樹做比較。
    元件數量越多，diff 越慢。
  </p>

  <h3>lit-html 的不同思路</h3>
  <p>
    lit-html 採用了截然不同的策略：
  </p>
  <ol>
    <li>
      <strong>解析階段（一次性）</strong>：第一次看到某個模板時，
      解析靜態 HTML，找到所有需要動態更新的「位置」（Part），
      建立真實 DOM 節點，記錄需要更新的 DOM 節點參考。
    </li>
    <li>
      <strong>更新階段（每次）</strong>：後續更新時，
      直接比較新舊 <code>values</code>（動態部分），
      只更新<em>確實改變的</em> DOM 節點，跳過靜態部分。
    </li>
  </ol>

  <div class="callout callout-info">
    <div class="callout-title">關鍵差異</div>
    <p>
      Virtual DOM 的 diff 是對整個 UI 樹的「全體比較」，是 O(n) 的操作。
      lit-html 的更新是「精準點更新」，只比較和更新真正動態的部分，
      更接近 O(k)，其中 k 是動態 binding 的數量，通常遠小於 n。
    </p>
  </div>
</section>

<section id="part-system">
  <h2>Part 系統：精準 DOM 更新</h2>
  <p>
    「Part」是 lit-html 中代表「模板中一個動態位置」的概念。
    每個 <code>\${...}</code> 表達式對應一個 Part。
  </p>

  <h3>Part 的類型</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- ChildPart：在元素內容中 --&gt;
&lt;p&gt;\${this.message}&lt;/p&gt;

&lt;!-- AttributePart：在元素屬性中 --&gt;
&lt;div class="\${this.className}"&gt;&lt;/div&gt;

&lt;!-- EventPart：事件綁定 --&gt;
&lt;button @click="\${this.handleClick}"&gt;&lt;/button&gt;

&lt;!-- PropertyPart：DOM property 設定 --&gt;
&lt;input .value="\${this.inputValue}"&gt;

&lt;!-- BooleanAttributePart：布林屬性 --&gt;
&lt;button ?disabled="\${this.isDisabled}"&gt;&lt;/button&gt;</code></pre>

  <h3>模板快取與 Part 追蹤</h3>
  <p>
    lit-html 在第一次渲染時：
  </p>
  <ol>
    <li>用 <code>&lt;template&gt;</code> 元素解析靜態 HTML（瀏覽器內建 HTML 解析器）</li>
    <li>用 <code>TreeWalker</code> 遍歷模板 DOM，找到每個 Part 的位置</li>
    <li>Clone 模板建立真實 DOM</li>
    <li>為每個動態位置建立 Part 物件，持有 DOM 節點參考</li>
    <li>以 <code>strings</code> 陣列作為快取 key，儲存這個模板結構</li>
  </ol>
  <p>
    後續更新時，直接找到對應的 Part 物件，
    比較新舊值，只在值改變時執行 DOM 操作。
  </p>
</section>

<section id="binding-types">
  <h2>五種 Binding 類型</h2>

  <h3>1. Child Binding（子節點綁定）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 字串、數字：直接設定文字節點
html\`&lt;p&gt;\${this.message}&lt;/p&gt;\`

// TemplateResult：巢狀模板（最常見）
html\`&lt;div&gt;\${html\`&lt;span&gt;巢狀模板&lt;/span&gt;\`}&lt;/div&gt;\`

// nothing：移除節點
import { nothing } from 'lit';
html\`&lt;div&gt;\${this.show ? html\`&lt;span&gt;顯示&lt;/span&gt;\` : nothing}&lt;/div&gt;\`

// Array / Iterable：渲染列表
html\`&lt;ul&gt;\${this.items.map(item =&gt; html\`&lt;li&gt;\${item}&lt;/li&gt;\`)}&lt;/ul&gt;\`

// Promise：非同步渲染（需搭配 until directive）
html\`\${until(fetchData(), html\`&lt;span&gt;載入中...&lt;/span&gt;\`)}\`</code></pre>

  <h3>2. Attribute Binding（屬性綁定）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 字串插值：設定 HTML attribute
html\`&lt;div class="card \${this.variant}"&gt;&lt;/div&gt;\`

// 動態多個值組合
html\`&lt;div id="\${this.prefix}-\${this.id}"&gt;&lt;/div&gt;\`</code></pre>

  <h3>3. Property Binding（屬性綁定，使用 .）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// . 前綴：設定 DOM Property（非 attribute）
// 適合設定複雜物件、陣列，或 .value 之類的 DOM property
html\`&lt;input .value=\${this.inputValue}&gt;\`
html\`&lt;custom-element .data=\${this.complexObject}&gt;\`

// 為什麼需要 . 前綴？
// class="..." 設定 attribute（字串）
// .className=... 設定 property（字串）
// 區別在複雜物件時很重要：
// list="[1,2,3]" 設定字串 attribute（元件無法直接使用）
// .list=${[1,2,3]} 設定 array property（元件直接使用）</code></pre>

  <h3>4. Event Binding（事件綁定，使用 @）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// @ 前綴：addEventListener 的語法糖
html\`&lt;button @click=\${this.handleClick}&gt;點擊&lt;/button&gt;\`

// 傳遞額外參數：使用箭頭函數
html\`&lt;button @click=\${(e) =&gt; this.handleClick(e, item)}&gt;\${item.name}&lt;/button&gt;\`

// 使用事件選項（passive、capture、once）
html\`&lt;div @scroll=\${{ handleEvent: this.onScroll, passive: true }}&gt;\`

// 重要：避免在模板中建立匿名箭頭函數（每次渲染都是新函數）
// 最佳實踐：使用 class method
@customElement('my-el')
class MyEl extends LitElement {
  // ✓ 好：class method 是穩定的參考
  private _handleClick = (e: Event) =&gt; {
    console.log('clicked');
  };

  render() {
    return html\`&lt;button @click=\${this._handleClick}&gt;OK&lt;/button&gt;\`;
    // ✗ 壞：每次渲染都建立新函數，導致 lit-html 認為需要更新
    // return html\`&lt;button @click=\${() =&gt; console.log('clicked')}&gt;OK&lt;/button&gt;\`;
  }
}</code></pre>

  <h3>5. Boolean Attribute Binding（使用 ?）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// ? 前綴：布林屬性的正確設定方式
// true  → 加上 attribute：&lt;button disabled&gt;
// false → 移除 attribute：&lt;button&gt;
html\`&lt;button ?disabled=\${this.loading}&gt;提交&lt;/button&gt;\`
html\`&lt;input ?required=\${this.isRequired}&gt;\`
html\`&lt;details ?open=\${this.isExpanded}&gt;\`</code></pre>
</section>

<section id="dynamic-templates">
  <h2>動態模板與條件渲染</h2>

  <h3>條件渲染的幾種模式</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 模式 1：三元運算子（最常用）
render() {
  return html\`
    \${this.isLoggedIn
      ? html\`&lt;user-dashboard .user=\${this.user}&gt;&lt;/user-dashboard&gt;\`
      : html\`&lt;login-form&gt;&lt;/login-form&gt;\`
    }
  \`;
}

// 模式 2：nothing 移除節點
import { nothing } from 'lit';
render() {
  return html\`
    \${this.hasError ? html\`&lt;error-banner .message=\${this.error}&gt;&lt;/error-banner&gt;\` : nothing}
    &lt;main-content&gt;&lt;/main-content&gt;
  \`;
}

// 模式 3：抽取為 getter 或 method（推薦用於複雜邏輯）
get _content() {
  if (this.loading) return html\`&lt;loading-spinner&gt;&lt;/loading-spinner&gt;\`;
  if (this.error) return html\`&lt;error-state .error=\${this.error}&gt;&lt;/error-state&gt;\`;
  return html\`&lt;data-view .data=\${this.data}&gt;&lt;/data-view&gt;\`;
}

render() {
  return html\`&lt;div class="container"&gt;\${this._content}&lt;/div&gt;\`;
}</code></pre>

  <h3>列表渲染</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 基本列表：適合靜態或低頻更新
render() {
  return html\`
    &lt;ul&gt;
      \${this.items.map(item =&gt; html\`
        &lt;li&gt;\${item.name}&lt;/li&gt;
      \`)}
    &lt;/ul&gt;
  \`;
}

// 使用 repeat directive：適合頻繁重排的列表（見 Chapter 7）
import { repeat } from 'lit/directives/repeat.js';
render() {
  return html\`
    &lt;ul&gt;
      \${repeat(
        this.items,
        item =&gt; item.id,  // key function
        item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`
      )}
    &lt;/ul&gt;
  \`;
}</code></pre>
</section>

<section id="template-caching">
  <h2>模板快取機制</h2>
  <p>
    lit-html 的快取基於兩個層面：
  </p>

  <h3>1. Template 層面快取</h3>
  <p>
    以 <code>strings</code> 陣列作為 WeakMap 的 key，
    快取解析後的模板結構（Part 位置資訊）。
    只要靜態 HTML 相同，不管調用多少次，都共享同一份解析結果。
  </p>

  <h3>2. TemplateInstance 層面快取</h3>
  <p>
    每次 <code>render()</code> 調用時，
    如果新模板的 <code>strings</code> 與上次相同，
    lit-html 會複用已存在的 DOM 節點，只更新動態值。
    如果 <code>strings</code> 改變（完全不同的模板），
    才會建立全新的 DOM 節點。
  </p>

  <h3>cache directive：保留隱藏模板的狀態</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { cache } from 'lit/directives/cache.js';

// 不使用 cache：切換時，被隱藏的模板 DOM 會被銷毀，重新顯示時重建
render() {
  return html\`
    \${this.tab === 'a' ? html\`&lt;tab-a&gt;&lt;/tab-a&gt;\` : html\`&lt;tab-b&gt;&lt;/tab-b&gt;\`}
  \`;
}

// 使用 cache：兩個模板的 DOM 都被保留，切換時只顯示/隱藏
render() {
  return html\`
    \${cache(this.tab === 'a'
      ? html\`&lt;tab-a&gt;&lt;/tab-a&gt;\`
      : html\`&lt;tab-b&gt;&lt;/tab-b&gt;\`
    )}
  \`;
}</code></pre>
  <p>
    <code>cache</code> directive 適用於：切換頻繁、且保留 DOM 狀態有意義的場景（如 Tab 切換）。
    代價是增加記憶體使用，因為隱藏的 DOM 節點不會被 GC 回收。
  </p>
</section>

<section id="template-internals">
  <h2>Template 編譯原理：TemplateResult 到 DOM</h2>
  <p>
    深入了解 lit-html 的內部運作，對於診斷效能問題、理解邊緣案例行為，以及優化大型應用程式至關重要。
    這一節揭開 <code>html\`...\`</code> 呼叫到真實 DOM 節點之間的完整旅程。
  </p>

  <h3>第一步：html 標籤函數建立 TemplateResult</h3>
  <p>
    <code>html</code> 並不立即操作 DOM。它只是建立一個輕量的 <code>TemplateResult</code> 物件——一個描述「應該渲染什麼」的資料結構：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// TemplateResult 的概念結構（簡化）
interface TemplateResult {
  // 靜態 HTML 字串陣列（來自模板字面量的靜態部分）
  // 這是快取 key 的來源
  readonly strings: TemplateStringsArray;

  // 動態值陣列（每次執行都可能不同）
  readonly values: unknown[];

  // 用於區分不同類型的 tagged template（html vs svg vs mathml）
  readonly ['_$litType$']: number;
}

// 當你寫：
const result = html\`&lt;p class=\${cls}&gt;\${text}&lt;/p&gt;\`;

// 等同於建立：
// {
//   strings: ['&lt;p class="', '"&gt;', '&lt;/p&gt;'],
//   values: [cls, text],
//   _$litType$: 1  // HTML 類型
// }</code></pre>

  <h3>第二步：Template 物件的建立與快取</h3>
  <p>
    當 lit-html 的 <code>render()</code> 函數（或 LitElement 的 update 機制）接收到 <code>TemplateResult</code> 時，
    它使用 <code>strings</code> 陣列作為 <code>WeakMap</code> 的 key 查詢快取：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 概念性的 Template 建立流程（簡化版）

// 全域快取：strings 陣列 → Template 物件
const templateCache = new WeakMap&lt;TemplateStringsArray, Template&gt;();

interface Template {
  // 解析後的 &lt;template&gt; DOM 元素（克隆用）
  el: HTMLTemplateElement;
  // Part 位置資訊陣列（記錄哪些節點需要動態更新）
  parts: TemplatePart[];
}

function getTemplate(strings: TemplateStringsArray): Template {
  // 快取命中：直接返回，跳過所有解析工作
  if (templateCache.has(strings)) {
    return templateCache.get(strings)!;
  }

  // 快取未命中（第一次見到這個模板）：建立 Template
  const template = createTemplate(strings);
  templateCache.set(strings, template);
  return template;
}

function createTemplate(strings: TemplateStringsArray): Template {
  // 1. 拼接靜態 HTML，在每個動態位置插入特殊標記
  //    lit-html 使用特殊的 marker comment 標記動態位置
  const html = strings.join('&lt;!--\${lit}--&gt;');  // 概念示意

  // 2. 使用瀏覽器內建的 HTML 解析器解析（非手工解析！）
  const el = document.createElement('template');
  el.innerHTML = html;

  // 3. 用 TreeWalker 遍歷解析後的 DOM，
  //    找到每個標記的位置並記錄 Part 資訊
  const parts: TemplatePart[] = [];
  const walker = document.createTreeWalker(el.content, NodeFilter.SHOW_ALL);
  let node: Node | null;
  let index = 0;

  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const comment = node as Comment;
      if (comment.data === '\${lit}') {
        // 記錄這個 ChildPart 的位置
        parts.push({ type: 'child', index });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      // 檢查屬性是否包含動態綁定
      for (const attr of el.attributes) {
        if (attr.value.includes('\${lit}')) {
          parts.push({ type: 'attribute', name: attr.name, index });
        }
      }
    }
    index++;
  }

  return { el, parts };
}</code></pre>

  <h3>第三步：TemplateInstance 的建立與更新</h3>
  <p>
    每個實際渲染到 DOM 中的模板副本，在 lit-html 內部稱為 <strong>TemplateInstance</strong>。
    它持有對應 Part 物件的實際 DOM 節點參考：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// TemplateInstance 的概念結構
class TemplateInstance {
  // 從 Template.el 克隆出的真實 DOM 節點
  _$fragment: DocumentFragment;

  // 每個動態位置對應的 Part 物件（持有 DOM 節點參考）
  _parts: Part[];

  constructor(template: Template) {
    // 克隆靜態 DOM 結構（O(節點數)，只在第一次渲染時執行）
    this._$fragment = template.el.content.cloneNode(true) as DocumentFragment;

    // 建立 Part 物件，讓每個 Part 持有對應 DOM 節點的參考
    this._parts = template.parts.map(partInfo =&gt;
      createPart(partInfo, this._$fragment)
    );
  }

  // 更新動態值（O(動態值數量)，每次渲染時執行）
  update(values: unknown[]) {
    for (let i = 0; i &lt; this._parts.length; i++) {
      this._parts[i].setValue(values[i]);
    }
  }
}

// 整個渲染流程：
function render(value: TemplateResult, container: Element) {
  // 1. 取得（或建立）對應此容器的 ChildPart
  let part = container._litPart;

  if (part === undefined) {
    // 第一次渲染：初始化
    const template = getTemplate(value.strings);
    const instance = new TemplateInstance(template);
    container.appendChild(instance._$fragment);
    part = container._litPart = new ChildPart(container);
    part._$committedValue = instance;
  }

  // 2. 取出現有的 TemplateInstance
  const instance = part._$committedValue as TemplateInstance;

  // 3. 更新動態值（只更新改變的部分）
  instance.update(value.values);
}</code></pre>

  <h3>strings 陣列作為快取 key 的深層含義</h3>
  <p>
    JavaScript 規範保證：對於同一個模板字面量（template literal）位置，
    每次函數執行時傳給標籤函數的 <code>strings</code> 物件<strong>都是同一個參考</strong>（identity equality）。
    這不是 lit-html 的約定，而是語言規範的保證。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 這是 JavaScript 引擎在編譯時決定的：
// 每個源碼中的 template literal 位置，對應一個固定的 strings 物件

function renderItem(item: Item) {
  // 每次呼叫這個函數，html 接收的 strings 參數都是同一個物件
  return html\`&lt;li class=\${item.type}&gt;\${item.name}&lt;/li&gt;\`;
}

// 但在不同的原始碼位置，即使 HTML 字串相同，也是不同的 strings 物件：
function renderItem2(item: Item) {
  // 這個 html\`...\` 與上面的 html\`...\` 字串相同，但 strings 物件不同
  return html\`&lt;li class=\${item.type}&gt;\${item.name}&lt;/li&gt;\`;
}

// renderItem 和 renderItem2 產生的 TemplateResult 會有不同的 strings 物件，
// 因此在 DOM 中會分別建立不同的模板快取項目。

// 實際意義：避免動態建立 html 標籤內容（會導致快取失效）
// ✗ 壞：每次呼叫都有不同的 strings（因為 html 在這裡是 Function，不是 tagged template）
function badRender(tagName: string, content: string) {
  // 這個寫法每次都會建立全新的 DOM，無法享受快取優勢
  return html\`&lt;\${tagName}&gt;\${content}&lt;/\${tagName}&gt;\`;
  // 注意：Lit 不支援動態標籤名稱在 attribute 位置以外
  // 應使用 keyed/guard directive 或條件渲染
}</code></pre>

  <h3>Event Binding 的清理機制：無記憶體洩漏</h3>
  <p>
    lit-html 的事件綁定不會造成記憶體洩漏，即使你在模板中使用箭頭函數。
    原因在於 EventPart 的實作方式：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// EventPart 的概念實作
class EventPart {
  private _element: Element;
  private _eventName: string;
  private _boundListener: EventListenerOrEventListenerObject | null = null;

  setValue(newListener: EventListenerOrEventListenerObject | null) {
    if (newListener === this._boundListener) return;

    if (this._boundListener !== null) {
      // 移除舊的監聽器（即使它是上次渲染的箭頭函數）
      this._element.removeEventListener(this._eventName, this._boundListener);
    }

    if (newListener !== null) {
      // 添加新的監聽器
      this._element.addEventListener(this._eventName, newListener);
    }

    this._boundListener = newListener;
  }
}

// 這意味著：
// 1. 當元件重新渲染時，舊的事件監聽器會被自動移除
// 2. 即使每次渲染都傳入新的箭頭函數，也不會累積監聽器
// 3. 當元件從 DOM 移除時，lit-html 會清理所有 Part（包含 EventPart）
// 4. 因此不會有「孤兒監聽器」留在 DOM 上

// 但注意：重複創建新的監聽器仍有輕微效能成本（removeEventListener + addEventListener）
// 對於效能敏感的場景，仍推薦使用穩定的方法參考</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">與 React 的比較</div>
    <p>
      React 使用合成事件系統（SyntheticEvent）和委派（delegation）來管理事件。
      lit-html 直接使用原生的 <code>addEventListener</code>/<code>removeEventListener</code>，
      透過 EventPart 管理生命週期。兩種方式都能避免記憶體洩漏，但機制完全不同。
      lit-html 的方式更直接、無需額外的事件池（event pooling）或合成層。
    </p>
  </div>
</section>

<section id="advanced-binding-patterns">
  <h2>進階 Binding 模式與邊緣案例</h2>
  <p>
    掌握了基本的五種 Binding 之後，Senior 工程師還需要理解一些進階模式和邊緣案例，
    才能在複雜場景下做出正確的決策。
  </p>

  <h3>nothing 與 noChange Sentinel 值</h3>
  <p>
    lit-html 提供兩個特殊的 sentinel 值，控制更新行為：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">import { nothing, noChange } from 'lit';

// ── nothing ──
// 用於 ChildPart：移除對應的 DOM 節點（類似 null/undefined，但更明確）
// 用於 AttributePart：移除整個 attribute
// 用於 BooleanAttributePart：同 false，移除 attribute
// 用於 PropertyPart：設定 property 為 undefined

html\`
  \${condition ? html\`&lt;span&gt;顯示&lt;/span&gt;\` : nothing}
  &lt;div class=\${condition ? 'active' : nothing}&gt;&lt;/div&gt;
\`

// nothing vs undefined vs null：
// undefined/null 在 ChildPart 中渲染為空字串（DOM 節點仍存在）
// nothing 完全移除對應的位置標記（更乾淨）

// ── noChange ──
// 告訴 lit-html：跳過這個 Part 的更新，保持 DOM 不變
// 主要用於 Directive 的實作中
// 普通元件程式碼很少需要直接使用 noChange

// 典型使用場景：自訂 Directive 中，當值未改變時返回 noChange
import { Directive, directive, PartInfo, PartType } from 'lit/directive.js';

class ThrottleDirective extends Directive {
  private _lastValue: unknown = noChange;
  private _lastUpdateTime = 0;
  private _intervalMs: number;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    this._intervalMs = 500;
  }

  render(value: unknown, intervalMs = 500) {
    this._intervalMs = intervalMs;
    const now = Date.now();

    if (now - this._lastUpdateTime &gt; this._intervalMs) {
      this._lastUpdateTime = now;
      this._lastValue = value;
      return value;
    }

    // 在節流期間：返回 noChange 告訴 lit-html 不要更新 DOM
    return noChange;
  }
}

export const throttle = directive(ThrottleDirective);</code></pre>

  <h3>動態標籤名稱的實現模式</h3>
  <p>
    lit-html 不直接支援動態標籤名稱（如 <code>&lt;\${tagName}&gt;</code>），因為這會破壞 strings 快取機制。
    以下是幾種正確的替代方案：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// ✗ 不支援（會導致安全警告和未定義行為）
// html\`&lt;\${this.tagName}&gt;\${content}&lt;/\${this.tagName}&gt;\`

// ✓ 方案 1：條件渲染（推薦，標籤名稱有限且已知）
get _headingTemplate() {
  const text = this.title;
  switch (this.level) {
    case 1: return html\`&lt;h1&gt;\${text}&lt;/h1&gt;\`;
    case 2: return html\`&lt;h2&gt;\${text}&lt;/h2&gt;\`;
    case 3: return html\`&lt;h3&gt;\${text}&lt;/h3&gt;\`;
    default: return html\`&lt;p&gt;\${text}&lt;/p&gt;\`;
  }
}

// ✓ 方案 2：使用 unsafeHTML（僅當標籤名稱來自可信來源）
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// 注意：tagName 必須是可信的白名單值，絕不能是使用者輸入
const ALLOWED_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'p', 'span']);

render() {
  const tagName = ALLOWED_TAGS.has(this.tag) ? this.tag : 'p';
  // 建立 HTML 字串（此處 tagName 已經過白名單驗證）
  const safeHtml = \`&lt;\${tagName} class="heading"&gt;\${this.escapeHtml(this.title)}&lt;/\${tagName}&gt;\`;
  return html\`\${unsafeHTML(safeHtml)}\`;
}

private escapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&amp;amp;')
    .replace(/&lt;/g, '&amp;lt;')
    .replace(/&gt;/g, '&amp;gt;')
    .replace(/"/g, '&amp;quot;')
    .replace(/'/g, '&amp;#039;');
}

// ✓ 方案 3：使用 customElements.define 建立通用包裝元件（最佳架構）
// 讓每種標籤用途有自己的元件
@customElement('heading-h1')
class HeadingH1 extends LitElement {
  @property() text = '';
  render() { return html\`&lt;h1&gt;\${this.text}&lt;/h1&gt;\`; }
}</code></pre>

  <h3>Attribute 的 spread 操作（Lit 沒有原生支援的替代方案）</h3>
  <p>
    React 的 JSX 支援 <code>&lt;div {...props}&gt;</code> 的 spread 語法。
    lit-html 沒有原生等效語法，但有幾種模式可以達到類似效果：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// Lit 3.x 中使用 spread directive（官方提供）
import { spread } from '@open-wc/lit-helpers';

// ✓ 方案 1：@open-wc/lit-helpers 的 spread directive
render() {
  const props = {
    '.value': this.inputValue,           // property binding
    '@input': this._handleInput,          // event binding
    '?disabled': this.disabled,           // boolean attribute
    'aria-label': this.label,             // regular attribute
  };
  return html\`&lt;input \${spread(props)}&gt;\`;
}

// ✓ 方案 2：自行實作簡單的屬性散佈 Directive
import { directive, Directive, ElementPart } from 'lit/directive.js';

class SpreadDirective extends Directive {
  update(part: ElementPart, [props]: [Record&lt;string, unknown&gt;]) {
    const el = part.element;
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('@')) {
        // 事件綁定
        el.addEventListener(key.slice(1), value as EventListener);
      } else if (key.startsWith('.')) {
        // Property 設定
        (el as unknown as Record&lt;string, unknown&gt;)[key.slice(1)] = value;
      } else if (key.startsWith('?')) {
        // Boolean attribute
        el.toggleAttribute(key.slice(1), Boolean(value));
      } else {
        // 一般 attribute
        if (value == null) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, String(value));
        }
      }
    }
    return noChange;
  }

  render() { return noChange; }
}

export const spread = directive(SpreadDirective);

// ✓ 方案 3：對於 ARIA 屬性，手動逐一設定
// 在許多情況下，明確比 spread 更好（更易讀、更易 TypeScript 型別檢查）
render() {
  return html\`
    &lt;button
      aria-label=\${this.label}
      aria-pressed=\${this.pressed}
      aria-describedby=\${this.descriptionId}
      ?disabled=\${this.disabled}
      @click=\${this._handleClick}
    &gt;
      \${this.label}
    &lt;/button&gt;
  \`;
}</code></pre>

  <h3>巢狀模板與 keyed directive</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { keyed } from 'lit/directives/keyed.js';

// 問題：當列表項目的型別改變時，lit-html 預設複用現有 DOM
// 這可能導致輸入欄位的值殘留在不正確的項目上
render() {
  return html\`
    \${this.items.map(item =&gt; html\`
      &lt;div class="item"&gt;
        \${item.type === 'text'
          ? html\`&lt;input type="text" .value=\${item.value}&gt;\`
          : html\`&lt;input type="number" .value=\${item.value}&gt;\`}
      &lt;/div&gt;
    \`)}
  \`;
}

// 解決方案：使用 keyed，當 key 改變時強制重建 DOM
render() {
  return html\`
    \${this.items.map(item =&gt; keyed(
      \`\${item.id}-\${item.type}\`,  // 包含型別的 key
      html\`
        &lt;div class="item"&gt;
          \${item.type === 'text'
            ? html\`&lt;input type="text" .value=\${item.value}&gt;\`
            : html\`&lt;input type="number" .value=\${item.value}&gt;\`}
        &lt;/div&gt;
      \`
    ))}
  \`;
}

// keyed vs repeat：
// keyed：強制在 key 改變時重建單一節點的 DOM
// repeat：跨整個列表追蹤 key，優化列表的新增/刪除/重排</code></pre>

  <h3>ifDefined directive：只在有值時設定 attribute</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { ifDefined } from 'lit/directives/if-defined.js';

// 問題：當值為 undefined 時，attribute 會被設為字串 "undefined"
html\`&lt;a href=\${this.href}&gt;連結&lt;/a&gt;\`
// 如果 this.href 是 undefined，會渲染為 &lt;a href="undefined"&gt;連結&lt;/a&gt;

// ✓ 解決方案：使用 ifDefined
html\`&lt;a href=\${ifDefined(this.href)}&gt;連結&lt;/a&gt;\`
// 如果 this.href 是 undefined，移除整個 href attribute
// 如果 this.href 是字串，正常設定 attribute

// 組合 ifDefined 和條件值
html\`
  &lt;img
    src=\${ifDefined(this.src)}
    alt=\${ifDefined(this.alt)}
    width=\${ifDefined(this.width &gt; 0 ? this.width : undefined)}
  &gt;
\`</code></pre>
</section>

<section id="trusted-types-csp">
  <h2>Trusted Types 與 CSP 整合</h2>
  <p>
    對於需要嚴格安全性的企業應用，
    Content Security Policy（CSP）和 Trusted Types 是防禦 XSS 攻擊的重要機制。
    理解 lit-html 如何與這些機制協作，對 Senior 工程師不可或缺。
  </p>

  <h3>lit-html 的 XSS 預防機制</h3>
  <p>
    lit-html 的設計天然對抗 XSS：<code>html\`...\`</code> 的動態值（<code>\${...}</code>）<strong>永遠不會被當作 HTML 解析</strong>——它們被設定為文字節點或 DOM 屬性，而非 innerHTML。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 假設惡意使用者提供了以下輸入：
const userInput = '&lt;script&gt;alert("XSS")&lt;/script&gt;';

// ✓ 安全：lit-html 將此作為文字節點渲染，不會執行 &lt;script&gt;
html\`&lt;p&gt;\${userInput}&lt;/p&gt;\`
// 渲染結果：&lt;p&gt;&lt;script&gt;alert("XSS")&lt;/script&gt;&lt;/p&gt;（原始文字）

// ✗ 危險：bypasses lit-html 的保護
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
html\`&lt;p&gt;\${unsafeHTML(userInput)}&lt;/p&gt;\`
// 這會執行 &lt;script&gt;！只用於完全可信的 HTML 字串</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">unsafeHTML 使用守則</div>
    <p>
      <code>unsafeHTML</code> 的名字已經清楚表明風險。只有在以下條件<em>全部成立</em>時才能使用：
      (1) HTML 字串來自你完全控制的來源（如靜態配置）；
      (2) 或者已經過嚴格的 sanitization（如使用 DOMPurify）。
      絕對不能將任何用戶輸入直接傳給 <code>unsafeHTML</code>。
    </p>
  </div>

  <h3>unsafeHTML 與 DOMPurify 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">import DOMPurify from 'dompurify';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// 安全地渲染富文字（如來自 CMS 的 HTML）
@customElement('rich-text')
class RichText extends LitElement {
  @property() content = '';

  // DOMPurify 設定：只允許安全的標籤和屬性
  private static readonly _purifyConfig = {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // 強制外部連結加上 rel="noopener noreferrer"
    ADD_ATTR: ['target'],
  };

  render() {
    // 使用 DOMPurify 清理 HTML，再用 unsafeHTML 渲染
    const safeHtml = DOMPurify.sanitize(
      this.content,
      RichText._purifyConfig
    );
    return html\`
      &lt;div class="rich-text"&gt;
        \${unsafeHTML(safeHtml)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>Trusted Types 整合</h3>
  <p>
    Trusted Types 是一個瀏覽器 API，要求所有注入 DOM 的 HTML 字串都必須通過一個「政策（policy）」的包裝，
    讓 XSS sink（如 innerHTML）只接受 <code>TrustedHTML</code> 物件而非普通字串。
  </p>
  <p>
    lit-html 本身對 Trusted Types 有原生支援——標準的 <code>html\`\`</code> 模板使用瀏覽器的 <code>&lt;template&gt;</code> 元素解析，不觸發 innerHTML 的 Trusted Types 檢查。
    但 <code>unsafeHTML</code> 確實使用 innerHTML，因此需要特別處理：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 為 lit-html 的 unsafeHTML 建立 Trusted Types policy
// 只在應用程式初始化時建立一次

declare const trustedTypes: {
  createPolicy: (name: string, rules: object) =&gt; {
    createHTML: (s: string) =&gt; TrustedHTML;
  };
};

// 建立政策（Policy）
const sanitizerPolicy = trustedTypes.createPolicy('dompurify', {
  // 所有傳入的字串都先經過 DOMPurify
  createHTML: (dirty: string) =&gt; DOMPurify.sanitize(dirty, {
    RETURN_TRUSTED_TYPE: true,
  }) as unknown as string,
});

// 自訂的安全 unsafeHTML wrapper
function trustedHTML(htmlString: string) {
  if (typeof trustedTypes !== 'undefined') {
    return unsafeHTML(
      sanitizerPolicy.createHTML(htmlString) as unknown as string
    );
  }
  // Fallback（不支援 Trusted Types 的環境）
  return unsafeHTML(DOMPurify.sanitize(htmlString));
}

// 在元件中使用
render() {
  return html\`&lt;div&gt;\${trustedHTML(this.richContent)}&lt;/div&gt;\`;
}</code></pre>

  <h3>CSP（Content Security Policy）配置</h3>
  <p>
    lit-html 使用 <code>&lt;template&gt;</code> 元素的 innerHTML 解析靜態 HTML。
    在嚴格 CSP 環境下，你可能需要啟用特定的 CSP 指令：
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// CSP Header 配置（伺服器端設定）：
// Content-Security-Policy:
//   default-src 'self';
//   script-src 'self';
//   style-src 'self' 'unsafe-inline';  // Shadow DOM 的 &lt;style&gt; 需要
//   require-trusted-types-for 'script'; // 啟用 Trusted Types

// ⚠️ lit-html 與 'unsafe-eval' 的關係：
// Lit 本身不需要 'unsafe-eval'（不使用 eval 或 new Function）
// 如果你的構建工具（如某些 webpack 設定）使用 eval，那是構建工具的問題
// 生產環境的 Lit 應用不需要 'unsafe-eval'

// ⚠️ 'unsafe-inline' in style-src：
// Lit 的 static styles（使用 css\`\`）在 ShadowRoot 中使用 &lt;style&gt; 標籤
// 這需要 'unsafe-inline' 或使用 Constructable Stylesheets（現代瀏覽器支援）
// 更好的方案：使用 adoptedStyleSheets（Lit 預設在支援時使用）

// 使用 Constructable Stylesheets 避免 'unsafe-inline'
import { css, adoptStyles } from 'lit';

@customElement('secure-component')
class SecureComponent extends LitElement {
  // Lit 自動使用 adoptedStyleSheets（如果瀏覽器支援）
  // 這樣就不需要 'unsafe-inline' in CSP
  static styles = css\`
    :host {
      display: block;
    }
    .container {
      padding: 1rem;
    }
  \`;
}</code></pre>

  <h3>Lit 安全性最佳實踐摘要</h3>
  <table>
    <thead>
      <tr>
        <th>場景</th>
        <th>推薦做法</th>
        <th>風險等級</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>渲染使用者輸入的文字</td>
        <td><code>html\`&lt;p&gt;\${userText}&lt;/p&gt;\`</code>（預設安全）</td>
        <td>低</td>
      </tr>
      <tr>
        <td>渲染來自 CMS 的富文字 HTML</td>
        <td><code>unsafeHTML(DOMPurify.sanitize(html))</code></td>
        <td>中（需驗證 sanitization 設定）</td>
      </tr>
      <tr>
        <td>渲染靜態的、已知安全的 HTML 字串</td>
        <td><code>unsafeHTML(staticHtmlString)</code></td>
        <td>低（確保字串來源可信）</td>
      </tr>
      <tr>
        <td>動態設定 href/src（來自使用者）</td>
        <td>驗證 URL scheme，拒絕 <code>javascript:</code> 協定</td>
        <td>高（需手動驗證）</td>
      </tr>
      <tr>
        <td>直接操作 <code>innerHTML</code>（在 Lit 元件內）</td>
        <td>避免；使用 lit-html binding 或 Trusted Types policy</td>
        <td>高</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">URL 安全性的常見疏漏</div>
    <p>
      即使使用了 lit-html 的 attribute binding（如 <code>href=\${url}</code>），
      也無法防止 <code>javascript:</code> 協定的 URL（如 <code>javascript:alert(1)</code>）。
      對於 href、src、action 等屬性，在設定之前必須驗證 URL scheme：
      <code>const safeUrl = url.startsWith('https://') || url.startsWith('/') ? url : '#';</code>
    </p>
  </div>
</section>
`,
};
