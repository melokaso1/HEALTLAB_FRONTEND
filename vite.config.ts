import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin /api in the browser → avoids CORS in local dev.
      // Proxies to the ASP.NET backend (keep path /api/... unchanged).
      '/api': {
        target: 'http://localhost:5077',
        changeOrigin: true,
      },
    },
  },
})
