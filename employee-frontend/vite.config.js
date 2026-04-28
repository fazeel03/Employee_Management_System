import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    proxy: {
      '/api/v1': 'http://localhost:5000',
      '/api/reports': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reports/, '/api/reports')
      }
    }
  }
})
