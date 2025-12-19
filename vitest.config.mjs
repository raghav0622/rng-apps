import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

// 1. Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    alias: {
      '@': path.resolve(__dirname, './'),
      // Fix: Alias server-only to a virtual empty module to prevent import errors
      'server-only': path.resolve(__dirname, './__mocks__/server-only.ts'),
    },
    server: {
      deps: {
        inline: ['server-only'],
      },
    },
  },
});
