// my-react-app/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Web_App',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
    allowedHosts: [
      'mariam-noncongruent-nonbeatifically.ngrok-free.dev' // 👈 add your ngrok domain here
    ]
  }
})
