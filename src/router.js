import { loadChapter } from './content-loader.js';
import { setActive, updateSectionsPanelForChapter } from './nav.js';

// Hash format: #chapter-1 or #chapter-1-section-slug
const HASH_RE = /^chapter-(\d+)(?:-(.+))?$/;

let _currentChapterId = null;

export function initRouter() {
  window.addEventListener('hashchange', handleHash);
  handleHash();
}

async function handleHash() {
  const hash = location.hash.slice(1) || 'chapter-1';
  const match = hash.match(HASH_RE);

  if (!match) {
    location.hash = 'chapter-1';
    return;
  }

  const chapterId = parseInt(match[1], 10);
  const sectionSlug = match[2] || null;

  if (chapterId < 1 || chapterId > 22) {
    location.hash = 'chapter-1';
    return;
  }

  // Show loading state if switching chapters
  if (_currentChapterId !== chapterId) {
    showLoading();
    _currentChapterId = chapterId;

    try {
      const chapter = await loadChapter(chapterId);
      document.title = `Chapter ${chapterId} — ${chapter.title} | Lit Framework 完全指南`;
      setActive(chapterId, sectionSlug);
      updateSectionsPanelForChapter(chapter);
    } catch (err) {
      showError(err);
      return;
    }
  } else {
    setActive(chapterId, sectionSlug);
  }

  // Scroll to section or top
  if (sectionSlug) {
    // Small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionSlug);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  } else {
    document.getElementById('content-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showLoading() {
  const contentEl = document.getElementById('content-body');
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    `;
  }
}

function showError(err) {
  const contentEl = document.getElementById('content-body');
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="loading-placeholder">
        <p style="color: var(--color-inline-code-text)">載入失敗：${err.message}</p>
      </div>
    `;
  }
}

export function getCurrentChapterId() {
  return _currentChapterId;
}
