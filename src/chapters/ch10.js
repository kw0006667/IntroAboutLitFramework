export default {
  id: 10,
  slug: 'chapter-10',
  title: '狀態管理的不同路徑',
  part: 3,
  intro: 'React 的 useState/useReducer/Redux 生態 vs. Lit 的 Reactive Properties + MobX/Zustand/Signals 整合方案比較。',
  sections: [
    { slug: 'react-state-hooks', title: 'React useState / useReducer' },
    { slug: 'lit-reactive-state', title: 'Lit 的 Reactive Properties' },
    { slug: 'mobx-integration', title: 'MobX 與 Lit 整合' },
    { slug: 'zustand-integration', title: 'Zustand 跨框架狀態' },
    { slug: 'signals-preview', title: 'Signals：下一代響應式原語' },
    { slug: 'state-strategy', title: '狀態管理策略選型指南' },
  ],
  content: `
<section id="react-state-hooks">
  <h2>React useState / useReducer</h2>
  <p>
    React 的狀態管理與元件生命週期深度綁定。
    Hooks 讓函數元件可以持有狀態，但這個狀態的存活週期由 React 的 Fiber 樹決定。
  </p>
  <pre data-lang="jsx"><code class="language-jsx">// React：useState + useReducer 模式
function ShoppingCart() {
  const [items, dispatch] = useReducer((state, action) =&gt; {
    switch(action.type) {
      case 'ADD': return [...state, action.item];
      case 'REMOVE': return state.filter(i =&gt; i.id !== action.id);
      case 'CLEAR': return [];
      default: return state;
    }
  }, []);

  const total = useMemo(
    () =&gt; items.reduce((sum, item) =&gt; sum + item.price, 0),
    [items]
  );

  return (
    &lt;div&gt;
      &lt;p&gt;共 {items.length} 件，總計 NT${total}&lt;/p&gt;
      &lt;button onClick={() =&gt; dispatch({ type: 'CLEAR' })}&gt;清空&lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
  <p>
    React 的狀態系統優雅，但 <code>useMemo</code>、<code>useCallback</code>
    的手動最佳化要求開發者對記憶化（memoization）有深刻理解。
    過度或不足的最佳化都是常見陷阱。
  </p>
</section>

<section id="lit-reactive-state">
  <h2>Lit 的 Reactive Properties</h2>
  <p>
    Lit 的狀態管理更直接：<code>@property</code> 和 <code>@state</code>
    加上 <code>willUpdate()</code> 中的衍生計算。
    不需要手動記憶化——Lit 的精準更新策略讓不必要的計算開銷很低。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('shopping-cart')
class ShoppingCart extends LitElement {
  @state() private _items: CartItem[] = [];

  // 計算屬性：在 willUpdate 中計算
  private _total = 0;
  private _count = 0;

  willUpdate(changedProperties: Map&lt;string, unknown&gt;) {
    if (changedProperties.has('_items')) {
      this._total = this._items.reduce((sum, item) =&gt; sum + item.price, 0);
      this._count = this._items.length;
    }
  }

  private _addItem(item: CartItem) {
    this._items = [...this._items, item];
  }

  private _removeItem(id: string) {
    this._items = this._items.filter(i =&gt; i.id !== id);
  }

  render() {
    return html\`
      &lt;p&gt;共 \${this._count} 件，總計 NT$\${this._total}&lt;/p&gt;
      &lt;button @click=\${() =&gt; { this._items = []; }}&gt;清空&lt;/button&gt;
    \`;
  }
}</code></pre>

  <h3>不可變更新的重要性</h3>
  <div class="callout callout-warning">
    <div class="callout-title">必須用新物件觸發更新</div>
    <p>
      Lit 使用 <code>!==</code>（嚴格不等）判斷屬性是否改變。
      <code>this._items.push(item)</code> 不會觸發更新，因為陣列參考沒有改變。
      必須用 <code>this._items = [...this._items, item]</code> 建立新陣列。
    </p>
  </div>
</section>

<section id="mobx-integration">
  <h2>MobX 與 Lit 整合</h2>
  <p>
    當需要複雜的應用級狀態時，MobX 的響應式系統與 Lit 搭配非常自然。
    MobX 的 <code>autorun</code> / <code>reaction</code> 可以在狀態改變時呼叫 Lit 的 <code>requestUpdate()</code>。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { makeAutoObservable } from 'mobx';

// MobX Store
class CartStore {
  items: CartItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  get total() {
    return this.items.reduce((sum, item) =&gt; sum + item.price, 0);
  }

  addItem(item: CartItem) {
    this.items.push(item);
  }

  removeItem(id: string) {
    this.items = this.items.filter(i =&gt; i.id !== id);
  }
}

export const cartStore = new CartStore();

// Lit Reactive Controller for MobX
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { autorun, IReactionDisposer } from 'mobx';

class MobXController implements ReactiveController {
  private _disposer?: IReactionDisposer;

  constructor(private host: ReactiveControllerHost, private store: object) {
    host.addController(this);
  }

  hostConnected() {
    this._disposer = autorun(() =&gt; {
      // 觸碰 store 中的 observable，建立依賴
      JSON.stringify(this.store);
      // 通知 Lit 重新渲染
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this._disposer?.();
  }
}

// 在元件中使用
@customElement('cart-view')
class CartView extends LitElement {
  private _mobx = new MobXController(this, cartStore);

  render() {
    return html\`
      &lt;p&gt;共 \${cartStore.items.length} 件，NT$\${cartStore.total}&lt;/p&gt;
      \${cartStore.items.map(item =&gt; html\`
        &lt;div&gt;
          \${item.name}
          &lt;button @click=\${() =&gt; cartStore.removeItem(item.id)}&gt;移除&lt;/button&gt;
        &lt;/div&gt;
      \`)}
    \`;
  }
}</code></pre>
</section>

<section id="zustand-integration">
  <h2>Zustand 跨框架狀態</h2>
  <p>
    Zustand 的 store 是純 JavaScript，不依賴任何框架，
    可以在 Lit 元件中直接使用並訂閱更新。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { create } from 'zustand';

// 建立 Zustand Store（純 JS，與框架無關）
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) =&gt; void;
  removeItem: (id: string) =&gt; void;
  get total(): number;
}

const useCartStore = create&lt;CartState&gt;((set, get) =&gt; ({
  items: [],
  addItem: (item) =&gt; set(state =&gt; ({ items: [...state.items, item] })),
  removeItem: (id) =&gt; set(state =&gt; ({ items: state.items.filter(i =&gt; i.id !== id) })),
  get total() { return get().items.reduce((sum, i) =&gt; sum + i.price, 0); },
}));

// Reactive Controller for Zustand
class ZustandController&lt;T&gt; implements ReactiveController {
  private _unsubscribe?: () =&gt; void;
  state: T;

  constructor(
    private host: ReactiveControllerHost,
    private store: ReturnType&lt;typeof create&lt;T&gt;&gt;
  ) {
    host.addController(this);
    this.state = store.getState();
  }

  hostConnected() {
    this._unsubscribe = this.store.subscribe((state) =&gt; {
      this.state = state;
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this._unsubscribe?.();
  }
}

@customElement('cart-widget')
class CartWidget extends LitElement {
  private _cart = new ZustandController(this, useCartStore);

  render() {
    const { items, total } = this._cart.state;
    return html\`
      &lt;div class="cart"&gt;
        &lt;span class="badge"&gt;\${items.length}&lt;/span&gt;
        &lt;p&gt;NT$\${total}&lt;/p&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="signals-preview">
  <h2>Signals：下一代響應式原語</h2>
  <p>
    TC39 Signals Proposal 正在標準化一種所有框架都能使用的響應式原語。
    Lit 已透過 <code>@lit-labs/signals</code> 提供早期整合。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 未來的 Signals API（概念預覽）
import { signal, computed, effect } from '@lit-labs/signals';

// Signal：響應式資料容器
const count = signal(0);
const doubled = computed(() =&gt; count.get() * 2);

effect(() =&gt; {
  console.log('count 改變為：', count.get());
});

// 在 Lit 元件中使用（需要 SignalWatcher mixin）
import { SignalWatcher } from '@lit-labs/signals';

@customElement('signal-counter')
class SignalCounter extends SignalWatcher(LitElement) {
  render() {
    // 自動追蹤 signal 依賴，改變時重新渲染
    return html\`
      &lt;p&gt;Count: \${count.get()}, Doubled: \${doubled.get()}&lt;/p&gt;
      &lt;button @click=\${() =&gt; count.set(count.get() + 1)}&gt;+1&lt;/button&gt;
    \`;
  }
}</code></pre>

  <p>
    Signals 的優勢在於<strong>跨框架共享</strong>：
    同一個 Signal 可以被 React、Vue、Angular、Lit 同時訂閱，
    這在微前端架構中具有革命性意義。
    我們將在 Chapter 22 深入探討。
  </p>
</section>

<section id="state-strategy">
  <h2>狀態管理策略選型指南</h2>

  <table>
    <thead>
      <tr>
        <th>狀態類型</th>
        <th>推薦方案</th>
        <th>理由</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>元件局部 UI 狀態（展開/收合、載入中）</td>
        <td><code>@state()</code></td>
        <td>最簡單，封裝在元件內</td>
      </tr>
      <tr>
        <td>父子間的資料傳遞</td>
        <td><code>@property()</code> + Events</td>
        <td>明確的資料流</td>
      </tr>
      <tr>
        <td>祖先到後代的共享設定（主題、語言）</td>
        <td><code>@lit/context</code></td>
        <td>避免 Prop Drilling</td>
      </tr>
      <tr>
        <td>應用級業務狀態（購物車、使用者資訊）</td>
        <td>Zustand / MobX</td>
        <td>框架無關，易測試</td>
      </tr>
      <tr>
        <td>跨框架共享狀態（微前端）</td>
        <td>Signals（TC39）</td>
        <td>真正的跨框架標準</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">從簡單開始</div>
    <p>
      從 <code>@state()</code> 開始。只有當你發現「需要在多個不相關元件之間共享狀態」時，
      才考慮引入 Context 或外部狀態管理。
      過早的架構設計是工程師最常犯的錯誤之一。
    </p>
  </div>
</section>
`,
};
