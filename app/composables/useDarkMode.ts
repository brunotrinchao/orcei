export const useDarkMode = () => {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: 'orcei-dark-mode',
  })
  const toggle = useToggle(isDark)
  return { isDark, toggle }
}
