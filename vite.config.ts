import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sassDts from 'vite-plugin-sass-dts'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sassDts()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *; @use "@/styles/mixins" as *;`,
      },
    },
  },
})
