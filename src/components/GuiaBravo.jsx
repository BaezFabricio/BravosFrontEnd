import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import apiClient from "@/api"
import { estadoPush, activarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"

/*
 * Guía de Bravo: recorre los pasos que le da quien la monta (GuiasAlumno decide cuál y cuándo). La pantalla se
 * oscurece y queda iluminado solo lo que se explica (un botón real de la app, marcado con data-guia="..."), con una
 * línea entrecortada que lo une al cuadro de Bravo. Al terminar o saltarla se guarda en la cuenta que esa guía ya se
 * vio (POST /guias/:guia/vista), así no se repite ni en otro celular.
 *
 * Movimiento: el recorte iluminado, el cuadro y Bravo se deslizan de un paso al otro (no aparecen de golpe);
 * la línea se dibuja recién cuando el cuadro terminó de llegar. Con "reducir movimiento" todo es instantáneo.
 *
 * navegar: en el recorrido completo, cada paso lleva a la pantalla donde está su elemento (paso.ruta) y al terminar
 * vuelve a donde estaba la persona; en las guías de un módulo la persona ya está en esa pantalla y no se navega.
 */

const CLAVE_AVISOS = "bravos-invitacion-avisos" // la misma que usa InvitacionAvisos
const ANCHO_BRAVO = 84
const BORDE_Y = (896 / 1024) * ANCHO_BRAVO // la imagen trae dibujado el borde donde apoya las patas (y = 896 de 1024)
const DURACION = 520 // ms que tarda el cuadro y el recorte en deslizarse
const CURVA = "cubic-bezier(.22,1,.36,1)"

const hayMovimiento = () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

// Línea con codos redondeados entre dos puntos
function codo(sx, sy, ex, ey) {
  const R = 10
  if (Math.abs(sx - ex) < 6) return `M${sx} ${sy} L${ex} ${ey}`
  const my = (sy + ey) / 2
  const d = ey > sy ? 1 : -1
  const h = ex > sx ? 1 : -1
  return `M${sx} ${sy} L${sx} ${my - d * R} Q${sx} ${my} ${sx + h * R} ${my} L${ex - h * R} ${my} Q${ex} ${my} ${ex} ${my + d * R} L${ex} ${ey}`
}

// Primer elemento visible marcado con data-guia="objetivo"
function buscarObjetivo(objetivo) {
  if (!objetivo) return null
  const candidatos = Array.from(document.querySelectorAll(`[data-guia="${objetivo}"]`))
  return candidatos.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }) || null
}

export default function GuiaBravo({ guia, pasos, navegar = false, onFin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [armados, setArmados] = useState([]) // pasos de esta vez (el de los avisos solo si se pueden activar)
  const [activa, setActiva] = useState(false)
  const [i, setI] = useState(0)
  const [foco, setFoco] = useState(null) // rectángulo del elemento iluminado (null = sin elemento)
  const [tam, setTam] = useState({ w: 0, h: 0 })
  const [linea, setLinea] = useState("")
  const [entro, setEntro] = useState(false) // para que la pantalla se oscurezca suavemente al abrir
  const [trabajando, setTrabajando] = useState(false)
  const rutaInicial = useRef(location.pathname)
  const cuadro = useRef(null)
  const principal = useRef(null)

  // Al abrir: se arman los pasos (el de los avisos solo si se pueden activar en este aparato)
  useEffect(() => {
    let vigente = true
    ;(async () => {
      let avisos = false
      try { avisos = (await estadoPush()) === "inactivas" } catch { /* sin avisos */ }
      if (!vigente) return
      setArmados(pasos.filter((p) => !p.soloAvisos || avisos))
      setActiva(true)
      setTimeout(() => { if (vigente) setEntro(true) }, 40) // un instante después, para que la pantalla se oscurezca con transición
    })()
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const terminar = useCallback(() => {
    apiClient.post(`/guias/${guia}/vista`).catch(() => {})
    setActiva(false)
    setFoco(null)
    if (navegar && rutaInicial.current && window.location.pathname !== rutaInicial.current) navigate(rutaInicial.current)
    onFin?.(guia)
  }, [guia, navegar, navigate, onFin])

  const paso = activa ? armados[i] : null

  // Llevar a la pantalla del paso (solo en el recorrido completo) y buscar lo que hay que iluminar (la pantalla puede
  // tardar en cargar sus datos). El recorte anterior se queda hasta encontrar el nuevo, así se desliza en vez de
  // desaparecer y reaparecer.
  useEffect(() => {
    if (!paso) return undefined
    if (navegar && paso.ruta && location.pathname !== paso.ruta) navigate(paso.ruta)
    if (!paso.objetivo) { setFoco(null); return undefined }
    let vivo = true
    let intentos = 0
    const medir = () => {
      const el = buscarObjetivo(paso.objetivo)
      if (!el) return false
      el.scrollIntoView({ block: "center", behavior: "auto" })
      // Un instante para que termine el desplazamiento; con temporizador y no con requestAnimationFrame,
      // que se pausa si la app queda en segundo plano
      setTimeout(() => {
        if (!vivo) return
        const r = el.getBoundingClientRect()
        setFoco({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, el })
      }, 30)
      return true
    }
    const t = setInterval(() => {
      intentos += 1
      if (medir()) { clearInterval(t); return }
      if (intentos === 12) setFoco(null) // todavía no está en pantalla: se explica sin iluminar mientras sigue buscando
      if (intentos > 36) clearInterval(t) // ~5 s: algunas pantallas esperan datos del servidor antes de mostrarse
    }, 150)
    return () => { vivo = false; clearInterval(t) }
  }, [paso, location.pathname, navigate, navegar])

  // Si cambia la pantalla (girar el celular, teclado), se vuelve a medir
  useEffect(() => {
    if (!activa || !foco?.el) return undefined
    const re = () => {
      const r = foco.el.getBoundingClientRect()
      setFoco((f) => (f ? { ...f, top: r.top, left: r.left, right: r.right, bottom: r.bottom } : f))
    }
    window.addEventListener("resize", re)
    window.addEventListener("scroll", re, true)
    return () => { window.removeEventListener("resize", re); window.removeEventListener("scroll", re, true) }
  }, [activa, foco?.el])

  // Tamaño del cuadro (para dibujar su borde cortado y ubicarlo)
  useLayoutEffect(() => {
    if (!cuadro.current) return undefined
    const ro = new ResizeObserver(() => setTam({ w: cuadro.current.offsetWidth, h: cuadro.current.offsetHeight }))
    ro.observe(cuadro.current)
    setTam({ w: cuadro.current.offsetWidth, h: cuadro.current.offsetHeight })
    return () => ro.disconnect()
  }, [activa])

  const vw = typeof window === "undefined" ? 375 : window.innerWidth
  const vh = typeof window === "undefined" ? 700 : window.innerHeight
  const ancho = Math.min(250, vw - 24)
  const medido = tam.h > 0
  const objetivoArriba = foco ? (foco.top + foco.bottom) / 2 < vh * 0.5 : false
  // El cuadro se ubica con top/left para poder deslizarse con una transición (no se puede entre bottom y top)
  const posicion = foco
    ? (objetivoArriba ? { left: 12, top: vh - 100 - tam.h } : { left: vw - 12 - ancho, top: 100 })
    : { left: (vw - ancho) / 2, top: Math.max(110, (vh - tam.h) / 2) }

  // Línea que une el cuadro con lo iluminado: se dibuja cuando el cuadro terminó de llegar
  const clavePos = `${Math.round(posicion.left)}-${Math.round(posicion.top)}-${Math.round(foco?.top ?? -1)}-${Math.round(foco?.left ?? -1)}-${Math.round(foco?.bottom ?? -1)}-${i}`
  useEffect(() => {
    setLinea("")
    if (!activa || !foco || !medido) return undefined
    const t = setTimeout(() => {
      if (!cuadro.current) return
      const g = cuadro.current.getBoundingClientRect()
      const u = { l: foco.left - 6, t: foco.top - 6, r: foco.right + 6, b: foco.bottom + 6 }
      const ex = (u.l + u.r) / 2
      let sy, ey, sx
      if (u.b < g.top) { sy = g.top - 3; ey = u.b + 2; sx = Math.max(g.left + 96, Math.min(g.right - 22, ex)) }
      else { sy = g.bottom + 3; ey = u.t - 2; sx = Math.max(g.left + 22, Math.min(g.right - 22, ex)) }
      setLinea(codo(sx, sy, ex, ey))
    }, hayMovimiento() ? DURACION + 80 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clavePos, activa, medido])

  // Foco del teclado en el botón principal y Escape para salir
  useEffect(() => {
    if (!activa) return undefined
    principal.current?.focus()
    const tecla = (e) => { if (e.key === "Escape") terminar() }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [activa, i, terminar])

  if (!activa || !paso) return null

  const esUltimo = i === armados.length - 1

  const activarAvisos = async () => {
    setTrabajando(true)
    try {
      await activarPush()
      toast.success("Listo: te vamos a avisar en este celular", { guardar: false })
      try { localStorage.setItem(CLAVE_AVISOS, "respondida") } catch { /* nada */ }
      terminar()
    } catch (err) {
      toast.error("No se pudieron activar los avisos", { description: err.response?.data?.message || err.message })
    } finally {
      setTrabajando(false)
    }
  }
  const ahoraNo = () => {
    try { localStorage.setItem(CLAVE_AVISOS, "respondida") } catch { /* nada */ }
    terminar()
  }

  const w = tam.w
  const h = tam.h
  const puntos = [[14, 0], [w - 8, 0], [w, 8], [w, h - 14], [w - 14, h], [6, h], [0, h - 6], [0, 14]]
  const forma = `M${puntos.map((p) => `${p[0]} ${p[1]}`).join(" L")}Z`
  const mov = hayMovimiento()
  const tr = (props) => (mov ? props.map((p) => `${p} ${DURACION}ms ${CURVA}`).join(", ") : "none")

  // Recorte iluminado: si no hay elemento, se achica al centro y todo queda oscuro
  const r = foco
    ? { top: foco.top - 6, left: foco.left - 6, width: foco.right - foco.left + 12, height: foco.bottom - foco.top + 12, borde: "#a3e635" }
    : { top: vh / 2, left: vw / 2, width: 0, height: 0, borde: "transparent" }

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="guia-titulo" className="fixed inset-0 z-[9990]">
      <style>{`
        @keyframes guia-bravo-entra { 0% { opacity: 0; transform: translateY(16px) scale(.92); } 60% { opacity: 1; transform: translateY(-3px) scale(1.02); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes guia-texto-entra { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes guia-linea-entra { from { opacity: 0; } to { opacity: 1; } }
        .guia-bravo-img { animation: guia-bravo-entra .55s cubic-bezier(.22,1.2,.36,1) both; }
        .guia-texto { animation: guia-texto-entra .35s ease-out both; }
        .guia-linea { animation: guia-linea-entra .3s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .guia-bravo-img, .guia-texto, .guia-linea { animation: none; } }
      `}</style>

      {/* Capa que evita tocar la pantalla de atrás mientras dura la guía */}
      <div className="absolute inset-0" aria-hidden="true" />

      {/* Pantalla oscurecida con un recorte iluminado sobre lo que se explica; el recorte se desliza de un paso al otro */}
      <div
        className="pointer-events-none absolute rounded-2xl border-2"
        style={{
          top: r.top, left: r.left, width: r.width, height: r.height, borderColor: r.borde,
          boxShadow: `0 0 0 100vmax rgba(0,0,0,${entro ? 0.8 : 0})`,
          transition: tr(["top", "left", "width", "height", "border-color", "box-shadow"]),
        }}
        aria-hidden="true"
      />

      {/* Línea entrecortada del cuadro a lo iluminado */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {linea && <path key={clavePos} className="guia-linea" d={linea} fill="none" stroke="#a3e635" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 6" />}
      </svg>

      {/* El cuadro de Bravo: se desliza a su lugar en cada paso */}
      <div
        className="absolute"
        style={{
          ...posicion, width: ancho,
          opacity: medido && entro ? 1 : 0,
          transition: tr(["top", "left"]) + (mov ? ", opacity 300ms ease-out" : ""),
        }}
      >
        <div ref={cuadro} className="relative px-3.5 pb-2.5 pt-3.5 text-white">
          <svg className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible" aria-hidden="true">
            <path d={forma} fill="#0d0d0d" stroke="#a3e635" strokeWidth="1.6" strokeLinejoin="round" />
            <path d={forma} transform={`translate(5 5) scale(${((w - 10) / (w || 1)).toFixed(4)} ${((h - 10) / (h || 1)).toFixed(4)})`} fill="none" stroke="#a3e635" strokeOpacity=".28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <rect x="-3" y="24" width="4" height="20" fill="#a3e635" />
            <path d={`M${w - 26} ${h}L${w - 14} ${h}`} stroke="#a3e635" strokeWidth="3.5" />
          </svg>

          <img key={`bravo-${i}`} src="/bravo_asomado.webp" alt="" draggable={false} className="guia-bravo-img pointer-events-none absolute max-w-none select-none"
            style={{ width: ANCHO_BRAVO, top: -BORDE_Y + 1, left: 8 }} />

          <div className="relative">
            <div key={`texto-${i}`} className="guia-texto">
              <p id="guia-titulo" className="text-[15px] font-black uppercase leading-tight tracking-wide text-lime-400">{paso.titulo}</p>
              <p className="mt-1 text-xs font-medium leading-snug text-white">{paso.texto}</p>
              <ul className="mt-1.5 grid gap-[3px]">
                {paso.puntos.map((p) => (
                  <li key={p} className="flex gap-1 text-[11px] leading-snug text-zinc-300">
                    <ChevronRight className="mt-px h-3 w-3 shrink-0 text-lime-400" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-2 flex gap-[2px]" aria-hidden="true">
              {armados.map((_, k) => <span key={k} className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${k <= i ? "bg-lime-400" : "bg-zinc-700"}`} />)}
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              {paso.soloAvisos ? (
                <button type="button" onClick={ahoraNo} disabled={trabajando} className="min-h-[34px] px-1 text-[11px] text-zinc-400 underline">Ahora no</button>
              ) : (
                <button type="button" onClick={terminar} className="min-h-[34px] px-1 text-[11px] text-zinc-400 underline">Saltar</button>
              )}
              {i > 0 && !paso.soloAvisos && (
                <button type="button" onClick={() => setI((k) => k - 1)} className="min-h-[34px] px-1 text-[11px] text-zinc-400">Atrás</button>
              )}
              {armados.length > 1 && (
                <span className="ml-1 text-[10px] tabular-nums text-zinc-500" aria-label={`Paso ${i + 1} de ${armados.length}`}>{i + 1}/{armados.length}</span>
              )}
              <button
                ref={principal}
                type="button"
                disabled={trabajando}
                onClick={paso.soloAvisos ? activarAvisos : esUltimo ? terminar : () => setI((k) => k + 1)}
                className="ml-auto min-h-[34px] rounded-bl-[3px] rounded-br-[10px] rounded-tl-[10px] rounded-tr-[3px] bg-lime-400 px-4 text-xs font-bold text-[#1a2a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
              >
                {paso.soloAvisos ? "Activar avisos" : esUltimo ? "Listo" : "Dale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
