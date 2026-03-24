import { loadChapter } from './content-loader.js';
import { setActive, updateSectionsPanelForChapter } from './nav.js';

// Hash format: #chapter-1 or #chapter-1-section-slug
const HASH_RE = /^chapter-(\d+)(?:-(.+))?$/;

let _currentChapterId = null;
let _currentSectionSlug = null;
let _sectionSyncTeardown = null;
let _suppressSectionSyncUntil = 0;

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
  _currentSectionSlug = sectionSlug;

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
      updateSectionsPanelForChapter(chapter);
      setActive(chapterId, sectionSlug);
      initSectionSync(chapterId, chapter.sections);
    } catch (err) {
      showError(err);
      return;
    }
  } else {
    suppressSectionSync();
    setActive(chapterId, sectionSlug);
  }

  // Scroll to section or top
  suppressSectionSync();
  if (sectionSlug) {
    // Small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionSlug);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  } else {
    if (window.matchMedia('(max-width: 767px)').matches) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById('content-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function initSectionSync(chapterId, sections) {
  _sectionSyncTeardown?.();

  const contentArea = document.getElementById('content-area');
  if (!contentArea || !sections?.length) return;

  const sectionElements = sections
    .map((section) => ({
      slug: section.slug,
      el: document.getElementById(section.slug),
    }))
    .filter((section) => section.el);

  if (!sectionElements.length) return;

  let rafId = 0;
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  const syncActiveSection = () => {
    if (performance.now() < _suppressSectionSyncUntil) return;

    let activeSection = sectionElements[0];

    if (isMobile()) {
      const marker = window.innerHeight * 0.28;

      for (const section of sectionElements) {
        if (section.el.getBoundingClientRect().top <= marker) {
          activeSection = section;
        } else {
          break;
        }
      }
    } else {
      const marker = contentArea.scrollTop + contentArea.clientHeight * 0.28;

      for (const section of sectionElements) {
        if (section.el.offsetTop <= marker) {
          activeSection = section;
        } else {
          break;
        }
      }
    }

    if (!activeSection || activeSection.slug === _currentSectionSlug) return;

    _currentSectionSlug = activeSection.slug;
    setActive(chapterId, activeSection.slug);
    history.replaceState(null, '', `#chapter-${chapterId}-${activeSection.slug}`);
  };

  const onScroll = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(syncActiveSection);
  };

  contentArea.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  requestAnimationFrame(syncActiveSection);

  _sectionSyncTeardown = () => {
    if (rafId) cancelAnimationFrame(rafId);
    contentArea.removeEventListener('scroll', onScroll);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

function suppressSectionSync(duration = 700) {
  _suppressSectionSyncUntil = performance.now() + duration;
}

function showLoading() {
  _sectionSyncTeardown?.();
  _sectionSyncTeardown = null;

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
