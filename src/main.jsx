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

/*
 * Versión nueva ya activa: la página se recarga sola. Si la persona está escribiendo o hay un diálogo abierto,
 * espera a que termine (o a que cambie de pestaña), así no se pierde nada.
 */
if ('serviceWorker' in navigator) {
  let versionNueva = false
  const hayEdicionAbierta = () => {
    const activo = document.activeElement
    return Boolean(document.querySelector('[role="dialog"]')) ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo?.tagName) || Boolean(activo?.isContentEditable)
  }
  const recargarSiSePuede = () => {
    if (versionNueva && !hayEdicionAbierta()) window.location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    versionNueva = true
    recargarSiSePuede()
  })
  document.addEventListener('focusout', () => setTimeout(recargarSiSePuede, 0))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && versionNueva) window.location.reload()
  })
  setInterval(recargarSiSePuede, 60 * 1000)
}

/*
 * Chequeo directo contra el servidor (no depende del service worker): si la página abierta es de una versión
 * anterior a la publicada, se limpia la caché y se recarga sola. No recarga si la persona está escribiendo
 * o hay un diálogo abierto.
 */
const hayEdicionAbiertaAhora = () => {
  const activo = document.activeElement
  return Boolean(document.querySelector('[role="dialog"]')) ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo?.tagName) || Boolean(activo?.isContentEditable)
}
async function recargarSiHayVersionNueva() {
  if (hayEdicionAbiertaAhora()) return
  const actual = document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src')
  if (!actual) return
  try {
    const respuesta = await fetch(`/?verificar-version=${Date.now()}`, { cache: 'no-store' })
    if (!respuesta.ok) return
    const html = await respuesta.text()
    const publicada = html.match(/src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1]
    if (!publicada || publicada === actual) return
    // Evita un bucle si la recarga todavía trae la versión vieja
    if (sessionStorage.getItem('bravos-version-recargada') === publicada) return
    sessionStorage.setItem('bravos-version-recargada', publicada)
    if ('serviceWorker' in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registros.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      for (const clave of await caches.keys()) await caches.delete(clave)
    }
    window.location.reload()
  } catch {
    // Sin conexión: se vuelve a intentar en el próximo chequeo
  }
}
recargarSiHayVersionNueva()
setInterval(recargarSiHayVersionNueva, 5 * 60 * 1000)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') recargarSiHayVersionNueva()
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