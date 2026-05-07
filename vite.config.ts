import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      canvg: path.resolve(__dirname, 'src/shims/canvg.ts'),
      html2canvas: path.resolve(__dirname, 'src/shims/html2canvas.ts'),
      dompurify: path.resolve(__dirname, 'src/shims/dompurify.ts'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
})
