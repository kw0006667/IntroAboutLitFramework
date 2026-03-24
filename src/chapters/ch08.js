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
      <strong>應用級複雜狀態（購物車、通知列表）？</strong> → 外部狀態管理（MobX/Zustand）</li>
  </ul>

  <h3>反模式警示</h3>
  <div class="callout callout-warning">
    <div class="callout-title">避免過度使用 Context</div>
    <p>
      <code>@lit/context</code> 很方便，但不應該成為「萬能解藥」。
      如果資料只需要傳遞一兩層，直接用 Properties 更清晰。
      Context 最適合真正「跨越多個不相關層級」的共享資料。
    </p>
  </div>
</section>
`,
};
