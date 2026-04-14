import { ref, onMounted, type Ref } from 'vue'

export function useTheme(): { isDark: Ref<boolean>; toggle: () => void } {
  const isDark = ref(false)

  function applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  function toggle(): void {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  onMounted(() => {
    const stored = localStorage.getItem('theme')
    isDark.value = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(isDark.value)
  })

  return { isDark, toggle }
}
