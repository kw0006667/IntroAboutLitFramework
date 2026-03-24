# Intro About Lit Framework

這是一個以 **Lit / Web Components** 為主題的靜態文件網站，使用 **Vite** 建置，內容從 Web Components 歷史、Lit 核心機制、React 比較、SSR / Testing，到 Canvas、WebGL、WebGPU、Workers 與未來標準化趨勢，整理成 6 個 Part、22 個 Chapter。

## 專案定位

- 以章節式文件網站呈現 Lit Framework 完整學習路線。
- 適合想從前端框架脈絡理解 Lit、或想把 Lit 用在設計系統與高效能視覺應用的讀者。
- 網站內容主要位於 `src/chapters/`，導覽結構定義在 `src/chapters/index.js`。

## 開發方式

```bash
npm install
npm run dev
```

其他指令：

```bash
npm run build
npm run preview
```

## 內容架構

### Part I：基礎與背景

#### Chapter 1｜Web Components 的前世今生
- GitHub Pages 連結：[Chapter 1](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-1)
- 從 jQuery、Angular、React、Vue 的演進脈絡切入，說明 Web Components 為什麼會出現。
- 內容涵蓋框架戰爭前夜、jQuery 稱霸、SPA 崛起、Web Components 規格誕生、Polymer → LitElement → Lit 的傳承，以及原生標準的長期優勢。

#### Chapter 2｜認識 Lit：設計哲學與核心理念
- GitHub Pages 連結：[Chapter 2](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-2)
- 說明 Lit 的核心哲學是「Embrace the Platform」而非再包一層抽象。
- 內容涵蓋極簡設計、零框架鎖定、Lit 架構概覽，以及什麼場景適合採用 Lit。

#### Chapter 3｜環境建置與第一個 Lit Component
- GitHub Pages 連結：[Chapter 3](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-3)
- 從 Vite + TypeScript 工具鏈開始，帶讀者建立第一個 Lit 元件。
- 內容涵蓋前置需求、專案初始化、Custom Element、Shadow DOM、Templates、Slots 與基本開發除錯流程。

### Part II：核心機制深度解析

#### Chapter 4｜Reactive Properties 與更新週期
- GitHub Pages 連結：[Chapter 4](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-4)
- 解釋 `@property`、`@state`、屬性反射與 Lit reactive update cycle。
- 內容涵蓋 microtask queue、property options、observed attributes 與 HTML attributes 的關係。

#### Chapter 5｜lit-html 模板引擎：Tagged Template Literals 的威力
- GitHub Pages 連結：[Chapter 5](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-5)
- 聚焦 Lit 不依賴 Virtual DOM 的原因，以及 `html\`\`` 背後的模板運作方式。
- 內容涵蓋 Tagged Template Literals、Part system、binding 類型、動態模板與模板快取。

#### Chapter 6｜生命週期：從 connectedCallback 到 updateComplete
- GitHub Pages 連結：[Chapter 6](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-6)
- 梳理 Web Components 與 Lit 疊加後的完整生命週期地圖。
- 內容涵蓋 `connectedCallback`、`firstUpdated`、`updated()`、`willUpdate()` 與 `updateComplete` 的使用時機。

#### Chapter 7｜Directives：擴展模板的超能力
- GitHub Pages 連結：[Chapter 7](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-7)
- 說明 Lit directives 如何封裝複雜 DOM 操作與渲染邏輯。
- 內容涵蓋 `repeat`、`until`、`classMap`、`styleMap`、`cache`、`guard`，以及自訂 directive。

#### Chapter 8｜Context API 與跨元件通訊
- GitHub Pages 連結：[Chapter 8](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-8)
- 介紹 Lit 元件之間的通訊策略與選型方式。
- 內容涵蓋事件驅動通訊、Slots 與組合模式、`@lit/context`、Provider / Consumer 模式。

### Part III：Lit vs React — 深度比較

#### Chapter 9｜心智模型的根本差異
- GitHub Pages 連結：[Chapter 9](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-9)
- 從「元件是函數」與「元件是 DOM 節點」兩種模型切入比較 React 與 Lit。
- 內容涵蓋 Shadow DOM 對 CSS 與事件冒泡的影響、React Fiber vs Lit 更新策略、JSX vs Tagged Templates。

#### Chapter 10｜狀態管理的不同路徑
- GitHub Pages 連結：[Chapter 10](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-10)
- 比較 React 生態中的狀態模式，與 Lit 常見的狀態整合方式。
- 內容涵蓋 `useState` / `useReducer`、Lit reactive properties、MobX、Zustand、Signals 與選型指南。

#### Chapter 11｜效能剖析：Virtual DOM vs. Lit 的 Fine-grained Updates
- GitHub Pages 連結：[Chapter 11](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-11)
- 從效能角度比較 Virtual DOM 與 Lit 的 fine-grained updates。
- 內容涵蓋 benchmark 方法論、大量列表、高頻更新與 Chrome DevTools profiling。

#### Chapter 12｜互通性：在 React 應用中使用 Lit，或反之
- GitHub Pages 連結：[Chapter 12](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-12)
- 說明 Lit 與 React 在實務專案中的共存策略。
- 內容涵蓋在 React 中使用 Web Components、`@lit/react` wrapper、事件互通、微前端與漸進式遷移。

### Part IV：進階應用與架構模式

#### Chapter 13｜設計系統與 Component Library 的建構
- GitHub Pages 連結：[Chapter 13](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-13)
- 聚焦用 Lit 建立跨框架設計系統與元件庫。
- 內容涵蓋 CSS Custom Properties、Design Tokens、Storybook、版本策略與 npm 發佈實務。

#### Chapter 14｜SSR 與 Hydration：Lit 的伺服器端渲染之路
- GitHub Pages 連結：[Chapter 14](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-14)
- 說明 Lit 在伺服器端渲染與 hydration 的技術路線。
- 內容涵蓋 SSR 的必要性、Declarative Shadow DOM、`@lit-labs/ssr`、Node.js / Edge Runtime 整合與 hydration 策略。

#### Chapter 15｜Testing 策略：Web Test Runner 與 Playwright
- GitHub Pages 連結：[Chapter 15](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-15)
- 整理 Web Components / Lit 的測試實踐。
- 內容涵蓋測試金字塔、Web Test Runner 設定、元件單元測試、Shadow DOM 查詢技巧、Playwright 與 CI/CD 整合。

### Part V：高效能視覺應用場景

#### Chapter 16｜Lit 與 Image 處理：動態圖片元件的設計
- GitHub Pages 連結：[Chapter 16](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-16)
- 以圖片元件為例，展示 Lit 如何包裝常見的前端效能與體驗需求。
- 內容涵蓋 lazy loading、Intersection Observer、progressive image loading、responsive images 與 canvas 合成。

#### Chapter 17｜Canvas 深度整合：在 Lit Component 中管理 2D 繪圖生命週期
- GitHub Pages 連結：[Chapter 17](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-17)
- 說明如何把命令式 Canvas API 安全整合進 Lit 的生命週期。
- 內容涵蓋 Shadow DOM 中的 canvas、ResizeObserver、HiDPI 縮放、動畫迴圈與宣告式/命令式協調。

#### Chapter 18｜WebGL 與 Three.js：Lit 作為 3D 場景的容器
- GitHub Pages 連結：[Chapter 18](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-18)
- 用 Lit 承接 3D 場景的初始化、更新與釋放流程。
- 內容涵蓋 WebGL context lifecycle、Three.js 封裝、reactive props 驅動 3D 場景、資源清理與後處理效果。

#### Chapter 19｜WebGPU：下一代 GPU 運算與 Lit 的整合
- GitHub Pages 連結：[Chapter 19](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-19)
- 介紹 WebGPU 與 Lit 元件的結合方式。
- 內容涵蓋 WebGPU 基礎、`GPUDevice` 初始化與釋放、compute shader、render pipeline 與 GPU 影像後處理。

#### Chapter 20｜Web Workers 與 OffscreenCanvas：將運算移出主執行緒
- GitHub Pages 連結：[Chapter 20](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-20)
- 聚焦主執行緒減壓與高效能 UI 協作。
- 內容涵蓋 Workers 的適用場景、訊息協議設計、OffscreenCanvas、Lit 與 Worker 的整合模式與效能提升評估。

### Part VI：生態系與未來展望

#### Chapter 21｜Lit 生態全景：Labs、工具鏈與社群
- GitHub Pages 連結：[Chapter 21](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-21)
- 盤點 Lit 目前可用的延伸套件與社群資源。
- 內容涵蓋 `@lit-labs` / `@lit` 相關套件、Task、Motion、Virtualizer、Open Web Components 與常見工具鏈。

#### Chapter 22｜Web Components 的未來：Signals、Declarative Custom Elements 與標準化趨勢
- GitHub Pages 連結：[Chapter 22](https://kw0006667.github.io/IntroAboutLitFramework/#chapter-22)
- 從標準化與未來 API 演進角度收尾。
- 內容涵蓋 TC39 Signals、Lit 對 Signals 的整合前景、Declarative Custom Elements、CSS `@scope`、Web Components 缺口與未來十年展望。

## 專案檔案重點

- `src/chapters/index.js`：章節與 Part 導覽資料。
- `src/chapters/ch01.js` 到 `src/chapters/ch22.js`：每章實際內容。
- `src/content-loader.js`：動態載入章節內容。
- `src/nav.js`：桌面與手機版導覽。
- `src/styles/`：主題、內容、導覽與程式碼樣式。

## 適合的讀者

- 想系統化學習 Lit 與 Web Components 的前端工程師。
- 已熟悉 React / Vue，想理解 Lit 差異與遷移策略的人。
- 正在規劃設計系統、跨框架元件庫、或高效能圖形 UI 的團隊。

## 可能的參考資料連結

### Lit 與 Web Components

- Lit 官方首頁：[https://lit.dev/](https://lit.dev/)
- Lit Docs：[https://lit.dev/docs/](https://lit.dev/docs/)
- Lit Playground：[https://lit.dev/playground/](https://lit.dev/playground/)
- Web Components on MDN：[https://developer.mozilla.org/en-US/docs/Web/API/Web_components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- Custom Elements on MDN：[https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- Shadow DOM on MDN：[https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- HTML `<slot>` on MDN：[https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot)
- Open Web Components：[https://open-wc.org/](https://open-wc.org/)

### 平台 API 與基礎觀念

- CustomElementRegistry on MDN：[https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry)
- Event composed path / Shadow DOM 事件行為：[https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath)
- ResizeObserver：[https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- Intersection Observer API：[https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- Web Workers API：[https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- OffscreenCanvas：[https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)

### 工具鏈與測試

- Vite Docs：[https://vitejs.dev/](https://vitejs.dev/)
- TypeScript Docs：[https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- Storybook Docs：[https://storybook.js.org/docs](https://storybook.js.org/docs)
- Web Test Runner Docs：[https://modern-web.dev/docs/test-runner/overview/](https://modern-web.dev/docs/test-runner/overview/)
- Playwright Docs：[https://playwright.dev/docs/intro](https://playwright.dev/docs/intro)

### 視覺與圖形相關

- Canvas API：[https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- WebGL API：[https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- Three.js Docs：[https://threejs.org/docs/](https://threejs.org/docs/)
- WebGPU on MDN：[https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- WebGPU Fundamentals：[https://webgpufundamentals.org/](https://webgpufundamentals.org/)

### 規格與未來提案

- Declarative Shadow DOM 說明：[https://web.dev/articles/declarative-shadow-dom](https://web.dev/articles/declarative-shadow-dom)
- TC39 Proposals：[https://github.com/tc39/proposals](https://github.com/tc39/proposals)
- Signals 提案討論：[https://github.com/tc39/proposal-signals](https://github.com/tc39/proposal-signals)
- CSS `@scope` on MDN：[https://developer.mozilla.org/en-US/docs/Web/CSS/@scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)

## 備註

- 目前網站本身是靜態文件站，重點在知識整理與章節導覽，而不是互動式教學沙盒。
- 如果後續要擴充 README，可以再加入網站截圖、章節對應的學習路徑圖、或每章延伸閱讀清單。
