import path from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appVersion = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version as string;

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@mobile-guide': path.resolve(__dirname, '../shared/mobile-guide/src'),
    },
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/components/**', 'happy-dom'],
      ['src/pages/**', 'happy-dom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/types.ts'],
    },
  },
});
