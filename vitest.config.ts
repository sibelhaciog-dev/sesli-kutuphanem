import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Testler Türkiye saatinde çalışsın: tarih testleri (ör. todayISO) yerel
// saatin UTC'den ileride olduğu durumu sınıyor; CI sunucusu ise UTC'de.
process.env.TZ = 'Europe/Istanbul'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
