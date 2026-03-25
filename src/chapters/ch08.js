export default {
  id: 8,
  slug: 'chapter-8',
  title: 'Context API 與跨元件通訊',
  part: 2,
  intro: 'Lit 的 @lit/context 解決方案，與 Event-based 通訊、Slot 模式的比較與選型策略。',
  sections: [
    { slug: 'communication-patterns', title: '元件通訊模式總覽' },
    { slug: 'event-based', title: 'Event-based 通訊' },
    { slug: 'slots-composition', title: 'Slots 與元件組合' },
    { slug: 'lit-context-api', title: '@lit/context 深度解析' },
    { slug: 'context-provider-consumer', title: 'Provider / Consumer 模式' },
    { slug: 'context-type-safety', title: 'Context 型別安全與 TypeScript 整合' },
    { slug: 'context-performance', title: 'Context 效能考量：何時觸發更新' },
    { slug: 'context-vs-alternatives', title: 'Context vs Redux vs Zustand：企業選型分析' },
    { slug: 'choosing-pattern', title: '如何選擇通訊策略' },
  ],
  content: `
<section id="communication-patterns">
  <h2>元件通訊模式總覽</h2>
  <p>
    Web Components 的通訊策略與 React/Vue 有所不同，主要因為 Shadow DOM 的封裝特性。
    Lit 提供了幾種通訊機制，各有其適用場景：
  </p>
  <table>
    <thead>
      <tr><th>模式</th><th>適用場景</th><th>複雜度</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Properties / Attributes</td>
        <td>父 → 子單向傳遞</td>
        <td>低</td>
      </tr>
      <tr>
        <td>Custom Events</td>
        <td>子 → 父（或任意方向）</td>
        <td>低</td>
      </tr>
      <tr>
        <td>Slots</td>
        <td>內容投影、組合模式</td>
        <td>低</td>
      </tr>
      <tr>
        <td>@lit/context</td>
        <td>跨層級的共享狀態</td>
        <td>中</td>
      </tr>
      <tr>
        <td>外部狀態管理（MobX/Zustand）</td>
        <td>應用級全域狀態</td>
        <td>高</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="event-based">
  <h2>Event-based 通訊</h2>
  <p>
    Custom Events 是 Web Components 最自然的通訊機制。
    子元件透過 <code>dispatchEvent</code> 發送事件，
    父元件透過 <code>@event-name</code> 監聽。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 子元件：發送事件
@customElement('item-card')
class ItemCard extends LitElement {
  @property({ type: Object }) item!: Item;

  private _handleDelete() {
    // composed: true 讓事件穿越 Shadow DOM 邊界
    this.dispatchEvent(new CustomEvent('item-delete', {
      detail: { id: this.item.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleEdit(newName: string) {
    this.dispatchEvent(new CustomEvent('item-edit', {
      detail: { id: this.item.id, name: newName },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;span&gt;\${this.item.name}&lt;/span&gt;
        &lt;button @click=\${this._handleDelete}&gt;刪除&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}

// 父元件：監聽事件
@customElement('item-list')
class ItemList extends LitElement {
  @state() private _items: Item[] = [...initialItems];

  private _handleDelete(e: CustomEvent) {
    this._items = this._items.filter(item =&gt; item.id !== e.detail.id);
  }

  private _handleEdit(e: CustomEvent) {
    this._items = this._items.map(item =&gt;
      item.id === e.detail.id ? { ...item, name: e.detail.name } : item
    );
  }

  render() {
    return html\`
      &lt;div @item-delete=\${this._handleDelete} @item-edit=\${this._handleEdit}&gt;
        \${this._items.map(item =&gt; html\`
          &lt;item-card .item=\${item}&gt;&lt;/item-card&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>型別安全的 Custom Events</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 定義型別安全的事件
interface ItemDeleteEvent extends CustomEvent {
  detail: { id: string };
}

// 使用型別斷言
private _handleDelete(e: Event) {
  const { id } = (e as ItemDeleteEvent).detail;
  this._items = this._items.filter(item =&gt; item.id !== id);
}</code></pre>
</section>

<section id="slots-composition">
  <h2>Slots 與元件組合</h2>
  <p>
    Slots 是組合（Composition）模式的核心工具。
    與其用 Properties 傳遞複雜的 UI 設定，
    不如讓使用者直接投影 HTML 內容。
  </p>

  <pre data-lang="typescript"><code class="language-typescript">// 彈性的 Dialog 元件，使用 Slots 實現高度可組合性
@customElement('app-dialog')
class AppDialog extends LitElement {
  static styles = css\`
    .overlay { /* ... */ }
    .dialog { /* ... */ }
    .header { border-bottom: 1px solid #e0e0e0; padding: 16px; }
    .body { padding: 24px; }
    .footer { border-top: 1px solid #e0e0e0; padding: 16px; display: flex; gap: 8px; justify-content: flex-end; }
  \`;

  @property({ type: Boolean, reflect: true }) open = false;

  render() {
    if (!this.open) return html\`\`;
    return html\`
      &lt;div class="overlay" @click=\${() =&gt; this.open = false}&gt;
        &lt;div class="dialog" @click=\${(e: Event) =&gt; e.stopPropagation()}&gt;
          &lt;div class="header"&gt;
            &lt;slot name="title"&gt;&lt;h2&gt;Dialog&lt;/h2&gt;&lt;/slot&gt;
          &lt;/div&gt;
          &lt;div class="body"&gt;
            &lt;slot&gt;&lt;/slot&gt;  &lt;!-- 預設 slot：dialog 內容 --&gt;
          &lt;/div&gt;
          &lt;div class="footer"&gt;
            &lt;slot name="actions"&gt;
              &lt;button @click=\${() =&gt; this.open = false}&gt;關閉&lt;/button&gt;
            &lt;/slot&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}

// 使用端：高度靈活，無需複雜的 Props API
render() {
  return html\`
    &lt;app-dialog .open=\${this._showDialog}&gt;
      &lt;h2 slot="title"&gt;確認刪除&lt;/h2&gt;
      &lt;p&gt;此操作無法復原，確定要刪除嗎？&lt;/p&gt;
      &lt;div slot="actions"&gt;
        &lt;button @click=\${this._cancel}&gt;取消&lt;/button&gt;
        &lt;button class="danger" @click=\${this._confirm}&gt;確認刪除&lt;/button&gt;
      &lt;/div&gt;
    &lt;/app-dialog&gt;
  \`;
}</code></pre>
</section>

<section id="lit-context-api">
  <h2>@lit/context 深度解析</h2>
  <p>
    當元件層級很深，需要將資料從祖先傳遞到遙遠的後代時，
    一層一層傳 Properties（Prop Drilling）會非常繁瑣。
    <code>@lit/context</code> 解決了這個問題。
  </p>
  <p>
    它基於瀏覽器原生的 <strong>Event-based 機制</strong>（不是 React Context 那種樹走訪），
    Consumer 向上發送請求事件，Provider 攔截並提供資料。
  </p>

  <h3>內部運作機制：ContextEvent 協定</h3>
  <p>
    理解 <code>@lit/context</code> 的內部機制有助於除錯和效能調優。
    整個系統建立在一個簡單的自訂事件協定上：
  </p>
  <ol>
    <li>
      Consumer 在 <code>connectedCallback</code> 中向上發送一個 <code>context-request</code> 事件，
      事件的 <code>detail</code> 包含 context key 和一個回呼函數。
    </li>
    <li>
      Provider 監聽這個事件，當 context key 匹配時，
      呼叫回呼函數傳入當前值，並（若 <code>subscribe: true</code>）記錄訂閱者。
    </li>
    <li>
      當 Provider 的值改變時，遍歷所有訂閱者，依次呼叫它們的回呼函數。
    </li>
    <li>
      Consumer 的回呼函數在被呼叫時，更新自身的屬性並呼叫 <code>requestUpdate()</code>。
    </li>
  </ol>

  <pre data-lang="typescript"><code class="language-typescript">// @lit/context 的簡化內部實作示意（非真實原始碼）
// 幫助理解 ContextEvent 協定

const CONTEXT_REQUEST = 'context-request';

class ContextEvent extends Event {
  constructor(
    public readonly context: unknown,           // Context key
    public readonly callback: (value: unknown, unsubscribe?: () =&gt; void) =&gt; void,
    public readonly subscribe: boolean = false,
  ) {
    super(CONTEXT_REQUEST, { bubbles: true, composed: true });
  }
}

// Provider 的核心邏輯（簡化）
class ContextProvider {
  private _value: unknown;
  private _subscribers = new Set&lt;(value: unknown) =&gt; void&gt;();

  constructor(private host: HTMLElement, private context: unknown) {
    host.addEventListener(CONTEXT_REQUEST, (e: Event) =&gt; {
      const event = e as ContextEvent;
      if (event.context !== this.context) return;
      e.stopPropagation(); // 阻止冒泡，防止外層 Provider 也響應

      if (event.subscribe) {
        const subscriber = event.callback;
        this._subscribers.add(subscriber);
        // 提供取消訂閱的方法
        event.callback(this._value, () =&gt; this._subscribers.delete(subscriber));
      } else {
        event.callback(this._value);
      }
    });
  }

  setValue(newValue: unknown) {
    this._value = newValue;
    // 通知所有訂閱者
    for (const subscriber of this._subscribers) {
      subscriber(newValue);
    }
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">為什麼是 Event 而不是樹走訪？</div>
    <p>
      React Context 透過虛擬 DOM 樹走訪找到最近的 Provider。
      <code>@lit/context</code> 改用 DOM Event 冒泡，
      這有幾個重要優點：<br>
      <br>
      1. <strong>天然支援 Shadow DOM</strong>：設定 <code>composed: true</code> 的事件可以穿越 Shadow DOM 邊界，
      Consumer 和 Provider 不需要在同一個 Shadow Tree 中。<br>
      <br>
      2. <strong>不依賴框架樹</strong>：可以在原生 Custom Elements 中使用，不需要 Lit 管理整個元件樹。<br>
      <br>
      3. <strong>效能更佳</strong>：只有發生請求的路徑上的 Provider 才會被觸發，
      不需要走訪整個虛擬 DOM 樹。
    </p>
  </div>

  <pre data-lang="bash"><code class="language-bash">npm install @lit/context</code></pre>

  <pre data-lang="typescript"><code class="language-typescript">import { createContext } from '@lit/context';

// 1. 定義 Context（型別安全）
export const themeContext = createContext&lt;'light' | 'dark'&gt;('theme-context');
export const userContext = createContext&lt;User | null&gt;('user-context');</code></pre>
</section>

<section id="context-provider-consumer">
  <h2>Provider / Consumer 模式</h2>

  <pre data-lang="typescript"><code class="language-typescript">import { provide, consume } from '@lit/context';
import { themeContext, userContext } from './contexts.js';

// Provider：提供資料給後代元件
@customElement('app-root')
class AppRoot extends LitElement {
  @provide({ context: themeContext })
  @state() theme: 'light' | 'dark' = 'light';

  @provide({ context: userContext })
  @state() currentUser: User | null = null;

  async connectedCallback() {
    super.connectedCallback();
    this.currentUser = await fetchCurrentUser();
  }

  render() {
    return html\`
      &lt;button @click=\${() =&gt; { this.theme = this.theme === 'light' ? 'dark' : 'light'; }}&gt;
        切換主題
      &lt;/button&gt;
      &lt;app-layout&gt;
        &lt;!-- 深層後代可以直接消費 context，無需逐層傳遞 --&gt;
        &lt;user-profile&gt;&lt;/user-profile&gt;
      &lt;/app-layout&gt;
    \`;
  }
}

// Consumer：消費 context 資料（可以在任意深度）
@customElement('user-avatar')
class UserAvatar extends LitElement {
  // 自動從最近的 Provider 取得資料，Provider 更新時自動重新渲染
  @consume({ context: userContext, subscribe: true })
  user: User | null = null;

  @consume({ context: themeContext, subscribe: true })
  theme: 'light' | 'dark' = 'light';

  render() {
    if (!this.user) return html\`&lt;div class="skeleton"&gt;&lt;/div&gt;\`;
    return html\`
      &lt;img
        class=\${this.theme}
        src=\${this.user.avatar}
        alt=\${this.user.name}
      &gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">subscribe: true</div>
    <p>
      <code>subscribe: true</code> 讓 Consumer 在 Provider 的值改變時自動更新。
      如果不加，只在元件第一次連接時取得一次值。
      大多數場景都需要 <code>subscribe: true</code>。
    </p>
  </div>

  <h3>結合 Reactive Controller 使用 Context</h3>
  <p>
    將 Context 消費邏輯封裝到 Reactive Controller 中，
    可以在多個元件之間共用相同的訂閱邏輯，並且更容易測試。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContextConsumer } from '@lit/context';
import { userContext, themeContext } from './contexts.js';
import type { User } from './types.js';

// 將常用的 context 消費封裝成 Controller
class AppContextController implements ReactiveController {
  private _userConsumer: ContextConsumer&lt;typeof userContext, ReactiveControllerHost &amp; HTMLElement&gt;;
  private _themeConsumer: ContextConsumer&lt;typeof themeContext, ReactiveControllerHost &amp; HTMLElement&gt;;

  constructor(private host: ReactiveControllerHost &amp; HTMLElement) {
    this._userConsumer = new ContextConsumer(host, {
      context: userContext,
      subscribe: true,
    });
    this._themeConsumer = new ContextConsumer(host, {
      context: themeContext,
      subscribe: true,
    });
    host.addController(this);
  }

  get user(): User | null {
    return this._userConsumer.value ?? null;
  }

  get theme(): 'light' | 'dark' {
    return this._themeConsumer.value ?? 'light';
  }

  get isDark() {
    return this.theme === 'dark';
  }

  hostConnected() {}
  hostDisconnected() {}
}

// 在任何元件中輕鬆使用
@customElement('themed-card')
class ThemedCard extends LitElement {
  private _ctx = new AppContextController(this);

  render() {
    return html\`
      &lt;div class=\${this._ctx.isDark ? 'dark' : 'light'}&gt;
        &lt;p&gt;使用者：\${this._ctx.user?.name ?? '未登入'}&lt;/p&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="context-type-safety">
  <h2>Context 型別安全與 TypeScript 整合</h2>
  <p>
    <code>@lit/context</code> 的 <code>createContext&lt;T&gt;</code>
    透過泛型參數為整個 Provider-Consumer 鏈提供端到端的型別安全。
    但在大型專案中，正確設定型別需要一些技巧。
  </p>

  <h3>完整的型別安全 Context 設定</h3>
  <pre data-lang="typescript"><code class="language-typescript">// contexts/user.context.ts
import { createContext } from '@lit/context';

// 定義清晰的型別
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  permissions: string[];
}

export interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) =&gt; Promise&lt;void&gt;;
  logout: () =&gt; Promise&lt;void&gt;;
  updateProfile: (updates: Partial&lt;User&gt;) =&gt; Promise&lt;void&gt;;
}

// createContext 的泛型參數讓整個系統型別安全
export const userContext = createContext&lt;UserContextValue&gt;(
  // Symbol 作為 key 確保唯一性，避免跨套件衝突
  Symbol.for('app.user-context')
);

// contexts/theme.context.ts
export interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark'; // 解析後的實際主題
  setTheme: (theme: ThemeContextValue['theme']) =&gt; void;
  primaryColor: string;
}

export const themeContext = createContext&lt;ThemeContextValue&gt;(
  Symbol.for('app.theme-context')
);</code></pre>

  <h3>型別安全的 Provider 實作</h3>
  <pre data-lang="typescript"><code class="language-typescript">// providers/user-provider.element.ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { userContext, UserContextValue, User } from '../contexts/user.context.js';

@customElement('user-provider')
class UserProvider extends LitElement {
  // TypeScript 會檢查型別是否與 createContext&lt;UserContextValue&gt; 一致
  @provide({ context: userContext })
  @state()
  private _contextValue: UserContextValue = {
    user: null,
    isLoading: false,
    error: null,
    login: this._login.bind(this),
    logout: this._logout.bind(this),
    updateProfile: this._updateProfile.bind(this),
  };

  private async _login(credentials: { email: string; password: string }) {
    // 更新 context 時，必須替換整個物件（觸發訂閱者更新）
    this._contextValue = { ...this._contextValue, isLoading: true, error: null };

    try {
      const user = await authService.login(credentials);
      // 替換整個物件確保 Consumer 收到通知
      this._contextValue = { ...this._contextValue, user, isLoading: false };
    } catch (err) {
      this._contextValue = {
        ...this._contextValue,
        isLoading: false,
        error: (err as Error).message,
      };
    }
  }

  private async _logout() {
    await authService.logout();
    this._contextValue = { ...this._contextValue, user: null };
  }

  private async _updateProfile(updates: Partial&lt;User&gt;) {
    if (!this._contextValue.user) return;
    const updated = await userService.update(this._contextValue.user.id, updates);
    this._contextValue = {
      ...this._contextValue,
      user: { ...this._contextValue.user, ...updated },
    };
  }

  render() {
    // Provider 元件本身只是一個透明的容器
    return html\`&lt;slot&gt;&lt;/slot&gt;\`;
  }

  // 隱藏 Shadow DOM（讓 slot 直接投影）
  protected createRenderRoot() {
    return this; // 無 Shadow DOM
  }
}</code></pre>

  <h3>使用 ContextConsumer 類別（更靈活的方式）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 不使用 decorator，直接用 ContextConsumer 類別
// 適合需要在 connectedCallback 中動態處理的情況
import { ContextConsumer } from '@lit/context';
import { userContext, UserContextValue } from '../contexts/user.context.js';

@customElement('login-button')
class LoginButton extends LitElement {
  private _userCtx = new ContextConsumer(this, {
    context: userContext,
    subscribe: true,
    // callback 在每次值更新時都會被呼叫
    callback: (value: UserContextValue) =&gt; {
      // 可以在這裡做一些非渲染的副作用
      if (value.user) {
        analytics.identify(value.user.id);
      }
    },
  });

  // 型別安全地存取 context 值
  private get _user() {
    return this._userCtx.value?.user ?? null;
  }

  private get _isLoading() {
    return this._userCtx.value?.isLoading ?? false;
  }

  private _handleLogin = async () =&gt; {
    await this._userCtx.value?.login({ email: '...', password: '...' });
  };

  render() {
    if (this._isLoading) {
      return html\`&lt;button disabled&gt;登入中...&lt;/button&gt;\`;
    }
    if (this._user) {
      return html\`&lt;span&gt;\${this._user.name}&lt;/span&gt;\`;
    }
    return html\`&lt;button @click=\${this._handleLogin}&gt;登入&lt;/button&gt;\`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">用 Symbol.for() 作為 Context Key</div>
    <p>
      使用字串作為 context key 有命名衝突的風險（尤其在微前端或使用第三方套件時）。
      改用 <code>Symbol.for('unique.namespace.key')</code> 可以確保全域唯一性，
      同時 <code>Symbol.for</code>（不是 <code>Symbol()</code>）保證在不同 bundle 中
      取得相同的 Symbol，避免 context 無法匹配的問題。
    </p>
  </div>
</section>

<section id="context-performance">
  <h2>Context 效能考量：何時觸發更新</h2>
  <p>
    <code>@lit/context</code> 的更新機制基於<strong>物件參考比較</strong>：
    當 Provider 的 <code>@state()</code> 屬性被賦予新值時，
    所有訂閱者都會收到通知並觸發重新渲染。
    如果 context value 是一個大型物件，不當的更新模式會導致過多的渲染。
  </p>

  <h3>常見的效能陷阱</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 錯誤做法：每次渲染都建立新物件
@customElement('bad-provider')
class BadProvider extends LitElement {
  @provide({ context: someContext })
  // 這樣寫會讓所有 Consumer 在 BadProvider 每次渲染時都更新！
  // 因為 getter 每次都返回新物件，參考不同
  get contextValue() {
    return {
      data: this._data,
      onUpdate: () =&gt; this._handleUpdate(), // 每次都是新函數
    };
  }
}

// 正確做法：維護穩定的物件參考
@customElement('good-provider')
class GoodProvider extends LitElement {
  @provide({ context: someContext })
  @state()
  private _contextValue = this._buildContextValue();

  private _data: Data = initialData;

  private _buildContextValue() {
    return {
      data: this._data,
      // bind 確保函數參考穩定
      onUpdate: this._handleUpdate.bind(this),
    };
  }

  private _handleUpdate(newData: Data) {
    this._data = newData;
    // 手動更新 context，只在真正需要時觸發
    this._contextValue = this._buildContextValue();
  }
}</code></pre>

  <h3>部分更新策略：避免渲染整棵樹</h3>
  <p>
    當 context 包含多個不相關的欄位時，
    應該將它們拆分成多個獨立的 context，
    這樣只有訂閱了變更欄位的 Consumer 才會重新渲染。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// 反模式：把所有狀態放進一個大 context
// 任何欄位改變都會重新渲染所有 Consumer
export const appContext = createContext&lt;{
  user: User | null;
  theme: Theme;
  notifications: Notification[];
  featureFlags: FeatureFlags;
  i18n: I18nConfig;
}&gt;('app-context');

// 正確做法：按更新頻率分離 context
export const userContext = createContext&lt;User | null&gt;('user');             // 低頻更新
export const themeContext = createContext&lt;Theme&gt;('theme');                 // 低頻更新
export const notificationsContext = createContext&lt;Notification[]&gt;('notifications'); // 高頻更新
export const featureFlagsContext = createContext&lt;FeatureFlags&gt;('feature-flags');    // 極低頻

// 消費者只訂閱自己需要的 context
@customElement('notification-badge')
class NotificationBadge extends LitElement {
  // 只訂閱 notifications，不受 user 或 theme 變更影響
  @consume({ context: notificationsContext, subscribe: true })
  notifications: Notification[] = [];

  render() {
    const unread = this.notifications.filter(n =&gt; !n.read).length;
    return html\`&lt;span class="badge"&gt;\${unread}&lt;/span&gt;\`;
  }
}</code></pre>

  <h3>使用 ContextProvider 類別手動控制更新時機</h3>
  <pre data-lang="typescript"><code class="language-typescript">import { ContextProvider } from '@lit/context';
import { notificationsContext } from './contexts.js';

@customElement('app-shell')
class AppShell extends LitElement {
  // 使用 ContextProvider 類別而非 @provide decorator，獲得更精細的控制
  private _notificationsProvider = new ContextProvider(this, {
    context: notificationsContext,
    initialValue: [],
  });

  connectedCallback() {
    super.connectedCallback();
    // 使用 Server-Sent Events 接收即時通知
    this._eventSource = new EventSource('/api/notifications/stream');
    this._eventSource.onmessage = (e) =&gt; {
      const notification = JSON.parse(e.data) as Notification;
      const current = this._notificationsProvider.value ?? [];

      // 手動更新 context 值
      // ContextProvider.setValue() 直接通知所有訂閱者，不需要觸發宿主元件的重新渲染
      this._notificationsProvider.setValue([notification, ...current]);
    };
  }

  private _eventSource: EventSource | undefined;

  disconnectedCallback() {
    super.disconnectedCallback();
    this._eventSource?.close();
  }

  render() {
    return html\`&lt;slot&gt;&lt;/slot&gt;\`;
  }
}</code></pre>
</section>

<section id="context-vs-alternatives">
  <h2>Context vs Redux vs Zustand：企業選型分析</h2>
  <p>
    在實際的企業專案中，狀態管理方案的選擇取決於多個維度。
    以下是針對 Lit 應用的系統性分析。
  </p>

  <h3>各方案特性比較</h3>
  <table>
    <thead>
      <tr>
        <th>維度</th>
        <th>@lit/context</th>
        <th>Redux + Redux Toolkit</th>
        <th>Zustand</th>
        <th>MobX</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Bundle 大小</td>
        <td>~3KB（含 @lit/context）</td>
        <td>~50KB（RTK）</td>
        <td>~3KB</td>
        <td>~20KB</td>
      </tr>
      <tr>
        <td>學習曲線</td>
        <td>低（純 Lit 概念）</td>
        <td>高（Action/Reducer/Selector）</td>
        <td>低（直覺的 API）</td>
        <td>中（Observable/Reaction 概念）</td>
      </tr>
      <tr>
        <td>DevTools 支援</td>
        <td>無（需自行實作）</td>
        <td>優秀（Redux DevTools）</td>
        <td>良好（Redux DevTools 插件）</td>
        <td>良好（MobX DevTools）</td>
      </tr>
      <tr>
        <td>跨框架使用</td>
        <td>僅限 Web Components</td>
        <td>框架無關</td>
        <td>框架無關</td>
        <td>框架無關</td>
      </tr>
      <tr>
        <td>時間旅行除錯</td>
        <td>不支援</td>
        <td>支援</td>
        <td>支援（需插件）</td>
        <td>不支援</td>
      </tr>
      <tr>
        <td>適用規模</td>
        <td>小至中型</td>
        <td>大型企業</td>
        <td>小至大型</td>
        <td>中至大型</td>
      </tr>
    </tbody>
  </table>

  <h3>與 React Context 的對比</h3>
  <p>
    雖然名字類似，<code>@lit/context</code> 和 React Context 在實作上有本質差異：
  </p>
  <table>
    <thead>
      <tr><th>面向</th><th>React Context</th><th>@lit/context</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>實作機制</td>
        <td>虛擬 DOM 樹走訪</td>
        <td>DOM 事件冒泡（ContextEvent）</td>
      </tr>
      <tr>
        <td>更新傳播</td>
        <td>重新渲染 Provider 下所有未 memo 的消費者</td>
        <td>只通知已訂閱（<code>subscribe: true</code>）的消費者</td>
      </tr>
      <tr>
        <td>Shadow DOM 支援</td>
        <td>不支援穿越 Shadow DOM</td>
        <td>原生支援（<code>composed: true</code>）</td>
      </tr>
      <tr>
        <td>框架依賴</td>
        <td>需要 React 運行時</td>
        <td>標準 Web API，無額外依賴</td>
      </tr>
      <tr>
        <td>Default Value</td>
        <td>支援（無 Provider 時使用）</td>
        <td>不支援（Consumer 必須有對應的 Provider）</td>
      </tr>
    </tbody>
  </table>

  <h3>與 Vue provide/inject 的對比</h3>
  <pre data-lang="typescript"><code class="language-typescript">// Vue 3 provide/inject
// 提供者（父元件）
const theme = ref('light');
provide('theme', readonly(theme));  // 建議用 readonly 防止 Consumer 直接修改

// 消費者（任意後代）
const theme = inject('theme', 'light');  // 第二個參數是預設值
// Vue 的 inject 支援預設值，@lit/context 不支援

// @lit/context 的等效寫法
@customElement('lit-theme-provider')
class ThemeProvider extends LitElement {
  @provide({ context: themeContext })
  @state() theme: 'light' | 'dark' = 'light';
  render() { return html\`&lt;slot&gt;&lt;/slot&gt;\`; }
}

// Consumer
@customElement('lit-themed-component')
class ThemedComponent extends LitElement {
  @consume({ context: themeContext, subscribe: true })
  theme: 'light' | 'dark' = 'light'; // 這個初始值不是預設值，只是型別佔位符
  render() { return html\`&lt;div class=\${this.theme}&gt;...&lt;/div&gt;\`; }
}</code></pre>

  <h3>Zustand 整合 Lit 的模式</h3>
  <p>
    對於需要跨越 Web Components 邊界的全域狀態，
    Zustand 是與 Lit 整合最自然的方案（Bundle 小、API 簡潔）。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// store/app.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppStore {
  cart: CartItem[];
  addToCart: (item: Product) =&gt; void;
  removeFromCart: (id: string) =&gt; void;
  clearCart: () =&gt; void;
  totalPrice: number;
}

export const useAppStore = create&lt;AppStore&gt;()(
  devtools((set, get) =&gt; ({
    cart: [],
    addToCart: (item) =&gt;
      set((state) =&gt; ({
        cart: [...state.cart, { ...item, quantity: 1 }],
      })),
    removeFromCart: (id) =&gt;
      set((state) =&gt; ({
        cart: state.cart.filter(i =&gt; i.id !== id),
      })),
    clearCart: () =&gt; set({ cart: [] }),
    get totalPrice() {
      return get().cart.reduce((sum, item) =&gt; sum + item.price * item.quantity, 0);
    },
  }))
);

// Reactive Controller 橋接 Zustand 和 Lit
import { ReactiveController, ReactiveControllerHost } from 'lit';

class ZustandController&lt;T extends object&gt; implements ReactiveController {
  value: T;
  private _unsubscribe: () =&gt; void;

  constructor(
    private host: ReactiveControllerHost,
    private store: { getState(): T; subscribe(cb: () =&gt; void): () =&gt; void },
    private selector: (state: T) =&gt; T = s =&gt; s,
  ) {
    this.value = this.selector(store.getState());
    host.addController(this);
  }

  hostConnected() {
    this._unsubscribe = this.store.subscribe(() =&gt; {
      const newValue = this.selector(this.store.getState());
      if (newValue !== this.value) {
        this.value = newValue;
        this.host.requestUpdate();
      }
    });
  }

  hostDisconnected() {
    this._unsubscribe();
  }
}

// 在 Lit 元件中使用 Zustand
@customElement('cart-summary')
class CartSummary extends LitElement {
  private _store = new ZustandController(this, useAppStore);

  render() {
    const { cart, totalPrice, removeFromCart } = this._store.value;
    return html\`
      &lt;div class="cart"&gt;
        &lt;p&gt;共 \${cart.length} 件商品，總計 NT\$\${totalPrice}&lt;/p&gt;
        \${cart.map(item =&gt; html\`
          &lt;div class="cart-item"&gt;
            &lt;span&gt;\${item.name}&lt;/span&gt;
            &lt;button @click=\${() =&gt; removeFromCart(item.id)}&gt;移除&lt;/button&gt;
          &lt;/div&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <h3>企業選型建議</h3>
  <div class="callout callout-info">
    <div class="callout-title">場景導向的選型指南</div>
    <ul>
      <li>
        <strong>設計系統 / UI 元件庫</strong>：用 <code>@lit/context</code>，
        保持零外部依賴，讓使用者自由選擇狀態管理方案。
      </li>
      <li>
        <strong>中小型應用（含主題、Auth）</strong>：<code>@lit/context</code> 足夠，
        對於全域 toast/notification 可搭配一個極簡的 Zustand store。
      </li>
      <li>
        <strong>大型企業應用（需要時間旅行除錯）</strong>：Redux Toolkit，
        搭配 Zustand Controller 橋接 Lit 元件。
      </li>
      <li>
        <strong>複雜業務邏輯（高度互依賴的狀態）</strong>：MobX 的響應式模型
        更適合表達複雜的衍生狀態關係（如 <code>computed</code>）。
      </li>
    </ul>
  </div>
</section>

<section id="choosing-pattern">
  <h2>如何選擇通訊策略</h2>

  <h3>決策樹</h3>
  <p>根據以下問題選擇適合的通訊模式：</p>
  <ul>
    <li>
      <strong>父傳子？</strong> → 直接使用 Properties（<code>.prop=\${value}</code>）
    </li>
    <li>
      <strong>子傳父（或兄弟間）？</strong> → Custom Events（<code>dispatchEvent</code>）
    </li>
    <li>
      <strong>需要靈活的 UI 組合？</strong> → Slots 模式
    </li>
    <li>
      <strong>多層級共享狀態（主題、使用者、語言設定）？</strong> → <code>@lit/context</code>
    </li>
    <li>
      <strong>應用級複雜狀態（購物車、通知列表）？</strong> → 外部狀態管理（MobX/Zustand）
    </li>
  </ul>

  <h3>反模式警示</h3>
  <div class="callout callout-warning">
    <div class="callout-title">避免過度使用 Context</div>
    <p>
      <code>@lit/context</code> 很方便，但不應該成為「萬能解藥」。
      如果資料只需要傳遞一兩層，直接用 Properties 更清晰。
      Context 最適合真正「跨越多個不相關層級」的共享資料。
      過度使用 Context 會讓元件間的資料流向變得隱晦，增加除錯難度。
    </p>
  </div>

  <div class="callout callout-tip">
    <div class="callout-title">Context 訂閱的清理</div>
    <p>
      使用 <code>@consume</code> decorator 時，<code>@lit/context</code>
      會在元素的 <code>disconnectedCallback</code> 中自動取消訂閱，無需手動清理。
      但如果你直接使用 <code>ContextConsumer</code> 類別，
      請確保在 <code>hostDisconnected</code> 中正確清理，
      或者將其包裝在 Reactive Controller 中。
    </p>
  </div>
</section>
`,
};
