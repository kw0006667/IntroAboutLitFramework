import { chapters, parts } from './chapters/index.js';

// Mobile state: 'closed' | 'drawer' | 'sections'
let mobileState = 'closed';
let _currentChapterId = null;
const SIDEBAR_STORAGE_KEY = 'lit-guide-sidebar-collapsed';
const DESKTOP_SECTIONS_STORAGE_KEY = 'lit-guide-desktop-sections-collapsed';

export function initNav() {
  buildSidebarNav();
  buildDrawerNav();
  initDesktopSidebarControls();
  initMobileControls();
}

// ─── Sidebar Nav (Desktop) ───

function buildSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const html = parts.map((part) => {
    const partChapters = chapters.filter((ch) => part.chapters.includes(ch.id));
    const chaptersHtml = partChapters.map(buildChapterItem).join('');
    return `
      <div class="nav-part-label">${part.title}</div>
      <ul>
        ${chaptersHtml}
      </ul>
    `;
  }).join('');

  nav.innerHTML = html;

  // Attach toggle listeners
  nav.querySelectorAll('.nav-chapter-trigger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = btn.closest('.nav-chapter');
      if (!li) return;
      const isOpen = li.classList.contains('is-open');
      // Close all
      nav.querySelectorAll('.nav-chapter').forEach((el) => el.classList.remove('is-open'));
      // Toggle current
      if (!isOpen) li.classList.add('is-open');
    });
  });
}

function buildChapterItem(chapter) {
  const sectionsHtml = chapter.sections.map((section) => `
    <li>
      <a
        href="#chapter-${chapter.id}-${section.slug}"
        class="nav-section-link"
        data-chapter="${chapter.id}"
        data-section="${section.slug}"
      >${section.title}</a>
    </li>
  `).join('');

  return `
    <li class="nav-chapter" data-chapter-id="${chapter.id}">
      <button class="nav-chapter-trigger" aria-expanded="false">
        <span class="nav-chapter-arrow">▶</span>
        <span class="nav-chapter-title">
          <span style="color: var(--color-text-muted); font-size: 0.75em; display: block; margin-bottom: 1px;">Ch.${String(chapter.id).padStart(2, '0')}</span>
          ${chapter.title}
        </span>
      </button>
      <ul class="nav-sections">
        ${sectionsHtml}
      </ul>
    </li>
  `;
}

// ─── Drawer Nav (Mobile) ───

function buildDrawerNav() {
  const nav = document.getElementById('drawer-nav');
  if (!nav) return;

  const html = parts.map((part) => {
    const partChapters = chapters.filter((ch) => part.chapters.includes(ch.id));
    const links = partChapters.map((ch) => `
      <a
        href="#chapter-${ch.id}"
        class="drawer-chapter-link"
        data-chapter="${ch.id}"
      >Ch.${String(ch.id).padStart(2, '0')} — ${ch.title}</a>
    `).join('');
    return `
      <div class="drawer-part-label">${part.title}</div>
      ${links}
    `;
  }).join('');

  nav.innerHTML = html;

  // Close drawer on chapter link click
  nav.querySelectorAll('.drawer-chapter-link').forEach((a) => {
    a.addEventListener('click', () => setMobileState('closed'));
  });
}

// ─── Active State ───

export function setActive(chapterId, sectionSlug = null) {
  _currentChapterId = chapterId;

  // Sidebar
  const sidebar = document.getElementById('sidebar-nav');
  if (sidebar) {
    // Clear active
    sidebar.querySelectorAll('.nav-chapter--active').forEach((el) =>
      el.classList.remove('nav-chapter--active')
    );
    sidebar.querySelectorAll('.nav-section-link.active').forEach((el) =>
      el.classList.remove('active')
    );

    // Set chapter active + open
    const chapterLi = sidebar.querySelector(`.nav-chapter[data-chapter-id="${chapterId}"]`);
    if (chapterLi) {
      // Close all, open this one
      sidebar.querySelectorAll('.nav-chapter').forEach((el) => el.classList.remove('is-open'));
      chapterLi.classList.add('nav-chapter--active', 'is-open');

      // Scroll chapter into view in sidebar
      setTimeout(() => {
        chapterLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }

    // Set section active
    if (sectionSlug) {
      const sectionLink = sidebar.querySelector(
        `.nav-section-link[data-chapter="${chapterId}"][data-section="${sectionSlug}"]`
      );
      if (sectionLink) {
        sectionLink.classList.add('active');
        setTimeout(() => {
          sectionLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 100);
      }
    }
  }

  // Drawer active
  const drawer = document.getElementById('drawer-nav');
  if (drawer) {
    drawer.querySelectorAll('.drawer-chapter-link.active').forEach((el) =>
      el.classList.remove('active')
    );
    const drawerLink = drawer.querySelector(`.drawer-chapter-link[data-chapter="${chapterId}"]`);
    if (drawerLink) drawerLink.classList.add('active');
  }

  // Sections panel active
  updateSectionsPanelActive(sectionSlug);
}

// ─── Sections Panel ───

export function updateSectionsPanelForChapter(chapter) {
  const nav = document.getElementById('sections-nav');
  if (!nav) return;

  const html = chapter.sections.map((section) => `
    <a
      href="#chapter-${chapter.id}-${section.slug}"
      class="panel-section-link"
      data-section="${section.slug}"
    >${section.title}</a>
  `).join('');

  nav.innerHTML = html;

  nav.querySelectorAll('.panel-section-link').forEach((a) => {
    a.addEventListener('click', () => setMobileState('closed'));
  });
}

function updateSectionsPanelActive(sectionSlug) {
  const nav = document.getElementById('sections-nav');
  if (!nav) return;
  nav.querySelectorAll('.panel-section-link.active').forEach((el) => el.classList.remove('active'));
  if (sectionSlug) {
    const link = nav.querySelector(`.panel-section-link[data-section="${sectionSlug}"]`);
    if (link) link.classList.add('active');
  }
}

// ─── Mobile Controls ───

function initDesktopSidebarControls() {
  const collapseToggle = document.getElementById('sidebar-collapse-toggle');
  const expandToggle = document.getElementById('sidebar-expand-toggle');
  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  const sectionsStored = window.localStorage.getItem(DESKTOP_SECTIONS_STORAGE_KEY);

  applyDesktopSidebarState(stored === 'true');
  applyDesktopSectionsState(sectionsStored === 'true');

  collapseToggle?.addEventListener('click', () => {
    applyDesktopSidebarState(true);
    applyDesktopSectionsState(false);
    setMobileState('closed');
  });

  expandToggle?.addEventListener('click', () => {
    applyDesktopSidebarState(false);
    applyDesktopSectionsState(false);
  });
}

function initMobileControls() {
  const hamburger = document.getElementById('hamburger');
  const drawerClose = document.getElementById('drawer-close');
  const sectionsToggle = document.getElementById('sections-toggle');
  const sectionsClose = document.getElementById('sections-close');
  const overlay = document.getElementById('overlay');

  hamburger?.addEventListener('click', () => {
    setMobileState(mobileState === 'drawer' ? 'closed' : 'drawer');
  });

  drawerClose?.addEventListener('click', () => setMobileState('closed'));
  sectionsToggle?.addEventListener('click', () => {
    if (isDesktop()) {
      applyDesktopSectionsState(false);
      return;
    }

    setMobileState(mobileState === 'sections' ? 'closed' : 'sections');
  });
  sectionsClose?.addEventListener('click', () => {
    if (isDesktop()) {
      applyDesktopSectionsState(true);
      return;
    }

    setMobileState('closed');
  });
  overlay?.addEventListener('click', () => setMobileState('closed'));
}

function setMobileState(newState) {
  if (isDesktop()) {
    newState = 'closed';
  }

  mobileState = newState;

  const drawer = document.getElementById('mobile-drawer');
  const panel = document.getElementById('sections-panel');
  const overlay = document.getElementById('overlay');
  const hamburger = document.getElementById('hamburger');
  const sectionsToggle = document.getElementById('sections-toggle');

  drawer?.classList.toggle('open', newState === 'drawer');
  drawer?.setAttribute('aria-hidden', String(newState !== 'drawer'));

  panel?.classList.toggle('open', newState === 'sections');
  panel?.setAttribute('aria-hidden', String(newState !== 'sections'));

  overlay?.classList.toggle('active', newState !== 'closed' && (!isDesktop() || document.body.classList.contains('sidebar-collapsed')));

  hamburger?.setAttribute('aria-expanded', String(newState === 'drawer'));
  sectionsToggle?.setAttribute('aria-expanded', String(newState === 'sections'));

  // Prevent body scroll when drawer/panel is open (mobile)
  document.body.style.overflow = newState !== 'closed' && !isDesktop() ? 'hidden' : '';
}

function applyDesktopSidebarState(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));

  const collapseToggle = document.getElementById('sidebar-collapse-toggle');
  const expandToggle = document.getElementById('sidebar-expand-toggle');
  const sectionsToggle = document.getElementById('sections-toggle');

  collapseToggle?.setAttribute('aria-label', collapsed ? '側欄已收起' : '收起側欄');
  collapseToggle?.setAttribute('aria-expanded', String(!collapsed));
  expandToggle?.setAttribute('aria-expanded', String(!collapsed));
  sectionsToggle?.setAttribute('aria-hidden', String(!(collapsed && document.body.classList.contains('desktop-sections-collapsed') && isDesktop())));

  if (!collapsed) {
    setMobileState('closed');
    applyDesktopSectionsState(false);
  }
}

function applyDesktopSectionsState(collapsed) {
  document.body.classList.toggle('desktop-sections-collapsed', collapsed);
  window.localStorage.setItem(DESKTOP_SECTIONS_STORAGE_KEY, String(collapsed));

  const sectionsToggle = document.getElementById('sections-toggle');
  const sectionsClose = document.getElementById('sections-close');
  const panel = document.getElementById('sections-panel');
  const shouldShowExpand = isDesktop()
    && document.body.classList.contains('sidebar-collapsed')
    && collapsed;

  sectionsToggle?.setAttribute('aria-hidden', String(!shouldShowExpand));
  sectionsToggle?.setAttribute('aria-expanded', String(!collapsed));
  sectionsClose?.setAttribute('aria-label', collapsed ? '展開章節清單' : '收起章節清單');
  panel?.setAttribute('aria-hidden', String(isDesktop() ? collapsed || !document.body.classList.contains('sidebar-collapsed') : mobileState !== 'sections'));
}

function isDesktop() {
  return window.matchMedia('(min-width: 768px)').matches;
}
