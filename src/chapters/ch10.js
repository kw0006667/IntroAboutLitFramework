export default {
  id: 10,
  slug: 'chapter-10',
  title: '狀態管理的不同路徑',
  part: 3,
  intro: 'React 的 useState/useReducer/Redux 生態 vs. Lit 的 Reactive Properties + MobX/Zustand/Signals 整合方案深度比較。涵蓋 Redux Toolkit 橋接、TC39 Signals 實作、企業級狀態架構、Optimistic UI 更新，以及 SSR 序列化策略。',
  sections: [
    { slug: 'react-state-hooks', title: 'React useState / useReducer' },
    { slug: 'lit-reactive-state', title: 'Lit 的 Reactive Properties' },
    { slug: 'mobx-integration', title: 'MobX 與 Lit 整合' },
    { slug: 'zustand-integration', title: 'Zustand 跨框架狀態' },
    { slug: 'redux-toolkit-integration', title: 'Redux Toolkit 整合模式' },
    { slug: 'signals-implementation', title: 'TC39 Signals 實作與 Lit 整合' },
    { slug: 'signals-preview', title: 'Signals：下一代響應式原語' },
    { slug: 'state-architecture-enterprise', title: '企業級狀態架構設計' },
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
      &lt;p&gt;共 {items.length} 件，總計 NT\${total}&lt;/p&gt;
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

  <h3>自訂 hasChanged：精細控制更新觸發</h3>
  <p>
    預設的 <code>!==</code> 比較對深層物件可能過於寬鬆（每次都更新）或嚴格（巢狀屬性改變卻不更新）。
    <code>hasChanged</code> 讓你自訂比較邏輯：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('user-profile')
class UserProfile extends LitElement {
  // 自訂 hasChanged：只比較關鍵欄位，避免因無關欄位改變而重新渲染
  @property({
    hasChanged(newVal: User, oldVal: User) {
      if (!oldVal) return true;
      // 只有 id、name、avatarUrl 改變才觸發重渲染
      return (
        newVal.id !== oldVal.id ||
        newVal.name !== oldVal.name ||
        newVal.avatarUrl !== oldVal.avatarUrl
      );
    }
  })
  user!: User;

  // 深度相等比較：適合陣列/物件
  @property({
    hasChanged(newVal: string[], oldVal: string[]) {
      if (!oldVal || newVal.length !== oldVal.length) return true;
      return newVal.some((v, i) =&gt; v !== oldVal[i]);
    }
  })
  tags: string[] = [];
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">hasChanged 的效能影響</div>
    <p>
      自訂 <code>hasChanged</code> 本身也有成本。對於大型陣列的深度比較，
      其成本可能超過節省的渲染成本。建議只在確認有不必要渲染問題時才引入，
      並用 Performance 面板驗證效果。
    </p>
  </div>
</section>

<section id="mobx-integration">
  <h2>MobX 與 Lit 整合</h2>
  <p>
    當需要複雜的應用級狀態時，MobX 的響應式系統與 Lit 搭配非常自然。
    MobX 的 <code>autorun</code> / <code>reaction</code> 可以在狀態改變時呼叫 Lit 的 <code>requestUpdate()</code>。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { makeAutoObservable, reaction } from 'mobx';

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

// 精細版 MobX Controller：只追蹤特定計算值，減少不必要重渲染
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { IReactionDisposer } from 'mobx';

class MobXController&lt;T&gt; implements ReactiveController {
  private _disposer?: IReactionDisposer;

  constructor(
    private host: ReactiveControllerHost,
    // expression：追蹤哪些 observable
    // effect：當追蹤值改變時執行（可選）
    private expression: () =&gt; T,
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._disposer = reaction(
      this.expression,
      () =&gt; this.host.requestUpdate(),
      { fireImmediately: false }
    );
  }

  hostDisconnected() {
    this._disposer?.();
  }
}

// 在元件中：只在 cartStore.total 改變時重渲染，而非 store 的任何欄位
@customElement('cart-total')
class CartTotal extends LitElement {
  // 只追蹤 total，不追蹤 items 陣列本身
  private _mobx = new MobXController(this, () =&gt; cartStore.total);

  render() {
    return html\`&lt;span class="total"&gt;NT$\${cartStore.total}&lt;/span&gt;\`;
  }
}</code></pre>
</section>

<section id="zustand-integration">
  <h2>Zustand 跨框架狀態</h2>
  <p>
    Zustand 的 store 是純 JavaScript，不依賴任何框架，
    可以在 Lit 元件中直接使用並訂閱更新。
    Zustand 的 <code>subscribe</code> with selector 讓你只在關心的切片改變時才重渲染。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { create, StoreApi, UseBoundStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: CartItem) =&gt; void;
  removeItem: (id: string) =&gt; void;
  clearCart: () =&gt; void;
  fetchCart: (userId: string) =&gt; Promise&lt;void&gt;;
}

// 使用 subscribeWithSelector middleware，啟用 selector 訂閱
const useCartStore = create&lt;CartState&gt;()(
  subscribeWithSelector((set, get) =&gt; ({
    items: [],
    isLoading: false,
    error: null,

    addItem: (item) =&gt; set(state =&gt; ({ items: [...state.items, item] })),
    removeItem: (id) =&gt; set(state =&gt; ({ items: state.items.filter(i =&gt; i.id !== id) })),
    clearCart: () =&gt; set({ items: [] }),

    fetchCart: async (userId) =&gt; {
      set({ isLoading: true, error: null });
      try {
        const items = await api.getCart(userId);
        set({ items, isLoading: false });
      } catch (e) {
        set({ error: (e as Error).message, isLoading: false });
      }
    },
  }))
);

// 精細訂閱：只在 selector 結果改變時更新
class ZustandSliceController&lt;TState, TSlice&gt; implements ReactiveController {
  private _unsubscribe?: () =&gt; void;
  slice: TSlice;

  constructor(
    private host: ReactiveControllerHost,
    private store: { subscribe: StoreApi&lt;TState&gt;['subscribe']; getState: () =&gt; TState },
    private selector: (state: TState) =&gt; TSlice,
    private equalityFn: (a: TSlice, b: TSlice) =&gt; boolean = Object.is,
  ) {
    host.addController(this);
    this.slice = selector(store.getState());
  }

  hostConnected() {
    // subscribeWithSelector 支援第二參數為 selector，第三參數為 equalityFn
    this._unsubscribe = (this.store.subscribe as any)(
      this.selector,
      (newSlice: TSlice) =&gt; {
        this.slice = newSlice;
        this.host.requestUpdate();
      },
      { equalityFn: this.equalityFn }
    );
  }

  hostDisconnected() {
    this._unsubscribe?.();
  }
}

// 使用範例：只訂閱 items.length，badge 數字改變時才重渲染
@customElement('cart-badge')
class CartBadge extends LitElement {
  private _count = new ZustandSliceController(
    this,
    useCartStore,
    (state) =&gt; state.items.length,
  );

  render() {
    return html\`&lt;span class="badge"&gt;\${this._count.slice}&lt;/span&gt;\`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Selector 是效能關鍵</div>
    <p>
      不使用 selector 而直接訂閱整個 store 時，每次 store 任何欄位改變都會觸發重渲染。
      永遠用 selector 精確指定你需要的切片，並配合 <code>equalityFn</code> 處理物件/陣列的相等比較。
    </p>
  </div>
</section>

<section id="redux-toolkit-integration">
  <h2>Redux Toolkit 整合模式</h2>
  <p>
    大型企業應用可能已有成熟的 Redux Toolkit（RTK）基礎設施。
    以下展示如何撰寫一個 <strong>Redux Middleware</strong> 橋接到 Lit 的 Reactive Properties，
    以及如何讓 RTK Query 的快取系統驅動 Lit 元件更新。
  </p>

  <h3>Redux Middleware 橋接 Lit</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { configureStore, createSlice, PayloadAction, Middleware } from '@reduxjs/toolkit';

// --- Redux Slice ---
interface CartSlice {
  items: CartItem[];
  status: 'idle' | 'loading' | 'failed';
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], status: 'idle' } as CartSlice,
  reducers: {
    addItem(state, action: PayloadAction&lt;CartItem&gt;) {
      state.items.push(action.payload);          // RTK 內建 Immer，可以直接 mutate
    },
    removeItem(state, action: PayloadAction&lt;string&gt;) {
      state.items = state.items.filter(i =&gt; i.id !== action.payload);
    },
  },
});

// --- Middleware：將 Redux action 廣播為 CustomEvent ---
// Lit 元件透過監聽 document 的 CustomEvent 來感知 Redux 狀態變化
// 這讓 Lit 元件不需要直接依賴 Redux store，保持解耦
const litBridgeMiddleware: Middleware = (storeAPI) =&gt; (next) =&gt; (action) =&gt; {
  const prevState = storeAPI.getState();
  const result = next(action);               // 先讓 action 通過
  const nextState = storeAPI.getState();

  // 只在狀態確實改變時廣播
  if (prevState.cart !== nextState.cart) {
    document.dispatchEvent(
      new CustomEvent('redux:cart-updated', {
        detail: nextState.cart,
        bubbles: false,
      })
    );
  }

  return result;
};

export const store = configureStore({
  reducer: { cart: cartSlice.reducer },
  middleware: (getDefaultMiddleware) =&gt;
    getDefaultMiddleware().concat(litBridgeMiddleware),
});

export type RootState = ReturnType&lt;typeof store.getState&gt;;
export const { addItem, removeItem } = cartSlice.actions;

// --- Lit Reactive Controller：訂閱 Redux ---
import { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Store, UnknownAction } from '@reduxjs/toolkit';

class ReduxController&lt;TState, TSlice&gt; implements ReactiveController {
  slice!: TSlice;
  private _unsubscribe?: () =&gt; void;

  constructor(
    private host: ReactiveControllerHost,
    private reduxStore: Store&lt;TState, UnknownAction&gt;,
    private selector: (state: TState) =&gt; TSlice,
  ) {
    host.addController(this);
    this.slice = selector(reduxStore.getState());
  }

  hostConnected() {
    let prevSlice = this.slice;
    this._unsubscribe = this.reduxStore.subscribe(() =&gt; {
      const nextSlice = this.selector(this.reduxStore.getState());
      if (!Object.is(prevSlice, nextSlice)) {
        prevSlice = nextSlice;
        this.slice = nextSlice;
        this.host.requestUpdate();
      }
    });
  }

  hostDisconnected() {
    this._unsubscribe?.();
  }
}

// --- Lit 元件使用 ---
@customElement('redux-cart-display')
class ReduxCartDisplay extends LitElement {
  private _cart = new ReduxController(
    this,
    store,
    (state: RootState) =&gt; state.cart,
  );

  private _handleAdd() {
    store.dispatch(addItem({ id: crypto.randomUUID(), name: '商品', price: 100 }));
  }

  render() {
    const { items, status } = this._cart.slice;
    return html\`
      &lt;div&gt;
        \${status === 'loading' ? html\`&lt;span&gt;載入中...&lt;/span&gt;\` : ''}
        &lt;p&gt;共 \${items.length} 件&lt;/p&gt;
        &lt;button @click=\${this._handleAdd}&gt;加入購物車&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>RTK Query 與 Lit 整合</h3>
  <p>
    RTK Query 提供了類似 TanStack Query 的請求快取、自動重新抓取、Optimistic Update 等功能。
    以下是讓 RTK Query 的端點結果驅動 Lit 元件的模式：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';

// 定義 API 端點
const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Product'],
  endpoints: (builder) =&gt; ({
    getProducts: builder.query&lt;Product[], void&gt;({
      query: () =&gt; '/products',
      providesTags: ['Product'],
    }),
    addProduct: builder.mutation&lt;Product, Partial&lt;Product&gt;&gt;({
      query: (body) =&gt; ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'],

      // Optimistic Update：在 API 回應前就更新 UI
      async onQueryStarted(newProduct, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          productApi.util.updateQueryData('getProducts', undefined, (draft) =&gt; {
            draft.push({ id: 'temp-' + Date.now(), ...newProduct } as Product);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          // API 失敗：回滾樂觀更新
          patchResult.undo();
        }
      },
    }),
  }),
});

// Lit Controller 包裝 RTK Query 端點
class RTKQueryController&lt;T&gt; implements ReactiveController {
  data: T | undefined;
  isLoading = false;
  error: unknown;
  private _unsubscribe?: () =&gt; void;

  constructor(
    private host: ReactiveControllerHost,
    private initiateFn: () =&gt; ReturnType&lt;typeof store.dispatch&gt;,
  ) {
    host.addController(this);
  }

  hostConnected() {
    const subscription = this.initiateFn() as any;
    this._unsubscribe = store.subscribe(() =&gt; {
      const result = subscription.select(store.getState());
      const changed =
        this.data !== result.data ||
        this.isLoading !== result.isLoading ||
        this.error !== result.error;
      if (changed) {
        this.data = result.data;
        this.isLoading = result.isLoading;
        this.error = result.error;
        this.host.requestUpdate();
      }
    });
  }

  hostDisconnected() {
    this._unsubscribe?.();
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">RTK vs TanStack Query for Lit</div>
    <p>
      對於新專案，<strong>TanStack Query</strong>（前身 React Query）是更輕量的選擇，
      不需要 Redux 整個體系。TanStack Query 5.x 有框架無關的核心（<code>@tanstack/query-core</code>），
      可以直接在 Lit 的 ReactiveController 中使用，無需任何適配層。
    </p>
  </div>

  <h3>TanStack Query Core 與 Lit 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { QueryClient, QueryObserver } from '@tanstack/query-core';

// 建立全域 QueryClient（應用級單例）
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 分鐘內視為新鮮
      gcTime: 10 * 60 * 1000,       // 10 分鐘後清除快取
      retry: 2,
    },
  },
});

// Lit ReactiveController 包裝 QueryObserver
class QueryController&lt;TData, TError = Error&gt; implements ReactiveController {
  private _observer!: QueryObserver&lt;TData, TError&gt;;
  private _unsubscribe?: () =&gt; void;

  data: TData | undefined;
  error: TError | null = null;
  isLoading = false;
  isFetching = false;
  status: 'pending' | 'error' | 'success' = 'pending';

  constructor(
    private host: ReactiveControllerHost,
    private getOptions: () =&gt; {
      queryKey: readonly unknown[];
      queryFn: () =&gt; Promise&lt;TData&gt;;
      enabled?: boolean;
    },
  ) {
    host.addController(this);
  }

  hostConnected() {
    this._observer = new QueryObserver(queryClient, {
      ...this.getOptions(),
    });

    this._unsubscribe = this._observer.subscribe((result) =&gt; {
      this.data = result.data;
      this.error = result.error;
      this.isLoading = result.isLoading;
      this.isFetching = result.isFetching;
      this.status = result.status;
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this._unsubscribe?.();
    this._observer?.destroy();
  }

  // 手動重新抓取
  refetch() {
    return this._observer.refetch();
  }
}

// 使用範例
@customElement('product-list')
class ProductList extends LitElement {
  @property() categoryId = '';

  private _query = new QueryController&lt;Product[]&gt;(this, () =&gt; ({
    queryKey: ['products', this.categoryId],
    queryFn: () =&gt; fetch(\`/api/products?cat=\${this.categoryId}\`).then(r =&gt; r.json()),
    enabled: Boolean(this.categoryId),
  }));

  render() {
    const { isLoading, error, data } = this._query;
    if (isLoading) return html\`&lt;loading-spinner&gt;&lt;/loading-spinner&gt;\`;
    if (error) return html\`&lt;error-message .message=\${error.message}&gt;&lt;/error-message&gt;\`;
    return html\`
      \${(data ?? []).map(p =&gt; html\`&lt;product-card .product=\${p}&gt;&lt;/product-card&gt;\`)}
    \`;
  }
}</code></pre>

  <h3>Optimistic UI 更新模式</h3>
  <p>
    Optimistic UI 在等待 API 回應之前就更新 UI，讓應用感覺更快速。
    關鍵在於能夠在失敗時安全回滾：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { useMutation } from '@tanstack/query-core';

@customElement('todo-list')
class TodoList extends LitElement {
  @state() private _optimisticItems: Todo[] = [];
  @state() private _serverItems: Todo[] = [];

  // 計算：樂觀狀態 + 伺服器狀態合併
  private get _displayItems() {
    return this._optimisticItems.length
      ? this._optimisticItems
      : this._serverItems;
  }

  private async _handleToggle(todo: Todo) {
    const toggled = { ...todo, completed: !todo.completed };

    // 1. 立即更新 UI（樂觀）
    this._optimisticItems = this._serverItems.map(t =&gt;
      t.id === todo.id ? toggled : t
    );

    try {
      // 2. 呼叫 API
      const updated = await api.updateTodo(toggled);
      // 3. 成功：用伺服器結果更新，清除樂觀狀態
      this._serverItems = this._serverItems.map(t =&gt;
        t.id === updated.id ? updated : t
      );
    } catch (error) {
      // 4. 失敗：回滾到伺服器狀態
      console.error('更新失敗，回滾', error);
    } finally {
      this._optimisticItems = [];    // 無論成功失敗都清除樂觀狀態
    }
  }

  render() {
    return html\`
      &lt;ul&gt;
        \${this._displayItems.map(todo =&gt; html\`
          &lt;li class=\${todo.completed ? 'done' : ''}&gt;
            &lt;input
              type="checkbox"
              .checked=\${todo.completed}
              @change=\${() =&gt; this._handleToggle(todo)}
            /&gt;
            \${todo.title}
          &lt;/li&gt;
        \`)}
      &lt;/ul&gt;
    \`;
  }
}</code></pre>
</section>

<section id="signals-implementation">
  <h2>TC39 Signals 實作與 Lit 整合</h2>
  <p>
    <strong>TC39 Signals Proposal</strong> 目前處於 Stage 1（截至 2025 年），
    但 <code>@preact/signals-core</code> 提供了穩定可用的 signals 實作，
    已可在生產環境中與 Lit 整合。
  </p>

  <h3>@preact/signals-core 與 Lit 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { signal, computed, effect, batch, Signal } from '@preact/signals-core';

// --- 應用級 Signals（框架無關的共享狀態）---
export const cartItems = signal&lt;CartItem[]&gt;([]);
export const userId = signal&lt;string | null&gt;(null);
export const cartTotal = computed(() =&gt;
  cartItems.value.reduce((sum, item) =&gt; sum + item.price * item.qty, 0)
);
export const cartCount = computed(() =&gt;
  cartItems.value.reduce((sum, item) =&gt; sum + item.qty, 0)
);

// 批次更新：避免觸發多次重渲染
export function addToCart(item: CartItem) {
  batch(() =&gt; {
    cartItems.value = [...cartItems.value, item];
    // 如果有其他 signals 也需要更新，放在同一個 batch 中
  });
}

// --- Lit ReactiveController for Signals ---
class SignalController implements ReactiveController {
  private _disposers: Array&lt;() =&gt; void&gt; = [];

  constructor(
    private host: ReactiveControllerHost,
    // 傳入需要追蹤的 signals 陣列
    private signals: Signal[],
  ) {
    host.addController(this);
  }

  hostConnected() {
    // 為每個 signal 建立 effect，signal 改變時請求更新
    for (const sig of this.signals) {
      const dispose = effect(() =&gt; {
        sig.value;                     // 讀取值以建立追蹤關係
        this.host.requestUpdate();
      });
      this._disposers.push(dispose);
    }
  }

  hostDisconnected() {
    this._disposers.forEach(d =&gt; d());
    this._disposers = [];
  }
}

// --- 使用 Signals 的 Lit 元件 ---
@customElement('cart-summary')
class CartSummary extends LitElement {
  // 訂閱多個 computed signals
  private _signals = new SignalController(this, [cartTotal, cartCount]);

  render() {
    return html\`
      &lt;div class="cart-summary"&gt;
        &lt;span class="count"&gt;\${cartCount.value} 件&lt;/span&gt;
        &lt;span class="total"&gt;NT$\${cartTotal.value.toFixed(0)}&lt;/span&gt;
      &lt;/div&gt;
    \`;
  }
}

// 任何框架都可以寫入相同的 signals
// React 元件也能使用相同的購物車狀態：
// import { useSignal } from '@preact/signals-react';
// const total = useSignal(cartTotal);   // 自動追蹤，React re-render</code></pre>

  <h3>Signals 的細粒度更新優勢</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 場景：大型列表，只有一個項目的價格改變
const products = signal&lt;Product[]&gt;(initialProducts);

// computed：每個產品獨立的 computed signal
function createProductSignals(productId: string) {
  return {
    price: computed(() =&gt;
      products.value.find(p =&gt; p.id === productId)?.price ?? 0
    ),
    stock: computed(() =&gt;
      products.value.find(p =&gt; p.id === productId)?.stock ?? 0
    ),
  };
}

@customElement('product-row')
class ProductRow extends LitElement {
  @property() productId = '';
  private _signals!: SignalController;
  private _price!: ReturnType&lt;typeof computed&gt;;
  private _stock!: ReturnType&lt;typeof computed&gt;;

  connectedCallback() {
    super.connectedCallback();
    const { price, stock } = createProductSignals(this.productId);
    this._price = price;
    this._stock = stock;
    // 只有這個產品的 price 或 stock 改變，才重渲染此元件
    this._signals = new SignalController(this, [price, stock]);
  }

  render() {
    return html\`
      &lt;tr&gt;
        &lt;td&gt;\${this.productId}&lt;/td&gt;
        &lt;td&gt;NT$\${this._price.value}&lt;/td&gt;
        &lt;td&gt;\${this._stock.value} 件&lt;/td&gt;
      &lt;/tr&gt;
    \`;
  }
}
// 1000 個 ProductRow 元件中，只有 1 個真正重渲染 ✓</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">@preact/signals-core vs @lit-labs/signals</div>
    <p>
      <code>@lit-labs/signals</code> 整合了 TC39 Signals Polyfill，API 可能隨規格演進而改變（目前 Stage 1）。
      <code>@preact/signals-core</code> 是穩定的生產就緒選項，API 不依賴 TC39 提案。
      新專案建議使用 <code>@preact/signals-core</code>，待 TC39 提案穩定後再遷移。
    </p>
  </div>
</section>

<section id="signals-preview">
  <h2>Signals：下一代響應式原語</h2>
  <p>
    TC39 Signals Proposal 正在標準化一種所有框架都能使用的響應式原語。
    Lit 已透過 <code>@lit-labs/signals</code> 提供早期整合。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// @lit-labs/signals：整合 TC39 Signals Polyfill
import { signal, computed, effect } from 'signal-polyfill';
import { SignalWatcher, html as signalHtml } from '@lit-labs/signals';

// 應用級 signals
const count = new Signal.State(0);
const doubled = new Signal.Computed(() =&gt; count.get() * 2);

// 在 Lit 元件中使用 SignalWatcher mixin
@customElement('signal-counter')
class SignalCounter extends SignalWatcher(LitElement) {
  render() {
    // SignalWatcher 自動追蹤 render() 中讀取的所有 signals
    return html\`
      &lt;p&gt;Count: \${count.get()}, Doubled: \${doubled.get()}&lt;/p&gt;
      &lt;button @click=\${() =&gt; count.set(count.get() + 1)}&gt;+1&lt;/button&gt;
    \`;
  }
}

// 使用 signalHtml：模板層級的細粒度更新
// 只有包含 signal 的 Part 才更新，而非整個元件
@customElement('signal-counter-v2')
class SignalCounterV2 extends LitElement {
  render() {
    // signalHtml 讓每個 signal 值直接更新對應 DOM 節點
    // 不需要 SignalWatcher，也不需要 requestUpdate()
    return signalHtml\`
      &lt;p&gt;Count: \${count}, Doubled: \${doubled}&lt;/p&gt;
    \`;
  }
}</code></pre>

  <p>
    Signals 的優勢在於<strong>跨框架共享</strong>：
    同一個 Signal 可以被 React、Vue、Angular、Lit 同時訂閱，
    這在微前端架構中具有革命性意義。
  </p>
</section>

<section id="state-architecture-enterprise">
  <h2>企業級狀態架構設計</h2>
  <p>
    企業應用的狀態不是單一層級的，而是由多個層級組成。
    混淆不同層級的狀態是最常見的架構錯誤之一。
  </p>

  <h3>四層狀態模型</h3>
  <table>
    <thead>
      <tr>
        <th>層級</th>
        <th>定義</th>
        <th>範例</th>
        <th>推薦工具</th>
        <th>生命週期</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>UI 狀態</strong></td>
        <td>純展示邏輯，不影響業務</td>
        <td>下拉選單展開、tooltip 顯示、輸入框 focus</td>
        <td><code>@state()</code></td>
        <td>元件存在期間</td>
      </tr>
      <tr>
        <td><strong>元件狀態</strong></td>
        <td>元件的業務資料，可能需要向上傳遞</td>
        <td>表單欄位值、分頁當前頁碼</td>
        <td><code>@property()</code> + Events</td>
        <td>元件存在期間</td>
      </tr>
      <tr>
        <td><strong>應用狀態</strong></td>
        <td>跨元件共享的業務資料</td>
        <td>登入使用者、購物車、通知列表</td>
        <td>Zustand / MobX / Redux</td>
        <td>頁面存在期間</td>
      </tr>
      <tr>
        <td><strong>伺服器狀態</strong></td>
        <td>來自後端的遠端資料，需要快取與同步</td>
        <td>商品列表、訂單歷史、使用者資料</td>
        <td>TanStack Query / RTK Query / SWR</td>
        <td>由 TTL 和失效策略決定</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">最常見的架構錯誤：把伺服器狀態放進應用狀態</div>
    <p>
      很多團隊把 <code>fetch()</code> 的結果存入 Redux/Zustand，
      然後自己實作快取失效、loading 狀態、錯誤處理、重試機制。
      這些工作 TanStack Query 已經解決了。
      伺服器狀態應該交給專門的伺服器狀態管理工具，
      應用狀態 store 只存放真正的客戶端狀態（使用者偏好、UI 配置等）。
    </p>
  </div>

  <h3>狀態序列化與 SSR 水合（Hydration）</h3>
  <p>
    當 Lit 元件在 SSR 環境（如 Lit SSR、Eleventy、Astro）中渲染時，
    狀態需要能夠序列化到 HTML，並在客戶端水合時恢復。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 方法一：使用 &lt;script type="application/json"&gt; 傳遞初始狀態
// server.ts（Node.js / Deno）
import { render } from '@lit-labs/ssr';
import { html } from 'lit';

async function renderPage(req: Request) {
  const user = await db.getUser(getUserId(req));
  const cart = await db.getCart(user.id);

  // 將狀態序列化為 JSON，嵌入 HTML
  const serializedState = JSON.stringify({ user, cart });

  const ssrResult = render(html\`
    &lt;script type="application/json" id="__INITIAL_STATE__"&gt;
      \${serializedState}
    &lt;/script&gt;
    &lt;my-app&gt;&lt;/my-app&gt;
  \`);

  return new Response(collectResultSync(ssrResult), {
    headers: { 'Content-Type': 'text/html' },
  });
}

// client.ts：從 HTML 恢復狀態
function hydrateState() {
  const el = document.getElementById('__INITIAL_STATE__');
  if (!el) return {};
  try {
    return JSON.parse(el.textContent ?? '{}');
  } catch {
    return {};
  }
}

const initialState = hydrateState();

// 將水合的狀態注入 store
useCartStore.setState({ items: initialState.cart?.items ?? [] });
userId.value = initialState.user?.id ?? null;

// 方法二：Lit 元件從 attribute 接收序列化狀態
@customElement('hydration-aware-cart')
class HydrationAwareCart extends LitElement {
  // attribute 接收序列化的 JSON 初始狀態
  @property({ type: Object, attribute: 'initial-state' })
  initialState?: { items: CartItem[] };

  @state() private _items: CartItem[] = [];

  connectedCallback() {
    super.connectedCallback();
    // 優先使用 SSR 傳下來的初始狀態
    if (this.initialState?.items) {
      this._items = this.initialState.items;
    }
  }
}</code></pre>

  <h3>狀態管理完整比較矩陣</h3>
  <table>
    <thead>
      <tr>
        <th>方案</th>
        <th>適用場景</th>
        <th>Bundle 大小</th>
        <th>TypeScript</th>
        <th>DevTools</th>
        <th>跨框架</th>
        <th>SSR 支援</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Lit @state()</strong></td>
        <td>元件局部 UI 狀態</td>
        <td>0（內建）</td>
        <td>★★★★★</td>
        <td>無</td>
        <td>否</td>
        <td>★★★★★</td>
      </tr>
      <tr>
        <td><strong>@lit/context</strong></td>
        <td>祖先→後代共享配置</td>
        <td>~2KB</td>
        <td>★★★★☆</td>
        <td>無</td>
        <td>否（Lit 限定）</td>
        <td>★★★★☆</td>
      </tr>
      <tr>
        <td><strong>Zustand</strong></td>
        <td>應用級業務狀態</td>
        <td>~3KB</td>
        <td>★★★★★</td>
        <td>Redux DevTools</td>
        <td>是</td>
        <td>★★★★☆</td>
      </tr>
      <tr>
        <td><strong>MobX</strong></td>
        <td>複雜響應式物件圖</td>
        <td>~16KB</td>
        <td>★★★★★</td>
        <td>MobX DevTools</td>
        <td>是</td>
        <td>★★★☆☆</td>
      </tr>
      <tr>
        <td><strong>Redux Toolkit</strong></td>
        <td>大型團隊、嚴格規範</td>
        <td>~40KB</td>
        <td>★★★★★</td>
        <td>Redux DevTools ★★★★★</td>
        <td>是</td>
        <td>★★★★★</td>
      </tr>
      <tr>
        <td><strong>@preact/signals</strong></td>
        <td>高效能、跨框架共享</td>
        <td>~2KB</td>
        <td>★★★★☆</td>
        <td>無（計劃中）</td>
        <td>是（最佳）</td>
        <td>★★★☆☆</td>
      </tr>
      <tr>
        <td><strong>TanStack Query</strong></td>
        <td>伺服器狀態管理</td>
        <td>~13KB</td>
        <td>★★★★★</td>
        <td>TanStack DevTools</td>
        <td>是</td>
        <td>★★★★★</td>
      </tr>
    </tbody>
  </table>
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
        <td>遠端資料快取（API 結果）</td>
        <td>TanStack Query Core</td>
        <td>解決快取、重試、失效的複雜性</td>
      </tr>
      <tr>
        <td>跨框架共享狀態（微前端）</td>
        <td>@preact/signals-core</td>
        <td>零框架依賴，細粒度更新</td>
      </tr>
      <tr>
        <td>大型團隊，需要嚴格狀態追蹤</td>
        <td>Redux Toolkit</td>
        <td>Time-travel debugging，完整 DevTools</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-tip">
    <div class="callout-title">從簡單開始，只在必要時升級</div>
    <p>
      從 <code>@state()</code> 開始。當你發現需要在多個不相關元件之間共享狀態時，
      才考慮 Context。當你的 Context 開始包含非同步邏輯和複雜更新時，
      才考慮 Zustand。當你的伺服器資料需要快取和同步時，才引入 TanStack Query。
      架構的複雜度應該與問題的複雜度成正比，過早的架構設計是最常見的工程陷阱。
    </p>
  </div>
</section>
`,
};
