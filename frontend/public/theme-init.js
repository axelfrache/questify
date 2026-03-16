(function () {
  try {
    const storageKey = 'vite-ui-theme';
    const defaultTheme = 'system';
    const theme = localStorage.getItem(storageKey) || defaultTheme;
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  } catch (e) {}
})();
