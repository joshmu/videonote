import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__test__/setupTests.tsx'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
  resolve: {
    alias: {
      '@/root': path.resolve(__dirname, '.'),
      '@/layout': path.resolve(__dirname, 'src/components/Layout'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/shared': path.resolve(__dirname, 'src/components/shared'),
      '@/context': path.resolve(__dirname, 'src/context'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@/pages': path.resolve(__dirname, 'pages'),
      '@/api': path.resolve(__dirname, 'pages/api'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'utils'),
    },
  },
})
