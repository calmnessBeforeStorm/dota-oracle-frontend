/**
 * Типы для `tailwind.config.js`, который импортирует только тест токенов.
 *
 * Конфиг остаётся обычным JS: его читают Tailwind, PostCSS и Vite, и переводить его в TS
 * ради одного теста значит менять то, что работает, ради того, что проверяет. Описано
 * ровно то, что тест трогает, — не весь конфиг Tailwind.
 */
declare module '*/tailwind.config.js' {
  const config: {
    theme?: {
      extend?: {
        colors?: Record<string, unknown>
        fontSize?: Record<string, unknown>
      }
    }
  }
  export default config
}
