import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/sesion'
import './index.css'
import App from './App.jsx'
// 1. Importamos el provider que ya tenés creado
import { ThemeProvider } from './components/theme-provider'
import { registerSW } from 'virtual:pwa-register'
import PullToRefresh from './components/PullToRefresh'
import AvisoVersionNueva from './components/AvisoVersionNueva'
import { registrarActualizador } from './lib/actualizacion'

/*
 * App instalable: se pide buscar una versión nueva cada vez que se abre o se vuelve a la app y cada 30 minutos.
 * Cuando hay una versión nueva, aparece el aviso "Hay una versión nueva · Actualizar" (AvisoVersionNueva).
 * No se recarga sola, para no perder lo que alguien esté escribiendo.
 */
registrarActualizador(registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event('bravos:version-nueva'))
  },
  onRegisteredSW(_url, registro) {
    if (!registro) return
    const buscar = () => registro.update().catch(() => {})
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') buscar() })
    window.addEventListener('focus', buscar)
    setInterval(buscar, 30 * 60 * 1000)
  },
}))


createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Envolvemos toda la aplicación */}
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <PullToRefresh />
      <AvisoVersionNueva />
    </ThemeProvider>
  </StrictMode>,
)