import { useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"

/*
 * Deslizar hacia abajo para recargar, como en cualquier app de celular. La app instalada en iPhone no trae este
 * gesto (el navegador sí), así que se arma acá: solo funciona estando arriba de todo de la pantalla, y se ignora
 * dentro de ventanas, formularios y listas que se deslizan de costado.
 * Al recargar también se busca si hay una versión nueva de la app.
 */
const UMBRAL = 70 // cuánto hay que tirar (en píxeles ya amortiguados) para que recargue
const MAXIMO = 110

const esAppInstalada = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true

// Zonas donde tirar hacia abajo no debe recargar: formularios, ventanas y listas con su propio deslizamiento
const ignorar = (el) => !!el?.closest?.("input, textarea, select, [role=dialog], [data-no-ptr], .overflow-x-auto, .overflow-y-auto")

export default function PullToRefresh() {
  const [tirando, setTirando] = useState(0) // píxeles tirados (amortiguados)
  const [cargando, setCargando] = useState(false)
  const inicio = useRef(null)
  const activo = useRef(false)

  useEffect(() => {
    if (!esAppInstalada()) return undefined

    const alTocar = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || ignorar(e.target)) { inicio.current = null; return }
      inicio.current = e.touches[0].clientY
      activo.current = false
    }

    const alMover = (e) => {
      if (inicio.current === null) return
      const dy = e.touches[0].clientY - inicio.current
      if (dy <= 0 || window.scrollY > 0) {
        if (activo.current) { activo.current = false; setTirando(0) }
        return
      }
      activo.current = true
      if (e.cancelable) e.preventDefault() // evita el rebote del navegador mientras se tira
      setTirando(Math.min(dy * 0.5, MAXIMO))
    }

    const alSoltar = () => {
      if (!activo.current) { inicio.current = null; return }
      const alcanzo = tirando >= UMBRAL
      inicio.current = null
      activo.current = false
      if (!alcanzo) { setTirando(0); return }
      setCargando(true)
      setTirando(UMBRAL)
      const recargar = () => window.location.reload()
      // Se busca una versión nueva de la app y se recarga (con un tope de espera por si no hay conexión)
      const tope = setTimeout(recargar, 1500)
      navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {}).finally(() => { clearTimeout(tope); recargar() })
    }

    document.addEventListener("touchstart", alTocar, { passive: true })
    document.addEventListener("touchmove", alMover, { passive: false })
    document.addEventListener("touchend", alSoltar)
    document.addEventListener("touchcancel", alSoltar)
    return () => {
      document.removeEventListener("touchstart", alTocar)
      document.removeEventListener("touchmove", alMover)
      document.removeEventListener("touchend", alSoltar)
      document.removeEventListener("touchcancel", alSoltar)
    }
  }, [tirando])

  if (tirando <= 0 && !cargando) return null
  const progreso = Math.min(tirando / UMBRAL, 1)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center" style={{ transform: `translateY(${Math.max(tirando - 8, 0) + 56}px)` }} role="status" aria-label={cargando ? "Actualizando" : "Soltá para actualizar"}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-lime-400 bg-card text-lime-700 shadow-lg dark:text-lime-400" style={{ opacity: 0.35 + progreso * 0.65 }}>
        <RefreshCw className={`h-5 w-5 ${cargando ? "animate-spin" : ""}`} style={cargando ? undefined : { transform: `rotate(${progreso * 270}deg)` }} aria-hidden="true" />
      </div>
    </div>
  )
}
