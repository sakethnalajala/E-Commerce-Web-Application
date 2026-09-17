/** @type {import('tailwindcss').Config} */

/**
 * ShopSphere design tokens.
 *
 * Identity: a deep violet "iris" primary, a warm gold accent for highlights,
 * cool slate neutrals, and a deep-navy dark surface used for the hero, auth
 * panel and admin sidebar. Everything else derives from these six ramps.
 */
/** A colour that resolves through a CSS variable (RGB triplet) so it can change per theme. */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name, steps) => Object.fromEntries(steps.map((step) => [step, v(`${name}-${step}`)]));

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // The theme is a `data-theme` attribute on <html>, set before first paint
  // by the inline script in index.html and managed by ThemeContext.
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Primary — iris violet. The three tint steps follow the theme (they
        // become deep violet washes in dark mode); the rest are fixed.
        brand: {
          ...scale('brand', [50, 100, 200]),
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Accent — warm gold, used sparingly for highlights and offers
        accent: {
          ...scale('accent', [50, 100]),
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Neutrals — cool slate in light mode; the whole ramp flips in dark
        // mode so `text-ink-900` is always "strong text" and `bg-ink-50` is
        // always "a subtle surface", whatever the theme. Values live in
        // src/index.css.
        ink: { ...scale('ink', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) },
        // Dark surfaces — deep navy with a violet undertone. Dark in both
        // themes (hero, auth panel, admin sidebar), lifted slightly in dark
        // mode so they still read as distinct panels.
        night: { DEFAULT: v('night-400'), ...scale('night', [50, 100, 200, 300, 400, 500]) },
        // Page background and raised surfaces (cards, inputs, sticky bars).
        canvas: v('canvas'),
        surface: v('surface'),
        success: { ...scale('success', [50, 100]), 500: '#10b981', 600: '#059669', 700: '#047857' },
        warning: { ...scale('warning', [50, 100]), 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        danger: { ...scale('danger', [50, 100]), 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        info: { ...scale('info', [50, 100]), 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1' },
      },
      boxShadow: {
        // `--shadow` is the shadow ink: slate in light mode, near-black in dark.
        soft: '0 1px 2px 0 rgb(var(--shadow) / 0.04), 0 1px 3px 0 rgb(var(--shadow) / 0.05)',
        card: '0 1px 2px rgb(var(--shadow) / 0.04), 0 4px 16px -6px rgb(var(--shadow) / 0.08)',
        lift: '0 18px 40px -16px rgb(var(--shadow) / 0.28), 0 4px 12px -6px rgb(var(--shadow) / 0.10)',
        popover: '0 16px 48px -12px rgb(var(--shadow) / 0.30), 0 2px 8px -2px rgb(var(--shadow) / 0.10)',
        glow: '0 0 0 1px rgb(124 58 237 / 0.25), 0 14px 40px -10px rgb(124 58 237 / 0.55)',
        'glow-sm': '0 8px 24px -10px rgb(124 58 237 / 0.55)',
        'glow-gold': '0 12px 32px -10px rgb(245 158 11 / 0.55)',
        'inner-top': 'inset 0 1px 0 0 rgb(255 255 255 / 0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 45%, #4c1d95 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        'gold-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        'night-gradient': 'linear-gradient(180deg, #0b0f1a 0%, #111827 100%)',
        'shine': 'linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.35) 50%, transparent 70%)',
      },
      transitionTimingFunction: {
        // A gentle overshoot-free ease for entrances; snappy for micro-interactions.
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.3, 0.64, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.96) translateY(6px)' },
          to: { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(24px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-up-sheet': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        shine: { '100%': { backgroundPosition: '200% center' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(-3deg)' },
          '50%': { transform: 'translate3d(0,-12px,0) rotate(-2deg)' },
        },
        'aurora-a': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(6%, -8%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-4%, 6%, 0) scale(0.96)' },
        },
        'aurora-b': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(-7%, 5%, 0) scale(1.05)' },
          '66%': { transform: 'translate3d(5%, -6%, 0) scale(1.1)' },
        },
        'aurora-c': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, 8%, 0) scale(1.12)' },
        },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'pulse-soft': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
        'pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        'toast-progress': { from: { transform: 'scaleX(1)' }, to: { transform: 'scaleX(0)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-down': 'fade-down 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up-sheet': 'slide-up-sheet 0.34s cubic-bezier(0.22, 1, 0.36, 1) both',
        shine: 'shine 1.6s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'aurora-a': 'aurora-a 18s ease-in-out infinite',
        'aurora-b': 'aurora-b 22s ease-in-out infinite',
        'aurora-c': 'aurora-c 26s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        pop: 'pop 0.35s cubic-bezier(0.34, 1.3, 0.64, 1)',
        'toast-progress': 'toast-progress linear forwards',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
      maxWidth: { '8xl': '88rem' },
      spacing: { 18: '4.5rem', 22: '5.5rem' },
    },
  },
  plugins: [],
};
