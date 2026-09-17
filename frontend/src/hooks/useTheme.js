import { useThemeContext } from '@/context/ThemeContext';

/** `{ theme, isDark, setTheme, toggleTheme }` for the current light/dark theme. */
const useTheme = () => useThemeContext();

export default useTheme;
