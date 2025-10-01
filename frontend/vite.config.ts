import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    // **重要：添加这一行来允许通过域名访问**
    allowedHosts: [
      'golf.cuizl.cn', // 允许通过您的域名访问
    ],
  },
  build: {
    outDir: 'dist',
  },
})