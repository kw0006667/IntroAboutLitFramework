import { chapters, getChapterById, getPartForChapter, getPrevNext } from './chapters/index.js';

const CHAPTER_MODULES = {
  1: () => import('./chapters/ch01.js'),
  2: () => import('./chapters/ch02.js'),
  3: () => import('./chapters/ch03.js'),
  4: () => import('./chapters/ch04.js'),
  5: () => import('./chapters/ch05.js'),
  6: () => import('./chapters/ch06.js'),
  7: () => import('./chapters/ch07.js'),
  8: () => import('./chapters/ch08.js'),
  9: () => import('./chapters/ch09.js'),
  10: () => import('./chapters/ch10.js'),
  11: () => import('./chapters/ch11.js'),
  12: () => import('./chapters/ch12.js'),
  13: () => import('./chapters/ch13.js'),
  14: () => import('./chapters/ch14.js'),
  15: () => import('./chapters/ch15.js'),
  16: () => import('./chapters/ch16.js'),
  17: () => import('./chapters/ch17.js'),
  18: () => import('./chapters/ch18.js'),
  19: () => import('./chapters/ch19.js'),
  20: () => import('./chapters/ch20.js'),
  21: () => import('./chapters/ch21.js'),
  22: () => import('./chapters/ch22.js'),
};

export async function loadChapter(chapterId) {
  const loader = CHAPTER_MODULES[chapterId];
  if (!loader) throw new Error(`Chapter ${chapterId} not found`);

  const mod = await loader();
  const chapter = mod.default;
  const meta = getChapterById(chapterId);
  const part = getPartForChapter(chapterId);
  const { prev, next } = getPrevNext(chapterId);

  const contentEl = document.getElementById('content-body');
  if (!contentEl) return chapter;

  // Build chapter HTML
  contentEl.innerHTML = `
    <div class="chapter-header">
      <span class="chapter-part-label">${part?.title || ''}</span>
      <h1>Chapter ${chapterId} — ${chapter.title}</h1>
      ${chapter.intro ? `<p class="chapter-intro">${chapter.intro}</p>` : ''}
    </div>
    ${chapter.content}
    ${buildNavFooter(prev, next)}
  `;

  // Add copy buttons to all code blocks
  contentEl.querySelectorAll('pre').forEach(addCopyButton);

  // Add data-lang attribute for the CSS label pseudo-element
  contentEl.querySelectorAll('pre[data-lang]').forEach((pre) => {
    // already has data-lang from the HTML
  });

  // Highlight with Prism
  if (window.Prism) {
    if (window.Prism.plugins?.autoloader) {
      window.Prism.plugins.autoloader.languages_path =
        'https://cdn.jsdelivr.net/npm/prismjs@1/components/';
    }
    window.Prism.highlightAllUnder(contentEl);
  }

  return chapter;
}

function buildNavFooter(prev, next) {
  if (!prev && !next) return '';
  const prevBtn = prev
    ? `<a href="#chapter-${prev.id}" class="chapter-nav-btn prev">
        <span class="chapter-nav-label">← 上一章</span>
        <span class="chapter-nav-title">Chapter ${prev.id} — ${prev.title}</span>
      </a>`
    : '<div></div>';
  const nextBtn = next
    ? `<a href="#chapter-${next.id}" class="chapter-nav-btn next">
        <span class="chapter-nav-label">下一章 →</span>
        <span class="chapter-nav-title">Chapter ${next.id} — ${next.title}</span>
      </a>`
    : '<div></div>';
  return `<nav class="chapter-nav-footer">${prevBtn}${nextBtn}</nav>`;
}

function addCopyButton(pre) {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = '複製';
  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = '已複製！';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '複製';
        btn.classList.remove('copied');
      }, 2000);
    } catch {
      btn.textContent = '失敗';
      setTimeout(() => { btn.textContent = '複製'; }, 2000);
    }
  });
  pre.style.position = 'relative';
  pre.appendChild(btn);
}
