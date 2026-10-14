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
 * App instalable: el navegador solo busca una versión nueva por su cuenta cada 24 horas, así que una app
 * instalada podía quedarse días con la copia vieja. Acá se pide la búsqueda cada vez que se abre o se vuelve
 * a la app y cada 30 minutos. Cuando hay una versión nueva se descarga en segundo plano, SIN recargar la pantalla
 * (así no se pierde lo que alguien esté escribiendo): se usa la próxima vez que se abra la app o al tirar hacia
 * abajo para recargar.
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


createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Envolvemos toda la aplicación */}
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <PullToRefresh />
    </ThemeProvider>
  </StrictMode>,
)