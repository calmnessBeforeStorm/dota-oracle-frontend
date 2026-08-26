import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        // Recharts alone is most of the bundle; keeping it out of the entry chunk
        // means the live feed paints without waiting for the charting library.
        manualChunks: {
          charts: ['recharts'],
          vendor: ['react', 'react-dom', '@tanstack/react-query', '@tanstack/react-router'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev proxy: the SPA talks to the FastAPI container without CORS juggling.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
