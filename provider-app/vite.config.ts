import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
      '@shared-i18n': path.resolve(__dirname, '../frontend/src/i18n'),
      '@booking-lib': path.resolve(__dirname, '../frontend/src/lib'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/offline-queue.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
