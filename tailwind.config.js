/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Radiant / Dire keep their canonical sides so the UI never has to explain itself.
        radiant: { DEFAULT: '#3f9b5b', dim: '#2c6b40' },
        dire: { DEFAULT: '#c0392b', dim: '#8e2a20' },
      },
    },
  },
  plugins: [],
}
