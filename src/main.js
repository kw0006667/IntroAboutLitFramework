import { initTheme, toggleTheme } from './theme.js';
import { initNav } from './nav.js';
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initRouter();

  // Theme toggle buttons (desktop + mobile)
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);
});
