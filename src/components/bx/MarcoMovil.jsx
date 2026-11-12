import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Ico } from "@/components/bx/iconos"
import { AvatarBx } from "@/components/bx/MenuCuenta"

/*
 * Marco del módulo Alumno en el celular (handoff móvil): header fijo de 56 px y menú inferior fijo de 5 opciones con el botón
 * Reservar flotante en el centro. Se adaptan a cualquier tamaño de celular y respetan las zonas seguras del teléfono.
 */

// Header fijo: logo · (título de la pantalla, si no es el inicio) · campanita · avatar (abre el menú de cuenta)
export function EncabezadoMovil({ titulo, userData, avatarUrl, onAvatar, campana }) {
  return (
    <header className="bx sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b border-bx-line bg-bx-bg pb-0 pl-4 pr-3 pt-[env(safe-area-inset-top)] lg:hidden">
      <Link to="/inicio" aria-label="Ir a la página principal" className="shrink-0 rounded-lg">
        <img src="/logo.jpg" alt="Bravos Box" className="h-9 w-9 rounded-lg object-cover" />
      </Link>
      {titulo
        ? <h1 data-guia="titulo" key={titulo} className="bx-aparece m-0 min-w-0 flex-1 truncate text-[1.0625rem] font-bold">{titulo}</h1>
        : <span className="flex-1" />}
      {campana}
      <button
        type="button"
        onClick={onAvatar}
        aria-label="Menú de cuenta"
        aria-haspopup="dialog"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform duration-200 active:scale-90"
      >
        <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} tam={36} />
      </button>
    </header>
  )
}

/*
 * Menú inferior. items: [{ name, mobileLabel, href, d (trazo del ícono), activo, centro?, alTocar?, guia?, insignia?, pista? }]
 * El centro (Reservar) es un círculo lima que sobresale hacia arriba. Efectos: al tocar salen ondas de agua desde el dedo,
 * un brillo sigue al dedo, al deslizar el dedo se resalta la opción bajo el dedo y se abre al soltar, y la barra se achica
 * al bajar por la pantalla (y vuelve al subir o al tocarla). Con "reducir movimiento" no hay animaciones.
 */
export function MenuInferior({ items, onNavegar }) {
  const navigate = useNavigate()
  const barra = useRef(null)
  const enlaces = useRef([])
  const inicio = useRef(null)
  const arrastro = useRef(false)
  const ignorarClic = useRef(false)
  const ultimaOnda = useRef({ x: -999, t: 0 })
  const reposo = useRef(0)
  const [sobre, setSobre] = useState(null)
  const [dedo, setDedo] = useState(null)
  const [ondas, setOndas] = useState([])
  const [compacta, setCompacta] = useState(false)

  // Al bajar por la pantalla la barra se achica; al subir o llegar arriba vuelve a su tamaño
  useEffect(() => {
    let ultimo = window.scrollY
    const alScroll = () => {
      const y = window.scrollY
      const dy = y - ultimo
      if (Math.abs(dy) < 6) return
      ultimo = y
      if (performance.now() < reposo.current) return
      setCompacta(!(y < 40 || dy < 0))
    }
    window.addEventListener("scroll", alScroll, { passive: true })
    return () => window.removeEventListener("scroll", alScroll)
  }, [])

  const posicion = (e) => { const r = barra.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
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
    reposo.current = performance.now() + 2500
    setCompacta(false)
    const p = posicion(e)
    setDedo(p)
    soltarOnda(p.x, p.y)
    inicio.current = { x: e.clientX, y: e.clientY }
    arrastro.current = false
  }
  const alMover = (e) => {
    if (e.pointerType === "mouse" && e.buttons === 0) return
    const p = posicion(e)
    setDedo(p)
    if (inicio.current && !arrastro.current && Math.hypot(e.clientX - inicio.current.x, e.clientY - inicio.current.y) > 12) arrastro.current = true
    if (arrastro.current) {
      const i = opcionBajo(e.clientX)
      setSobre((previa) => {
        if (previa !== i && previa !== null) navigator.vibrate?.(8)
        return i
      })
    }
    const ult = ultimaOnda.current
    if (Math.abs(p.x - ult.x) > 56 || performance.now() - ult.t > 380) soltarOnda(p.x, p.y)
  }
  const alSoltar = () => {
    if (arrastro.current && sobre !== null && items[sobre]) {
      ignorarClic.current = true // el navegador igual dispara un clic al soltar: se descarta
      setTimeout(() => { ignorarClic.current = false }, 350)
      if (items[sobre].alTocar) items[sobre].alTocar()
      else navigate(items[sobre].href)
      onNavegar?.()
    }
    arrastro.current = false
    inicio.current = null
    setSobre(null)
    setDedo(null)
  }
  const cancelar = () => { arrastro.current = false; inicio.current = null; setSobre(null); setDedo(null) }

  return (
    <div className="bx fixed inset-x-3 bottom-[calc(24px+env(safe-area-inset-bottom))] z-20 lg:hidden">
      <nav aria-label="Navegación principal">
        <div
          ref={barra}
          onPointerDown={alTocar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={cancelar}
          onClickCapture={(e) => { if (ignorarClic.current) { e.preventDefault(); e.stopPropagation() } }}
          style={{ touchAction: "none" }}
          className={`relative grid grid-cols-5 rounded-[22px] border border-bx-line bg-bx-card shadow-[0_10px_30px_rgba(0,0,0,.35)] transition-[height] duration-300 ease-out ${compacta ? "h-14" : "h-[68px]"}`}
        >
          {/* Brillo que sigue al dedo, con retraso, y ondas que se expanden desde donde se tocó */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
            <span
              className="pointer-events-none absolute z-0 h-14 w-14 rounded-full bg-[radial-gradient(circle,rgba(155,230,0,0.22)_0%,rgba(155,230,0,0.07)_50%,transparent_72%)] motion-reduce:hidden"
              style={{
                left: dedo ? dedo.x : "50%",
                top: dedo ? dedo.y : "50%",
                opacity: dedo ? 1 : 0,
                transform: `translate(-50%, -50%) scale(${dedo ? 1 : 0.6})`,
                transition: "left 160ms cubic-bezier(.2,.8,.3,1), top 160ms cubic-bezier(.2,.8,.3,1), opacity 300ms ease-out, transform 300ms ease-out",
              }}
            />
            {ondas.map((o) => (
              <span
                key={o.id}
                onAnimationEnd={() => setOndas((prev) => prev.filter((x) => x.id !== o.id))}
                className="onda-agua pointer-events-none absolute z-0 h-10 w-10 rounded-full border border-lime-300/30 bg-lime-300/5 motion-reduce:hidden"
                style={{ left: o.x - 20, top: o.y - 20 }}
              />
            ))}
          </div>

          {items.map((item, idx) => {
            const resaltada = sobre !== null ? sobre === idx : item.activo
            const etiqueta = (
              <span className={`max-w-full truncate px-0.5 transition-all duration-300 ${compacta ? "max-h-0 opacity-0" : "max-h-4 opacity-100"}`}>{item.mobileLabel}</span>
            )
            if (item.centro) {
              return (
                <Link
                  key={item.name}
                  ref={(el) => { enlaces.current[idx] = el }}
                  to={item.href}
                  aria-label="Reservar clase"
                  aria-current={item.activo ? "page" : undefined}
                  className="relative z-10 flex h-full min-w-0 flex-col items-center justify-end pb-[7px] text-[0.6875rem] font-bold text-bx-ok-fg"
                >
                  <span className={`latido-centro absolute left-[calc(50%-30px)] -top-[30px] grid h-[60px] w-[60px] place-items-center rounded-full border-4 border-bx-bg bg-bx-lima text-bx-negro shadow-[0_0_0_1px_rgba(155,230,0,0.4),0_0.5rem_1.5rem_rgba(155,230,0,0.25)] transition-all duration-300 active:scale-90 ${resaltada ? "ring-2 ring-lime-200/60" : ""}`}>
                    <Ico d={item.d} size={22} sw={1.9} />
                  </span>
                  {etiqueta}
                </Link>
              )
            }
            return (
              <Link
                key={item.name}
                ref={(el) => { enlaces.current[idx] = el }}
                to={item.href}
                data-guia={item.guia}
                aria-current={item.activo ? "page" : undefined}
                className={`relative z-10 flex h-full min-w-0 flex-col items-center justify-center gap-[3px] text-[0.6875rem] transition-colors duration-200 ${resaltada ? "font-bold text-bx-ok-fg" : "font-semibold text-bx-muted hover:text-bx-ink"}`}
              >
                <span className={`relative grid h-[1.875rem] w-[3.25rem] place-items-center rounded-[0.9375rem] transition-[background-color,transform] duration-300 active:scale-90 ${resaltada ? "bg-bx-ok-bg -translate-y-0.5 scale-110" : "bg-transparent"}`}>
                  <Ico d={item.d} size={22} sw={1.9} />
                  {item.insignia > 0 && (
                    <span className="absolute right-0.5 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-bx-lima px-1 text-[0.5625rem] font-extrabold leading-none text-bx-negro ring-2 ring-bx-card" aria-label={`${item.insignia} reservas próximas`}>
                      {item.insignia > 9 ? "9+" : item.insignia}
                    </span>
                  )}
                </span>
                {etiqueta}
                {item.pista && (
                  <span role="status" className="pista-barra pointer-events-none absolute -top-12 left-1/2 z-20 -ml-10 w-20 rounded-lg bg-bx-lima px-2 py-1.5 text-center text-[0.625rem] font-extrabold uppercase leading-tight tracking-wide text-bx-negro shadow-lg">
                    {item.pista}
                    <span aria-hidden="true" className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-bx-lima" />
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
