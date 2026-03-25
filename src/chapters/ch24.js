export default {
  id: 24,
  slug: 'chapter-24',
  title: '進階 AI 互動模式：RAG、Agent UI 與多模態輸入',
  part: 7,
  intro: '深入探討 AI 應用的進階前端模式，包括 RAG（Retrieval-Augmented Generation）的查詢介面設計、AI Agent 任務執行的視覺化追蹤、多模態輸入處理，以及如何設計能反映 AI 推理過程的透明 UI。',
  sections: [
    { slug: 'rag-ui-patterns', title: 'RAG 介面設計：來源引用與信心指標' },
    { slug: 'ai-agent-ui', title: 'AI Agent 介面：任務規劃與執行追蹤' },
    { slug: 'multimodal-input', title: '多模態輸入：圖片、語音與文件上傳' },
    { slug: 'prompt-management', title: 'Prompt 管理與模板系統' },
    { slug: 'ai-error-handling', title: 'AI 錯誤處理與重試 UX 設計' },
    { slug: 'streaming-optimizations', title: 'Streaming 優化：節流、虛擬化與效能' },
    { slug: 'ai-accessibility', title: 'AI 介面的無障礙設計' },
    { slug: 'cost-latency-monitoring', title: '成本與延遲監控：即時指標 Dashboard' },
  ],
  content: `
<section id="rag-ui-patterns">
  <h2>RAG 介面設計：來源引用與信心指標</h2>
  <p>
    RAG（Retrieval-Augmented Generation）是現代 AI 應用中最重要的架構模式之一。
    其核心流程分為三個階段：<strong>Retrieval（檢索）</strong>從向量資料庫或文件庫中找出語意相近的文件片段；
    <strong>Augmentation（增強）</strong>將檢索結果注入 System Prompt；
    <strong>Generation（生成）</strong>則讓 LLM 根據增強後的上下文產生有依據的回答。
    對前端工程師來說，設計良好的 RAG UI 必須讓使用者清楚看到「AI 說的話有哪些依據」，從而建立對 AI 回答的信任感。
  </p>
  <p>
    良好的 RAG 前端介面需要回答三個核心問題：
    這個答案來自哪裡？相關性有多高？使用者應該信任多少？
    以下我們將逐一設計能回答這三個問題的 Lit 元件。
  </p>

  <h3>來源卡片元件：<code>source-card</code></h3>
  <p>
    每個被檢索到的文件片段都應以一張「來源卡片」呈現，顯示文件標題、摘要文字，
    以及以進度條形式呈現的相關性分數（Relevance Score，通常是餘弦相似度 0–1）。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface SourceDocument {
  id: string;
  title: string;
  excerpt: string;
  url?: string;
  relevanceScore: number; // 0.0 ~ 1.0
  citationIndex: number;  // 1-based, matches inline citation [1]
}

@customElement('source-card')
export class SourceCard extends LitElement {
  static styles = css\`
    :host {
      display: block;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 8px;
      padding: 12px 16px;
      background: var(--color-surface, #fff);
      transition: box-shadow 0.2s;
    }
    :host(:hover) { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .citation-badge {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--color-primary, #3b82f6);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--color-text-primary, #1a202c);
      flex: 1;
    }
    .title a { color: inherit; text-decoration: none; }
    .title a:hover { text-decoration: underline; }
    .excerpt {
      font-size: 0.82rem;
      color: var(--color-text-secondary, #4a5568);
      line-height: 1.5;
      margin-bottom: 10px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .relevance-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: var(--color-text-secondary, #4a5568);
    }
    .relevance-bar-bg {
      flex: 1;
      height: 5px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .relevance-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, #3b82f6, #6366f1);
      transition: width 0.4s ease;
    }
  \`;

  @property({ type: Object }) source!: SourceDocument;

  render() {
    const pct = Math.round(this.source.relevanceScore * 100);
    return html\`
      &lt;div class="header"&gt;
        &lt;span class="citation-badge" aria-label="Citation \${this.source.citationIndex}"&gt;
          \${this.source.citationIndex}
        &lt;/span&gt;
        &lt;div class="title"&gt;
          \${this.source.url
            ? html\`&lt;a href="\${this.source.url}" target="_blank" rel="noopener"&gt;\${this.source.title}&lt;/a&gt;\`
            : this.source.title}
        &lt;/div&gt;
      &lt;/div&gt;
      &lt;p class="excerpt"&gt;\${this.source.excerpt}&lt;/p&gt;
      &lt;div class="relevance-row"&gt;
        &lt;span&gt;相關性&lt;/span&gt;
        &lt;div class="relevance-bar-bg" role="meter" aria-valuenow="\${pct}" aria-valuemin="0" aria-valuemax="100"&gt;
          &lt;div class="relevance-bar-fill" style="width:\${pct}%"&gt;&lt;/div&gt;
        &lt;/div&gt;
        &lt;span&gt;\${pct}%&lt;/span&gt;
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <h3>信心指標元件：<code>confidence-indicator</code></h3>
  <p>
    除了單一來源的相關性，整體回答的信心程度也應該呈現。
    信心等級通常根據最高來源相關性、來源數量及 LLM 回傳的 logprobs 計算而來。
    以下元件將信心分為三個視覺等級：低（紅）、中（黃）、高（綠）。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">type ConfidenceLevel = 'low' | 'medium' | 'high';

@customElement('confidence-indicator')
export class ConfidenceIndicator extends LitElement {
  static styles = css\`
    :host { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .low    { background: #ef4444; }
    .medium { background: #f59e0b; }
    .high   { background: #10b981; }
    .label-low    { color: #ef4444; }
    .label-medium { color: #d97706; }
    .label-high   { color: #059669; }
  \`;

  @property() level: ConfidenceLevel = 'medium';

  private get levelLabel() {
    return { low: '低信心', medium: '中等信心', high: '高信心' }[this.level];
  }

  render() {
    return html\`
      &lt;span class="dot \${this.level}" aria-hidden="true"&gt;&lt;/span&gt;
      &lt;span class="label-\${this.level}"&gt;\${this.levelLabel}&lt;/span&gt;
    \`;
  }
}
</code></pre>

  <h3>完整的 <code>rag-search-results</code> 元件</h3>
  <p>
    將上述元件組合成完整的 RAG 結果面板。面板頂部顯示 AI 回答（含行內引用標記），
    底部展示各來源卡片。若無相關來源，則顯示空白狀態提示。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">interface RagResult {
  answer: string;            // 可含 [1][2] 樣式的行內引用
  sources: SourceDocument[];
  confidence: ConfidenceLevel;
  modelId: string;
  latencyMs: number;
}

@customElement('rag-search-results')
export class RagSearchResults extends LitElement {
  static styles = css\`
    :host { display: block; max-width: 760px; }
    .answer-block {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .answer-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.78rem;
      color: #718096;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }
    .answer-text { line-height: 1.7; color: #1a202c; }
    .inline-citation {
      display: inline-block;
      background: #ebf4ff;
      color: #3b82f6;
      border-radius: 3px;
      padding: 0 4px;
      font-size: 0.78em;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
    }
    .sources-header {
      font-size: 0.85rem;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 10px;
    }
    .sources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 10px;
    }
    .no-sources {
      text-align: center;
      padding: 32px;
      color: #a0aec0;
      border: 1px dashed #cbd5e0;
      border-radius: 8px;
    }
  \`;

  @property({ type: Object }) result: RagResult | null = null;

  /** 將 [1][2] 引用標記轉換為可點擊的上標連結 */
  private renderAnswerWithCitations(text: string) {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map(part =&gt; {
      const m = part.match(/^\[(\d+)\]$/);
      if (m) {
        const idx = parseInt(m[1]);
        return html\`&lt;a class="inline-citation" href="#source-\${idx}" aria-label="來源 \${idx}"&gt;[\${idx}]&lt;/a&gt;\`;
      }
      return part;
    });
  }

  render() {
    if (!this.result) return html\`&lt;p&gt;尚無結果。&lt;/p&gt;\`;
    const { answer, sources, confidence, modelId, latencyMs } = this.result;

    return html\`
      &lt;div class="answer-block"&gt;
        &lt;div class="answer-text"&gt;\${this.renderAnswerWithCitations(answer)}&lt;/div&gt;
        &lt;div class="answer-meta"&gt;
          &lt;confidence-indicator .level="\${confidence}"&gt;&lt;/confidence-indicator&gt;
          &lt;span&gt;模型：\${modelId}&lt;/span&gt;
          &lt;span&gt;回應時間：\${latencyMs}ms&lt;/span&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      \${sources.length === 0
        ? html\`
          &lt;div class="no-sources"&gt;
            &lt;p&gt;⚠️ 未找到相關來源文件。此回答純粹基於模型訓練知識，請謹慎參考。&lt;/p&gt;
          &lt;/div&gt;\`
        : html\`
          &lt;p class="sources-header"&gt;參考來源（\${sources.length} 筆）&lt;/p&gt;
          &lt;div class="sources-grid"&gt;
            \${sources.map(s =&gt; html\`
              &lt;source-card id="source-\${s.citationIndex}" .source="\${s}"&gt;&lt;/source-card&gt;
            \`)}
          &lt;/div&gt;\`
      }
    \`;
  }
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">設計建議</div>
    <p>
      將行內引用 <code>[1]</code> 設計為錨點連結，使用者點擊後頁面捲動至對應的來源卡片，
      可以大幅提升可信度感知。研究顯示，能「追蹤來源」的 AI 介面比無來源的介面
      使用者信任度高出約 40%。
    </p>
  </div>
</section>

<section id="ai-agent-ui">
  <h2>AI Agent 介面：任務規劃與執行追蹤</h2>
  <p>
    AI Agent 系統能自動規劃多步驟任務、呼叫外部工具並反覆迭代直到完成目標。
    對前端來說，最大的挑戰是讓使用者理解「AI 正在做什麼」——可觀察性（Observability）
    是 Agent UI 的核心設計原則。優秀的 Agent UI 必須具備：即時步驟追蹤、工具呼叫詳情、
    執行時間顯示，以及使用者可隨時取消任務的控制權。
  </p>

  <h3>Agent 步驟的資料結構</h3>
  <pre data-lang="typescript"><code class="language-typescript">type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

interface AgentStep {
  id: string;
  label: string;
  status: StepStatus;
  startedAt?: number;   // timestamp ms
  finishedAt?: number;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  errorMessage?: string;
  subSteps?: AgentStep[];
}

interface AgentExecution {
  id: string;
  goal: string;
  steps: AgentStep[];
  status: 'planning' | 'running' | 'completed' | 'cancelled' | 'failed';
  startedAt: number;
}
</code></pre>

  <h3>步驟狀態圖示映射</h3>
  <p>
    每個步驟狀態都對應一個視覺符號與顏色，幫助使用者一目了然地掌握執行進度。
  </p>
  <table>
    <thead>
      <tr><th>狀態</th><th>圖示</th><th>顏色</th><th>語意</th></tr>
    </thead>
    <tbody>
      <tr><td>pending</td><td>○</td><td>#94a3b8（灰）</td><td>等待執行</td></tr>
      <tr><td>running</td><td>⟳（旋轉）</td><td>#3b82f6（藍）</td><td>執行中</td></tr>
      <tr><td>done</td><td>✓</td><td>#10b981（綠）</td><td>成功完成</td></tr>
      <tr><td>failed</td><td>✕</td><td>#ef4444（紅）</td><td>執行失敗</td></tr>
      <tr><td>skipped</td><td>—</td><td>#f59e0b（黃）</td><td>已跳過</td></tr>
    </tbody>
  </table>

  <h3>工具呼叫卡片（可折疊）</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('tool-call-card')
export class ToolCallCard extends LitElement {
  static styles = css\`
    :host { display: block; margin-top: 6px; }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      font-size: 0.82rem;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f7fafc;
      cursor: pointer;
      user-select: none;
    }
    .tool-name { font-weight: 600; color: #6366f1; }
    .toggle { margin-left: auto; color: #a0aec0; font-size: 0.7rem; }
    .body { padding: 10px 12px; border-top: 1px solid #e2e8f0; }
    .label { font-weight: 600; color: #718096; margin-bottom: 4px; margin-top: 8px; }
    .label:first-child { margin-top: 0; }
    pre {
      margin: 0;
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 8px 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.78rem;
      line-height: 1.5;
    }
  \`;

  @property({ type: Object }) step!: AgentStep;
  @property({ type: Boolean, reflect: true }) expanded = false;

  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;div class="header" @click="\${() =&gt; this.expanded = !this.expanded}"
             role="button" aria-expanded="\${this.expanded}"&gt;
          &lt;span&gt;🔧&lt;/span&gt;
          &lt;span class="tool-name"&gt;\${this.step.toolName ?? '未知工具'}&lt;/span&gt;
          &lt;span class="toggle"&gt;\${this.expanded ? '▲ 收合' : '▼ 展開'}&lt;/span&gt;
        &lt;/div&gt;
        \${this.expanded ? html\`
          &lt;div class="body"&gt;
            &lt;div class="label"&gt;輸入參數&lt;/div&gt;
            &lt;pre&gt;\${JSON.stringify(this.step.toolInput, null, 2)}&lt;/pre&gt;
            \${this.step.toolOutput !== undefined ? html\`
              &lt;div class="label"&gt;執行結果&lt;/div&gt;
              &lt;pre&gt;\${JSON.stringify(this.step.toolOutput, null, 2)}&lt;/pre&gt;\`
            : ''}
            \${this.step.errorMessage ? html\`
              &lt;div class="label" style="color:#ef4444"&gt;錯誤訊息&lt;/div&gt;
              &lt;pre style="border-left:3px solid #ef4444"&gt;\${this.step.errorMessage}&lt;/pre&gt;\`
            : ''}
          &lt;/div&gt;\`
        : ''}
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <h3>完整的 <code>agent-execution-panel</code> 元件（含 EventSource）</h3>
  <p>
    Agent 執行面板透過 Server-Sent Events（SSE）接收來自後端的即時步驟更新，
    並即時渲染進度。取消功能透過 AbortController 搭配 DELETE 請求實作。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('agent-execution-panel')
export class AgentExecutionPanel extends LitElement {
  static styles = css\`
    :host { display: block; font-family: system-ui, sans-serif; max-width: 680px; }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .goal { font-weight: 600; flex: 1; }
    .elapsed { font-size: 0.82rem; color: #718096; font-variant-numeric: tabular-nums; }
    .cancel-btn {
      padding: 4px 12px;
      border: 1px solid #ef4444;
      color: #ef4444;
      background: transparent;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .cancel-btn:hover { background: #fff5f5; }
    .steps { padding: 12px 16px; }
    .step-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .step-icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .icon-pending { background: #f1f5f9; color: #94a3b8; }
    .icon-running { background: #eff6ff; color: #3b82f6; animation: spin 1s linear infinite; }
    .icon-done    { background: #f0fdf4; color: #10b981; }
    .icon-failed  { background: #fef2f2; color: #ef4444; }
    .step-content { flex: 1; }
    .step-label { font-size: 0.88rem; font-weight: 500; }
    .step-duration { font-size: 0.75rem; color: #a0aec0; margin-top: 2px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  \`;

  @property() executionId = '';
  @property() apiBase = '/api/agent';

  @property({ type: Object, state: true })
  private execution: AgentExecution | null = null;

  private _sse: EventSource | null = null;
  private _elapsedTimer: ReturnType&lt;typeof setInterval&gt; | null = null;
  private _elapsed = 0;

  connectedCallback() {
    super.connectedCallback();
    this._startListening();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._sse?.close();
    if (this._elapsedTimer) clearInterval(this._elapsedTimer);
  }

  private _startListening() {
    this._sse = new EventSource(\`\${this.apiBase}/\${this.executionId}/stream\`);
    this._sse.addEventListener('execution', (e: MessageEvent) =&gt; {
      this.execution = JSON.parse(e.data) as AgentExecution;
    });
    this._sse.addEventListener('step', (e: MessageEvent) =&gt; {
      const step = JSON.parse(e.data) as AgentStep;
      if (!this.execution) return;
      const idx = this.execution.steps.findIndex(s =&gt; s.id === step.id);
      const steps = [...this.execution.steps];
      if (idx &gt;= 0) steps[idx] = step; else steps.push(step);
      this.execution = { ...this.execution, steps };
    });
    this._sse.addEventListener('done', () =&gt; {
      this._sse?.close();
      if (this._elapsedTimer) clearInterval(this._elapsedTimer);
    });
    this._elapsedTimer = setInterval(() =&gt; {
      this._elapsed = this.execution
        ? Math.floor((Date.now() - this.execution.startedAt) / 1000)
        : 0;
      this.requestUpdate();
    }, 1000);
  }

  private async _cancel() {
    await fetch(\`\${this.apiBase}/\${this.executionId}\`, { method: 'DELETE' });
    this._sse?.close();
  }

  private _iconClass(status: StepStatus) {
    return \`step-icon icon-\${status}\`;
  }
  private _iconChar(status: StepStatus) {
    return { pending: '○', running: '⟳', done: '✓', failed: '✕', skipped: '—' }[status];
  }
  private _durationLabel(step: AgentStep) {
    if (!step.startedAt) return '';
    const end = step.finishedAt ?? Date.now();
    return \`\${((end - step.startedAt) / 1000).toFixed(1)}s\`;
  }

  render() {
    if (!this.execution) return html\`&lt;p&gt;連接中…&lt;/p&gt;\`;
    const running = this.execution.status === 'running' || this.execution.status === 'planning';
    return html\`
      &lt;div class="panel-header"&gt;
        &lt;div class="goal"&gt;\${this.execution.goal}&lt;/div&gt;
        &lt;span class="elapsed"&gt;\${this._elapsed}s&lt;/span&gt;
        \${running
          ? html\`&lt;button class="cancel-btn" @click="\${this._cancel}"&gt;取消&lt;/button&gt;\`
          : ''}
      &lt;/div&gt;
      &lt;div class="steps"&gt;
        \${this.execution.steps.map(step =&gt; html\`
          &lt;div class="step-row"&gt;
            &lt;div class="\${this._iconClass(step.status)}" aria-label="\${step.status}"&gt;
              \${this._iconChar(step.status)}
            &lt;/div&gt;
            &lt;div class="step-content"&gt;
              &lt;div class="step-label"&gt;\${step.label}&lt;/div&gt;
              &lt;div class="step-duration"&gt;\${this._durationLabel(step)}&lt;/div&gt;
              \${step.toolName
                ? html\`&lt;tool-call-card .step="\${step}"&gt;&lt;/tool-call-card&gt;\`
                : ''}
            &lt;/div&gt;
          &lt;/div&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">長時間執行的注意事項</div>
    <p>
      當 Agent 任務預計執行超過 30 秒時，務必提供明確的「取消」按鈕，並在 UI 上顯示已耗時間。
      研究顯示，當使用者看到計時器和取消選項時，對長時間等待的忍耐度可提升約 3 倍。
      同時記得在 <code>disconnectedCallback</code> 中關閉 EventSource，避免記憶體洩漏。
    </p>
  </div>
</section>

<section id="multimodal-input">
  <h2>多模態輸入：圖片、語音與文件上傳</h2>
  <p>
    現代 LLM（如 GPT-4o、Claude 3.5）支援圖片、音訊和文件等多模態輸入。
    前端需要提供流暢的多模態輸入體驗：拖放上傳、即時預覽、格式驗證、
    大型檔案壓縮，以及語音輸入（Web Speech API）的無縫整合。
    良好的多模態 UI 讓使用者感受不到技術複雜度，只感受到表達的自由。
  </p>

  <h3>圖片壓縮（Canvas-based）</h3>
  <p>
    大多數 LLM Vision API 有圖片大小限制（如 OpenAI 的 20MB 上限，推薦 1024px 以下）。
    在上傳前使用 Canvas 進行客戶端壓縮，可以大幅降低傳輸成本並加快回應速度。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">async function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.85
): Promise&lt;Blob&gt; {
  return new Promise((resolve, reject) =&gt; {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () =&gt; {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob =&gt; blob ? resolve(blob) : reject(new Error('壓縮失敗')),
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

function validateFile(file: File): string | null {
  const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_DOC   = ['application/pdf', 'text/plain'];
  const MAX_BYTES     = 20 * 1024 * 1024; // 20 MB

  if (file.size &gt; MAX_BYTES) return \`檔案過大（最大 20MB，目前 \${(file.size/1e6).toFixed(1)}MB）\`;
  if (![...ALLOWED_IMAGE, ...ALLOWED_DOC].includes(file.type))
    return \`不支援的格式：\${file.type}\`;
  return null;
}
</code></pre>

  <h3>Web Speech API 語音輸入</h3>
  <pre data-lang="typescript"><code class="language-typescript">class VoiceInputController {
  private recognition: SpeechRecognition | null = null;
  onTranscript?: (text: string, isFinal: boolean) =&gt; void;
  onError?: (msg: string) =&gt; void;

  get isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  start(lang = 'zh-TW') {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { this.onError?.('此瀏覽器不支援語音輸入'); return; }

    this.recognition = new SR() as SpeechRecognition;
    this.recognition.lang = lang;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (e: SpeechRecognitionEvent) =&gt; {
      for (let i = e.resultIndex; i &lt; e.results.length; i++) {
        const r = e.results[i];
        this.onTranscript?.(r[0].transcript, r.isFinal);
      }
    };
    this.recognition.onerror = (e: SpeechRecognitionErrorEvent) =&gt; {
      this.onError?.(e.error === 'not-allowed' ? '請允許麥克風存取權限' : e.error);
    };
    this.recognition.start();
  }

  stop() { this.recognition?.stop(); }
}
</code></pre>

  <h3>完整的 <code>multimodal-input</code> 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">type AttachmentType = 'image' | 'pdf' | 'text';

interface Attachment {
  id: string;
  file: File;
  type: AttachmentType;
  previewUrl?: string;
  compressed?: Blob;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

@customElement('multimodal-input')
export class MultimodalInput extends LitElement {
  static styles = css\`
    :host { display: block; }
    .drop-zone {
      border: 2px dashed #cbd5e0;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      color: #a0aec0;
      transition: border-color 0.2s, background 0.2s;
      cursor: pointer;
    }
    .drop-zone.drag-over { border-color: #3b82f6; background: #eff6ff; }
    .attachments { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .attachment-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 0.8rem;
    }
    .attachment-chip img { width: 24px; height: 24px; object-fit: cover; border-radius: 3px; }
    .remove-btn { cursor: pointer; color: #a0aec0; font-size: 1rem; line-height: 1; }
    .remove-btn:hover { color: #ef4444; }
    .progress { height: 3px; background: #3b82f6; border-radius: 2px; margin-top: 2px; }
    .toolbar { display: flex; gap: 8px; margin-top: 10px; }
    .tool-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 6px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 0.82rem;
      color: #4a5568;
    }
    .tool-btn:hover { background: #f7fafc; }
    .tool-btn.recording { border-color: #ef4444; color: #ef4444; animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 50% { opacity: 0.6; } }
    .error-msg { color: #ef4444; font-size: 0.78rem; margin-top: 4px; }
  \`;

  @property({ type: Array, state: true }) private attachments: Attachment[] = [];
  @property({ type: Boolean, state: true }) private isDragOver = false;
  @property({ type: Boolean, state: true }) private isRecording = false;
  @property({ state: true }) private interimTranscript = '';

  private _voice = new VoiceInputController();
  private _fileInputRef: HTMLInputElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._voice.onTranscript = (text, isFinal) =&gt; {
      this.interimTranscript = isFinal ? '' : text;
      if (isFinal) this.dispatchEvent(new CustomEvent('voice-input', { detail: text }));
    };
    this._voice.onError = msg =&gt; alert(msg);
  }

  private async _handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const err = validateFile(file);
      const type: AttachmentType = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf' : 'text';

      const att: Attachment = {
        id: crypto.randomUUID(),
        file, type,
        previewUrl: type === 'image' ? URL.createObjectURL(file) : undefined,
        error: err ?? undefined,
      };
      this.attachments = [...this.attachments, att];
      if (err) continue;

      if (type === 'image') {
        att.compressed = await compressImage(file);
        this.attachments = this.attachments.map(a =&gt; a.id === att.id ? { ...a, compressed: att.compressed } : a);
      }
      this.dispatchEvent(new CustomEvent('attachment-added', { detail: att }));
    }
  }

  private _removeAttachment(id: string) {
    const att = this.attachments.find(a =&gt; a.id === id);
    if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
    this.attachments = this.attachments.filter(a =&gt; a.id !== id);
    this.dispatchEvent(new CustomEvent('attachment-removed', { detail: { id } }));
  }

  private _toggleVoice() {
    if (this.isRecording) {
      this._voice.stop();
      this.isRecording = false;
    } else {
      this._voice.start();
      this.isRecording = true;
    }
  }

  render() {
    return html\`
      &lt;div
        class="drop-zone \${this.isDragOver ? 'drag-over' : ''}"
        @dragover="\${(e: DragEvent) =&gt; { e.preventDefault(); this.isDragOver = true; }}"
        @dragleave="\${() =&gt; this.isDragOver = false}"
        @drop="\${(e: DragEvent) =&gt; { e.preventDefault(); this.isDragOver = false; if (e.dataTransfer?.files) this._handleFiles(e.dataTransfer.files); }}"
        @click="\${() =&gt; this._fileInputRef?.click()}"
      &gt;
        &lt;input type="file" hidden multiple accept="image/*,.pdf,.txt"
          @change="\${(e: Event) =&gt; { const inp = e.target as HTMLInputElement; if (inp.files) this._handleFiles(inp.files); }}"
          \${(el: HTMLInputElement) =&gt; { this._fileInputRef = el; }}
        /&gt;
        拖曳圖片、PDF 或文字檔案至此，或點擊上傳
      &lt;/div&gt;

      \${this.attachments.length &gt; 0 ? html\`
        &lt;div class="attachments"&gt;
          \${this.attachments.map(a =&gt; html\`
            &lt;div class="attachment-chip"&gt;
              \${a.previewUrl ? html\`&lt;img src="\${a.previewUrl}" alt="\${a.file.name}"&gt;\` : '📄'}
              &lt;span&gt;\${a.file.name}&lt;/span&gt;
              \${a.uploading ? html\`&lt;div class="progress" style="width:\${a.uploadProgress ?? 0}%"&gt;&lt;/div&gt;\` : ''}
              \${a.error ? html\`&lt;span class="error-msg"&gt;\${a.error}&lt;/span&gt;\` : ''}
              &lt;span class="remove-btn" @click="\${() =&gt; this._removeAttachment(a.id)}" role="button" aria-label="移除"&gt;×&lt;/span&gt;
            &lt;/div&gt;
          \`)}
        &lt;/div&gt;\`
      : ''}

      &lt;div class="toolbar"&gt;
        &lt;button class="tool-btn \${this.isRecording ? 'recording' : ''}" @click="\${this._toggleVoice}"&gt;
          \${this.isRecording ? '⏹ 停止錄音' : '🎤 語音輸入'}
        &lt;/button&gt;
        \${this.interimTranscript ? html\`&lt;span style="color:#94a3b8;font-size:0.8rem"&gt;\${this.interimTranscript}…&lt;/span&gt;\` : ''}
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">PDF 文字擷取</div>
    <p>
      若需要對 PDF 進行文字擷取後傳給 LLM，可使用 <code>pdfjs-dist</code> 套件：
      <code>import * as pdfjsLib from 'pdfjs-dist'</code>，
      透過 <code>pdfjsLib.getDocument(arrayBuffer)</code> 載入 PDF，
      再逐頁呼叫 <code>page.getTextContent()</code> 擷取文字內容。
      請記得設定 <code>pdfjsLib.GlobalWorkerOptions.workerSrc</code> 以避免主執行緒阻塞。
    </p>
  </div>
</section>

<section id="prompt-management">
  <h2>Prompt 管理與模板系統</h2>
  <p>
    在生產級 AI 應用中，Prompt 工程往往是影響輸出品質最關鍵的因素之一。
    良好的 Prompt 管理系統需要支援：變數插值（讓 Prompt 可複用）、
    版本控制（追蹤 Prompt 變更歷史）、A/B 測試（比較不同 Prompt 的效果），
    以及輸入安全性驗證（防止 Prompt Injection 攻擊）。
  </p>

  <h3>PromptTemplate 類別</h3>
  <p>
    使用 <code>\{\{variable\}\}</code> 語法作為佔位符，支援預設值與型別驗證。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: unknown;
  sanitize?: boolean; // 是否對此變數進行 injection 防護
}

class PromptTemplate {
  private readonly _raw: string;
  readonly id: string;
  readonly version: string;
  readonly variables: TemplateVariable[];

  constructor(config: {
    id: string;
    version: string;
    template: string;
    variables: TemplateVariable[];
  }) {
    this.id = config.id;
    this.version = config.version;
    this._raw = config.template;
    this.variables = config.variables;
  }

  /** 防止 Prompt Injection：移除可疑的指令注入字串 */
  private static sanitizeInput(value: string): string {
    return value
      .replace(/\bignore\s+(?:all\s+)?(?:previous|above)\b/gi, '[filtered]')
      .replace(/\bsystem\s*prompt\b/gi, '[filtered]')
      .replace(/\bact\s+as\b/gi, '[filtered]')
      .slice(0, 4000); // 防止超長輸入
  }

  render(vars: Record&lt;string, unknown&gt;): string {
    let result = this._raw;

    for (const varDef of this.variables) {
      const rawValue = vars[varDef.name] ?? varDef.defaultValue;
      if (rawValue === undefined && varDef.required) {
        throw new Error(\`Prompt 模板缺少必要變數：\${varDef.name}\`);
      }

      let strValue: string;
      if (varDef.type === 'array') {
        strValue = (rawValue as unknown[]).map((v, i) =&gt; \`\${i + 1}. \${v}\`).join('\\n');
      } else {
        strValue = String(rawValue ?? '');
      }

      if (varDef.sanitize) {
        strValue = PromptTemplate.sanitizeInput(strValue);
      }

      result = result.replaceAll(\`{{\${varDef.name}}}\`, strValue);
    }
    return result;
  }
}

// 使用範例
const summarizeTemplate = new PromptTemplate({
  id: 'document-summarize-v2',
  version: '2.1.0',
  template: \`你是一位專業的文件摘要助手。請用繁體中文，以不超過 {{maxWords}} 字摘要以下文件：

文件標題：{{title}}
文件內容：
{{content}}

摘要格式：{{format}}\`,
  variables: [
    { name: 'title',    type: 'string',  required: true,  sanitize: true  },
    { name: 'content',  type: 'string',  required: true,  sanitize: true  },
    { name: 'maxWords', type: 'number',  required: false, defaultValue: 200 },
    { name: 'format',   type: 'string',  required: false, defaultValue: '條列式重點' },
  ],
});

const prompt = summarizeTemplate.render({
  title: '2024 年 AI 產業報告',
  content: '...（長篇文件內容）...',
  maxWords: 150,
});
</code></pre>

  <h3><code>prompt-editor</code> 元件（含語法高亮）</h3>
  <p>
    Prompt 編輯器使用 ContentEditable + CSS 語法高亮，將 <code>\{\{variable\}\}</code>
    標記為不同顏色，讓 Prompt 工程師在編輯時一目了然。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('prompt-editor')
export class PromptEditor extends LitElement {
  static styles = css\`
    :host { display: block; }
    .editor {
      min-height: 160px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.88rem;
      line-height: 1.6;
      white-space: pre-wrap;
      outline: none;
      background: #fafafa;
    }
    .editor:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    .var-highlight {
      background: #fef3c7;
      color: #92400e;
      border-radius: 3px;
      padding: 0 2px;
      font-weight: 600;
    }
    .toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
    .version-tag {
      font-size: 0.75rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 4px;
      padding: 2px 8px;
    }
  \`;

  @property() value = '';
  @property() templateId = '';
  @property() version = '1.0.0';

  /** 高亮 {{variable}} 標記 */
  private _highlight(text: string): string {
    return text.replace(
      /\{\{(\w+)\}\}/g,
      '&lt;span class="var-highlight"&gt;{{$1}}&lt;/span&gt;'
    );
  }

  private _onInput(e: InputEvent) {
    const div = e.target as HTMLDivElement;
    this.value = div.innerText;
    this.dispatchEvent(new CustomEvent('prompt-change', { detail: this.value }));
  }

  render() {
    return html\`
      &lt;div class="toolbar"&gt;
        &lt;span&gt;模板 ID：&lt;code&gt;\${this.templateId}&lt;/code&gt;&lt;/span&gt;
        &lt;span class="version-tag"&gt;v\${this.version}&lt;/span&gt;
      &lt;/div&gt;
      &lt;div
        class="editor"
        contenteditable="true"
        spellcheck="false"
        @input="\${this._onInput}"
        .innerHTML="\${this._highlight(this.value)}"
        aria-label="Prompt 編輯器"
        role="textbox"
        aria-multiline="true"
      &gt;&lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">Prompt Injection 防護</div>
    <p>
      永遠不要直接將使用者輸入插入 System Prompt 而不做任何過濾。
      攻擊者可以輸入「Ignore all previous instructions and...」等字串來覆蓋系統指令。
      最小化的防護措施包括：過濾注入關鍵字、限制輸入長度、
      以及在 System Prompt 中明確指定模型應忽略用戶輸入中試圖修改行為的指令。
    </p>
  </div>
</section>

<section id="ai-error-handling">
  <h2>AI 錯誤處理與重試 UX 設計</h2>
  <p>
    AI API 呼叫比一般 REST API 更容易遇到各種錯誤，包括網路超時（大型回應）、
    速率限制（Rate Limit）、內容政策拒絕（Content Policy Violation），
    以及模型過載（503 Service Unavailable）。優秀的錯誤處理 UX 不僅要展示錯誤，
    更要告知使用者「需要等多久」並提供自動重試功能。
  </p>

  <h3>錯誤分類系統</h3>
  <pre data-lang="typescript"><code class="language-typescript">type AiErrorType =
  | 'network'          // fetch 失敗、DNS 錯誤
  | 'rate_limit'       // HTTP 429
  | 'content_policy'   // HTTP 400 with content_filter reason
  | 'context_length'   // 超過 token 上限
  | 'server_error'     // HTTP 5xx
  | 'auth_error'       // HTTP 401/403
  | 'timeout'          // 請求超時
  | 'unknown';

interface AiError {
  type: AiErrorType;
  message: string;
  retryAfterSec?: number;    // 來自 Retry-After header
  retryable: boolean;
  originalError?: unknown;
}

function classifyAiError(response: Response | null, err?: unknown): AiError {
  if (!response) {
    return { type: 'network', message: '網路連線失敗，請確認網路狀態', retryable: true };
  }
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60');
    return { type: 'rate_limit', message: \`請求頻率超過上限，請稍候 \${retryAfter} 秒\`, retryAfterSec: retryAfter, retryable: true };
  }
  if (response.status === 400) {
    return { type: 'content_policy', message: '輸入內容不符合使用政策，請修改後重試', retryable: false };
  }
  if (response.status === 401 || response.status === 403) {
    return { type: 'auth_error', message: 'API 金鑰無效或已過期', retryable: false };
  }
  if (response.status &gt;= 500) {
    return { type: 'server_error', message: \`伺服器暫時不可用（\${response.status}），請稍後重試\`, retryable: true };
  }
  return { type: 'unknown', message: '發生未預期的錯誤', retryable: true, originalError: err };
}
</code></pre>

  <h3>指數退避重試元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('retry-countdown')
export class RetryCountdown extends LitElement {
  static styles = css\`
    :host { display: flex; align-items: center; gap: 10px; font-size: 0.88rem; }
    .bar-bg { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: #f59e0b; border-radius: 3px; transition: width 0.1s linear; }
    .label { color: #4a5568; font-variant-numeric: tabular-nums; min-width: 60px; }
    .cancel-link { color: #3b82f6; cursor: pointer; text-decoration: underline; font-size: 0.8rem; }
  \`;

  @property({ type: Number }) totalSeconds = 30;
  @property({ state: true }) private remaining = 0;
  private _timer: ReturnType&lt;typeof setInterval&gt; | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.remaining = this.totalSeconds;
    this._timer = setInterval(() =&gt; {
      this.remaining -= 1;
      if (this.remaining &lt;= 0) {
        clearInterval(this._timer!);
        this.dispatchEvent(new CustomEvent('retry-ready'));
      }
    }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer) clearInterval(this._timer);
  }

  private _skipRetry() {
    if (this._timer) clearInterval(this._timer);
    this.dispatchEvent(new CustomEvent('retry-cancelled'));
  }

  render() {
    const pct = ((this.totalSeconds - this.remaining) / this.totalSeconds) * 100;
    return html\`
      &lt;span class="label"&gt;\${this.remaining}s 後重試&lt;/span&gt;
      &lt;div class="bar-bg"&gt;
        &lt;div class="bar-fill" style="width:\${pct}%"&gt;&lt;/div&gt;
      &lt;/div&gt;
      &lt;span class="cancel-link" @click="\${this._skipRetry}"&gt;取消&lt;/span&gt;
    \`;
  }
}

@customElement('ai-error-boundary')
export class AiErrorBoundary extends LitElement {
  static styles = css\`
    :host { display: block; }
    .error-box {
      border: 1px solid #fee2e2;
      background: #fff5f5;
      border-radius: 8px;
      padding: 16px;
      color: #991b1b;
    }
    .error-type { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #dc2626; margin-bottom: 6px; }
    .error-msg  { font-size: 0.88rem; margin-bottom: 12px; }
    .actions    { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .retry-btn  {
      padding: 6px 14px;
      background: #dc2626;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .retry-btn:disabled { background: #fca5a5; cursor: not-allowed; }
  \`;

  @property({ type: Object }) error: AiError | null = null;
  @property({ type: Number }) retryAttempt = 0;

  /** 指數退避：1s, 2s, 4s, 8s … 上限 60s */
  private get _waitSeconds(): number {
    if (this.error?.retryAfterSec) return this.error.retryAfterSec;
    return Math.min(60, Math.pow(2, this.retryAttempt));
  }

  private _onRetryReady() {
    this.dispatchEvent(new CustomEvent('retry', { detail: { attempt: this.retryAttempt + 1 } }));
  }

  render() {
    if (!this.error) return html\`&lt;slot&gt;&lt;/slot&gt;\`;

    const typeLabel: Record&lt;AiErrorType, string&gt; = {
      network: '網路錯誤', rate_limit: '請求限制', content_policy: '內容政策',
      context_length: '超過長度限制', server_error: '伺服器錯誤',
      auth_error: '認證錯誤', timeout: '請求超時', unknown: '未知錯誤',
    };

    return html\`
      &lt;div class="error-box" role="alert"&gt;
        &lt;div class="error-type"&gt;\${typeLabel[this.error.type]}&lt;/div&gt;
        &lt;div class="error-msg"&gt;\${this.error.message}&lt;/div&gt;
        &lt;div class="actions"&gt;
          \${this.error.retryable ? html\`
            &lt;retry-countdown
              .totalSeconds="\${this._waitSeconds}"
              @retry-ready="\${this._onRetryReady}"
              @retry-cancelled="\${() =&gt; this.dispatchEvent(new CustomEvent('give-up'))}"
            &gt;&lt;/retry-countdown&gt;\`
          : html\`&lt;span style="color:#718096;font-size:0.8rem"&gt;此錯誤無法自動重試，請修改輸入後再試。&lt;/span&gt;\`}
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">錯誤遙測</div>
    <p>
      建議使用 Sentry 的 <code>captureException</code> 搭配 AI 特有的 Context 資料，
      例如 <code>Sentry.setTag('ai.model', modelId)</code>、
      <code>Sentry.setExtra('ai.tokens', tokenCount)</code>，
      讓錯誤報告包含足夠的 AI 上下文，便於後續排查。
    </p>
  </div>
</section>

<section id="streaming-optimizations">
  <h2>Streaming 優化：節流、虛擬化與效能</h2>
  <p>
    LLM Streaming 每秒可能傳送 30–60 個 token，若每個 token 都觸發一次 Lit 的
    <code>requestUpdate()</code>，會造成過多的 DOM 更新，導致瀏覽器掉幀。
    同時，長對話（數十條訊息）若全部渲染在 DOM 中，也會造成記憶體壓力。
    本節介紹三種核心優化策略：節流更新、訊息視窗化，以及虛擬滾動。
  </p>

  <h3>策略一：節流 UI 更新（避免每個 Token 觸發 Re-render）</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('streaming-message')
export class StreamingMessage extends LitElement {
  static styles = css\`
    :host { display: block; }
    .cursor { display: inline-block; width: 2px; height: 1em; background: currentColor; animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }
  \`;

  @property({ state: true }) private _displayedText = '';
  private _bufferedText = '';
  private _raf: number | null = null;
  private _lastFlush = 0;
  private readonly THROTTLE_MS = 50; // 最多每 50ms 更新一次 DOM

  /** 外部呼叫：追加新的 token */
  appendToken(token: string) {
    this._bufferedText += token;
    this._scheduleFlush();
  }

  private _scheduleFlush() {
    if (this._raf !== null) return; // 已排定，不重複
    this._raf = requestAnimationFrame(() =&gt; {
      const now = performance.now();
      if (now - this._lastFlush &gt;= this.THROTTLE_MS) {
        this._displayedText = this._bufferedText;
        this._lastFlush = now;
        this._raf = null;
      } else {
        this._raf = null;
        this._scheduleFlush();
      }
    });
  }

  @property({ type: Boolean }) streaming = false;

  render() {
    return html\`
      &lt;span&gt;\${this._displayedText}&lt;/span&gt;
      \${this.streaming ? html\`&lt;span class="cursor" aria-hidden="true"&gt;&lt;/span&gt;\` : ''}
    \`;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
</code></pre>

  <h3>策略二：訊息視窗化（只渲染最近 N 則訊息）</h3>
  <pre data-lang="typescript"><code class="language-typescript">const MAX_VISIBLE_MESSAGES = 50;

@customElement('windowed-chat')
export class WindowedChat extends LitElement {
  @property({ type: Array }) messages: ChatMessage[] = [];

  /** 只渲染最後 MAX_VISIBLE_MESSAGES 則 */
  private get visibleMessages() {
    return this.messages.slice(-MAX_VISIBLE_MESSAGES);
  }

  private get hasHiddenMessages() {
    return this.messages.length &gt; MAX_VISIBLE_MESSAGES;
  }

  render() {
    return html\`
      \${this.hasHiddenMessages ? html\`
        &lt;div class="load-more" role="note"&gt;
          顯示最近 \${MAX_VISIBLE_MESSAGES} 則（共 \${this.messages.length} 則）
          &lt;button @click="\${() =&gt; this.dispatchEvent(new CustomEvent('load-all'))}"&gt;載入全部&lt;/button&gt;
        &lt;/div&gt;\`
      : ''}
      \${this.visibleMessages.map(msg =&gt; html\`&lt;chat-message .message="\${msg}"&gt;&lt;/chat-message&gt;\`)}
    \`;
  }
}
</code></pre>

  <h3>策略三：虛擬滾動（@lit-labs/virtualizer）</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 安裝：npm install @lit-labs/virtualizer
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';
import { LitVirtualizer } from '@lit-labs/virtualizer';

// 確保自定義元素已註冊
customElements.define('lit-virtualizer', LitVirtualizer);

@customElement('virtual-chat-list')
export class VirtualChatList extends LitElement {
  static styles = css\`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    lit-virtualizer { flex: 1; }
  \`;

  @property({ type: Array }) messages: ChatMessage[] = [];

  render() {
    return html\`
      &lt;lit-virtualizer
        .items="\${this.messages}"
        .renderItem="\${(msg: ChatMessage) =&gt; html\`
          &lt;chat-message .message="\${msg}" style="contain: content"&gt;&lt;/chat-message&gt;
        \`}"
        scroller
      &gt;&lt;/lit-virtualizer&gt;
    \`;
  }
}
</code></pre>

  <h3>Streaming 中斷與恢復</h3>
  <pre data-lang="typescript"><code class="language-typescript">class ResumableStreamReader {
  private _reader: ReadableStreamDefaultReader&lt;string&gt; | null = null;
  private _accumulated = '';
  private _abortCtrl = new AbortController();

  async start(url: string, body: object, onChunk: (text: string) =&gt; void) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: this._abortCtrl.signal,
    });
    const reader = resp.body!.pipeThrough(new TextDecoderStream()).getReader();
    this._reader = reader;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        this._accumulated += value;
        onChunk(value);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') throw e;
    }
  }

  abort() { this._abortCtrl.abort(); }

  /** 恢復時傳入已接收的字數，後端需支援 Range-like 恢復機制 */
  get accumulatedLength() { return this._accumulated.length; }
}
</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">效能剖析技巧</div>
    <p>
      在 Chrome DevTools 的 Performance 面板中，使用 <code>performance.mark('stream-start')</code>
      與 <code>performance.measure('stream-duration', 'stream-start')</code>
      標記 Streaming 的開始與結束，可以清楚看到 Long Tasks 是否發生在 token 處理期間。
      理想情況下，每幀的 JavaScript 執行時間應低於 5ms。
    </p>
  </div>
</section>

<section id="ai-accessibility">
  <h2>AI 介面的無障礙設計</h2>
  <p>
    AI 聊天介面對無障礙設計提出了特殊挑戰：Streaming 文字會持續更新 DOM，
    若處理不當，螢幕閱讀器可能每個 token 都播報一次，造成使用者困擾。
    優秀的 AI 無障礙設計應批次播報（每個句子播報一次，而非每個 token）、
    提供暫停/繼續控制，以及完整的鍵盤快捷鍵支援。
  </p>

  <h3>批次 aria-live 播報策略</h3>
  <p>
    將 <code>aria-live="polite"</code> 區域的更新限制為每個句子（句號/問號/驚嘆號）才觸發，
    避免螢幕閱讀器被頻繁的 token 更新打斷。
  </p>
  <pre data-lang="typescript"><code class="language-typescript">class AriaLiveThrottler {
  private _liveRegion: HTMLElement;
  private _buffer = '';
  private _timer: ReturnType&lt;typeof setTimeout&gt; | null = null;
  private readonly SENTENCE_ENDINGS = /[。！？.!?]/;

  constructor(container: HTMLElement) {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.setAttribute('aria-atomic', 'false');
    this._liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
    container.appendChild(this._liveRegion);
  }

  append(token: string) {
    this._buffer += token;
    // 若緩衝區有句子結尾，立即播報
    if (this.SENTENCE_ENDINGS.test(token)) {
      this._flush();
    } else {
      // 否則最多等 800ms 後播報（避免長句永遠不播報）
      if (!this._timer) {
        this._timer = setTimeout(() =&gt; this._flush(), 800);
      }
    }
  }

  private _flush() {
    if (!this._buffer) return;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._liveRegion.textContent = this._buffer;
    this._buffer = '';
  }

  destroy() {
    this._liveRegion.remove();
    if (this._timer) clearTimeout(this._timer);
  }
}
</code></pre>

  <h3>完整的無障礙 <code>chat-message</code> 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('chat-message')
export class ChatMessage extends LitElement {
  static styles = css\`
    :host { display: block; padding: 12px 0; }
    .wrapper { display: flex; gap: 12px; align-items: flex-start; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0;
    }
    .avatar-user { background: #dbeafe; }
    .avatar-ai   { background: #d1fae5; }
    .bubble { flex: 1; }
    .bubble-text { line-height: 1.7; }
    .meta {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.75rem; color: #a0aec0; margin-top: 6px;
    }
    .skip-link {
      position: absolute;
      left: -9999px;
      background: #3b82f6; color: #fff;
      padding: 4px 8px; border-radius: 4px;
      font-size: 0.78rem;
    }
    .skip-link:focus { left: auto; position: static; }
    /* 高對比模式 */
    @media (forced-colors: active) {
      .bubble-text { forced-color-adjust: auto; }
      .avatar { border: 2px solid ButtonText; }
    }
    /* 使用者偏好：減少動畫 */
    @media (prefers-reduced-motion: reduce) {
      .cursor { animation: none; opacity: 1; }
    }
  \`;

  @property({ type: Object }) message!: ChatMessage;
  @property({ type: Boolean }) streaming = false;

  private _ariaThrottler?: AriaLiveThrottler;

  connectedCallback() {
    super.connectedCallback();
    if (this.streaming) {
      this._ariaThrottler = new AriaLiveThrottler(this.shadowRoot! as unknown as HTMLElement);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._ariaThrottler?.destroy();
  }

  render() {
    const isAi = this.message.role === 'assistant';
    return html\`
      &lt;!-- 讓使用者可以跳過長段 AI 回應 --&gt;
      \${isAi && this.message.content.length &gt; 500 ? html\`
        &lt;a class="skip-link" href="#after-message-\${this.message.id}"&gt;跳過此回應&lt;/a&gt;\`
      : ''}

      &lt;article
        class="wrapper"
        aria-label="\${isAi ? 'AI 助理' : '您'}的訊息"
        role="article"
      &gt;
        &lt;div class="avatar \${isAi ? 'avatar-ai' : 'avatar-user'}" aria-hidden="true"&gt;
          \${isAi ? '🤖' : '👤'}
        &lt;/div&gt;
        &lt;div class="bubble"&gt;
          &lt;div
            class="bubble-text"
            aria-live="\${this.streaming ? 'off' : 'polite'}"
          &gt;
            \${this.message.content}
            \${this.streaming ? html\`&lt;span class="cursor" aria-hidden="true"&gt;&lt;/span&gt;\` : ''}
          &lt;/div&gt;
          &lt;div class="meta"&gt;
            &lt;time datetime="\${new Date(this.message.timestamp).toISOString()}"&gt;
              \${new Date(this.message.timestamp).toLocaleTimeString('zh-TW')}
            &lt;/time&gt;
            \${isAi && this.message.modelId ? html\`&lt;span&gt;\${this.message.modelId}&lt;/span&gt;\` : ''}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/article&gt;
      &lt;div id="after-message-\${this.message.id}" tabindex="-1"&gt;&lt;/div&gt;
    \`;
  }
}
</code></pre>

  <h3>鍵盤快捷鍵</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('chat-keyboard-handler')
export class ChatKeyboardHandler extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKey);
  }

  private _handleKey = (e: KeyboardEvent) =&gt; {
    // Ctrl+Enter 或 Cmd+Enter：送出訊息
    if ((e.ctrlKey || e.metaKey) &amp;&amp; e.key === 'Enter') {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('send-message', { bubbles: true, composed: true }));
    }
    // Escape：取消 Streaming
    if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('cancel-stream', { bubbles: true, composed: true }));
    }
    // Alt+N：跳至下一條訊息
    if (e.altKey &amp;&amp; e.key === 'n') {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('next-message', { bubbles: true, composed: true }));
    }
  };

  render() { return html\`&lt;slot&gt;&lt;/slot&gt;\`; }
}
</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">無障礙測試工具</div>
    <p>
      使用 NVDA（Windows）或 VoiceOver（macOS）手動測試 Streaming 播報行為，
      確認螢幕閱讀器的播報頻率和內容是否合適。
      自動化測試可使用 <code>@axe-core/playwright</code> 在 CI 中掃描 WCAG 2.1 AA 違規。
    </p>
  </div>
</section>

<section id="cost-latency-monitoring">
  <h2>成本與延遲監控：即時指標 Dashboard</h2>
  <p>
    AI API 費用是生產環境中不可忽視的運營成本。GPT-4o 每百萬輸入 token 約 $5 美元，
    Claude 3.5 Sonnet 約 $3 美元。在沒有監控的情況下，一個 Bug 可能造成無限迴圈呼叫，
    在幾小時內消耗數千美元。前端監控 Dashboard 需要追蹤：
    token 用量、成本估算、首字延遲（TTFT）、請求成功率，以及費用預警。
  </p>

  <h3>指標資料結構</h3>
  <pre data-lang="typescript"><code class="language-typescript">interface RequestMetrics {
  id: string;
  timestamp: number;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  ttftMs: number;        // Time-to-First-Token
  totalMs: number;       // 總回應時間
  success: boolean;
  errorType?: AiErrorType;
}

interface CostConfig {
  inputPricePerMToken:  number;  // $ per 1M tokens
  outputPricePerMToken: number;
}

const MODEL_COSTS: Record&lt;string, CostConfig&gt; = {
  'gpt-4o':               { inputPricePerMToken: 5.00,  outputPricePerMToken: 15.00 },
  'gpt-4o-mini':          { inputPricePerMToken: 0.15,  outputPricePerMToken: 0.60  },
  'claude-3-5-sonnet':    { inputPricePerMToken: 3.00,  outputPricePerMToken: 15.00 },
  'claude-3-5-haiku':     { inputPricePerMToken: 0.80,  outputPricePerMToken: 4.00  },
};

function calcCost(metrics: RequestMetrics): number {
  const cost = MODEL_COSTS[metrics.modelId];
  if (!cost) return 0;
  return (
    (metrics.inputTokens  / 1_000_000) * cost.inputPricePerMToken +
    (metrics.outputTokens / 1_000_000) * cost.outputPricePerMToken
  );
}
</code></pre>

  <h3>Canvas Sparkline 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('metric-sparkline')
export class MetricSparkline extends LitElement {
  static styles = css\`
    canvas { display: block; width: 100%; height: 40px; }
  \`;

  @property({ type: Array }) data: number[] = [];
  @property() color = '#3b82f6';
  @property({ type: Number }) alertThreshold?: number;

  private _canvas?: HTMLCanvasElement;

  updated() {
    this._canvas = this.shadowRoot?.querySelector('canvas') ?? undefined;
    this._draw();
  }

  private _draw() {
    if (!this._canvas || this.data.length &lt; 2) return;
    const canvas = this._canvas;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const max = Math.max(...this.data, this.alertThreshold ?? 0, 1);
    const step = W / (this.data.length - 1);

    ctx.beginPath();
    this.data.forEach((v, i) =&gt; {
      const x = i * step;
      const y = H - (v / max) * H * 0.9;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 填充漸層
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, this.color + '33');
    grad.addColorStop(1, this.color + '00');
    ctx.fillStyle = grad;
    ctx.fill();

    // 警戒線
    if (this.alertThreshold !== undefined) {
      const ty = H - (this.alertThreshold / max) * H * 0.9;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, ty); ctx.lineTo(W, ty);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  render() { return html\`&lt;canvas aria-hidden="true"&gt;&lt;/canvas&gt;\`; }
}
</code></pre>

  <h3>完整的 <code>metrics-dashboard</code> 元件</h3>
  <pre data-lang="typescript"><code class="language-typescript">@customElement('metrics-dashboard')
export class MetricsDashboard extends LitElement {
  static styles = css\`
    :host { display: block; font-family: system-ui, sans-serif; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }
    .card-label { font-size: 0.75rem; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .card-value { font-size: 1.6rem; font-weight: 700; color: #1a202c; font-variant-numeric: tabular-nums; }
    .card-unit  { font-size: 0.85rem; color: #a0aec0; margin-left: 4px; }
    .card.alert { border-color: #fca5a5; background: #fff5f5; }
    .card.alert .card-value { color: #dc2626; }
    .chart-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .chart-title { font-size: 0.85rem; font-weight: 600; color: #4a5568; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 20px; }
    th { text-align: left; padding: 8px 12px; background: #f7fafc; color: #4a5568; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-variant-numeric: tabular-nums; }
    .success { color: #10b981; } .failure { color: #ef4444; }
    .budget-bar-bg  { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .budget-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  \`;

  @property({ type: Array }) recentMetrics: RequestMetrics[] = [];
  @property({ type: Number }) dailyBudgetUsd = 10;

  private get _totalCostToday(): number {
    return this.recentMetrics.reduce((sum, m) =&gt; sum + calcCost(m), 0);
  }
  private get _avgTtft(): number {
    const ok = this.recentMetrics.filter(m =&gt; m.success);
    if (!ok.length) return 0;
    return ok.reduce((s, m) =&gt; s + m.ttftMs, 0) / ok.length;
  }
  private get _totalTokens(): number {
    return this.recentMetrics.reduce((s, m) =&gt; s + m.inputTokens + m.outputTokens, 0);
  }
  private get _successRate(): number {
    if (!this.recentMetrics.length) return 100;
    return (this.recentMetrics.filter(m =&gt; m.success).length / this.recentMetrics.length) * 100;
  }
  private get _latencySeries(): number[] {
    return this.recentMetrics.slice(-20).map(m =&gt; m.ttftMs);
  }
  private get _costSeries(): number[] {
    return this.recentMetrics.slice(-20).map(m =&gt; calcCost(m) * 100);
  }

  render() {
    const costToday  = this._totalCostToday;
    const overBudget = costToday &gt; this.dailyBudgetUsd;
    const budgetPct  = Math.min(100, (costToday / this.dailyBudgetUsd) * 100);

    return html\`
      &lt;div class="grid"&gt;
        &lt;div class="card \${overBudget ? 'alert' : ''}"&gt;
          &lt;div class="card-label"&gt;今日費用&lt;/div&gt;
          &lt;div class="card-value"&gt;$\${costToday.toFixed(4)}&lt;span class="card-unit"&gt;USD&lt;/span&gt;&lt;/div&gt;
          &lt;div class="budget-bar-bg"&gt;
            &lt;div class="budget-bar-fill"
              style="width:\${budgetPct}%;background:\${overBudget ? '#ef4444' : '#3b82f6'}"&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;div style="font-size:0.75rem;color:#a0aec0;margin-top:4px"&gt;預算 $\${this.dailyBudgetUsd} / 日&lt;/div&gt;
        &lt;/div&gt;

        &lt;div class="card"&gt;
          &lt;div class="card-label"&gt;平均首字延遲（TTFT）&lt;/div&gt;
          &lt;div class="card-value"&gt;\${Math.round(this._avgTtft)}&lt;span class="card-unit"&gt;ms&lt;/span&gt;&lt;/div&gt;
        &lt;/div&gt;

        &lt;div class="card"&gt;
          &lt;div class="card-label"&gt;Token 總用量&lt;/div&gt;
          &lt;div class="card-value"&gt;\${(this._totalTokens / 1000).toFixed(1)}&lt;span class="card-unit"&gt;K&lt;/span&gt;&lt;/div&gt;
        &lt;/div&gt;

        &lt;div class="card"&gt;
          &lt;div class="card-label"&gt;成功率&lt;/div&gt;
          &lt;div class="card-value" style="color:\${this._successRate &lt; 95 ? '#ef4444' : '#10b981'}"&gt;
            \${this._successRate.toFixed(1)}&lt;span class="card-unit"&gt;%&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div class="chart-section"&gt;
        &lt;div class="chart-title"&gt;首字延遲趨勢（最近 20 次請求，ms）&lt;/div&gt;
        &lt;metric-sparkline .data="\${this._latencySeries}" color="#3b82f6" .alertThreshold="\${2000}"&gt;&lt;/metric-sparkline&gt;
      &lt;/div&gt;

      &lt;table&gt;
        &lt;thead&gt;
          &lt;tr&gt;
            &lt;th&gt;時間&lt;/th&gt;&lt;th&gt;模型&lt;/th&gt;&lt;th&gt;輸入 Token&lt;/th&gt;&lt;th&gt;輸出 Token&lt;/th&gt;&lt;th&gt;費用&lt;/th&gt;&lt;th&gt;TTFT&lt;/th&gt;&lt;th&gt;狀態&lt;/th&gt;
          &lt;/tr&gt;
        &lt;/thead&gt;
        &lt;tbody&gt;
          \${this.recentMetrics.slice(-10).reverse().map(m =&gt; html\`
            &lt;tr&gt;
              &lt;td&gt;\${new Date(m.timestamp).toLocaleTimeString('zh-TW')}&lt;/td&gt;
              &lt;td&gt;\${m.modelId}&lt;/td&gt;
              &lt;td&gt;\${m.inputTokens.toLocaleString()}&lt;/td&gt;
              &lt;td&gt;\${m.outputTokens.toLocaleString()}&lt;/td&gt;
              &lt;td&gt;$\${calcCost(m).toFixed(5)}&lt;/td&gt;
              &lt;td&gt;\${m.ttftMs}ms&lt;/td&gt;
              &lt;td class="\${m.success ? 'success' : 'failure'}"&gt;\${m.success ? '✓' : '✕'}&lt;/td&gt;
            &lt;/tr&gt;
          \`)}
        &lt;/tbody&gt;
      &lt;/table&gt;
    \`;
  }
}
</code></pre>

  <h3>OpenTelemetry 整合</h3>
  <pre data-lang="typescript"><code class="language-typescript">// 安裝：npm install @opentelemetry/sdk-trace-web @opentelemetry/exporter-otlp-http
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const provider = new WebTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(new OTLPTraceExporter({ url: '/v1/traces' }))
);
provider.register();

const tracer = trace.getTracer('ai-chat-app', '1.0.0');

async function tracedAiRequest(
  prompt: string,
  modelId: string,
  handler: () =&gt; Promise&lt;RequestMetrics&gt;
): Promise&lt;RequestMetrics&gt; {
  const span = tracer.startSpan('ai.chat_completion', {
    attributes: {
      'ai.model_id': modelId,
      'ai.prompt_length': prompt.length,
    },
  });

  try {
    const metrics = await handler();
    span.setAttributes({
      'ai.input_tokens':  metrics.inputTokens,
      'ai.output_tokens': metrics.outputTokens,
      'ai.ttft_ms':       metrics.ttftMs,
      'ai.total_ms':      metrics.totalMs,
    });
    span.setStatus({ code: SpanStatusCode.OK });
    return metrics;
  } catch (err) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
    throw err;
  } finally {
    span.end();
  }
}
</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">費用警戒建議</div>
    <p>
      建議設定雙重警戒機制：前端 Dashboard 在當日費用超過預算 80% 時顯示橘色警告，
      超過 100% 時顯示紅色並停用新請求；後端則設定 API 提供商的「硬性費用上限」
      （Hard Limit）作為最後防線，確保即使前端程式碼有 Bug 也不會造成無限超支。
    </p>
  </div>
</section>
`,
};
