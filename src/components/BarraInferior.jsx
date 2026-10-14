import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

/*
 * Barra de abajo del celular (alumno, profesor y administrador): una píldora flotante, separada de los bordes,
 * con el item activo resaltado en el verde de Bravos. El item "centro" (la acción principal, ej. Reservar)
 * va relleno de verde. Se oculta en computadora (ahí está el menú lateral).
 *
 * Efecto agua: al tocar salen ondas desde el dedo, y al deslizar el dedo por la barra un brillo verde lo
 * sigue con un poco de retraso, dejando ondas a su paso. Se desactiva si el celular pide menos movimiento.
 *
 * Deslizar para elegir: mientras el dedo recorre la barra, la opción que está debajo se va resaltando (y vibra
 * suave al cambiar). Al soltar el dedo se abre esa opción. Un toque normal funciona como siempre.
 *
 * items: [{ name, href, icon, mobileLabel, activo: boolean, centro?: boolean }]
 */
export function BarraInferior({ items, onNavegar }) {
  const navigate = useNavigate()
  const barra = useRef(null)
  const enlaces = useRef([])
  const inicio = useRef(null) // dónde empezó el toque
  const arrastro = useRef(false) // si el dedo se movió lo suficiente como para considerarse un deslizamiento
  const ignorarClic = useRef(false)
  const [sobre, setSobre] = useState(null) // índice de la opción que está bajo el dedo mientras se desliza
  const ultimaOnda = useRef({ x: -999, t: 0 })
  const [dedo, setDedo] = useState(null) // { x, y } mientras el dedo está sobre la barra
  const [ondas, setOndas] = useState([]) // [{ id, x, y }]

  const posicion = (e) => {
    const r = barra.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const soltarOnda = (x, y) => {
    const id = performance.now() + Math.random()
    setOndas((prev) => [...prev.slice(-3), { id, x, y }])
    ultimaOnda.current = { x, t: performance.now() }
  }

  // Opción que está bajo el dedo (si el dedo sale por los costados, la más cercana)
  const opcionBajo = (clientX) => {
    let mejor = null
    let distancia = Infinity
    enlaces.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const d = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0
      if (d < distancia) { distancia = d; mejor = i }
    })
    return mejor
  }

  const alTocar = (e) => {
    const p = posicion(e)
    setDedo(p)
    soltarOnda(p.x, p.y)
    inicio.current = { x: e.clientX, y: e.clientY }
    arrastro.current = false
  }

  const alMover = (e) => {
    if (e.pointerType === "mouse" && e.buttons === 0) return // con mouse solo mientras se arrastra
    const p = posicion(e)
    setDedo(p)
    // Deslizamiento: pasados ~12 px, la opción bajo el dedo se resalta y cambia al ir pasando
    if (inicio.current && !arrastro.current && Math.hypot(e.clientX - inicio.current.x, e.clientY - inicio.current.y) > 12) arrastro.current = true
    if (arrastro.current) {
      const i = opcionBajo(e.clientX)
      setSobre((previa) => {
        if (previa !== i && previa !== null) navigator.vibrate?.(8)
        return i
      })
    }
    // Una onda nueva cada ~28 px recorridos (o cada 220 ms), para que parezca una estela en el agua
    const ult = ultimaOnda.current
    if (Math.abs(p.x - ult.x) > 56 || performance.now() - ult.t > 380) soltarOnda(p.x, p.y)
  }

  const alSoltar = () => {
    // Al soltar después de deslizar, se abre la opción que quedó bajo el dedo
    if (arrastro.current && sobre !== null && items[sobre]) {
      ignorarClic.current = true // el navegador igual dispara un clic al soltar: se descarta
      setTimeout(() => { ignorarClic.current = false }, 350)
      navigate(items[sobre].href)
      onNavegar?.()
    }
    arrastro.current = false
    inicio.current = null
    setSobre(null)
    setDedo(null)
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden" aria-label="Navegación principal">
      <div
        ref={barra}
        onPointerDown={alTocar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => { arrastro.current = false; inicio.current = null; setSobre(null); setDedo(null) }}
        onClickCapture={(e) => { if (ignorarClic.current) { e.preventDefault(); e.stopPropagation() } }}
        style={{ touchAction: "none" }}
        className="pointer-events-auto relative mx-auto flex max-w-md items-stretch gap-1 rounded-2xl border border-border bg-sidebar/95 p-1.5 shadow-xl shadow-black/30 backdrop-blur"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {/* Brillo que sigue al dedo, con retraso (efecto gota de agua) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-0 h-14 w-14 rounded-full bg-[radial-gradient(circle,rgba(163,230,53,0.22)_0%,rgba(163,230,53,0.07)_50%,transparent_72%)] motion-reduce:hidden"
          style={{
            left: dedo ? dedo.x : "50%",
            top: dedo ? dedo.y : "50%",
            opacity: dedo ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${dedo ? 1 : 0.6})`,
            transition: "left 160ms cubic-bezier(.2,.8,.3,1), top 160ms cubic-bezier(.2,.8,.3,1), opacity 300ms ease-out, transform 300ms ease-out",
          }}
        />

        {/* Ondas que se expanden y se desvanecen */}
        {ondas.map((o) => (
          <span
            key={o.id}
            aria-hidden="true"
            onAnimationEnd={() => setOndas((prev) => prev.filter((x) => x.id !== o.id))}
            className="onda-agua pointer-events-none absolute z-0 h-10 w-10 rounded-full border border-lime-300/30 bg-lime-300/5 motion-reduce:hidden"
            style={{ left: o.x - 20, top: o.y - 20 }}
          />
        ))}
        </div>

        {items.map((item, idx) => {
          const Icono = item.icon
          // Mientras se desliza, solo se ve resaltada la opción bajo el dedo
          const resaltada = sobre !== null ? sobre === idx : item.activo
          if (item.centro) {
            return (
              <Link key={item.name} ref={(el) => { enlaces.current[idx] = el }} to={item.href} onClick={onNavegar} aria-current={item.activo ? "page" : undefined}
                className="relative z-10 flex min-w-0 flex-[1.1] flex-col items-center justify-end gap-1 pb-1.5 focus-visible:outline-none">
                <span className={`latido-centro -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-background bg-lime-400 text-black shadow-md shadow-lime-400/25 transition-transform active:scale-90 ${resaltada ? "ring-2 ring-lime-200/60" : ""}`}>
                  <Icono className="h-6 w-6" strokeWidth={2.75} />
                </span>
                <span className="max-w-full truncate px-0.5 text-[9px] font-black uppercase leading-none tracking-wide text-lime-700 dark:text-lime-400">{item.mobileLabel}</span>
              </Link>
            )
          }
          const base = "relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all active:scale-95"
          const estilo = resaltada
              ? "bg-lime-400/15 text-lime-700 dark:text-lime-400"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
          return (
            <Link key={item.name} ref={(el) => { enlaces.current[idx] = el }} to={item.href} data-guia={item.guia} onClick={onNavegar} aria-current={item.activo ? "page" : undefined} className={`${base} ${estilo}`}>
              <span className="relative">
                <Icono className="h-5 w-5 shrink-0" strokeWidth={resaltada || item.centro ? 2.5 : 2} />
                {item.insignia > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-400 px-1 text-[9px] font-black leading-none text-black ring-2 ring-sidebar" aria-label={`${item.insignia} reservas próximas`}>
                    {item.insignia > 9 ? "9+" : item.insignia}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-0.5 text-[9px] font-black uppercase leading-none tracking-wide">{item.mobileLabel}</span>
              {item.pista && (
                <span role="status" className="pista-barra pointer-events-none absolute -top-12 left-1/2 z-20 -ml-10 w-20 rounded-lg bg-lime-400 px-2 py-1.5 text-center text-[10px] font-black uppercase leading-tight tracking-wide text-black shadow-lg">
                  {item.pista}
                  <span aria-hidden="true" className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-lime-400" />
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
