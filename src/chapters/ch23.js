export default {
  id: 23,
  slug: 'chapter-23',
  title: '以 Lit 打造 AI 應用：串流、對話介面與 LLM 整合',
  part: 7,
  intro: '探索如何以 Lit Framework 建構現代 AI 應用的前端介面，涵蓋串流文字渲染、Markdown 解析、對話管理，以及與 OpenAI、Anthropic Claude、Google Gemini 等主流 LLM API 的整合模式。',
  sections: [
    { slug: 'ai-frontend-challenges', title: 'AI 前端的特殊挑戰' },
    { slug: 'streaming-text-rendering', title: 'Streaming 文字渲染：SSE 與 ReadableStream' },
    { slug: 'chat-component-architecture', title: '對話介面架構設計' },
    { slug: 'openai-integration', title: 'OpenAI API 整合：Chat Completions Streaming' },
    { slug: 'anthropic-claude-integration', title: 'Anthropic Claude API 整合' },
    { slug: 'gemini-integration', title: 'Google Gemini API 整合' },
    { slug: 'markdown-code-rendering', title: 'Markdown 與程式碼高亮渲染' },
    { slug: 'tool-calling-ui', title: 'Tool Calling UI：展示 AI 工具調用過程' },
  ],
  content: `
<section id="ai-frontend-challenges">
  <h2>AI 前端的特殊挑戰</h2>
  <p>
    傳統的 Web 應用程式遵循「請求—回應」模型：使用者觸發操作，伺服器回傳完整資料，UI 更新一次。
    AI 應用打破了這個模式。當你向 ChatGPT 提問，回應不是在某個瞬間完整呈現，而是一個字一個字
    「流」出來——這背後涉及一套完全不同的前端工程思維。
  </p>
  <p>
    本章從工程實務的角度，系統性地拆解 AI 前端開發的核心挑戰，並展示如何以 Lit Framework
    優雅地解決它們。
  </p>

  <h3>串流 Token 與完整回應的根本差異</h3>
  <p>
    大型語言模型（LLM）以 <strong>Token</strong> 為單位逐步生成回應。GPT-4 每秒約產生
    20–60 個 Token，Claude 3 Opus 約 15–40 個。一個 500 字的回應可能需要
    5–15 秒才能完全生成。
  </p>
  <p>
    如果等待完整回應再顯示，使用者會面臨漫長的空白等待。<strong>串流渲染</strong>
    讓 UI 在第一個 Token 抵達時（通常 &lt; 500ms）就開始顯示，大幅提升感知速度。
    但這帶來了新的工程問題：
  </p>
  <ul>
    <li><strong>Markdown 部分渲染：</strong>一個程式碼區塊（如 <code>\`\`\`typescript</code>）可能在三個不同的 chunk 分批抵達，如何在串流過程中正確渲染 Markdown？</li>
    <li><strong>狀態管理複雜性：</strong>訊息從「等待中」→「串流中」→「完成」有多個中間狀態。</li>
    <li><strong>DOM 更新效能：</strong>每個 Token 都觸發 DOM 更新，如果不做批次處理，會導致嚴重的效能問題。</li>
    <li><strong>滾動行為：</strong>串流過程中，訊息清單在持續增長，需要智慧地決定何時自動捲動、何時不捲動（使用者正在滾動回看時）。</li>
  </ul>

  <h3>對話狀態管理</h3>
  <p>
    LLM API 是<strong>無狀態</strong>的。每次請求都需要攜帶完整的對話歷史。
    這意味著前端必須維護對話記憶，並在每次呼叫 API 時將歷史訊息一併送出。
  </p>
  <p>
    隨著對話增長，這帶來 Context Window 的限制問題。GPT-4o 的上下文窗口是 128K Token，
    Claude 3.5 Sonnet 是 200K Token。前端需要實作：
  </p>
  <ul>
    <li>Token 計數（使用 tiktoken 或 API 回傳的 usage 資料）</li>
    <li>對話截斷策略（保留最近 N 輪、摘要舊對話）</li>
    <li>對話持久化（localStorage、IndexedDB、後端資料庫）</li>
  </ul>

  <h3>錯誤處理與重試</h3>
  <p>LLM API 有其獨特的錯誤模式：</p>

  <table>
    <thead>
      <tr>
        <th>錯誤類型</th>
        <th>HTTP 狀態碼</th>
        <th>建議處理策略</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Rate Limit 超出</td>
        <td>429</td>
        <td>指數退避重試，顯示倒數計時</td>
      </tr>
      <tr>
        <td>Context 超出限制</td>
        <td>400</td>
        <td>截斷對話歷史後重試</td>
      </tr>
      <tr>
        <td>內容政策違反</td>
        <td>400</td>
        <td>顯示友善提示，不重試</td>
      </tr>
      <tr>
        <td>伺服器錯誤</td>
        <td>500/503</td>
        <td>最多重試 3 次，線性退避</td>
      </tr>
      <tr>
        <td>串流中斷</td>
        <td>N/A（網路）</td>
        <td>保存已收到的部分、提供重試選項</td>
      </tr>
    </tbody>
  </table>

  <h3>成本管理</h3>
  <p>
    每次 API 呼叫都有金錢成本。GPT-4o 的輸入 Token 費用約為 $2.5/1M Token，
    輸出約 $10/1M Token。一個活躍的使用者每天可能消耗數萬個 Token。
    前端需要：
  </p>
  <ul>
    <li>即時顯示預估成本</li>
    <li>設定每日/每月用量上限</li>
    <li>在用量接近限制時給予警示</li>
    <li>提供模型切換（低成本 vs 高品質）</li>
  </ul>

  <div class="callout callout-info">
    <div class="callout-title">為什麼選擇 Lit？</div>
    <p>
      Lit 的響應式更新系統（基於 <code>@property</code> 裝飾器）與 <strong>AsyncDirective</strong>
      機制天然適合串流渲染。不同於 React 的 Virtual DOM diff，Lit 直接操作實際 DOM，
      減少不必要的重新渲染。對於每秒需要更新數十次的串流文字，這種效能優勢至關重要。
    </p>
  </div>
</section>

<section id="streaming-text-rendering">
  <h2>Streaming 文字渲染：SSE 與 ReadableStream</h2>
  <p>
    AI API 的串流傳輸主要透過兩種機制實現：<strong>Server-Sent Events（SSE）</strong>
    和 <strong>ReadableStream</strong>。理解這兩者的差異是建構穩健串流 UI 的基礎。
  </p>

  <h3>Server-Sent Events 協定</h3>
  <p>
    SSE 是 HTML5 標準的一部分，允許伺服器透過單一 HTTP 連線持續推送事件。
    OpenAI、Anthropic 等 API 都採用 SSE 格式。一個典型的 SSE 串流看起來像這樣：
  </p>
  <pre data-lang="text"><code class="language-text">data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"你"},"index":0}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"好"},"index":0}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"！"},"index":0}]}

data: [DONE]
</code></pre>

  <p>
    每個事件以 <code>data: </code> 開頭，事件之間以空行分隔。
    串流結束時發送 <code>data: [DONE]</code>。
  </p>

  <h3>StreamingTextDirective：AsyncDirective 的核心應用</h3>
  <p>
    Lit 的 <code>AsyncDirective</code> 是處理串流渲染的最佳工具。
    它允許 Directive 在非同步資料抵達時，直接更新它所綁定的 DOM 節點，
    而無需觸發完整的元件重新渲染。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// src/directives/streaming-text.directive.ts
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { PartInfo, PartType } from 'lit/directive.js';
import { noChange } from 'lit';

interface StreamChunk {
  text: string;
  isDone: boolean;
}

class StreamingTextDirective extends AsyncDirective {
  private abortController: AbortController | null = null;
  private buffer = '';
  private animationFrameId: number | null = null;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error('streamingText 只能用在 child binding');
    }
  }

  render(stream: ReadableStream&lt;string&gt; | null) {
    if (stream === null) return this.buffer;
    this.startStreaming(stream);
    return noChange;
  }

  private async startStreaming(stream: ReadableStream&lt;string&gt;) {
    this.buffer = '';
    this.abortController = new AbortController();
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        this.buffer += value;
        this.scheduleUpdate();
      }
      // 串流完成後做最終更新
      this.setValue(this.buffer);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('串流讀取錯誤:', error);
        this.setValue(this.buffer + ' [串流中斷]');
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 使用 requestAnimationFrame 批次 DOM 更新，避免每個 token 都觸發重繪
  private scheduleUpdate() {
    if (this.animationFrameId !== null) return;
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      if (this.isConnected) {
        this.setValue(this.buffer);
      }
    });
  }

  disconnected() {
    this.abortController?.abort();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  reconnected() {
    // 重新連接後繼續顯示已累積的內容
    this.setValue(this.buffer);
  }
}

export const streamingText = directive(StreamingTextDirective);
</code></pre>

  <h3>SSE 解析器：從 fetch Response 到 ReadableStream&lt;string&gt;</h3>
  <p>
    原生 <code>fetch</code> 可以直接處理 SSE，無需使用 <code>EventSource</code>
    （後者不支援 POST 請求和自訂 Headers）。以下是一個通用的 SSE 解析器：
  </p>
  <pre data-lang="typescript"><code class="language-typescript">// src/utils/sse-parser.ts

export type SSEEvent = {
  type: 'data' | 'event' | 'error' | 'done';
  data?: string;
  event?: string;
};

/**
 * 將 fetch Response 的 body 轉換為解析後的 SSE 事件串流
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator&lt;SSEEvent&gt; {
  if (!response.body) throw new Error('Response body 為空');
  if (!response.ok) {
    const error = await response.text();
    throw new Error(\`HTTP \${response.status}: \${error}\`);
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split('\\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }
          yield { type: 'data', data };
        } else if (line.startsWith('event: ')) {
          yield { type: 'event', event: line.slice(7).trim() };
        }
        // 忽略空行和注釋行（以 : 開頭）
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 將 SSE 事件串流轉換為純文字 ReadableStream
 * 供 StreamingTextDirective 使用
 */
export function createTextStream(
  asyncGen: AsyncGenerator&lt;SSEEvent&gt;,
  extractText: (data: string) =&gt; string | null
): ReadableStream&lt;string&gt; {
  return new ReadableStream&lt;string&gt;({
    async start(controller) {
      try {
        for await (const event of asyncGen) {
          if (event.type === 'done') {
            controller.close();
            return;
          }
          if (event.type === 'data' &amp;&amp; event.data) {
            const text = extractText(event.data);
            if (text !== null) {
              controller.enqueue(text);
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
</code></pre>

  <h3>使用範例：在 Lit 元件中整合串流</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/streaming-demo.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { streamingText } from '../directives/streaming-text.directive.js';
import { parseSSEStream, createTextStream } from '../utils/sse-parser.js';

@customElement('streaming-demo')
export class StreamingDemo extends LitElement {
  static styles = css\`
    .container { font-family: sans-serif; padding: 1rem; }
    .output {
      min-height: 100px;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      white-space: pre-wrap;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .cursor {
      display: inline-block;
      width: 2px;
      height: 1em;
      background: currentColor;
      animation: blink 1s step-end infinite;
      vertical-align: text-bottom;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  \`;

  @state() private stream: ReadableStream&lt;string&gt; | null = null;
  @state() private isStreaming = false;

  private async startStream() {
    this.isStreaming = true;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '請介紹一下 Lit Framework' }),
    });

    const sseGen = parseSSEStream(response);
    this.stream = createTextStream(sseGen, (data) =&gt; {
      try {
        const parsed = JSON.parse(data);
        return parsed.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    });
    this.isStreaming = false;
  }

  render() {
    return html\`
      &lt;div class="container"&gt;
        &lt;button @click=\${this.startStream} ?disabled=\${this.isStreaming}&gt;
          開始串流
        &lt;/button&gt;
        &lt;div class="output"&gt;
          \${streamingText(this.stream)}
          \${this.isStreaming ? html\`&lt;span class="cursor"&gt;&lt;/span&gt;\` : ''}
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">效能最佳化：批次更新</div>
    <p>
      <code>requestAnimationFrame</code> 批次更新是關鍵。LLM 每秒可能產生 30–60 個 Token，
      如果每個 Token 都直接呼叫 <code>setValue()</code>，會觸發 30–60 次 DOM 更新。
      使用 <code>requestAnimationFrame</code> 將更新率限制在螢幕刷新率（60fps），
      實際上每個畫格最多更新一次，效能提升 3–5 倍。
    </p>
  </div>
</section>

<section id="chat-component-architecture">
  <h2>對話介面架構設計</h2>
  <p>
    一個生產級的對話介面需要精心設計的元件架構。以下展示完整的
    <code>&lt;chat-container&gt;</code> 元件，涵蓋訊息類型、自動捲動、歷史管理等核心功能。
  </p>

  <h3>訊息資料模型</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/types/chat.types.ts

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface BaseMessage {
  id: string;
  role: MessageRole;
  timestamp: Date;
  status: 'complete' | 'streaming' | 'error' | 'pending';
}

export interface TextMessage extends BaseMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
}

export interface ToolMessage extends BaseMessage {
  role: 'tool';
  toolCallId: string;
  toolName: string;
  input: Record&lt;string, unknown&gt;;
  output?: string;
  duration?: number; // ms
}

export type ChatMessage = TextMessage | ToolMessage;

export interface ConversationState {
  id: string;
  messages: ChatMessage[];
  totalTokens: number;
  estimatedCost: number;
  model: string;
  isLoading: boolean;
}
</code></pre>

  <h3>完整的 chat-container 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/chat-container.ts
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import type { ChatMessage, ConversationState } from '../types/chat.types.js';

@customElement('chat-container')
export class ChatContainer extends LitElement {
  static styles = css\`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      --chat-bg: #fff;
      --user-bubble-bg: #0084ff;
      --user-bubble-color: #fff;
      --assistant-bubble-bg: #f0f0f0;
      --assistant-bubble-color: #1a1a1a;
      --system-bubble-bg: #fffbeb;
      --tool-bubble-bg: #f0fdf4;
    }

    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      scroll-behavior: smooth;
    }

    .message-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .message-row.user { flex-direction: row-reverse; }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
      background: #e5e7eb;
    }

    .bubble {
      max-width: 72%;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      line-height: 1.6;
      font-size: 0.9375rem;
    }

    .bubble.user {
      background: var(--user-bubble-bg);
      color: var(--user-bubble-color);
      border-bottom-right-radius: 0.25rem;
    }

    .bubble.assistant {
      background: var(--assistant-bubble-bg);
      color: var(--assistant-bubble-color);
      border-bottom-left-radius: 0.25rem;
    }

    .bubble.system {
      background: var(--system-bubble-bg);
      border: 1px solid #fcd34d;
      font-size: 0.875rem;
    }

    .bubble.error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #dc2626;
    }

    .tool-card {
      background: var(--tool-bubble-bg);
      border: 1px solid #bbf7d0;
      border-radius: 0.75rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      max-width: 72%;
    }

    .tool-name {
      font-weight: 600;
      color: #16a34a;
      margin-bottom: 0.25rem;
    }

    .streaming-cursor {
      display: inline-block;
      width: 2px;
      height: 1em;
      background: currentColor;
      margin-left: 1px;
      animation: blink 0.7s step-end infinite;
      vertical-align: text-bottom;
    }

    @keyframes blink {
      50% { opacity: 0; }
    }

    .input-area {
      border-top: 1px solid #e5e7eb;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .input-textarea {
      flex: 1;
      resize: none;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      font-size: 0.9375rem;
      line-height: 1.5;
      max-height: 160px;
      overflow-y: auto;
      outline: none;
      font-family: inherit;
    }

    .input-textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .send-btn {
      padding: 0.75rem 1.25rem;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: background 0.15s;
    }

    .send-btn:hover { background: #4f46e5; }
    .send-btn:disabled { background: #a5b4fc; cursor: not-allowed; }

    .token-counter {
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: right;
      padding: 0 1rem 0.25rem;
    }
  \`;

  @property({ type: Object }) conversation!: ConversationState;
  @state() private inputText = '';
  @state() private userIsScrolling = false;
  @query('.messages-list') private messagesList!: HTMLElement;

  // 監聽使用者滾動行為
  private handleScroll = () => {
    const el = this.messagesList;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight &lt; 100;
    this.userIsScrolling = !isAtBottom;
  };

  updated(changedProps: Map&lt;string, unknown&gt;) {
    if (changedProps.has('conversation') &amp;&amp; !this.userIsScrolling) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    requestAnimationFrame(() =&gt; {
      if (this.messagesList) {
        this.messagesList.scrollTop = this.messagesList.scrollHeight;
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' &amp;&amp; !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  private sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.conversation.isLoading) return;

    this.dispatchEvent(new CustomEvent('message-send', {
      detail: { text },
      bubbles: true,
    }));
    this.inputText = '';
  }

  private renderMessage(msg: ChatMessage) {
    if (msg.role === 'tool') {
      return html\`
        &lt;div class="message-row"&gt;
          &lt;div class="tool-card"&gt;
            &lt;div class="tool-name"&gt;🔧 \${msg.toolName}&lt;/div&gt;
            &lt;div&gt;\${msg.output ?? '執行中...'}&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      \`;
    }

    const isUser = msg.role === 'user';
    const avatar = isUser ? '👤' : '🤖';
    const classes = classMap({
      bubble: true,
      [msg.role]: true,
      error: msg.status === 'error',
    });

    return html\`
      &lt;div class=\${'message-row ' + (isUser ? 'user' : '')}&gt;
        &lt;div class="avatar"&gt;\${avatar}&lt;/div&gt;
        &lt;div class=\${classes}&gt;
          \${msg.content}
          \${msg.status === 'streaming'
            ? html\`&lt;span class="streaming-cursor"&gt;&lt;/span&gt;\`
            : nothing}
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }

  render() {
    return html\`
      &lt;div
        class="messages-list"
        @scroll=\${this.handleScroll}
      &gt;
        \${repeat(
          this.conversation.messages,
          (msg) =&gt; msg.id,
          (msg) =&gt; this.renderMessage(msg)
        )}
      &lt;/div&gt;

      &lt;div class="token-counter"&gt;
        \${this.conversation.totalTokens.toLocaleString()} tokens
        ｜ 預估費用：$\${this.conversation.estimatedCost.toFixed(4)}
      &lt;/div&gt;

      &lt;div class="input-area"&gt;
        &lt;textarea
          class="input-textarea"
          placeholder="輸入訊息... (Shift+Enter 換行)"
          .value=\${this.inputText}
          @input=\${(e: InputEvent) =&gt; {
            this.inputText = (e.target as HTMLTextAreaElement).value;
          }}
          @keydown=\${this.handleKeyDown}
          rows="1"
        &gt;&lt;/textarea&gt;
        &lt;button
          class="send-btn"
          @click=\${this.sendMessage}
          ?disabled=\${this.conversation.isLoading || !this.inputText.trim()}
        &gt;
          \${this.conversation.isLoading ? '生成中...' : '發送'}
        &lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">智慧自動捲動</div>
    <p>
      <code>userIsScrolling</code> 旗標解決了一個常見的 UX 問題：
      當使用者滾動回看歷史訊息時，不應強制捲動到底部。
      只有當使用者位於底部（距底部 &lt; 100px）時，才自動跟隨新訊息捲動。
    </p>
  </div>
</section>

<section id="openai-integration">
  <h2>OpenAI API 整合：Chat Completions Streaming</h2>
  <p>
    OpenAI 的 Chat Completions API 是目前最廣泛使用的 LLM API。
    以下展示在 Lit 應用中完整整合 OpenAI 串流的生產級實作。
  </p>

  <h3>OpenAI 串流服務</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/services/openai.service.ts
import { parseSSEStream, createTextStream } from '../utils/sse-parser.js';
import type { TextMessage, ToolMessage } from '../types/chat.types.js';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamResult {
  textStream: ReadableStream&lt;string&gt;;
  abort: () =&gt; void;
  usage: Promise&lt;{ inputTokens: number; outputTokens: number }&gt;;
}

export class OpenAIService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      baseURL: 'https://api.openai.com/v1',
      maxTokens: 4096,
      temperature: 0.7,
      ...config,
    };
  }

  async streamChat(
    messages: Array&lt;{ role: string; content: string }&gt;
  ): Promise&lt;StreamResult&gt; {
    const abortController = new AbortController();
    let resolveUsage!: (usage: { inputTokens: number; outputTokens: number }) =&gt; void;
    const usagePromise = new Promise&lt;{ inputTokens: number; outputTokens: number }&gt;(
      (resolve) =&gt; { resolveUsage = resolve; }
    );

    const response = await fetch(
      \`\${this.config.baseURL}/chat/completions\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${this.config.apiKey}\`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          stream_options: { include_usage: true }, // 在串流中包含 usage 資訊
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
        signal: abortController.signal,
      }
    );

    const sseGen = parseSSEStream(response);
    const textStream = createTextStream(sseGen, (data) =&gt; {
      const parsed = JSON.parse(data) as OpenAIChunk;

      // 最後一個 chunk 包含 usage 資訊
      if (parsed.usage) {
        resolveUsage({
          inputTokens: parsed.usage.prompt_tokens,
          outputTokens: parsed.usage.completion_tokens,
        });
      }

      // 處理 finish_reason
      const choice = parsed.choices?.[0];
      if (choice?.finish_reason === 'length') {
        console.warn('回應被截斷：達到 max_tokens 限制');
      }
      if (choice?.finish_reason === 'content_filter') {
        throw new Error('內容被 OpenAI 安全過濾器攔截');
      }

      return choice?.delta?.content ?? null;
    });

    return {
      textStream,
      abort: () =&gt; abortController.abort(),
      usage: usagePromise,
    };
  }
}

interface OpenAIChunk {
  id: string;
  object: string;
  choices: Array&lt;{
    index: number;
    delta: { content?: string; role?: string };
    finish_reason: string | null;
  }&gt;;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
</code></pre>

  <h3>整合到 Lit 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/openai-chat.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { OpenAIService } from '../services/openai.service.js';
import { streamingText } from '../directives/streaming-text.directive.js';
import type { ConversationState } from '../types/chat.types.js';
import { nanoid } from 'nanoid';

@customElement('openai-chat')
export class OpenAIChat extends LitElement {
  private openai = new OpenAIService({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: 'gpt-4o',
  });

  @state() private conversation: ConversationState = {
    id: nanoid(),
    messages: [],
    totalTokens: 0,
    estimatedCost: 0,
    model: 'gpt-4o',
    isLoading: false,
  };

  private currentAbort: (() =&gt; void) | null = null;

  private async handleMessageSend(e: CustomEvent&lt;{ text: string }&gt;) {
    const userMessage = e.detail.text;

    // 加入使用者訊息
    this.conversation = {
      ...this.conversation,
      messages: [
        ...this.conversation.messages,
        {
          id: nanoid(),
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
          status: 'complete',
        },
      ],
      isLoading: true,
    };

    // 加入空白的 assistant 訊息（準備串流填充）
    const assistantMsgId = nanoid();
    this.conversation = {
      ...this.conversation,
      messages: [
        ...this.conversation.messages,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          status: 'streaming',
        },
      ],
    };

    try {
      const { textStream, abort, usage } = await this.openai.streamChat(
        this.conversation.messages
          .filter((m) =&gt; m.role !== 'tool')
          .map((m) =&gt; ({ role: m.role, content: (m as any).content }))
      );

      this.currentAbort = abort;

      // 訂閱串流，更新訊息內容
      const reader = textStream.getReader();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += value;

        // 即時更新訊息
        this.updateMessage(assistantMsgId, fullText, 'streaming');
      }

      // 串流完成
      this.updateMessage(assistantMsgId, fullText, 'complete');

      // 更新 token 計數
      const { inputTokens, outputTokens } = await usage;
      this.conversation = {
        ...this.conversation,
        totalTokens: this.conversation.totalTokens + inputTokens + outputTokens,
        estimatedCost: this.calculateCost(inputTokens, outputTokens),
        isLoading: false,
      };
    } catch (error) {
      this.updateMessage(assistantMsgId, \`發生錯誤：\${(error as Error).message}\`, 'error');
      this.conversation = { ...this.conversation, isLoading: false };
    }
  }

  private updateMessage(
    id: string,
    content: string,
    status: 'streaming' | 'complete' | 'error'
  ) {
    this.conversation = {
      ...this.conversation,
      messages: this.conversation.messages.map((m) =&gt;
        m.id === id ? { ...m, content, status } : m
      ),
    };
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // GPT-4o 定價：輸入 $2.50/1M，輸出 $10.00/1M
    const inputCost = (inputTokens / 1_000_000) * 2.50;
    const outputCost = (outputTokens / 1_000_000) * 10.00;
    return this.conversation.estimatedCost + inputCost + outputCost;
  }

  render() {
    return html\`
      &lt;chat-container
        .conversation=\${this.conversation}
        @message-send=\${this.handleMessageSend}
      &gt;&lt;/chat-container&gt;
    \`;
  }
}
</code></pre>
</section>

<section id="anthropic-claude-integration">
  <h2>Anthropic Claude API 整合</h2>
  <p>
    Anthropic 的 Claude API 使用與 OpenAI 不同的 SSE 格式，並提供獨特的
    <strong>Extended Thinking</strong> 功能，允許模型在回答前進行可見的推理過程。
  </p>

  <h3>Anthropic SSE 格式解析</h3>
  <p>Anthropic 的串流事件格式比 OpenAI 更為結構化：</p>
  <pre data-lang="text"><code class="language-text">event: message_start
data: {"type":"message_start","message":{"id":"msg_01","model":"claude-opus-4-5","usage":{"input_tokens":25}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你好"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"！"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":42}}

event: message_stop
data: {"type":"message_stop"}
</code></pre>

  <h3>Claude 串流服務（含 Extended Thinking）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/services/anthropic.service.ts

export interface ClaudeStreamEvent {
  type: 'text' | 'thinking' | 'usage' | 'error' | 'done';
  content?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export class AnthropicService {
  private apiKey: string;
  private model: string;
  private proxyURL: string;

  constructor(config: {
    apiKey?: string;
    model?: string;
    proxyURL?: string;
  }) {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'claude-opus-4-5';
    // 生產環境應透過後端 Proxy，避免在前端暴露 API Key
    this.proxyURL = config.proxyURL ?? '/api/anthropic/proxy';
  }

  async* streamChat(
    messages: Array&lt;{ role: 'user' | 'assistant'; content: string }&gt;,
    systemPrompt?: string,
    enableThinking = false
  ): AsyncGenerator&lt;ClaudeStreamEvent&gt; {
    const requestBody: Record&lt;string, unknown&gt; = {
      model: this.model,
      max_tokens: 8192,
      messages,
      stream: true,
    };

    if (systemPrompt) requestBody.system = systemPrompt;

    // Claude Extended Thinking 功能
    if (enableThinking) {
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: 10000,
      };
    }

    const response = await fetch(this.proxyURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message ?? 'Anthropic API 錯誤');
    }

    let eventType = '';

    for await (const event of this.parseAnthropicSSE(response)) {
      if (event.event) {
        eventType = event.event;
        continue;
      }

      if (!event.data) continue;

      const data = JSON.parse(event.data) as AnthropicEvent;

      switch (data.type) {
        case 'content_block_start':
          // Thinking 區塊開始
          if (data.content_block?.type === 'thinking') {
            yield { type: 'thinking', content: '' };
          }
          break;

        case 'content_block_delta':
          if (data.delta?.type === 'thinking_delta') {
            yield { type: 'thinking', content: data.delta.thinking };
          } else if (data.delta?.type === 'text_delta') {
            yield { type: 'text', content: data.delta.text };
          }
          break;

        case 'message_delta':
          if (data.usage) {
            yield {
              type: 'usage',
              outputTokens: data.usage.output_tokens,
            };
          }
          break;

        case 'message_start':
          if (data.message?.usage) {
            yield {
              type: 'usage',
              inputTokens: data.message.usage.input_tokens,
            };
          }
          break;

        case 'message_stop':
          yield { type: 'done' };
          return;
      }
    }
  }

  private async* parseAnthropicSSE(
    response: Response
  ): AsyncGenerator&lt;{ event?: string; data?: string }&gt; {
    const reader = response.body!
      .pipeThrough(new TextDecoderStream())
      .getReader();

    let buffer = '';
    let currentEvent: { event?: string; data?: string } = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line === '') {
            if (Object.keys(currentEvent).length &gt; 0) {
              yield currentEvent;
              currentEvent = {};
            }
          } else if (line.startsWith('event: ')) {
            yield { event: line.slice(7) };
          } else if (line.startsWith('data: ')) {
            currentEvent.data = line.slice(6);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

interface AnthropicEvent {
  type: string;
  content_block?: { type: string; text?: string };
  delta?: {
    type: string;
    text?: string;
    thinking?: string;
  };
  usage?: { output_tokens: number };
  message?: {
    id: string;
    usage: { input_tokens: number; output_tokens: number };
  };
}
</code></pre>

  <h3>展示 Extended Thinking 的 UI 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/thinking-block.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('thinking-block')
export class ThinkingBlock extends LitElement {
  static styles = css\`
    .thinking-container {
      border-left: 3px solid #7c3aed;
      background: #faf5ff;
      padding: 0.75rem 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.75rem;
    }

    .thinking-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .thinking-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .thinking-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #7c3aed;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .thinking-content {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #4c1d95;
      white-space: pre-wrap;
      line-height: 1.6;
      max-height: 200px;
      overflow-y: auto;
    }

    .thinking-content.collapsed { display: none; }
  \`;

  @property({ type: String }) content = '';
  @property({ type: Boolean }) isStreaming = false;
  @state() private isExpanded = true;

  render() {
    return html\`
      &lt;div class="thinking-container"&gt;
        &lt;div class="thinking-header" @click=\${() =&gt; { this.isExpanded = !this.isExpanded; }}&gt;
          \${this.isStreaming ? html\`&lt;div class="thinking-pulse"&gt;&lt;/div&gt;\` : '💭'}
          &lt;span class="thinking-label"&gt;
            \${this.isStreaming ? '推理中...' : '推理過程'}
          &lt;/span&gt;
          &lt;span&gt;\${this.isExpanded ? '▲' : '▼'}&lt;/span&gt;
        &lt;/div&gt;
        &lt;div class="thinking-content \${this.isExpanded ? '' : 'collapsed'}"&gt;
          \${this.content}
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}
</code></pre>
</section>

<section id="gemini-integration">
  <h2>Google Gemini API 整合</h2>
  <p>
    Google Gemini 支援多模態輸入（文字、圖片、影片、文件），
    並透過 REST API 或官方 SDK 提供串流功能。以下展示完整的整合方式。
  </p>

  <h3>Gemini 串流服務</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/services/gemini.service.ts

export interface GeminiPart {
  type: 'text' | 'image' | 'document';
  content: string; // text 或 base64
  mimeType?: string;
}

export class GeminiService {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-2.0-flash';
  }

  async* streamGenerateContent(
    parts: GeminiPart[],
    history: Array&lt;{ role: 'user' | 'model'; parts: GeminiPart[] }&gt; = []
  ): AsyncGenerator&lt;{ text?: string; citations?: GeminiCitation[]; done?: boolean }&gt; {
    const contents = [
      ...history.map((h) =&gt; ({
        role: h.role,
        parts: h.parts.map(this.convertPart),
      })),
      {
        role: 'user',
        parts: parts.map(this.convertPart),
      },
    ];

    const response = await fetch(
      \`\${this.baseURL}/models/\${this.model}:streamGenerateContent?key=\${this.apiKey}&alt=sse\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
          // 啟用 Grounding（Google 搜尋增強）
          tools: [{ googleSearch: {} }],
        }),
      }
    );

    const reader = response.body!
      .pipeThrough(new TextDecoderStream())
      .getReader();

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          const chunk = JSON.parse(data) as GeminiChunk;
          const candidate = chunk.candidates?.[0];

          if (!candidate) continue;

          // 提取文字內容
          for (const part of candidate.content?.parts ?? []) {
            if (part.text) {
              yield { text: part.text };
            }
          }

          // 提取 Grounding 引用
          const groundingMeta = candidate.groundingMetadata;
          if (groundingMeta?.groundingChunks?.length) {
            const citations: GeminiCitation[] = groundingMeta.groundingChunks.map(
              (chunk) =&gt; ({
                title: chunk.web?.title ?? '',
                uri: chunk.web?.uri ?? '',
              })
            );
            yield { citations };
          }

          if (candidate.finishReason === 'STOP') {
            yield { done: true };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private convertPart(part: GeminiPart): Record&lt;string, unknown&gt; {
    switch (part.type) {
      case 'text':
        return { text: part.content };
      case 'image':
        return {
          inlineData: {
            data: part.content,
            mimeType: part.mimeType ?? 'image/jpeg',
          },
        };
      case 'document':
        return {
          fileData: {
            fileUri: part.content,
            mimeType: part.mimeType ?? 'application/pdf',
          },
        };
    }
  }
}

interface GeminiChunk {
  candidates?: Array&lt;{
    content: { parts: Array&lt;{ text?: string }&gt; };
    finishReason?: string;
    groundingMetadata?: {
      groundingChunks?: Array&lt;{ web?: { title: string; uri: string } }&gt;;
    };
  }&gt;;
}

interface GeminiCitation {
  title: string;
  uri: string;
}
</code></pre>

  <h3>多模態輸入 UI（圖片 + 文字）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/multimodal-input.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { GeminiPart } from '../services/gemini.service.js';

@customElement('multimodal-input')
export class MultimodalInput extends LitElement {
  static styles = css\`
    .input-wrapper {
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      overflow: hidden;
    }

    .image-preview-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .image-preview {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0.5rem;
    }

    .remove-img {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-top: 1px solid #f3f4f6;
    }

    .attach-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
      font-size: 1.25rem;
      padding: 0.25rem;
    }
  \`;

  @state() private attachedImages: Array&lt;{ base64: string; preview: string }&gt; = [];
  @state() private text = '';

  private async handleImageDrop(e: DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []).filter(
      (f) =&gt; f.type.startsWith('image/')
    );
    await this.processImageFiles(files);
  }

  private async handleImageSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    await this.processImageFiles(files);
  }

  private async processImageFiles(files: File[]) {
    for (const file of files) {
      const base64 = await this.fileToBase64(file);
      const preview = URL.createObjectURL(file);
      this.attachedImages = [...this.attachedImages, { base64, preview }];
    }
  }

  private fileToBase64(file: File): Promise&lt;string&gt; {
    return new Promise((resolve, reject) =&gt; {
      const reader = new FileReader();
      reader.onload = () =&gt; {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // 移除 data:xxx;base64, 前綴
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private submit() {
    const parts: GeminiPart[] = [
      ...this.attachedImages.map((img) =&gt; ({
        type: 'image' as const,
        content: img.base64,
        mimeType: 'image/jpeg',
      })),
      { type: 'text' as const, content: this.text },
    ];

    this.dispatchEvent(new CustomEvent('submit', { detail: { parts } }));
    this.text = '';
    this.attachedImages = [];
  }

  render() {
    return html\`
      &lt;div
        class="input-wrapper"
        @dragover=\${(e: DragEvent) =&gt; e.preventDefault()}
        @drop=\${this.handleImageDrop}
      &gt;
        \${this.attachedImages.length &gt; 0 ? html\`
          &lt;div class="image-preview-grid"&gt;
            \${this.attachedImages.map((img, i) =&gt; html\`
              &lt;div class="image-preview"&gt;
                &lt;img src=\${img.preview} alt="附件圖片 \${i + 1}" /&gt;
                &lt;button
                  class="remove-img"
                  @click=\${() =&gt; {
                    this.attachedImages = this.attachedImages.filter((_, idx) =&gt; idx !== i);
                  }}
                &gt;✕&lt;/button&gt;
              &lt;/div&gt;
            \`)}
          &lt;/div&gt;
        \` : ''}

        &lt;textarea
          placeholder="輸入文字，或拖拽圖片到此處..."
          .value=\${this.text}
          @input=\${(e: InputEvent) =&gt; {
            this.text = (e.target as HTMLTextAreaElement).value;
          }}
        &gt;&lt;/textarea&gt;

        &lt;div class="toolbar"&gt;
          &lt;label class="attach-btn" title="附加圖片"&gt;
            📎
            &lt;input
              type="file"
              accept="image/*"
              multiple
              hidden
              @change=\${this.handleImageSelect}
            /&gt;
          &lt;/label&gt;
          &lt;button @click=\${this.submit}&gt;發送&lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}
</code></pre>
</section>

<section id="markdown-code-rendering">
  <h2>Markdown 與程式碼高亮渲染</h2>
  <p>
    LLM 的回應通常包含 Markdown 格式文字、程式碼區塊、表格等。
    如何在串流過程中正確渲染這些內容，是 AI 前端開發的核心挑戰之一。
  </p>

  <h3>安全的 Markdown 渲染策略</h3>
  <div class="callout callout-warning">
    <div class="callout-title">XSS 安全警告</div>
    <p>
      將 LLM 輸出直接插入 <code>innerHTML</code> 是嚴重的安全漏洞。
      必須使用 DOMPurify 對 HTML 進行清理，防止 XSS 攻擊。
      LLM 可能被惡意 Prompt 誘導輸出包含 <code>&lt;script&gt;</code> 的內容。
    </p>
  </div>

  <pre data-lang="typescript"><code class="language-typescript">// src/components/markdown-renderer.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// 設定帶有語法高亮的 marked renderer
const renderer = new Renderer();

renderer.code = ({ text, lang }) =&gt; {
  const validLang = lang &amp;&amp; hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language: validLang }).value;
  return \`
    &lt;div class="code-block"&gt;
      &lt;div class="code-header"&gt;
        &lt;span class="code-lang"&gt;\${validLang}&lt;/span&gt;
        &lt;button class="copy-btn" data-code="\${encodeURIComponent(text)}"&gt;複製&lt;/button&gt;
      &lt;/div&gt;
      &lt;pre&gt;&lt;code class="hljs language-\${validLang}"&gt;\${highlighted}&lt;/code&gt;&lt;/pre&gt;
    &lt;/div&gt;
  \`;
};

marked.use({ renderer });

@customElement('markdown-renderer')
export class MarkdownRenderer extends LitElement {
  // 使用 :host 使樣式能穿透 Shadow DOM（或使用 adoptedStyleSheets）
  static styles = css\`
    :host {
      display: block;
      line-height: 1.7;
    }

    .code-block {
      margin: 1rem 0;
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid #374151;
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #1f2937;
      color: #9ca3af;
      font-size: 0.8125rem;
    }

    .copy-btn {
      background: transparent;
      border: 1px solid #4b5563;
      color: #9ca3af;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .copy-btn:hover { background: #374151; }

    pre { margin: 0; }

    pre code {
      display: block;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.6;
      background: #111827;
    }

    /* 表格樣式 */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem 0.75rem;
      text-align: left;
    }

    th { background: #f9fafb; font-weight: 600; }

    /* 行內程式碼 */
    :host code:not(.hljs) {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875em;
      color: #dc2626;
    }

    blockquote {
      border-left: 4px solid #6366f1;
      margin: 0;
      padding: 0.5rem 1rem;
      background: #f5f3ff;
      border-radius: 0 0.5rem 0.5rem 0;
    }
  \`;

  @property({ type: String }) content = '';
  @property({ type: Boolean }) isStreaming = false;

  private renderMarkdown(text: string): string {
    // 串流過程中，避免渲染不完整的程式碼區塊（等待閉合）
    let processText = text;
    if (this.isStreaming) {
      const codeBlockCount = (text.match(/\`\`\`/g) ?? []).length;
      if (codeBlockCount % 2 !== 0) {
        // 奇數個 \`\`\` 意味著程式碼區塊未閉合，先閉合它再渲染
        processText = text + '\\n\`\`\`';
      }
    }

    const rawHTML = marked(processText) as string;
    // DOMPurify 清理 HTML，防止 XSS
    return DOMPurify.sanitize(rawHTML, {
      ADD_ATTR: ['data-code'], // 允許 copy-btn 的自訂屬性
    });
  }

  // 處理複製按鈕點擊（因為在 Shadow DOM 中需特殊處理）
  private handleClick(e: MouseEvent) {
    const target = (e.target as HTMLElement).closest('.copy-btn');
    if (!target) return;

    const code = decodeURIComponent(target.getAttribute('data-code') ?? '');
    navigator.clipboard.writeText(code).then(() =&gt; {
      target.textContent = '已複製！';
      setTimeout(() =&gt; { target.textContent = '複製'; }, 2000);
    });
  }

  render() {
    return html\`
      &lt;div @click=\${this.handleClick}&gt;
        \${unsafeHTML(this.renderMarkdown(this.content))}
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">串流 Markdown 渲染的技巧</div>
    <p>
      計算 <code>\`\`\`</code> 的出現次數是關鍵：奇數次意味著程式碼區塊還未閉合。
      在這種情況下，臨時補上結尾的 <code>\`\`\`</code> 再交給 marked 渲染，
      可以避免程式碼區塊渲染為純文字的醜陋效果。
    </p>
  </div>
</section>

<section id="tool-calling-ui">
  <h2>Tool Calling UI：展示 AI 工具調用過程</h2>
  <p>
    現代 LLM 支援「Function Calling」或「Tool Use」，允許 AI 呼叫外部工具
    （搜尋網路、執行程式碼、讀取文件等）。設計良好的 Tool Calling UI
    能讓使用者理解 AI 的行動，建立信任感。
  </p>

  <h3>工具執行狀態元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/tool-call-card.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type ToolStatus = 'pending' | 'running' | 'success' | 'error';

export interface ToolCallData {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  status: ToolStatus;
  input: Record&lt;string, unknown&gt;;
  output?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

@customElement('tool-call-card')
export class ToolCallCard extends LitElement {
  static styles = css\`
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      overflow: hidden;
      margin: 0.5rem 0;
      transition: border-color 0.2s;
    }

    .card.running { border-color: #6366f1; }
    .card.success { border-color: #22c55e; }
    .card.error { border-color: #ef4444; }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      user-select: none;
    }

    .header.running { background: linear-gradient(90deg, #eef2ff, #f0f9ff); }
    .header.success { background: #f0fdf4; }
    .header.error { background: #fef2f2; }

    .icon { font-size: 1.25rem; }

    .tool-info { flex: 1; }
    .tool-name { font-weight: 600; font-size: 0.9375rem; }
    .tool-desc { font-size: 0.8125rem; color: #6b7280; }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-indicator.pending { background: #d1d5db; }
    .status-indicator.running {
      background: #6366f1;
      animation: spin-ring 1s linear infinite;
      box-shadow: 0 0 0 2px #c7d2fe;
    }
    .status-indicator.success { background: #22c55e; }
    .status-indicator.error { background: #ef4444; }

    @keyframes spin-ring {
      0% { box-shadow: 0 0 0 2px #c7d2fe; }
      50% { box-shadow: 0 0 0 4px #a5b4fc; }
      100% { box-shadow: 0 0 0 2px #c7d2fe; }
    }

    .duration {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .body {
      padding: 0.75rem 1rem;
      border-top: 1px solid #f3f4f6;
      font-size: 0.875rem;
    }

    .input-section label,
    .output-section label {
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.05em;
    }

    pre.tool-data {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      overflow-x: auto;
      margin: 0.25rem 0 0.75rem;
      font-size: 0.8125rem;
    }
  \`;

  @property({ type: Object }) tool!: ToolCallData;
  @property({ type: Boolean }) expanded = false;

  private getDuration(): string {
    if (!this.tool.startTime || !this.tool.endTime) return '';
    const ms = this.tool.endTime - this.tool.startTime;
    return ms &lt; 1000 ? \`\${ms}ms\` : \`\${(ms / 1000).toFixed(1)}s\`;
  }

  render() {
    const { tool } = this;
    const statusClass = tool.status;

    return html\`
      &lt;div class="card \${statusClass}"&gt;
        &lt;div
          class="header \${statusClass}"
          @click=\${() =&gt; { this.expanded = !this.expanded; }}
        &gt;
          &lt;span class="icon"&gt;\${tool.icon}&lt;/span&gt;
          &lt;div class="tool-info"&gt;
            &lt;div class="tool-name"&gt;\${tool.displayName}&lt;/div&gt;
            &lt;div class="tool-desc"&gt;
              \${tool.status === 'pending' ? '等待執行' : ''}
              \${tool.status === 'running' ? '執行中...' : ''}
              \${tool.status === 'success' ? '執行成功' : ''}
              \${tool.status === 'error' ? tool.error ?? '執行失敗' : ''}
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;span class="duration"&gt;\${this.getDuration()}&lt;/span&gt;
          &lt;div class="status-indicator \${statusClass}"&gt;&lt;/div&gt;
          &lt;span&gt;\${this.expanded ? '▲' : '▼'}&lt;/span&gt;
        &lt;/div&gt;

        \${this.expanded ? html\`
          &lt;div class="body"&gt;
            &lt;div class="input-section"&gt;
              &lt;label&gt;輸入參數&lt;/label&gt;
              &lt;pre class="tool-data"&gt;\${JSON.stringify(tool.input, null, 2)}&lt;/pre&gt;
            &lt;/div&gt;
            \${tool.output ? html\`
              &lt;div class="output-section"&gt;
                &lt;label&gt;執行結果&lt;/label&gt;
                &lt;pre class="tool-data"&gt;\${tool.output}&lt;/pre&gt;
              &lt;/div&gt;
            \` : ''}
          &lt;/div&gt;
        \` : ''}
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <h3>工具調用序列展示</h3>
  <pre data-lang="typescript"><code class="language-typescript">// src/components/tool-timeline.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ToolCallData } from './tool-call-card.js';

// 預先定義工具的顯示資訊
const TOOL_REGISTRY: Record&lt;string, { displayName: string; icon: string }&gt; = {
  web_search: { displayName: '網路搜尋', icon: '🔍' },
  read_file: { displayName: '讀取文件', icon: '📄' },
  write_file: { displayName: '寫入文件', icon: '✏️' },
  execute_code: { displayName: '執行程式碼', icon: '⚡' },
  fetch_url: { displayName: '抓取網頁', icon: '🌐' },
  send_email: { displayName: '發送郵件', icon: '📧' },
};

@customElement('tool-timeline')
export class ToolTimeline extends LitElement {
  static styles = css\`
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }

    .timeline-item {
      position: relative;
      padding-left: 1.5rem;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: 0.4rem;
      top: 1.5rem;
      bottom: -0.5rem;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-item:last-child::before { display: none; }
  \`;

  @property({ type: Array }) tools: ToolCallData[] = [];

  render() {
    const enrichedTools = this.tools.map((tool) =&gt; ({
      ...tool,
      ...(TOOL_REGISTRY[tool.name] ?? { displayName: tool.name, icon: '🔧' }),
    }));

    return html\`
      &lt;div class="timeline"&gt;
        \${repeat(
          enrichedTools,
          (tool) =&gt; tool.id,
          (tool) =&gt; html\`
            &lt;div class="timeline-item"&gt;
              &lt;tool-call-card .tool=\${tool}&gt;&lt;/tool-call-card&gt;
            &lt;/div&gt;
          \`
        )}
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Tool Calling 的 UX 原則</div>
    <p>
      良好的工具調用 UI 遵循以下原則：（1）<strong>即時回饋</strong>——工具開始執行時立即顯示「執行中」狀態，
      不讓使用者面對空白等待；（2）<strong>透明度</strong>——展示工具的輸入和輸出，讓使用者了解 AI 的行動；
      （3）<strong>可折疊</strong>——預設折疊詳情，保持對話視覺簡潔；（4）<strong>時間標記</strong>——顯示執行時間，
      幫助使用者判斷工具效率。
    </p>
  </div>

  <h3>本章小結</h3>
  <p>
    本章涵蓋了以 Lit 打造 AI 應用前端的完整技術棧：從底層的 SSE 串流解析、
    AsyncDirective 高效渲染，到 OpenAI、Anthropic、Gemini 三大主流 API 的整合，
    再到 Markdown 安全渲染和 Tool Calling UI 的設計模式。
  </p>
  <p>
    下一章將深入探討更進階的 AI 前端模式：RAG 介面、向量搜尋視覺化和 AI Agent UI。
  </p>
</section>
`,
};
