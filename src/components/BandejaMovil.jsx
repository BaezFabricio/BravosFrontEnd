import { useEffect, useRef, useState } from "react"
import { Bell, ChevronDown, Trash2 } from "lucide-react"
import { ICONOS_TIPO } from "@/lib/avisosEstilos"
import { parsearFecha } from "@/lib/fechasNotificaciones"

/*
 * Bandeja de notificaciones para el celular (alumno y administrador). Título grande, cartel con las nuevas, filtros en
 * píldoras y una tarjeta por aviso: ícono de color, categoría, hora y el texto. Tocar una tarjeta la abre y muestra las
 * acciones (Ver, Marcar leída, Borrar); deslizarla hacia la izquierda la borra. Los colores salen de las variables .bx.
 *
 * El padre pone los datos y qué pasa en cada acción: onAbrir(n) marca como leída y navega, onLeer(n), onBorrar(n),
 * onLeerTodo(), onBorrarTodo(). Las notificaciones traen { idNotificacion, tipo, titulo, mensaje, link, leida, creadoEn }.
 */

const CATEGORIAS = {
  reserva: { etiqueta: "Reserva", color: "#9be600", fondo: "rgba(155,230,0,.16)" },
  asistencia: { etiqueta: "Asistencia", color: "#4da3ff", fondo: "rgba(77,163,255,.16)" },
  credito: { etiqueta: "Crédito", color: "#f5b72b", fondo: "rgba(245,183,43,.16)" },
  sistema: { etiqueta: "Sistema", color: "#a3a698", fondo: "rgba(163,166,152,.18)" },
  exito: { etiqueta: "Aviso", color: "#9be600", fondo: "rgba(155,230,0,.16)" },
  error: { etiqueta: "Aviso", color: "#ff6b61", fondo: "rgba(255,107,97,.16)" },
  advertencia: { etiqueta: "Aviso", color: "#f5b72b", fondo: "rgba(245,183,43,.16)" },
  info: { etiqueta: "Aviso", color: "#4da3ff", fondo: "rgba(77,163,255,.16)" },
}
const categoria = (tipo) => CATEGORIAS[tipo] || CATEGORIAS.sistema

const hace = (raw) => {
  const min = Math.floor((Date.now() - parsearFecha(raw).getTime()) / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "hace 1 día" : `hace ${d} días`
}

const UMBRAL = 96 // píxeles hacia la izquierda a partir de los cuales se borra al soltar

function Tarjeta({ n, abierta, onAlternar, onAbrir, onLeer, onBorrar, indice }) {
  const [dx, setDx] = useState(0)
  const [saliendo, setSaliendo] = useState(false)
  const [tocando, setTocando] = useState(false) // mientras el dedo está apoyado la tarjeta sigue al dedo sin animación
  const toque = useRef(null)
  const cat = categoria(n.tipo)
  const Icono = ICONOS_TIPO[n.tipo] || Bell
  const sinLeer = !n.leida

  const alBajar = (e) => { toque.current = { x: e.clientX, y: e.clientY, mov: false, horizontal: null }; setTocando(true) }
  const alMover = (e) => {
    const t = toque.current
    if (!t) return
    const mx = e.clientX - t.x
    const my = e.clientY - t.y
    if (t.horizontal === null && Math.hypot(mx, my) > 8) t.horizontal = Math.abs(mx) > Math.abs(my) * 1.2
    if (t.horizontal) { t.mov = true; setDx(Math.max(-220, Math.min(0, mx))) }
  }
  const alSoltar = () => {
    const t = toque.current
    toque.current = null
    setTocando(false)
    if (t?.mov && dx <= -UMBRAL) { setSaliendo(true); setTimeout(() => onBorrar(n), 220) } else setDx(0)
  }

  return (
    <li
      className="bn-item relative overflow-hidden rounded-2xl"
      style={{ animationDelay: `${Math.min(indice, 8) * 45}ms`, maxHeight: saliendo ? 0 : 600, opacity: saliendo ? 0 : 1, marginTop: saliendo ? -6 : 0, transition: saliendo ? "max-height .22s ease, opacity .2s ease, margin .22s ease" : undefined }}
    >
      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-end gap-2 pr-5 text-sm font-extrabold text-white" style={{ background: "#e5484d" }}>
        <Trash2 size={18} /> Borrar
      </div>
      <div
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        className="relative rounded-2xl border p-3.5"
        style={{ background: "var(--bx-card)", borderColor: sinLeer ? "var(--bx-ok-line)" : "var(--bx-line)", transform: `translateX(${saliendo ? -420 : dx}px)`, transition: tocando ? "none" : "transform .22s cubic-bezier(.2,.8,.3,1)", touchAction: "pan-y" }}
      >
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: cat.fondo, color: cat.color }} aria-hidden="true"><Icono size={19} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[0.625rem] font-extrabold uppercase tracking-[0.1em]" style={{ color: "var(--bx-muted)" }}>
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: sinLeer ? "var(--bx-lima, #9be600)" : cat.color }} />
                <span className="truncate">{cat.etiqueta}</span>
              </span>
              <button type="button" onClick={onAlternar} aria-expanded={abierta} aria-label={abierta ? "Cerrar detalle" : "Abrir detalle"} className="-mr-1.5 -mt-1.5 flex h-9 shrink-0 items-center gap-1 rounded-lg px-1.5 text-[0.6875rem] font-semibold" style={{ color: "var(--bx-muted)" }}>
                {hace(n.creadoEn)}
                <ChevronDown size={14} style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform .25s ease" }} />
              </button>
            </div>
            <div className={`mt-0.5 text-[0.9375rem] leading-snug ${sinLeer ? "font-extrabold" : "font-bold"}`} style={{ color: "var(--bx-ink)" }}>{n.titulo}</div>
            <div className={`mt-0.5 text-[0.8125rem] leading-normal ${abierta ? "" : "line-clamp-2"}`} style={{ color: "var(--bx-muted)" }}>{n.mensaje}</div>
          </div>
        </div>
        <div className="grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out" style={{ gridTemplateRows: abierta ? "1fr" : "0fr", opacity: abierta ? 1 : 0, marginTop: abierta ? 12 : 0 }}>
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-2">
              {n.link && <button type="button" tabIndex={abierta ? 0 : -1} onClick={() => onAbrir(n)} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-[0.8125rem] font-extrabold" style={{ background: "var(--bx-lima, #9be600)", color: "#0b0b0b" }}>Ver</button>}
              {sinLeer && <button type="button" tabIndex={abierta ? 0 : -1} onClick={() => onLeer(n)} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border px-4 text-[0.8125rem] font-bold" style={{ borderColor: "var(--bx-line)", color: "var(--bx-ink)" }}>Leída</button>}
              <button type="button" tabIndex={abierta ? 0 : -1} onClick={() => { setSaliendo(true); setTimeout(() => onBorrar(n), 220) }} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-[0.8125rem] font-bold" style={{ background: "var(--bx-err-bg)", color: "var(--bx-err-fg)" }}><Trash2 size={15} />Borrar</button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export default function BandejaMovil({ notifs, cargando = false, error = false, onReintentar, filtro, onFiltro, noLeidas, onAbrir, onLeer, onBorrar, onLeerTodo, onBorrarTodo, aviso = null, titulo = "Notificaciones", className = "" }) {
  const [abierta, setAbierta] = useState(null)
  const [confirmar, setConfirmar] = useState(false)
  useEffect(() => {
    if (!confirmar) return undefined
    const t = setTimeout(() => setConfirmar(false), 3500)
    return () => clearTimeout(t)
  }, [confirmar])

  const lista = (notifs || []).filter((n) => filtro === "todas" || !n.leida)
  const total = (notifs || []).length

  const pastilla = (id, etiqueta, contador) => {
    const activa = filtro === id
    return (
      <button key={id} type="button" aria-pressed={activa} onClick={() => onFiltro(id)} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border text-[0.8125rem] font-bold transition-colors duration-200" style={{ background: activa ? "var(--bx-ink)" : "transparent", color: activa ? "var(--bx-bg)" : "var(--bx-ink)", borderColor: activa ? "var(--bx-ink)" : "var(--bx-line)" }}>
        {etiqueta}<span className="text-[0.6875rem] font-extrabold" style={{ opacity: 0.7 }}>{contador}</span>
      </button>
    )
  }

  return (
    <div className={`bx bn-raiz flex flex-col gap-4 ${className}`}>
      <style>{`.bn-raiz,.bn-raiz *,.bn-raiz *::before,.bn-raiz *::after{box-sizing:border-box}@keyframes bn-entra{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}.bn-item{animation:bn-entra .4s cubic-bezier(.16,1,.3,1) backwards}@media (prefers-reduced-motion:reduce){.bn-item{animation:none}}`}</style>

      <div className="flex items-center justify-between gap-3">
        {noLeidas > 0
          ? <span className="inline-flex h-8 items-center rounded-full px-3 text-[0.75rem] font-extrabold" style={{ background: "#e5484d", color: "#fff" }}>{noLeidas} {noLeidas === 1 ? "nueva" : "nuevas"}</span>
          : <span className="inline-flex h-8 items-center rounded-full px-3 text-[0.75rem] font-bold" style={{ background: "var(--bx-ok-bg)", color: "var(--bx-ok-fg)" }}>Al día</span>}
        <div className="flex items-center gap-1">
          <button type="button" onClick={onLeerTodo} disabled={noLeidas === 0} className="inline-flex h-11 items-center px-2.5 text-[0.8125rem] font-bold disabled:opacity-40" style={{ color: "var(--bx-ok-fg)" }}>Leer todo</button>
          <button type="button" onClick={() => { if (confirmar) { setConfirmar(false); onBorrarTodo() } else setConfirmar(true) }} disabled={total === 0} className="inline-flex h-11 items-center px-2.5 text-[0.8125rem] font-bold disabled:opacity-40" style={{ color: confirmar ? "var(--bx-err-fg)" : "var(--bx-muted)" }}>
            {confirmar ? "¿Borrar todo?" : "Borrar todo"}
          </button>
        </div>
      </div>

      <h1 className="m-0 text-center text-[1.75rem] font-extrabold leading-tight tracking-[-0.01em]" style={{ color: "var(--bx-ink)" }}>{titulo}</h1>

      <div className="flex gap-2" role="group" aria-label="Filtrar notificaciones">
        {pastilla("todas", "Todas", total)}
        {pastilla("sin", "Sin leer", noLeidas)}
      </div>

      {aviso}

      {error && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border px-5 py-7 text-center" style={{ borderColor: "var(--bx-line)", background: "var(--bx-card)" }}>
          <div className="text-base font-bold" style={{ color: "var(--bx-ink)" }}>No pudimos cargar tus notificaciones</div>
          <div className="text-sm" style={{ color: "var(--bx-muted)" }}>Revisá tu conexión e intentá de nuevo.</div>
          {onReintentar && <button type="button" onClick={onReintentar} className="mt-1 inline-flex h-11 items-center rounded-full px-5 text-sm font-extrabold" style={{ background: "var(--bx-lima, #9be600)", color: "#0b0b0b" }}>Reintentar</button>}
        </div>
      )}
      {!error && cargando && <div aria-label="Cargando notificaciones" className="h-32 animate-pulse rounded-2xl" style={{ background: "var(--bx-card)" }} />}

      {!error && !cargando && lista.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border px-5 py-9 text-center" style={{ borderColor: "var(--bx-line)", background: "var(--bx-card)" }}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--bx-tile)", color: "var(--bx-ok-fg)" }}><Bell size={22} /></span>
          <div className="text-base font-bold" style={{ color: "var(--bx-ink)" }}>Estás al día</div>
          <div className="text-sm" style={{ color: "var(--bx-muted)" }}>{filtro === "sin" ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}</div>
        </div>
      )}

      {!error && lista.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label="Notificaciones">
          {lista.map((n, i) => (
            <Tarjeta
              key={n.idNotificacion}
              n={n}
              indice={i}
              abierta={abierta === n.idNotificacion}
              onAlternar={() => setAbierta((a) => (a === n.idNotificacion ? null : n.idNotificacion))}
              onAbrir={onAbrir}
              onLeer={onLeer}
              onBorrar={onBorrar}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
