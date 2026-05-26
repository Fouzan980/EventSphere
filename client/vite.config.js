import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/projects/eventsphere/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Socket.IO needs both HTTP long-polling (/socket.io) and WS upgrade
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,          // proxy WebSocket upgrade
      },
    },
  },
})
