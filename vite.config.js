import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Rutas que atiende el backend (pasan por el proxy): el service worker nunca las guarda ni las responde
const RUTAS_DEL_SERVIDOR = [/^\/api\//, /^\/landing\//, /^\/uploads\//]

/*
 * App instalable (PWA). Regla de privacidad: en el celular se guarda solo la estructura de la
 * app (código, estilos, íconos, fotos públicas). Nunca respuestas del servidor (datos de
 * alumnos, pagos) ni archivos de /uploads (comprobantes, certificados médicos).
 */
const pwa = VitePWA({
  registerType: 'prompt', // la página no se recarga sola al haber versión nueva (no se pierde lo que se está escribiendo)
  injectRegister: false, // el registro lo hace src/main.jsx: busca versiones nuevas al abrir la app y al volver a ella
  manifest: {
    name: 'Bravos Box',
    short_name: 'Bravos',
    description: 'Reservá tus clases, seguí tu plan y pagá tu membresía de Bravos Box.',
    lang: 'es-AR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0a0a0a',
    background_color: '#445f40', // el verde del logo: la pantalla de carga se ve como el ícono
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      // El logo tiene fondo de borde a borde y el texto centrado: Android puede recortarlo en círculo
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // Se guardan de antemano solo los archivos de la app (no las fotos grandes de public/)
    globPatterns: ['**/*.{js,css,html,woff2}', 'pwa-*.png', 'favicon-48x48.png', 'apple-touch-icon-180x180.png'],
    // El paquete principal pesa ~2,1 MB; el límite por defecto (2 MB) lo dejaría afuera
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    navigateFallback: '/index.html',
    navigateFallbackDenylist: RUTAS_DEL_SERVIDOR,
    cleanupOutdatedCaches: true,
    // La versión nueva se activa sola en segundo plano; se ve al abrir la app de nuevo o al tirar para recargar
    skipWaiting: true,
    clientsClaim: true,
    // Notificaciones push: mostrar el aviso y abrir la pantalla al tocarlo (public/push-sw.js)
    importScripts: ['push-sw.js'],
    runtimeCaching: [
      {
        // Fotos y gráficos públicos de la app (mascotas, logos, fondos): se guardan al verse
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && !RUTAS_DEL_SERVIDOR.some((r) => r.test(url.pathname)) && /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname),
        handler: 'CacheFirst',
        options: { cacheName: 'imagenes-app-v2', expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
      },
      {
        // Tipografías de Google
        urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'tipografias', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 } },
      },
    ],
  },
  // En desarrollo no se activa: así no quedan versiones viejas guardadas mientras se programa
  devOptions: { enabled: false },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // TUNEL_NGROK sale del .env (no se sube a git: el repo es público y la dirección del túnel no se publica)
  const { TUNEL_NGROK } = loadEnv(mode, __dirname, '')
  return {
  plugins: [react(), pwa],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Túneles para usar la app fuera de la red de casa:
    // - ngrok con la dirección fija de TUNEL_NGROK (ngrok http --url=<TUNEL_NGROK> 5173, o 4173 para
    //   la vista previa): la usan también Mercado Pago (avisos de pago) y los links de los emails,
    //   vía FRONTEND_URL/BACKEND_URL del backend.
    // - Cloudflare rápido (cloudflared tunnel --url http://localhost:5173): dirección distinta cada vez.
    // Solo se suman esas direcciones: Vite sigue rechazando cualquier otro dominio desconocido.
    allowedHosts: [...(TUNEL_NGROK ? [TUNEL_NGROK.trim()] : []), '.trycloudflare.com'],
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
  // Vista previa de la versión de producción (npm run build && npm run preview): con la app
  // instalable activa. Usa el mismo proxy y las mismas direcciones permitidas que el desarrollo.
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  }
})
