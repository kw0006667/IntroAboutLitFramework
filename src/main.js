import { initTheme, toggleTheme } from './theme.js';
import { initNav } from './nav.js';
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initRouter();
  initLanguageMenus();

  // Theme toggle buttons (desktop + mobile)
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);
});

function initLanguageMenus() {
  const menus = Array.from(document.querySelectorAll('[data-language-menu]'));
  if (menus.length === 0) return;

  const closeMenu = (menu) => {
    menu.classList.remove('is-open');
    menu.querySelector('.language-menu-trigger')?.setAttribute('aria-expanded', 'false');
    menu.querySelector('.language-menu')?.setAttribute('hidden', '');
  };

  const openMenu = (menu) => {
    menus.forEach((item) => {
      if (item !== menu) closeMenu(item);
    });
    menu.classList.add('is-open');
    menu.querySelector('.language-menu-trigger')?.setAttribute('aria-expanded', 'true');
    menu.querySelector('.language-menu')?.removeAttribute('hidden');
  };

  menus.forEach((menu) => {
    const trigger = menu.querySelector('.language-menu-trigger');
    if (!trigger) return;
    if (trigger.disabled) {
      closeMenu(menu);
      return;
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      if (menu.classList.contains('is-open')) {
        closeMenu(menu);
        return;
      }

      openMenu(menu);
    });
  });

  document.addEventListener('click', (event) => {
    menus.forEach((menu) => {
      if (!menu.contains(event.target)) closeMenu(menu);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menus.forEach(closeMenu);
    }
  });
}
