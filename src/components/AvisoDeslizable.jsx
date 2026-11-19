import { useRef, useState } from "react"

/*
 * Un aviso en pantalla que se quita deslizándolo con el dedo (a un costado o hacia arriba), como en el celular.
 * Si se suelta antes de llegar lejos, vuelve a su lugar. Un toque normal sigue funcionando (onClick); si el dedo se movió, no cuenta como toque.
 * También se puede quitar con el teclado (Escape) cuando tiene el foco.
 */
const DISTANCIA = 70 // píxeles que hay que deslizar para quitarlo
const VELOCIDAD = 0.5 // píxeles por milisegundo: un deslizamiento rápido también lo quita aunque sea corto

export default function AvisoDeslizable({ onQuitar, onClick, className = "", style, children }) {
  const inicio = useRef(null)
  const movido = useRef(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [arrastrando, setArrastrando] = useState(false)
  const [saliendo, setSaliendo] = useState(null) // { x, y } hacia donde se va

  const quitar = (x, y) => {
    setSaliendo({ x, y })
    setTimeout(onQuitar, 180)
  }

  const alBajar = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    inicio.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    movido.current = false
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* sin captura: el aviso igual se puede deslizar */ }
  }
  const alMover = (e) => {
    if (!inicio.current || saliendo) return
    const dx = e.clientX - inicio.current.x
    // Hacia abajo no se mueve (no tiene a dónde ir); hacia arriba y a los costados sí
    const dy = Math.min(0, e.clientY - inicio.current.y)
    if (!arrastrando && Math.hypot(dx, dy) < 6) return
    movido.current = true
    setArrastrando(true)
    setPos({ x: dx, y: dy })
  }
  const alSoltar = (e) => {
    const ini = inicio.current
    inicio.current = null
    if (!ini || saliendo) return
    setArrastrando(false)
    const dx = e.clientX - ini.x
    const dy = Math.min(0, e.clientY - ini.y)
    const ms = Math.max(1, performance.now() - ini.t)
    const lejos = Math.abs(dx) > DISTANCIA || -dy > DISTANCIA * 0.7
    const rapido = Math.hypot(dx, dy) / ms > VELOCIDAD && Math.hypot(dx, dy) > 24
    if (movido.current && (lejos || rapido)) {
      // Se va hacia el lado en que se lo empujó
      if (Math.abs(dx) >= -dy) quitar(dx < 0 ? -140 : 140, 0)
      else quitar(0, -120)
    } else {
      setPos({ x: 0, y: 0 })
    }
  }

  const cancelar = () => { inicio.current = null; setArrastrando(false); setPos({ x: 0, y: 0 }) }
  const desplazamiento = saliendo || pos
  const opacidad = saliendo ? 0 : Math.max(0.35, 1 - Math.max(Math.abs(pos.x) / 220, -pos.y / 160))

  return (
    <div
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={cancelar}
      onClick={(e) => { if (movido.current) { movido.current = false; e.stopPropagation(); return } onClick?.(e) }}
      onKeyDown={(e) => { if (e.key === "Escape") quitar(0, -120) }}
      className={className}
      style={{
        ...style,
        transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px)`,
        opacity: opacidad,
        transition: arrastrando ? "none" : "transform 0.18s ease-out, opacity 0.18s ease-out",
        touchAction: "none",
        cursor: arrastrando ? "grabbing" : undefined,
      }}
    >
      {children}
    </div>
  )
}
