import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const mockDir = path.resolve(__dirname, './src/__mocks__');

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'react-i18next', replacement: path.join(mockDir, 'react-i18next.ts') },
      // Match any import containing .module.scss
      { find: /^(.*)\.module\.scss$/, replacement: path.join(mockDir, 'css-module.ts') },
    ],
  },
});
