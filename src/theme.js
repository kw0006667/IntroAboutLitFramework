const STORAGE_KEY = 'lit-guide-theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = theme === 'dark' ? '☀' : '☾';
  document.querySelectorAll('.theme-icon').forEach((el) => {
    el.textContent = icon;
  });

  const lightSheet = document.getElementById('prism-theme-light');
  const darkSheet = document.getElementById('prism-theme-dark');
  if (lightSheet) lightSheet.disabled = theme === 'dark';
  if (darkSheet) darkSheet.disabled = theme !== 'dark';
}
