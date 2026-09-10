/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--base)',
        raised: 'var(--raised)',
        line: 'var(--line)',
        ink: {
          DEFAULT: 'var(--ink)',
          dim: 'var(--ink-dim)',
          faint: 'var(--ink-faint)',
        },
        // Стороны сохраняют канонические цвета: UI никогда не должен их объяснять.
        radiant: 'var(--radiant)',
        dire: 'var(--dire)',
      },
      fontSize: {
        // Провал между hero и lead — то, что делает главную цифру читаемой с дивана.
        hero: ['5.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        lead: ['1.25rem', { lineHeight: '1.4' }],
        body: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.75rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'lit-radiant': '0 0 40px -12px var(--radiant)',
        'lit-dire': '0 0 40px -12px var(--dire)',
      },
    },
  },
  plugins: [],
}
