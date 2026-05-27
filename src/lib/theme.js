// Theme helper — reads/writes data-theme on <html>
export function getTheme() {
  return localStorage.getItem('hf_theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('hf_theme', theme)
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

// Apply on load
applyTheme(getTheme())
