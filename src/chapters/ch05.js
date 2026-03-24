export default {
  id: 5,
  slug: 'chapter-5',
  title: 'lit-html 模板引擎：Tagged Template Literals 的威力',
  part: 2,
  intro: '為什麼 Lit 不需要 Virtual DOM？解析 html`` 背後的 Part 系統，以及它如何實現精準的 DOM 更新。',
  sections: [
    { slug: 'tagged-template-literals', title: 'Tagged Template Literals 原理' },
    { slug: 'why-no-vdom', title: '為何不需要 Virtual DOM？' },
    { slug: 'part-system', title: 'Part 系統：精準 DOM 更新' },
    { slug: 'binding-types', title: '五種 Binding 類型' },
    { slug: 'dynamic-templates', title: '動態模板與條件渲染' },
    { slug: 'template-caching', title: '模板快取機制' },
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
`,
};
