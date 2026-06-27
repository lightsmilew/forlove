import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl = 'http://localhost:6748'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 80,
    proxy: {
      '/api': backendUrl,
      '/uploads': backendUrl,
      '/ws': {
        target: backendUrl,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 80,
    proxy: {
      '/api': backendUrl,
      '/uploads': backendUrl,
      '/ws': {
        target: backendUrl,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
