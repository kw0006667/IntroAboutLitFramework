export default {
  id: 25,
  slug: 'chapter-25',
  title: '企業級 AI Foundation：以 Lit 打造跨團隊共用基礎設施',
  part: 7,
  intro: '探討如何以 Lit Framework 建構企業級的 AI UI Foundation，讓不同技術棧（React、Vue、Angular）的團隊都能共享同一套 AI 介面元件，涵蓋 Provider 抽象層設計、跨框架 Wrapper 策略、設計 Token 規範，以及安全治理與可觀測性架構。',
  sections: [
    { slug: 'foundation-architecture', title: 'AI Foundation 架構設計原則' },
    { slug: 'provider-abstraction', title: 'AI Provider 抽象層：統一介面，支援多模型' },
    { slug: 'shared-component-library', title: '共用 AI 元件庫：設計規範與發布策略' },
    { slug: 'framework-wrapper-strategy', title: '框架 Wrapper 策略：React、Vue、Angular 適配' },
    { slug: 'design-tokens-ai', title: 'AI 專屬 Design Token：狀態、動畫、語意色彩' },
    { slug: 'cross-team-governance', title: '跨團隊治理：RFC 流程與版本策略' },
    { slug: 'telemetry-observability', title: '可觀測性：使用追蹤、效能指標與錯誤監控' },
    { slug: 'security-governance', title: '安全治理：API 金鑰管理、輸入驗證與內容過濾' },
  ],
  content: `
<section id="foundation-architecture">
  <h2>AI Foundation 架構設計原則</h2>
  <p>
    當企業內有多個產品團隊都需要整合 AI 功能時，最常見的反模式是「每個團隊各自為政」。
    React 團隊自己寫一套 Chat UI，Vue 團隊再寫一套，Angular 團隊又另起爐灶。
    結果是：三套 UX 不一致的對話介面、三套難以維護的 API 整合邏輯、三倍的 Bug 修復成本。
  </p>
  <p>
    <strong>AI Foundation</strong> 的核心概念是：用 Lit Web Components 作為底層，
    建構一個與框架無關的 AI UI 元件庫，然後為各技術棧提供薄薄一層的 Wrapper。
    這樣，所有業務邏輯（串流渲染、Provider 切換、錯誤重試）只需維護一次，
    而各框架團隊獲得符合其生態慣例的使用體驗。
  </p>

  <h3>三層架構</h3>
  <p>
    AI Foundation 採用清晰的三層架構，每一層都有明確的職責邊界：
  </p>
  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>第一層：Core AI Components</h4>
      <p>以 Lit Web Components 實作。包含 <code>&lt;ai-chat&gt;</code>、<code>&lt;ai-message&gt;</code>、
      <code>&lt;ai-input&gt;</code>、<code>&lt;ai-status&gt;</code> 等元件，以及所有 ReactiveController 和 Context。
      這一層是 Framework-agnostic 的，任何支援 Custom Elements 的環境都能直接使用。</p>
    </div>
    <div class="comparison-card">
      <h4>第二層：Framework Wrappers</h4>
      <p>為 React、Vue 3、Angular 各自提供符合其慣例的包裝層。
      React 使用 <code>@lit/react</code>，Vue 3 使用 <code>isCustomElement</code> 配置加上型別宣告，
      Angular 使用 <code>CUSTOM_ELEMENTS_SCHEMA</code> 模組。
      Wrappers 本身不包含業務邏輯，只負責事件名稱映射和 TypeScript 型別導出。</p>
    </div>
    <div class="comparison-card">
      <h4>第三層：Application Layer</h4>
      <p>各產品團隊的業務程式碼。負責身份驗證、資料擷取、路由、業務規則。
      應用層透過 <code>AIProvider</code> 介面注入所需的 AI 服務實作，
      Foundation 不感知任何業務細節。</p>
    </div>
  </div>

  <h3>Monorepo 結構</h3>
  <p>
    整個 Foundation 以 Monorepo 管理，使用 pnpm workspaces 或 Nx 協調跨套件的建置和測試。
    以下是建議的套件結構：
  </p>
  <pre data-lang="plaintext"><code class="language-plaintext">packages/
  ai-foundation/          # Core Lit components（公開 npm 套件）
    src/
      components/         # Web Components
      controllers/        # ReactiveControllers
      directives/         # Custom directives
      contexts/           # @lit/context 定義
      tokens/             # CSS custom properties
    package.json
    tsconfig.json

  ai-foundation-react/    # @lit/react wrappers
    src/
      index.ts            # 重新導出所有 React 元件
    package.json

  ai-foundation-vue/      # Vue 3 wrappers
    src/
      index.ts
      plugin.ts           # Vue plugin（設定 isCustomElement）
    package.json

  ai-foundation-angular/  # Angular module
    src/
      ai-foundation.module.ts
      index.ts
    package.json

  ai-foundation-tokens/   # Design tokens（CSS、JS、iOS、Android）
    tokens/
      base.json           # Style Dictionary source
    dist/                 # 產出的 token 檔案
    package.json

  storybook/              # 文件與互動展示
    .storybook/
    stories/
    package.json</code></pre>

  <h3>什麼屬於 Foundation，什麼屬於 Application</h3>
  <p>
    這是 Foundation 設計中最關鍵的判斷準則。一個功能是否應該進入 Foundation，
    取決於它是否具備「跨團隊共用」和「與業務無關」兩個特性。
  </p>
  <table>
    <thead>
      <tr>
        <th>Foundation（共用層）</th>
        <th>Application（應用層）</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Chat UI 佈局與訊息渲染</td>
        <td>身份驗證與使用者資料</td>
      </tr>
      <tr>
        <td>串流文字動畫</td>
        <td>業務相關的 Prompt 模板</td>
      </tr>
      <tr>
        <td>AI Provider 抽象介面</td>
        <td>API Key 管理與 BFF 服務</td>
      </tr>
      <tr>
        <td>錯誤狀態與重試邏輯</td>
        <td>資料擷取與快取策略</td>
      </tr>
      <tr>
        <td>Design Tokens（AI 專屬）</td>
        <td>品牌色彩與商業視覺規範</td>
      </tr>
      <tr>
        <td>可觀測性 hooks</td>
        <td>路由與頁面導航</td>
      </tr>
    </tbody>
  </table>

  <h3>peerDependencies 策略</h3>
  <p>
    Foundation 套件必須將 <code>lit</code> 宣告為 <code>peerDependencies</code> 而非 <code>dependencies</code>，
    避免應用程式在 bundle 中包含多個 Lit 版本，導致 Custom Elements Registry 衝突。
  </p>
  <pre data-lang="json"><code class="language-json">// packages/ai-foundation/package.json
{
  "name": "ai-foundation",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./components/*": "./dist/components/*.js",
    "./controllers/*": "./dist/controllers/*.js",
    "./contexts/*": "./dist/contexts/*.js"
  },
  "peerDependencies": {
    "lit": "^3.0.0",
    "@lit/context": "^1.0.0",
    "@lit/reactive-element": "^2.0.0"
  },
  "devDependencies": {
    "lit": "^3.2.0",
    "@lit/context": "^1.1.0",
    "typescript": "^5.4.0"
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">設計原則</div>
    <p>
      Foundation 永遠不應該知道「這是哪個產品的 AI」。它只知道如何渲染訊息、
      如何處理串流、如何呈現錯誤。業務語意（「這是客服機器人」或「這是程式碼助手」）
      全部由 Application Layer 透過 Props 和 Provider 注入。
    </p>
  </div>
</section>

<section id="provider-abstraction">
  <h2>AI Provider 抽象層：統一介面，支援多模型</h2>
  <p>
    企業環境中，AI 模型的選擇往往受到多重因素影響：成本、合規要求、效能 SLA、
    資料主權政策。今天用 OpenAI，明天可能因為資料本地化要求改用自建模型。
    如果 UI 元件直接呼叫特定廠商的 SDK，每次切換都是一場災難。
  </p>
  <p>
    解決方案是定義一個 <strong>AIProvider 介面</strong>，讓 Foundation 只依賴這個抽象層，
    而非任何具體實作。這遵循了依賴反轉原則（Dependency Inversion Principle）。
  </p>

  <h3>AIProvider 介面定義</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/types/provider.ts

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  timestamp?: number;
  metadata?: Record&lt;string, unknown&gt;;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  abortSignal?: AbortSignal;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderCapabilities {
  streaming: boolean;
  embeddings: boolean;
  vision: boolean;
  functionCalling: boolean;
  maxContextTokens: number;
}

export interface AIProvider {
  readonly modelId: string;
  readonly capabilities: ProviderCapabilities;

  chat(messages: Message[], options?: ChatOptions): Promise&lt;Message&gt;;
  stream(messages: Message[], options?: ChatOptions): AsyncIterable&lt;StreamChunk&gt;;
  embed(text: string): Promise&lt;number[]&gt;;
}</code></pre>

  <h3>具體 Provider 實作：OpenAI</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/providers/openai-provider.ts
import type { AIProvider, Message, ChatOptions, StreamChunk, ProviderCapabilities } from '../types/provider.js';

export class OpenAIProvider implements AIProvider {
  readonly modelId: string;
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    embeddings: true,
    vision: true,
    functionCalling: true,
    maxContextTokens: 128000,
  };

  // baseUrl 指向 BFF proxy，永遠不在前端直接持有 API Key
  constructor(
    private readonly baseUrl: string,
    modelId = 'gpt-4o',
  ) {
    this.modelId = modelId;
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise&lt;Message&gt; {
    const response = await fetch(\`\${this.baseUrl}/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, options, model: this.modelId }),
      signal: options.abortSignal,
    });
    if (!response.ok) throw new AIProviderError(await response.text(), response.status);
    const data = await response.json();
    return { role: 'assistant', content: data.content, id: data.id };
  }

  async *stream(messages: Message[], options: ChatOptions = {}): AsyncIterable&lt;StreamChunk&gt; {
    const response = await fetch(\`\${this.baseUrl}/stream\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, options, model: this.modelId }),
      signal: options.abortSignal,
    });
    if (!response.ok) throw new AIProviderError(await response.text(), response.status);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') { yield { delta: '', done: true }; return; }
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          yield { delta, done: false, usage: parsed.usage };
        } catch { /* skip malformed chunks */ }
      }
    }
  }

  async embed(text: string): Promise&lt;number[]&gt; {
    const response = await fetch(\`\${this.baseUrl}/embed\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model: 'text-embedding-3-small' }),
    });
    const data = await response.json();
    return data.embedding;
  }
}

export class AIProviderError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'AIProviderError';
  }
}</code></pre>

  <h3>Anthropic Claude Provider</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/providers/anthropic-provider.ts
import type { AIProvider, Message, ChatOptions, StreamChunk, ProviderCapabilities } from '../types/provider.js';
import { AIProviderError } from './openai-provider.js';

export class AnthropicProvider implements AIProvider {
  readonly modelId: string;
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    embeddings: false, // Anthropic 目前不提供 embedding API
    vision: true,
    functionCalling: true,
    maxContextTokens: 200000,
  };

  constructor(private readonly baseUrl: string, modelId = 'claude-sonnet-4-5') {
    this.modelId = modelId;
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise&lt;Message&gt; {
    const response = await fetch(\`\${this.baseUrl}/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, options, model: this.modelId }),
      signal: options.abortSignal,
    });
    if (!response.ok) throw new AIProviderError(await response.text(), response.status);
    const data = await response.json();
    return { role: 'assistant', content: data.content };
  }

  async *stream(messages: Message[], options: ChatOptions = {}): AsyncIterable&lt;StreamChunk&gt; {
    // 實作與 OpenAI 類似，解析 Anthropic 的 SSE 格式
    const response = await fetch(\`\${this.baseUrl}/stream\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, options, model: this.modelId }),
      signal: options.abortSignal,
    });
    if (!response.ok) throw new AIProviderError(await response.text(), response.status);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'content_block_delta') {
            yield { delta: parsed.delta?.text ?? '', done: false };
          } else if (parsed.type === 'message_stop') {
            yield { delta: '', done: true };
          }
        } catch { /* skip */ }
      }
    }
  }

  async embed(_text: string): Promise&lt;number[]&gt; {
    throw new Error('Anthropic does not support embeddings. Use OpenAI or a dedicated embedding model.');
  }
}</code></pre>

  <h3>ProviderContext 與注入機制</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/contexts/provider-context.ts
import { createContext } from '@lit/context';
import type { AIProvider } from '../types/provider.js';

export const aiProviderContext = createContext&lt;AIProvider&gt;(
  Symbol('ai-provider-context')
);

// packages/ai-foundation/src/controllers/ai-provider-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContextConsumer } from '@lit/context';
import { aiProviderContext } from '../contexts/provider-context.js';
import type { AIProvider } from '../types/provider.js';

export class AIProviderController implements ReactiveController {
  private _consumer: ContextConsumer&lt;typeof aiProviderContext, ReactiveControllerHost&gt;;

  get provider(): AIProvider | undefined {
    return this._consumer.value;
  }

  constructor(private host: ReactiveControllerHost) {
    this._consumer = new ContextConsumer(host, {
      context: aiProviderContext,
      subscribe: true,
    });
    host.addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}
}</code></pre>

  <h3>Provider Fallback 策略</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/providers/fallback-provider.ts
import type { AIProvider, Message, ChatOptions, StreamChunk } from '../types/provider.js';

/**
 * FallbackProvider：依序嘗試多個 Provider，
 * 若主要 Provider 失敗則自動切換到備援。
 * 適用於高可用場景或跨地區部署。
 */
export class FallbackProvider implements AIProvider {
  private _activeIndex = 0;

  get modelId() { return this._providers[this._activeIndex].modelId; }
  get capabilities() { return this._providers[this._activeIndex].capabilities; }

  constructor(private readonly _providers: AIProvider[]) {
    if (_providers.length === 0) throw new Error('FallbackProvider requires at least one provider');
  }

  async chat(messages: Message[], options?: ChatOptions): Promise&lt;Message&gt; {
    for (let i = this._activeIndex; i &lt; this._providers.length; i++) {
      try {
        const result = await this._providers[i].chat(messages, options);
        this._activeIndex = i; // 成功後固定到此 provider
        return result;
      } catch (err) {
        console.warn(\`[ai-foundation] Provider \${this._providers[i].modelId} failed, trying next...\`, err);
      }
    }
    throw new Error('All AI providers failed');
  }

  async *stream(messages: Message[], options?: ChatOptions): AsyncIterable&lt;StreamChunk&gt; {
    for (let i = this._activeIndex; i &lt; this._providers.length; i++) {
      try {
        yield* this._providers[i].stream(messages, options);
        return;
      } catch (err) {
        console.warn(\`[ai-foundation] Provider \${this._providers[i].modelId} stream failed\`, err);
      }
    }
    throw new Error('All AI providers failed for streaming');
  }

  async embed(text: string): Promise&lt;number[]&gt; {
    // 只使用支援 embedding 的 provider
    const provider = this._providers.find(p =&gt; p.capabilities.embeddings);
    if (!provider) throw new Error('No provider supports embeddings');
    return provider.embed(text);
  }
}</code></pre>

  <h3>應用層注入不同環境的 Provider</h3>
  <pre data-lang="typescript"><code class="language-typescript">// app/src/ai-app-shell.ts（應用層，非 Foundation）
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { aiProviderContext } from 'ai-foundation/contexts';
import { OpenAIProvider, AnthropicProvider, FallbackProvider } from 'ai-foundation/providers';

@customElement('ai-app-shell')
export class AiAppShell extends LitElement {
  private _providerCtx = new ContextProvider(this, { context: aiProviderContext });

  connectedCallback() {
    super.connectedCallback();

    // 根據環境變數決定使用哪個 Provider
    const bffUrl = import.meta.env.VITE_AI_BFF_URL;
    const env = import.meta.env.MODE;

    let provider;
    if (env === 'production') {
      // 生產環境：Anthropic 為主，OpenAI 為備援
      provider = new FallbackProvider([
        new AnthropicProvider(\`\${bffUrl}/anthropic\`),
        new OpenAIProvider(\`\${bffUrl}/openai\`),
      ]);
    } else {
      // 開發/測試環境：直接使用 OpenAI，方便 debug
      provider = new OpenAIProvider(\`\${bffUrl}/openai\`, 'gpt-4o-mini');
    }

    this._providerCtx.setValue(provider);
  }

  render() {
    return html\`&lt;slot&gt;&lt;/slot&gt;\`;
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">為何不用全域 Singleton</div>
    <p>
      使用 <code>@lit/context</code> 而非全域 Singleton 的原因是：同一個頁面可能需要多個
      <em>不同配置</em>的 AI Provider（例如左欄是「客服 AI」用 GPT-4o，右欄是「程式碼助手」用 Claude）。
      Context 讓每個子樹可以有自己的 Provider 實例，互不干擾。
    </p>
  </div>
</section>

<section id="shared-component-library">
  <h2>共用 AI 元件庫：設計規範與發布策略</h2>
  <p>
    一個企業級 Design System 的核心挑戰不是「寫出元件」，而是「讓元件被信任地使用」。
    信任來自三個面向：<strong>清晰的 API 契約</strong>、<strong>完整的文件與範例</strong>、
    以及<strong>可預期的版本演進</strong>。
  </p>

  <h3>完整套件結構</h3>
  <pre data-lang="plaintext"><code class="language-plaintext">packages/ai-foundation/src/
  components/
    ai-chat/
      ai-chat.ts          # 主元件
      ai-chat.stories.ts  # Storybook stories
      ai-chat.test.ts     # Web Test Runner 測試
    ai-message/
      ai-message.ts
      ai-message.stories.ts
    ai-input/
      ai-input.ts
      ai-input.stories.ts
    ai-status/
      ai-status.ts        # thinking / streaming / error 狀態指示器

  controllers/
    ai-controller.ts        # 管理 chat / stream 請求生命週期
    stream-controller.ts    # 專責串流狀態管理
    conversation-controller.ts  # 對話歷史管理

  directives/
    streaming-text.ts       # 串流文字逐字渲染 directive

  contexts/
    provider-context.ts

  tokens/
    ai-tokens.css           # CSS custom properties

  index.ts                  # 統一公開 API</code></pre>

  <h3>元件 API 契約：以 ai-chat 為例</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/components/ai-chat/ai-chat.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AIProviderController } from '../../controllers/ai-provider-controller.js';
import { ConversationController } from '../../controllers/conversation-controller.js';
import type { Message } from '../../types/provider.js';

/**
 * &lt;ai-chat&gt; — 完整的對話介面元件
 *
 * @fires {CustomEvent&lt;MessageSentDetail&gt;} message-sent - 使用者送出訊息時觸發
 * @fires {CustomEvent&lt;StreamCompleteDetail&gt;} stream-complete - AI 回應串流完成時觸發
 * @fires {CustomEvent&lt;AIErrorDetail&gt;} ai-error - AI 請求失敗時觸發
 *
 * @csspart container - 最外層容器
 * @csspart message-list - 訊息列表區域
 * @csspart input-area - 輸入區域
 *
 * @cssprop {color} --ai-chat-bg - 背景色，預設 var(--ai-color-surface)
 * @cssprop {length} --ai-chat-max-width - 最大寬度，預設 800px
 * @cssprop {length} --ai-chat-height - 高度，預設 600px
 */
@customElement('ai-chat')
export class AiChat extends LitElement {
  // ---- Public Properties（對外 API）----

  /** 停用輸入框（例如：正在等待 AI 回應時） */
  @property({ type: Boolean }) disabled = false;

  /** 輸入框的佔位文字 */
  @property({ type: String, attribute: 'placeholder' })
  placeholder = '傳訊息給 AI...';

  /** 是否顯示角色標籤（user / assistant） */
  @property({ type: Boolean, attribute: 'show-roles' }) showRoles = false;

  /** 系統提示詞（不會顯示在 UI 中，只作為 context 傳入） */
  @property({ type: String, attribute: 'system-prompt' }) systemPrompt = '';

  // ---- Private State ----
  @state() private _messages: Message[] = [];
  @state() private _isStreaming = false;

  private _providerCtrl = new AIProviderController(this);
  private _convCtrl = new ConversationController(this);

  static styles = css\`
    :host {
      display: flex;
      flex-direction: column;
      height: var(--ai-chat-height, 600px);
      max-width: var(--ai-chat-max-width, 800px);
      background: var(--ai-chat-bg, var(--ai-color-surface, #fff));
    }
    [part="container"] { display: contents; }
    [part="message-list"] {
      flex: 1;
      overflow-y: auto;
      padding: var(--ai-spacing-md, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--ai-message-gap, 1rem);
    }
    [part="input-area"] {
      padding: var(--ai-spacing-sm, 0.5rem) var(--ai-spacing-md, 1rem);
      border-top: 1px solid var(--ai-color-border, #e5e7eb);
    }
  \`;

  render() {
    return html\`
      &lt;div part="container"&gt;
        &lt;div part="message-list" role="log" aria-label="對話記錄" aria-live="polite"&gt;
          \${this._messages.map(msg =&gt; html\`
            &lt;ai-message
              .role=\${msg.role}
              .content=\${msg.content}
              ?show-role=\${this.showRoles}
            &gt;&lt;/ai-message&gt;
          \`)}
          \${this._isStreaming ? html\`&lt;ai-status state="streaming"&gt;&lt;/ai-status&gt;\` : ''}
        &lt;/div&gt;
        &lt;div part="input-area"&gt;
          &lt;ai-input
            .placeholder=\${this.placeholder}
            ?disabled=\${this.disabled || this._isStreaming}
            @submit=\${this._handleSubmit}
          &gt;&lt;/ai-input&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }

  private async _handleSubmit(e: CustomEvent&lt;{ value: string }&gt;) {
    const provider = this._providerCtrl.provider;
    if (!provider) {
      this.dispatchEvent(new CustomEvent('ai-error', {
        detail: { message: 'No AI provider available', code: 'NO_PROVIDER' },
        bubbles: true, composed: true,
      }));
      return;
    }

    const userMsg: Message = { role: 'user', content: e.detail.value };
    this._messages = [...this._messages, userMsg];
    this.dispatchEvent(new CustomEvent('message-sent', {
      detail: { message: userMsg }, bubbles: true, composed: true,
    }));

    this._isStreaming = true;
    let fullContent = '';

    try {
      for await (const chunk of provider.stream(
        this._convCtrl.getContext(this._messages, this.systemPrompt),
        { abortSignal: this._convCtrl.abortSignal },
      )) {
        fullContent += chunk.delta;
        // 更新最後一則 assistant 訊息（串流渲染）
        const assistantMsg: Message = { role: 'assistant', content: fullContent };
        this._messages = [...this._messages.filter(m =&gt; m !== assistantMsg), assistantMsg];
        if (chunk.done) break;
      }

      this.dispatchEvent(new CustomEvent('stream-complete', {
        detail: { content: fullContent }, bubbles: true, composed: true,
      }));
    } catch (err) {
      this.dispatchEvent(new CustomEvent('ai-error', {
        detail: { message: String(err), code: 'STREAM_ERROR' },
        bubbles: true, composed: true,
      }));
    } finally {
      this._isStreaming = false;
    }
  }
}

// ---- 事件 Detail 型別（供使用者 import）----
export interface MessageSentDetail { message: Message; }
export interface StreamCompleteDetail { content: string; }
export interface AIErrorDetail { message: string; code: string; }</code></pre>

  <h3>Storybook Stories 與 Mock Provider</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/components/ai-chat/ai-chat.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ContextProvider } from '@lit/context';
import { aiProviderContext } from '../../contexts/provider-context.js';
import type { AIProvider, Message, StreamChunk } from '../../types/provider.js';
import './ai-chat.js';

// Mock Provider：用於文件與測試，不需要真實 API Key
class MockAIProvider implements AIProvider {
  readonly modelId = 'mock-gpt';
  readonly capabilities = {
    streaming: true, embeddings: false, vision: false,
    functionCalling: false, maxContextTokens: 4096,
  };

  async chat(_messages: Message[]): Promise&lt;Message&gt; {
    return { role: 'assistant', content: '這是一個模擬的 AI 回應。' };
  }

  async *stream(_messages: Message[]): AsyncIterable&lt;StreamChunk&gt; {
    const words = '這是一個逐字串流的模擬回應，展示打字機效果。'.split('');
    for (const char of words) {
      await new Promise(r =&gt; setTimeout(r, 50));
      yield { delta: char, done: false };
    }
    yield { delta: '', done: true };
  }

  async embed(_text: string): Promise&lt;number[]&gt; { return []; }
}

// Story Decorator：自動注入 Mock Provider
const withMockProvider = (story: () =&gt; unknown) =&gt; {
  const wrapper = document.createElement('div');
  // 使用 ContextProvider 包裝 story
  const provider = new ContextProvider(wrapper as any, {
    context: aiProviderContext,
    initialValue: new MockAIProvider(),
  });
  void provider; // 避免 unused variable warning
  return html\`&lt;div style="padding: 2rem;"&gt;\${story()}&lt;/div&gt;\`;
};

const meta: Meta = {
  title: 'AI Foundation/ai-chat',
  component: 'ai-chat',
  decorators: [withMockProvider],
  parameters: { docs: { description: { component: '完整的 AI 對話介面元件。' } } },
};
export default meta;

export const Default: StoryObj = {
  render: () =&gt; html\`&lt;ai-chat style="height: 400px;"&gt;&lt;/ai-chat&gt;\`,
};

export const WithSystemPrompt: StoryObj = {
  render: () =&gt; html\`
    &lt;ai-chat
      system-prompt="你是一位專業的 TypeScript 程式碼審查員。"
      placeholder="貼上你的程式碼..."
      show-roles
    &gt;&lt;/ai-chat&gt;
  \`,
};</code></pre>

  <h3>SemVer 策略與 Breaking Change 文件</h3>
  <p>
    Design System 套件的版本管理需要比一般套件更嚴格。建議採用以下規則：
  </p>
  <table>
    <thead>
      <tr><th>變更類型</th><th>版本衝擊</th><th>範例</th></tr>
    </thead>
    <tbody>
      <tr><td>新增 Property（有預設值）</td><td>Minor</td><td>新增 <code>show-timestamp</code></td></tr>
      <tr><td>移除或重命名 Property</td><td>Major</td><td>移除 <code>legacy-mode</code></td></tr>
      <tr><td>變更 Custom Event 的 detail 結構</td><td>Major</td><td>重命名 <code>detail.text</code> 為 <code>detail.content</code></td></tr>
      <tr><td>新增 CSS Part</td><td>Minor</td><td>新增 <code>::part(avatar)</code></td></tr>
      <tr><td>移除 CSS Custom Property</td><td>Major</td><td>移除 <code>--ai-bubble-color</code></td></tr>
      <tr><td>Bug 修復（不改變 API）</td><td>Patch</td><td>修正串流中斷問題</td></tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">元件 API 是公開契約</div>
    <p>
      一旦元件進入 <strong>stable</strong> 狀態，任何 breaking change 都必須：
      (1) 在 CHANGELOG 中明確說明；(2) 提供 codemods 或遷移指南；
      (3) 保持至少一個 major 版本的向後相容（透過 deprecation warning）。
    </p>
  </div>
</section>

<section id="framework-wrapper-strategy">
  <h2>框架 Wrapper 策略：React、Vue、Angular 適配</h2>
  <p>
    Lit Web Components 在技術上可以直接在任何框架中使用，但有幾個摩擦點：
    React 17 以前對 Custom Events 的處理很差；Vue 3 需要告知哪些 tag 是 Custom Elements；
    Angular 需要啟用 <code>CUSTOM_ELEMENTS_SCHEMA</code>。
    Wrapper 層的目的是消除這些摩擦，讓框架開發者感覺像在使用原生框架元件。
  </p>

  <h3>React Wrapper：@lit/react</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation-react/src/AiChat.tsx
import React from 'react';
import { createComponent } from '@lit/react';
import { AiChat as AiChatElement } from 'ai-foundation';
import type { MessageSentDetail, StreamCompleteDetail, AIErrorDetail } from 'ai-foundation';

/**
 * React 版本的 &lt;ai-chat&gt;，透過 @lit/react 自動處理：
 * 1. ref forwarding 到底層 DOM element
 * 2. React synthetic event 到 Custom Event 的映射
 * 3. TypeScript prop 型別自動推導
 */
export const AiChat = createComponent({
  tagName: 'ai-chat',
  elementClass: AiChatElement,
  react: React,
  events: {
    onMessageSent: 'message-sent',
    onStreamComplete: 'stream-complete',
    onError: 'ai-error',
  },
});

// 補充 TypeScript 型別（createComponent 的泛型支援）
export type AiChatProps = React.ComponentProps&lt;typeof AiChat&gt; &amp; {
  onMessageSent?: (e: CustomEvent&lt;MessageSentDetail&gt;) =&gt; void;
  onStreamComplete?: (e: CustomEvent&lt;StreamCompleteDetail&gt;) =&gt; void;
  onError?: (e: CustomEvent&lt;AIErrorDetail&gt;) =&gt; void;
};

// 同樣方式包裝其他元件
export { AiMessage } from './AiMessage.js';
export { AiInput } from './AiInput.js';
export { AiStatus } from './AiStatus.js';
// 同時重新導出 Provider 和 Context 工具
export { OpenAIProvider, AnthropicProvider, FallbackProvider } from 'ai-foundation/providers';
export { aiProviderContext } from 'ai-foundation/contexts';</code></pre>

  <p>
    React 應用的使用方式非常直觀，完全符合 React 開發者的直覺：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// React 應用程式範例
import React, { useEffect, useRef } from 'react';
import { ContextProvider } from '@lit/context';
import { AiChat, type AiChatProps } from 'ai-foundation-react';
import { OpenAIProvider } from 'ai-foundation-react';
import { aiProviderContext } from 'ai-foundation-react';

function AiPage() {
  const shellRef = useRef&lt;HTMLDivElement&gt;(null);

  useEffect(() =&gt; {
    if (!shellRef.current) return;
    // 在 React root element 上建立 context provider
    const ctx = new ContextProvider(shellRef.current as any, {
      context: aiProviderContext,
      initialValue: new OpenAIProvider('/api/ai'),
    });
    return () =&gt; { /* cleanup if needed */ };
  }, []);

  const handleMessageSent: AiChatProps['onMessageSent'] = (e) =&gt; {
    console.log('User sent:', e.detail.message);
  };

  return (
    &lt;div ref={shellRef}&gt;
      &lt;AiChat
        placeholder="問我任何問題..."
        showRoles
        onMessageSent={handleMessageSent}
        style={{ height: '500px' }}
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>

  <h3>Vue 3 Wrapper</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation-vue/src/plugin.ts
import type { App } from 'vue';

/**
 * Vue 3 Plugin：
 * 1. 設定 isCustomElement 避免 Vue 嘗試解析 ai-* 元件
 * 2. 定義全域型別（透過 d.ts augmentation）
 */
export const AIFoundationPlugin = {
  install(app: App) {
    // 告知 Vue compiler ai-* 開頭的 tag 是 Custom Elements
    app.config.compilerOptions.isCustomElement = (tag: string) =&gt; tag.startsWith('ai-');
  },
};

// packages/ai-foundation-vue/src/components.d.ts
// 為 Vue 3 template 提供型別提示
import type { DefineComponent } from 'vue';

declare module 'vue' {
  interface GlobalComponents {
    AiChat: DefineComponent&lt;{
      disabled?: boolean;
      placeholder?: string;
      showRoles?: boolean;
      systemPrompt?: string;
    }, {}, {}, {}, {},
    {
      'message-sent': (e: CustomEvent) =&gt; void;
      'stream-complete': (e: CustomEvent) =&gt; void;
      'ai-error': (e: CustomEvent) =&gt; void;
    }&gt;;
  }
}

export {};</code></pre>

  <p>Vue 3 應用的使用方式：</p>
  <pre data-lang="typescript"><code class="language-typescript">// Vue 3 應用程式範例（&lt;script setup lang="ts"&gt;）
// main.ts
import { createApp } from 'vue';
import { AIFoundationPlugin } from 'ai-foundation-vue';
import App from './App.vue';

const app = createApp(App);
app.use(AIFoundationPlugin);
app.mount('#app');

// AiPage.vue
// &lt;script setup lang="ts"&gt;
import { ref, onMounted } from 'vue';
import { ContextProvider } from '@lit/context';
import { aiProviderContext } from 'ai-foundation/contexts';
import { OpenAIProvider } from 'ai-foundation/providers';

const shellRef = ref&lt;HTMLDivElement | null&gt;(null);

onMounted(() =&gt; {
  if (!shellRef.value) return;
  new ContextProvider(shellRef.value as any, {
    context: aiProviderContext,
    initialValue: new OpenAIProvider('/api/ai'),
  });
});

function handleMessageSent(e: Event) {
  const detail = (e as CustomEvent).detail;
  console.log('Sent:', detail.message);
}
// &lt;/script&gt;

// &lt;template&gt;
//   &lt;div ref="shellRef"&gt;
//     &lt;ai-chat
//       placeholder="問我任何問題..."
//       @message-sent="handleMessageSent"
//       style="height: 500px"
//     /&gt;
//   &lt;/div&gt;
// &lt;/template&gt;</code></pre>

  <h3>Angular Module</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation-angular/src/ai-foundation.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

// 確保 Lit 元件在 Angular 初始化前就已 define
import 'ai-foundation'; // 側效引入，觸發 customElements.define

@NgModule({
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 允許使用非 Angular 的 custom elements
  exports: [], // 使用者直接在 template 中使用 &lt;ai-chat&gt; 等 tag
})
export class AIFoundationModule {}

// packages/ai-foundation-angular/src/types.ts
// 為 Angular template 提供型別提示（配合 ViewChild 使用）
export interface AiChatElement extends HTMLElement {
  disabled: boolean;
  placeholder: string;
  showRoles: boolean;
  systemPrompt: string;
  // 自定義方法
  clearHistory(): void;
}</code></pre>

  <p>Angular 應用的使用方式：</p>
  <pre data-lang="typescript"><code class="language-typescript">// Angular 元件範例
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ContextProvider } from '@lit/context';
import { aiProviderContext } from 'ai-foundation/contexts';
import { OpenAIProvider } from 'ai-foundation/providers';

@Component({
  selector: 'app-ai-page',
  template: \`
    &lt;div #shell&gt;
      &lt;ai-chat
        placeholder="問我任何問題..."
        (message-sent)="onMessageSent($event)"
        style="height: 500px"
      &gt;&lt;/ai-chat&gt;
    &lt;/div&gt;
  \`,
})
export class AiPageComponent implements OnInit {
  @ViewChild('shell') shell!: ElementRef&lt;HTMLDivElement&gt;;

  ngOnInit() {
    new ContextProvider(this.shell.nativeElement as any, {
      context: aiProviderContext,
      initialValue: new OpenAIProvider('/api/ai'),
    });
  }

  onMessageSent(e: Event) {
    const { message } = (e as CustomEvent).detail;
    console.log('User sent:', message);
  }
}</code></pre>

  <h3>自動化 Wrapper 生成</h3>
  <p>
    隨著 Foundation 元件數量增加，手動維護 Wrapper 容易出現遺漏。
    使用 <code>@custom-elements-manifest/analyzer</code> 分析元件的 JSDoc 和 TypeScript 型別，
    自動生成 React、Vue、Angular 的 Wrapper 程式碼：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// scripts/generate-wrappers.ts
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from '@custom-elements-manifest/analyzer';

async function generateReactWrappers(manifestPath: string) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

  for (const module of manifest.modules) {
    for (const declaration of (module.declarations ?? [])) {
      if (declaration.kind !== 'class' || !declaration.customElement) continue;

      const tagName = declaration.tagName;
      const className = declaration.name;
      const events = declaration.events ?? [];

      const eventMap = events.map((e: { name: string }) =&gt; {
        // message-sent =&gt; onMessageSent
        const reactProp = 'on' + e.name.split('-').map((w: string) =&gt;
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join('');
        return \`      \${reactProp}: '\${e.name}',\`;
      }).join('\n');

      const code = \`// Auto-generated — do not edit manually
import React from 'react';
import { createComponent } from '@lit/react';
import { \${className} as \${className}Element } from 'ai-foundation';

export const \${className} = createComponent({
  tagName: '\${tagName}',
  elementClass: \${className}Element,
  react: React,
  events: {
\${eventMap}
  },
});
\`;
      await writeFile(\`packages/ai-foundation-react/src/\${className}.tsx\`, code);
      console.log(\`Generated React wrapper for \${className}\`);
    }
  }
}

generateReactWrappers('packages/ai-foundation/custom-elements.json').catch(console.error);</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Wrapper 同步策略</div>
    <p>
      在 CI/CD pipeline 中加入一個步驟：每次 <code>ai-foundation</code> 發布新版本時，
      自動執行 <code>generate-wrappers.ts</code>，並建立 PR 更新各框架的 Wrapper 套件。
      這樣能確保 Wrapper 永遠與 Core 元件同步。
    </p>
  </div>
</section>

<section id="design-tokens-ai">
  <h2>AI 專屬 Design Token：狀態、動畫、語意色彩</h2>
  <p>
    AI 互動介面有其獨特的視覺語言需求：「思考中」的等待狀態、
    串流文字的逐字出現動畫、模型切換時的視覺回饋。
    這些都需要專屬的 Design Token 支撐，而不是直接寫死在元件 CSS 中。
  </p>
  <p>
    將 Token 提取到獨立套件（<code>ai-foundation-tokens</code>）的好處是：
    品牌設計師可以在不修改元件程式碼的情況下調整整個 AI 介面的視覺風格，
    同時確保所有框架的 AI 元件視覺一致。
  </p>

  <h3>完整 AI Token 定義</h3>
  <pre data-lang="css"><code class="language-css">/* packages/ai-foundation-tokens/dist/ai-tokens.css */

:root {
  /* ===== 語意狀態色彩 ===== */
  --ai-color-thinking: #8b5cf6;        /* 紫色：AI 正在思考/處理 */
  --ai-color-thinking-bg: #f5f3ff;     /* 思考狀態背景 */
  --ai-color-streaming: #0ea5e9;       /* 藍色：串流傳輸中 */
  --ai-color-streaming-bg: #f0f9ff;    /* 串流狀態背景 */
  --ai-color-complete: #10b981;        /* 綠色：回應完成 */
  --ai-color-error: #ef4444;           /* 紅色：錯誤狀態 */
  --ai-color-error-bg: #fef2f2;        /* 錯誤狀態背景 */
  --ai-color-surface: #ffffff;         /* 元件背景色 */
  --ai-color-surface-alt: #f9fafb;     /* 使用者訊息泡泡背景 */
  --ai-color-border: #e5e7eb;          /* 邊框顏色 */
  --ai-color-text-primary: #111827;    /* 主要文字 */
  --ai-color-text-secondary: #6b7280;  /* 次要文字（時間戳、角色標籤） */

  /* ===== 排版 ===== */
  --ai-font-chat: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --ai-font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  --ai-font-size-message: 0.9375rem;   /* 15px */
  --ai-font-size-code: 0.875rem;       /* 14px */
  --ai-font-size-meta: 0.75rem;        /* 12px，用於時間戳 */
  --ai-line-height-message: 1.7;
  --ai-line-height-code: 1.5;

  /* ===== 動畫時長 ===== */
  --ai-duration-thinking: 1.4s;        /* 思考動畫循環週期 */
  --ai-duration-typing: 0.05s;         /* 每個字元出現的間隔 */
  --ai-duration-appear: 0.25s;         /* 訊息泡泡進場動畫 */
  --ai-duration-cursor-blink: 1.0s;    /* 游標閃爍週期 */
  --ai-easing-appear: cubic-bezier(0.16, 1, 0.3, 1); /* spring-like */

  /* ===== 間距 ===== */
  --ai-message-gap: 1rem;              /* 訊息之間的間距 */
  --ai-bubble-padding-x: 1rem;
  --ai-bubble-padding-y: 0.75rem;
  --ai-bubble-radius: 1rem;            /* 訊息泡泡圓角 */
  --ai-bubble-radius-small: 0.375rem;  /* 連續訊息的小圓角 */
  --ai-spacing-sm: 0.5rem;
  --ai-spacing-md: 1rem;
  --ai-spacing-lg: 1.5rem;

  /* ===== 尺寸 ===== */
  --ai-avatar-size: 2rem;
  --ai-input-min-height: 2.75rem;
  --ai-input-max-height: 12rem;        /* 自動展開的上限 */
  --ai-status-dot-size: 0.5rem;
}

/* ===== 深色模式 ===== */
@media (prefers-color-scheme: dark) {
  :root {
    --ai-color-thinking: #a78bfa;
    --ai-color-thinking-bg: #1e1b4b;
    --ai-color-streaming: #38bdf8;
    --ai-color-streaming-bg: #082f49;
    --ai-color-surface: #1f2937;
    --ai-color-surface-alt: #111827;
    --ai-color-border: #374151;
    --ai-color-text-primary: #f9fafb;
    --ai-color-text-secondary: #9ca3af;
  }
}

/* ===== 高對比模式 ===== */
@media (forced-colors: active) {
  :root {
    --ai-color-thinking: HighlightText;
    --ai-color-streaming: Highlight;
    --ai-color-error: Mark;
    --ai-color-surface: Canvas;
    --ai-color-border: ButtonBorder;
    --ai-color-text-primary: CanvasText;
  }
}</code></pre>

  <h3>思考狀態動畫</h3>
  <pre data-lang="css"><code class="language-css">/* 思考中動畫：三個點依序彈跳 */
@keyframes ai-thinking-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1.0);
    opacity: 1;
  }
}

.ai-thinking-indicator {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  padding: var(--ai-bubble-padding-y) var(--ai-bubble-padding-x);
}

.ai-thinking-indicator span {
  width: var(--ai-status-dot-size);
  height: var(--ai-status-dot-size);
  border-radius: 50%;
  background: var(--ai-color-thinking);
  animation: ai-thinking-bounce var(--ai-duration-thinking) ease-in-out infinite;
}

.ai-thinking-indicator span:nth-child(1) { animation-delay: 0s; }
.ai-thinking-indicator span:nth-child(2) { animation-delay: 0.2s; }
.ai-thinking-indicator span:nth-child(3) { animation-delay: 0.4s; }

/* 串流游標閃爍 */
@keyframes ai-cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.ai-streaming-cursor::after {
  content: '▋';
  color: var(--ai-color-streaming);
  animation: ai-cursor-blink var(--ai-duration-cursor-blink) step-end infinite;
  font-size: 0.875em;
  vertical-align: text-bottom;
}

/* 訊息進場動畫 */
@keyframes ai-message-appear {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-message-enter {
  animation: ai-message-appear var(--ai-duration-appear) var(--ai-easing-appear) both;
}</code></pre>

  <h3>Style Dictionary 多平台 Token 生成</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation-tokens/style-dictionary.config.ts
import StyleDictionary from 'style-dictionary';

const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'ai',
      buildPath: 'dist/css/',
      files: [{ destination: 'ai-tokens.css', format: 'css/variables' }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [
        { destination: 'ai-tokens.cjs.js', format: 'javascript/module' },
        { destination: 'ai-tokens.esm.js', format: 'javascript/es6' },
        { destination: 'ai-tokens.d.ts', format: 'typescript/es6-declarations' },
      ],
    },
    ios_swift: {
      transformGroup: 'ios-swift',
      buildPath: 'dist/ios/',
      files: [{ destination: 'AITokens.swift', format: 'ios-swift/class.swift' }],
    },
    android: {
      transformGroup: 'android',
      buildPath: 'dist/android/',
      files: [{ destination: 'ai_tokens.xml', format: 'android/resources' }],
    },
  },
};

const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();
console.log('AI tokens built for CSS, JS, iOS, Android');</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Token 命名規範</div>
    <p>
      所有 AI Foundation 的 CSS Custom Property 一律以 <code>--ai-</code> 前綴開頭，
      避免與產品的品牌 token（通常用 <code>--color-</code>、<code>--spacing-</code>）衝突。
      應用層可以透過重新賦值這些 token 來客製化 AI 元件的視覺風格，
      而不需要覆寫任何元件的 CSS。
    </p>
  </div>
</section>

<section id="cross-team-governance">
  <h2>跨團隊治理：RFC 流程與版本策略</h2>
  <p>
    當多個團隊共用同一個元件庫時，誰有權修改 API？如何避免一個團隊的需求破壞其他團隊的使用？
    這需要一套清晰的治理流程，而不是依賴「有人負責就好」的模糊分工。
  </p>

  <h3>元件穩定性標籤</h3>
  <p>
    每個元件必須標記其穩定性狀態，讓使用者清楚知道採用風險：
  </p>
  <table>
    <thead>
      <tr><th>狀態</th><th>含義</th><th>API 穩定性承諾</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>experimental</code></td>
        <td>概念驗證，API 隨時可能改變</td>
        <td>無承諾，隨時可能移除</td>
      </tr>
      <tr>
        <td><code>beta</code></td>
        <td>功能完整，正在收集回饋</td>
        <td>Breaking changes 需提前 1 個 minor 版本警告</td>
      </tr>
      <tr>
        <td><code>stable</code></td>
        <td>生產就緒，API 已凍結</td>
        <td>Breaking changes 只在 major 版本，需遷移指南</td>
      </tr>
      <tr>
        <td><code>deprecated</code></td>
        <td>即將移除，請遷移到替代方案</td>
        <td>保留至下一個 major 版本後移除</td>
      </tr>
    </tbody>
  </table>

  <h3>Deprecation Warning 模式</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 在 Lit 元件中加入 deprecation warning 的標準模式
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ai-chat')
export class AiChat extends LitElement {
  /**
   * @deprecated 請改用 system-prompt attribute。
   * 此屬性將在 v3.0.0 移除。
   */
  @property({ type: String, attribute: 'initial-prompt' })
  set initialPrompt(value: string) {
    console.warn(
      '[ai-foundation][ai-chat] \`initial-prompt\` is deprecated and will be removed in v3.0.0. ' +
      'Use \`system-prompt\` instead. ' +
      'Migration guide: https://ai-foundation.example.com/migration/v3'
    );
    this.systemPrompt = value;
  }
  get initialPrompt() { return this.systemPrompt; }

  @property({ type: String, attribute: 'system-prompt' })
  systemPrompt = '';

  connectedCallback() {
    super.connectedCallback();
    // 檢查 legacy attribute
    if (this.hasAttribute('mode') && this.getAttribute('mode') === 'legacy') {
      console.warn(
        '[ai-foundation][ai-chat] mode="legacy" is deprecated. ' +
        'Please migrate to the new streaming architecture.'
      );
    }
  }
}</code></pre>

  <h3>RFC（Request for Comments）模板</h3>
  <p>
    任何新增元件或 Breaking Change 都需要經過 RFC 流程，讓所有相關團隊有機會提供意見：
  </p>
  <pre data-lang="plaintext"><code class="language-plaintext">---
RFC: 0042
Title: 新增 &lt;ai-code-editor&gt; 元件
Status: proposed  # proposed | accepted | rejected | implemented
Author: @frontend-platform-team
Created: 2024-03-15
---

## 動機（Motivation）
多個團隊需要讓使用者在 AI 對話中直接編輯程式碼片段，
目前各自用不同的 textarea 解決，體驗不一致。

## 提案（Proposal）
新增 &lt;ai-code-editor&gt; 元件，整合 CodeMirror 6，
支援語法高亮、行號、基本 AI 輔助功能（Accept/Reject suggestion）。

## API 設計
Properties:
  - language: string  # 程式語言，影響語法高亮
  - value: string     # 程式碼內容（受控模式）
  - readonly: boolean

Events:
  - code-change: { value: string, language: string }
  - ai-suggestion: { original: string, suggested: string }

## 替代方案（Alternatives Considered）
1. 建議各團隊直接整合 Monaco Editor —— 太重（2MB+），不適合作為 Foundation
2. 只提供基礎 textarea with monospace font —— 無法滿足程式碼 UX 需求

## 影響評估（Impact）
Bundle size 增加約 400KB（CodeMirror tree-sitter）
需要新增 ai-foundation-tokens 中的 code editor token

## 反對意見截止日（Dissent Deadline）
2024-03-29（兩週）</code></pre>

  <h3>Changesets：Monorepo 版本管理</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 使用 @changesets/cli 管理 monorepo 發版
// 每次 PR 合入前，開發者執行 npx changeset 建立變更記錄

// .changeset/add-model-selector.md（自動生成格式）
// ---
// "ai-foundation": minor
// "ai-foundation-react": minor
// "ai-foundation-vue": minor
// ---
//
// feat(ai-foundation): 新增 &lt;model-selector&gt; 元件
//
// 讓使用者可以在執行時切換 AI 模型。
// 同步更新 React 和 Vue wrapper。

// package.json scripts
// {
//   "scripts": {
//     "changeset": "changeset",
//     "version": "changeset version &amp;&amp; pnpm install",
//     "release": "pnpm build &amp;&amp; changeset publish"
//   }
// }

// CI/CD：自動建立 Version PR
// .github/workflows/release.yml 配置（概念示意）
const releaseWorkflow = \`
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
\`;</code></pre>

  <h3>元件健康儀表板</h3>
  <p>
    透過 npm 下載統計、Sentry 錯誤率、以及自定義的元件使用埋點，
    Foundation 團隊可以建立一個健康儀表板，追蹤哪些元件被廣泛使用、
    哪些有高錯誤率、哪些 deprecated 元件仍在使用中。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/components/health-dashboard/health-dashboard.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface ComponentHealth {
  name: string;
  stability: 'experimental' | 'beta' | 'stable' | 'deprecated';
  usageCount: number;      // 過去 30 天的渲染次數
  errorRate: number;       // 錯誤率（百分比）
  p95Latency: number;      // 第一次渲染的 p95 延遲（ms）
  teamsUsing: string[];    // 使用此元件的團隊清單
}

@customElement('ai-health-dashboard')
export class AIHealthDashboard extends LitElement {
  @state() private _data: ComponentHealth[] = [];

  static styles = css\`
    :host { display: block; font-family: var(--ai-font-chat); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid var(--ai-color-border); }
    .stable { color: var(--ai-color-complete); }
    .deprecated { color: var(--ai-color-error); }
    .beta { color: var(--ai-color-streaming); }
    .experimental { color: var(--ai-color-thinking); }
  \`;

  async connectedCallback() {
    super.connectedCallback();
    const res = await fetch('/api/foundation/health');
    this._data = await res.json();
  }

  render() {
    return html\`
      &lt;table&gt;
        &lt;thead&gt;
          &lt;tr&gt;
            &lt;th&gt;元件&lt;/th&gt;
            &lt;th&gt;狀態&lt;/th&gt;
            &lt;th&gt;30日使用次數&lt;/th&gt;
            &lt;th&gt;錯誤率&lt;/th&gt;
            &lt;th&gt;P95 延遲&lt;/th&gt;
          &lt;/tr&gt;
        &lt;/thead&gt;
        &lt;tbody&gt;
          \${this._data.map(c =&gt; html\`
            &lt;tr&gt;
              &lt;td&gt;&lt;code&gt;&amp;lt;\${c.name}&amp;gt;&lt;/code&gt;&lt;/td&gt;
              &lt;td class=\${c.stability}&gt;\${c.stability}&lt;/td&gt;
              &lt;td&gt;\${c.usageCount.toLocaleString()}&lt;/td&gt;
              &lt;td style="color: \${c.errorRate &gt; 1 ? 'var(--ai-color-error)' : 'inherit'}"&gt;
                \${c.errorRate.toFixed(2)}%
              &lt;/td&gt;
              &lt;td&gt;\${c.p95Latency}ms&lt;/td&gt;
            &lt;/tr&gt;
          \`)}
        &lt;/tbody&gt;
      &lt;/table&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">Inner Source 文化</div>
    <p>
      Foundation 應鼓勵所有團隊貢獻程式碼，但需要清晰的 inner-source 指引：
      每個 PR 需包含 Storybook story、單元測試、以及 changeset 記錄。
      Foundation 團隊扮演「gatekeepers」角色，確保 API 一致性和品質，
      而非親自撰寫所有元件。
    </p>
  </div>
</section>

<section id="telemetry-observability">
  <h2>可觀測性：使用追蹤、效能指標與錯誤監控</h2>
  <p>
    AI 功能的可靠性監控比傳統 UI 元件更複雜：除了一般的錯誤率和延遲，
    還需要追蹤 LLM 特有的指標——首 token 時間（TTFT）、每秒 token 數（TPS）、
    使用者滿意度訊號、以及 token 使用成本。
  </p>

  <h3>OpenTelemetry 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/providers/instrumented-provider.ts
import { trace, metrics, context, SpanStatusCode } from '@opentelemetry/api';
import type { AIProvider, Message, ChatOptions, StreamChunk } from '../types/provider.js';

const tracer = trace.getTracer('ai-foundation', '1.0.0');
const meter = metrics.getMeter('ai-foundation', '1.0.0');

// 自定義指標定義
const ttftHistogram = meter.createHistogram('ai.ttft_ms', {
  description: '首個 token 抵達的時間（毫秒）',
  unit: 'ms',
});
const tpsGauge = meter.createObservableGauge('ai.tokens_per_second', {
  description: '每秒 token 生成速率',
});
const abortCounter = meter.createCounter('ai.stream_abort_count', {
  description: '使用者主動中止串流的次數',
});
const totalTokensCounter = meter.createCounter('ai.total_tokens', {
  description: '累計使用的 token 數',
  unit: 'tokens',
});

/**
 * InstrumentedProvider：Decorator 模式，
 * 為任何 AIProvider 加上 OpenTelemetry 可觀測性，
 * 不需修改原始 Provider 程式碼。
 */
export class InstrumentedProvider implements AIProvider {
  get modelId() { return this._inner.modelId; }
  get capabilities() { return this._inner.capabilities; }

  constructor(private readonly _inner: AIProvider) {}

  async chat(messages: Message[], options?: ChatOptions): Promise&lt;Message&gt; {
    const span = tracer.startSpan('ai.chat', {
      attributes: {
        'ai.model': this.modelId,
        'ai.messages.count': messages.length,
        'ai.operation': 'chat',
      },
    });

    return context.with(trace.setSpan(context.active(), span), async () =&gt; {
      const startTime = performance.now();
      try {
        const result = await this._inner.chat(messages, options);
        span.setAttribute('ai.response.length', result.content.length);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.recordException(err as Error);
        throw err;
      } finally {
        span.setAttribute('ai.duration_ms', performance.now() - startTime);
        span.end();
      }
    });
  }

  async *stream(messages: Message[], options?: ChatOptions): AsyncIterable&lt;StreamChunk&gt; {
    const span = tracer.startSpan('ai.stream', {
      attributes: {
        'ai.model': this.modelId,
        'ai.messages.count': messages.length,
        'ai.operation': 'stream',
      },
    });

    let firstTokenTime: number | null = null;
    let totalTokens = 0;
    let charCount = 0;
    const startTime = performance.now();
    let aborted = false;

    try {
      for await (const chunk of this._inner.stream(messages, options)) {
        if (firstTokenTime === null && chunk.delta) {
          firstTokenTime = performance.now() - startTime;
          ttftHistogram.record(firstTokenTime, { 'ai.model': this.modelId });
          span.addEvent('first_token', { 'ai.ttft_ms': firstTokenTime });
        }

        charCount += chunk.delta.length;
        if (chunk.usage) {
          totalTokens = chunk.usage.totalTokens;
          totalTokensCounter.add(chunk.usage.totalTokens, { 'ai.model': this.modelId });
        }

        yield chunk;

        if (chunk.done) break;
      }

      const duration = (performance.now() - startTime) / 1000;
      if (duration &gt; 0 &amp;&amp; totalTokens &gt; 0) {
        // 計算實際 TPS 並記錄
        span.setAttribute('ai.tokens_per_second', totalTokens / duration);
      }
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        aborted = true;
        abortCounter.add(1, { 'ai.model': this.modelId });
        span.addEvent('stream_aborted');
      } else {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.recordException(err as Error);
        throw err;
      }
    } finally {
      span.setAttributes({
        'ai.stream.total_tokens': totalTokens,
        'ai.stream.char_count': charCount,
        'ai.stream.aborted': aborted,
        'ai.stream.ttft_ms': firstTokenTime ?? -1,
        'ai.stream.duration_ms': performance.now() - startTime,
      });
      span.end();
    }
  }

  async embed(text: string): Promise&lt;number[]&gt; {
    return this._inner.embed(text);
  }
}</code></pre>

  <h3>Sentry 整合與 AI 脈絡</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/controllers/ai-controller.ts（Sentry 整合片段）
import * as Sentry from '@sentry/browser';

export class AIController implements ReactiveController {
  // ... 其他程式碼 ...

  private _captureAIError(err: Error, context: {
    model: string;
    messageCount: number;
    promptTemplate?: string;
  }) {
    Sentry.withScope(scope =&gt; {
      scope.setTag('ai.model', context.model);
      scope.setContext('ai_request', {
        messageCount: context.messageCount,
        promptTemplate: context.promptTemplate ?? 'default',
        timestamp: new Date().toISOString(),
      });
      // 注意：不要在 Sentry 中記錄實際的訊息內容（隱私考量）
      scope.setExtra('ai.has_system_prompt', context.promptTemplate !== undefined);
      Sentry.captureException(err);
    });
  }
}</code></pre>

  <h3>使用者滿意度訊號元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/components/ai-feedback/ai-feedback.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('ai-feedback')
export class AIFeedback extends LitElement {
  @property({ type: String, attribute: 'message-id' }) messageId = '';
  @state() private _voted: 'up' | 'down' | null = null;

  static styles = css\`
    :host { display: flex; gap: 0.5rem; align-items: center; }
    button {
      background: none; border: 1px solid var(--ai-color-border);
      border-radius: 0.25rem; cursor: pointer; padding: 0.25rem 0.5rem;
      font-size: 1rem; transition: background 0.15s;
    }
    button:hover { background: var(--ai-color-surface-alt); }
    button[aria-pressed="true"] { background: var(--ai-color-surface-alt); border-color: var(--ai-color-streaming); }
  \`;

  render() {
    return html\`
      &lt;span style="font-size: var(--ai-font-size-meta); color: var(--ai-color-text-secondary)"&gt;
        這個回答有幫助嗎？
      &lt;/span&gt;
      &lt;button
        aria-pressed=\${this._voted === 'up'}
        @click=\${() =&gt; this._vote('up')}
        aria-label="有幫助"
      &gt;👍&lt;/button&gt;
      &lt;button
        aria-pressed=\${this._voted === 'down'}
        @click=\${() =&gt; this._vote('down')}
        aria-label="沒有幫助"
      &gt;👎&lt;/button&gt;
    \`;
  }

  private _vote(sentiment: 'up' | 'down') {
    if (this._voted === sentiment) return; // 防止重複投票
    this._voted = sentiment;

    // 發送滿意度訊號到分析服務
    this.dispatchEvent(new CustomEvent('ai-feedback', {
      detail: { messageId: this.messageId, sentiment, timestamp: Date.now() },
      bubbles: true, composed: true,
    }));

    // 同時記錄到 OpenTelemetry
    const meter = metrics.getMeter('ai-foundation');
    meter.createCounter('ai.user_feedback').add(1, {
      'ai.feedback.sentiment': sentiment,
    });
  }
}</code></pre>

  <h3>效能預算警示</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/utils/performance-budget.ts

const PERFORMANCE_BUDGETS = {
  ttft: 3000,          // 首 token 時間上限：3 秒
  streamDuration: 30000, // 串流總時長上限：30 秒
  renderLatency: 100,  // UI 渲染延遲上限：100ms
} as const;

export function checkPerformanceBudget(
  metric: keyof typeof PERFORMANCE_BUDGETS,
  value: number,
  context: { model: string; component: string }
): void {
  const budget = PERFORMANCE_BUDGETS[metric];
  if (value &gt; budget) {
    // 送出警示事件
    const event = new CustomEvent('ai-performance-budget-exceeded', {
      detail: { metric, value, budget, ...context },
      bubbles: true, composed: true,
    });
    document.dispatchEvent(event);

    // 同時記錄到 OpenTelemetry
    const meter = metrics.getMeter('ai-foundation');
    meter.createCounter('ai.budget_violation').add(1, {
      'ai.budget.metric': metric,
      'ai.model': context.model,
    });

    if (import.meta.env.DEV) {
      console.warn(
        \`[ai-foundation] Performance budget exceeded for \${metric}: \` +
        \`\${value}ms > \${budget}ms (model: \${context.model})\`
      );
    }
  }
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">可觀測性的隱私邊界</div>
    <p>
      AI 可觀測性的一個重要原則：<strong>永遠不記錄使用者的實際訊息內容到外部監控服務</strong>。
      只記錄訊息的<em>統計特徵</em>（長度、數量、角色），而非內容本身。
      如果需要 debug 特定錯誤，使用 session replay 工具（如 LogRocket）並確保
      已適當地 mask 敏感欄位。
    </p>
  </div>
</section>

<section id="security-governance">
  <h2>安全治理：API 金鑰管理、輸入驗證與內容過濾</h2>
  <p>
    AI 功能引入了傳統 Web 應用未曾面對的安全威脅：Prompt Injection、
    PII 洩漏到 LLM 的訓練或日誌中、API 金鑰被前端程式碼暴露、
    以及無限制的 token 消耗導致的成本攻擊。
    Foundation 層需要提供安全護欄，讓應用層開發者難以犯錯。
  </p>

  <h3>BFF（Backend for Frontend）API 代理模式</h3>
  <p>
    最重要的安全原則：<strong>AI API 金鑰永遠不能出現在前端程式碼或瀏覽器中</strong>。
    所有 AI 請求必須通過後端代理服務，由後端注入 API 金鑰並驗證使用者身份：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// bff/src/ai-proxy.ts（後端 BFF 服務，例如 Node.js + Express）
import express from 'express';
import { verifyJWT } from './auth.js';
import { rateLimiter } from './rate-limit.js';
import { auditLogger } from './audit.js';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); // 只在後端

// JWT 驗證中介層：確保只有已登入使用者可以呼叫 AI API
router.use(verifyJWT);

// 速率限制：每個使用者每天最多 50,000 tokens
router.use(rateLimiter({
  keyBy: (req) =&gt; req.user.id,
  maxTokensPerDay: 50000,
  onExceeded: (req, res) =&gt; {
    res.status(429).json({
      error: 'TOKEN_BUDGET_EXCEEDED',
      message: '今日 AI 使用額度已用完，請明日再試。',
      resetAt: new Date(Date.now() + 86400000).toISOString(),
    });
  },
}));

router.post('/stream', async (req, res) =&gt; {
  const { messages, options } = req.body;

  // 稽核日誌：記錄誰在何時發送了 AI 請求（不記錄內容）
  await auditLogger.log({
    userId: req.user.id,
    action: 'ai.stream',
    model: options.model ?? 'claude-sonnet-4-5',
    messageCount: messages.length,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no'); // 關閉 nginx 緩衝

  try {
    const stream = anthropic.messages.stream({
      model: options.model ?? 'claude-sonnet-4-5',
      max_tokens: Math.min(options.maxTokens ?? 2048, 4096), // 後端強制上限
      system: options.systemPrompt,
      messages,
    });

    for await (const event of stream) {
      res.write(\`data: \${JSON.stringify(event)}\n\n\`);
    }
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
});</code></pre>

  <h3>Prompt Injection 防護</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/utils/input-sanitizer.ts

const MAX_INPUT_LENGTH = 4000; // 字元數上限
const MAX_MESSAGE_COUNT = 50;  // 對話歷史上限

// 常見的 Prompt Injection 模式
const INJECTION_PATTERNS = [
  /\bignore\b.{0,50}\b(previous|above|all)\b.{0,50}\b(instruction|prompt|rule)/gi,
  /\bsystem\s*:/gi,
  /\b(assistant|user)\s*:/gi,       // 嘗試偽造角色
  /&lt;\/?(system|user|assistant)&gt;/gi, // XML 風格的角色注入
  /\bdisregard\b.{0,50}\bguideline/gi,
  /\bact as\b.{0,100}\bai\b/gi,
  /\byou are now\b/gi,
] as const;

export function sanitizeUserInput(input: string): string {
  let sanitized = input.trim();

  // 長度限制
  if (sanitized.length &gt; MAX_INPUT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH);
    console.warn('[ai-foundation] Input truncated to MAX_INPUT_LENGTH');
  }

  // 過濾明顯的 injection 嘗試
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  return sanitized;
}

export function sanitizeMessages(messages: Message[]): Message[] {
  // 限制歷史訊息數量（避免 context window 爆炸）
  const limited = messages.slice(-MAX_MESSAGE_COUNT);

  return limited.map(msg =&gt; ({
    ...msg,
    // 只對使用者訊息做 sanitization，AI 回應不需要
    content: msg.role === 'user' ? sanitizeUserInput(msg.content) : msg.content,
  }));
}

// PII 偵測與遮罩（在送出給 AI 前保護個資）
const PII_PATTERNS: Array&lt;{ pattern: RegExp; replacement: string }&gt; = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },                         // 美國 SSN
  { pattern: /\b[A-Z]\d{9}\b/g, replacement: '[PASSPORT]' },                            // 護照號碼
  { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '[CARD]' },      // 信用卡
  { pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b(?:\+?886|0)\s*(?:9\d{8}|\d{1,2}[- ]\d{7,8})\b/g, replacement: '[PHONE]' }, // 台灣電話
];

export function maskPII(text: string): string {
  let masked = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    masked = masked.replace(pattern, replacement);
  }
  return masked;
}</code></pre>

  <h3>內容過濾 Hooks</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/utils/content-filter.ts

export type ContentFilterResult =
  | { allowed: true; content: string }
  | { allowed: false; reason: string; code: string };

export type ContentFilterHook = (content: string, role: 'user' | 'assistant') =&gt; ContentFilterResult;

/**
 * 可組合的內容過濾器鏈
 * 應用層可以注入自定義的過濾邏輯
 */
export class ContentFilterChain {
  private _hooks: ContentFilterHook[] = [];

  use(hook: ContentFilterHook): this {
    this._hooks.push(hook);
    return this;
  }

  run(content: string, role: 'user' | 'assistant'): ContentFilterResult {
    for (const hook of this._hooks) {
      const result = hook(content, role);
      if (!result.allowed) return result;
      content = result.content; // 允許 hook 修改內容（例如 masking）
    }
    return { allowed: true, content };
  }
}

// 預建的過濾器
export const piiMaskingFilter: ContentFilterHook = (content, role) =&gt; {
  if (role !== 'user') return { allowed: true, content };
  return { allowed: true, content: maskPII(content) };
};

export const lengthLimitFilter = (maxLength: number): ContentFilterHook =&gt; (content) =&gt; {
  if (content.length &gt; maxLength) {
    return { allowed: false, reason: \`輸入長度超過限制（\${maxLength} 字元）\`, code: 'TOO_LONG' };
  }
  return { allowed: true, content };
};</code></pre>

  <h3>GDPR 合規：對話歷史刪除</h3>
  <pre data-lang="typescript"><code class="language-typescript">// packages/ai-foundation/src/controllers/conversation-controller.ts（GDPR 片段）
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class ConversationController implements ReactiveController {
  private _storageKey: string;

  constructor(
    private host: ReactiveControllerHost,
    private readonly userId: string
  ) {
    this._storageKey = \`ai-conversation:\${userId}\`;
    host.addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}

  getContext(messages: Message[], systemPrompt?: string): Message[] {
    return systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
  }

  get abortSignal(): AbortSignal {
    return new AbortController().signal;
  }

  /** GDPR 右一：刪除所有對話歷史（Right to Erasure） */
  async deleteAllHistory(): Promise&lt;void&gt; {
    // 清除本地儲存
    localStorage.removeItem(this._storageKey);
    sessionStorage.removeItem(this._storageKey);

    // 通知後端刪除伺服器端的對話記錄
    await fetch(\`/api/ai/conversations/\${this.userId}\`, {
      method: 'DELETE',
      headers: { Authorization: \`Bearer \${this._getToken()}\` },
    });

    // 發送事件通知 UI 更新
    this.host.requestUpdate();
  }

  private _getToken(): string {
    return localStorage.getItem('auth_token') ?? '';
  }
}</code></pre>

  <h3>安全審查清單</h3>
  <p>每次發布新的 AI Foundation 版本前，必須通過以下安全審查：</p>
  <table>
    <thead>
      <tr><th>類別</th><th>檢查項目</th><th>負責人</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>API 金鑰</td>
        <td>確認前端 bundle 中不包含任何 AI API 金鑰（靜態分析）</td>
        <td>Platform Team</td>
      </tr>
      <tr>
        <td>輸入驗證</td>
        <td>所有使用者輸入在送出前都通過 sanitizeUserInput</td>
        <td>Foundation Team</td>
      </tr>
      <tr>
        <td>PII 防護</td>
        <td>piiMaskingFilter 已包含在預設 ContentFilterChain 中</td>
        <td>Foundation Team</td>
      </tr>
      <tr>
        <td>速率限制</td>
        <td>BFF 服務已設定每用戶 token 每日預算</td>
        <td>Backend Team</td>
      </tr>
      <tr>
        <td>稽核日誌</td>
        <td>所有 AI 請求（含 userId、timestamp、model）均有日誌記錄</td>
        <td>Backend Team</td>
      </tr>
      <tr>
        <td>GDPR</td>
        <td>deleteAllHistory API 已實作並測試</td>
        <td>Legal + Engineering</td>
      </tr>
      <tr>
        <td>身份驗證</td>
        <td>BFF 的所有端點都有 JWT 驗證中介層</td>
        <td>Security Team</td>
      </tr>
      <tr>
        <td>依賴項</td>
        <td>執行 npm audit，確認無高風險依賴漏洞</td>
        <td>DevOps</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">安全性是非功能性需求，但必須是一等公民</div>
    <p>
      在企業 AI 應用中，安全漏洞的代價遠超過功能 bug。一旦 API 金鑰外洩，
      攻擊者可以用你的名義發送數百萬次 AI 請求，產生巨額費用且難以追責。
      Foundation 的安全護欄必須是<em>預設開啟</em>且<em>難以關閉</em>的，
      而不是讓應用層開發者自己記得去啟用。
    </p>
  </div>
</section>
`,
};
