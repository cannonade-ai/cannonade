import { ref, onMounted } from 'vue'

export function useTheme() {
  const isDark = ref(false)

  function applyTheme(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  function toggle() {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  onMounted(() => {
    const stored = localStorage.getItem('theme')
    isDark.value = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(isDark.value)
  })

  return { isDark, toggle }
}
