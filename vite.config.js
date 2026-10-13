import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Túneles para usar la app fuera de la red de casa:
    // - ngrok con la dirección fija (ngrok http --url=crate-silica-silk.ngrok-free.dev 5173): la usan
    //   también Mercado Pago (avisos de pago) y los links de los emails, vía FRONTEND_URL/BACKEND_URL.
    // - Cloudflare rápido (cloudflared tunnel --url http://localhost:5173): dirección distinta cada vez.
    // Solo se suman esas direcciones: Vite sigue rechazando cualquier otro dominio desconocido.
    allowedHosts: ['crate-silica-silk.ngrok-free.dev', '.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/landing': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
