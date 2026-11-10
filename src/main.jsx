import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/sesion'
import './index.css'
import App from './App.jsx'
// 1. Importamos el provider que ya tenés creado
import { ThemeProvider } from './components/theme-provider'
import { registerSW } from 'virtual:pwa-register'
import PullToRefresh from './components/PullToRefresh'

/*
 * App instalable: se pide buscar una versión nueva cada vez que se abre o se vuelve a la app y cada 30 minutos.
 * Cuando llega una versión nueva se activa sola. Si la página ya estaba abierta, se recarga al salir de ella
 * (cambiar de pestaña o minimizar), así la persona nunca ve un aviso ni la recarga la interrumpe mientras escribe.
 */
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    if (!registro) return
    const buscar = () => registro.update().catch(() => {})
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') buscar() })
    window.addEventListener('focus', buscar)
    setInterval(buscar, 30 * 60 * 1000)
  },
})

if ('serviceWorker' in navigator) {
  let versionNueva = false
  navigator.serviceWorker.addEventListener('controllerchange', () => { versionNueva = true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && versionNueva) window.location.reload()
  })
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Envolvemos toda la aplicación */}
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <PullToRefresh />
    </ThemeProvider>
  </StrictMode>,
)