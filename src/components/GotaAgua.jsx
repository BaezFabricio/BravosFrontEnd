import { useEffect, useRef } from "react"

/*
 * Gota de agua de los menús de abajo. Es una sola burbuja que va por detrás de las opciones y se desliza hasta la elegida
 * (o hasta donde está el dedo mientras se desliza por la barra). Se mueve con un resorte, no con una curva fija:
 * arranca suave, se estira de costado según la velocidad, se pasa un poquito y vuelve, como un líquido.
 *
 * Requisitos: va dentro de un contenedor con position (relative/absolute) que además contiene a las opciones,
 * y `enlaces` es la lista (ref) de los elementos de las opciones, en el mismo orden que `indice`.
 * `clave` es cualquier valor que, al cambiar, vuelve a medir (por ejemplo, cuando la barra se achica).
 * Con "menos movimiento" la gota salta directo, sin resorte.
 */
const RIGIDEZ = 210 // qué tan rápido la tira hacia su lugar
const AMORTIGUACION = 17 // qué tan rápido se frena (menos = más rebote)

// Dónde quedó la gota la última vez. Cada pantalla del panel dibuja su propio menú de abajo, así que sin esto la gota
// aparecería ya colocada en la opción nueva; con esto arranca donde estaba y viaja hasta la opción nueva.
let ultimaPosicion = null

export default function GotaAgua({ enlaces, indice, oculta = false, clave, margenX = 4, margenY = 6, className = "" }) {
  const gota = useRef(null)
  const estado = useRef({ x: 0, w: 0, vx: 0, vw: 0, listo: false })

  useEffect(() => {
    const el = gota.current
    if (!el) return
    const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const s = estado.current
    if (!s.listo && ultimaPosicion) Object.assign(s, { x: ultimaPosicion.x, w: ultimaPosicion.w, vx: 0, vw: 0, listo: true })
    let raf = 0
    let hasta = 0
    let ultimo = 0

    const medir = () => {
      const t = enlaces.current?.[indice]
      if (!t) return null
      return { x: t.offsetLeft + margenX, w: Math.max(0, t.offsetWidth - margenX * 2) }
    }
    const pintar = () => {
      // Se estira según la velocidad y se aplasta un poco hacia abajo: efecto líquido
      const estira = reducido ? 0 : Math.min(Math.abs(s.vx) * 0.045, 30)
      ultimaPosicion = { x: s.x, w: s.w }
      el.style.width = `${Math.max(0, s.w + estira)}px`
      el.style.transform = `translate3d(${s.x - estira / 2}px, 0, 0) scaleY(${1 - estira / 220})`
    }
    const paso = (ahora) => {
      const m = medir()
      const dt = Math.min(0.032, Math.max(0.001, (ahora - ultimo) / 1000))
      ultimo = ahora
      if (m) {
        if (!s.listo || reducido) {
          s.x = m.x; s.w = m.w; s.vx = 0; s.vw = 0; s.listo = true
        } else {
          s.vx += (RIGIDEZ * (m.x - s.x) - AMORTIGUACION * s.vx) * dt
          s.vw += (RIGIDEZ * (m.w - s.w) - AMORTIGUACION * s.vw) * dt
          s.x += s.vx * dt
          s.w += s.vw * dt
        }
        pintar()
        const quieta = Math.abs(m.x - s.x) < 0.3 && Math.abs(m.w - s.w) < 0.3 && Math.abs(s.vx) < 1 && Math.abs(s.vw) < 1
        if (quieta && ahora > hasta) { s.x = m.x; s.w = m.w; s.vx = 0; s.vw = 0; pintar(); return }
      }
      raf = requestAnimationFrame(paso)
    }
    const despertar = () => {
      cancelAnimationFrame(raf)
      const ahora = performance.now()
      hasta = ahora + 450 // cubre el tiempo en que la barra cambia de tamaño
      ultimo = ahora
      raf = requestAnimationFrame(paso)
    }
    el.style.opacity = oculta ? "0" : "1"
    // Sin posición anterior (primera vez que se abre la app), se coloca de inmediato en su lugar
    if (!s.listo) { const m = medir(); if (m) { s.x = m.x; s.w = m.w; s.listo = true; pintar() } } else pintar()
    despertar()
    window.addEventListener("resize", despertar)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", despertar) }
  }, [enlaces, indice, oculta, clave, margenX])

  return (
    <span
      ref={gota}
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 z-0 rounded-full ${className}`}
      style={{
        top: margenY, bottom: margenY, width: 0, opacity: 0, willChange: "transform, width",
        transition: "opacity .25s ease-out",
        background: "radial-gradient(120% 140% at 50% 0%, rgba(190,242,100,.30) 0%, rgba(155,230,0,.17) 55%, rgba(155,230,0,.08) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.16), 0 0 16px rgba(155,230,0,.20)",
      }}
    />
  )
}
