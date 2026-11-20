import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Bell, ChevronDown, Trash2 } from "lucide-react"
import { ICONOS_TIPO } from "@/lib/avisosEstilos"
import { parsearFecha } from "@/lib/fechasNotificaciones"

/*
 * Bandeja de notificaciones para el celular (alumno y administrador). Una tarjeta por aviso: ícono de color, categoría, hora y
 * el texto. Tocar una tarjeta la abre y muestra las acciones (Ver, Leída, Borrar); deslizarla hacia la izquierda la borra.
 * Se muestran de a 4 y "Ver más" trae las siguientes. Las tarjetas entran con una animación escalonada y salen deslizándose.
 *
 * La fila de arriba (cartel con las nuevas, "Leer todo" y "Borrar todo") puede ir dentro del encabezado de la pantalla:
 * si se pasa `encabezadoEn` (un elemento del DOM) se dibuja ahí; si no, va arriba del título.
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
const DE_A = 4 // cuántas se muestran de entrada y cuántas más trae "Ver más"
const SALIDA_MS = 260

const ESTILOS = `
.bn-raiz,.bn-raiz *,.bn-raiz *::before,.bn-raiz *::after{box-sizing:border-box}
@keyframes bn-entra{from{opacity:0;transform:translateY(26px) scale(.95)}to{opacity:1;transform:none}}
@keyframes bn-titulo{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes bn-fila{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes bn-pulso{0%{box-shadow:0 0 0 0 rgba(155,230,0,.6)}70%,100%{box-shadow:0 0 0 7px rgba(155,230,0,0)}}
.bn-item{animation:bn-entra .55s cubic-bezier(.22,1.15,.36,1) backwards}
.bn-titulo{animation:bn-titulo .5s cubic-bezier(.16,1,.3,1) .05s backwards}
.bn-fila{animation:bn-fila .45s cubic-bezier(.16,1,.3,1) backwards}
.bn-filtros{animation:bn-titulo .5s cubic-bezier(.16,1,.3,1) .12s backwards}
.bn-mas{animation:bn-entra .45s cubic-bezier(.22,1.15,.36,1) backwards}
.bn-punto{animation:bn-pulso 1.9s ease-out infinite}
@media (prefers-reduced-motion:reduce){.bn-item,.bn-titulo,.bn-fila,.bn-filtros,.bn-mas,.bn-punto{animation:none}}
`

function Tarjeta({ n, abierta, onAlternar, onAbrir, onLeer, onBorrar, indice, limpiar }) {
  const [dx, setDx] = useState(0)
  const [saliendo, setSaliendo] = useState(false)
  const [tocando, setTocando] = useState(false) // mientras el dedo está apoyado la tarjeta sigue al dedo sin animación
  const toque = useRef(null)
  const cat = categoria(n.tipo)
  const Icono = ICONOS_TIPO[n.tipo] || Bell
  const sinLeer = !n.leida

  const irse = () => { setSaliendo(true); setTimeout(() => onBorrar(n), SALIDA_MS) }
  // "Borrar todo": las tarjetas se van una tras otra
  useEffect(() => {
    if (!limpiar) return undefined
    const t = setTimeout(() => setSaliendo(true), indice * 70)
    return () => clearTimeout(t)
  }, [limpiar, indice])

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
    if (t?.mov && dx <= -UMBRAL) irse(); else setDx(0)
  }

  return (
    <li
      className="bn-item relative overflow-hidden rounded-2xl"
      style={{ animationDelay: `${Math.min(indice, 8) * 70}ms`, maxHeight: saliendo ? 0 : 600, opacity: saliendo ? 0 : 1, marginTop: saliendo ? -10 : 0, transition: saliendo ? `max-height ${SALIDA_MS}ms ease .05s, opacity ${SALIDA_MS - 40}ms ease, margin ${SALIDA_MS}ms ease` : undefined }}
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
        style={{ background: "var(--bx-card)", borderColor: sinLeer ? "var(--bx-ok-line)" : "var(--bx-line)", transform: `translateX(${saliendo ? -440 : dx}px)`, transition: tocando ? "none" : `transform ${SALIDA_MS}ms cubic-bezier(.2,.8,.3,1), border-color .5s ease`, touchAction: "pan-y" }}
      >
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: cat.fondo, color: cat.color }} aria-hidden="true"><Icono size={19} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[0.625rem] font-extrabold uppercase tracking-[0.1em]" style={{ color: "var(--bx-muted)" }}>
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: sinLeer ? "#9be600" : cat.color, transition: "background .5s ease" }} />
                <span className="truncate">{cat.etiqueta}</span>
              </span>
              <button type="button" onClick={onAlternar} aria-expanded={abierta} aria-label={abierta ? "Cerrar detalle" : "Abrir detalle"} className="-mr-1.5 -mt-1.5 flex h-9 shrink-0 items-center gap-1 rounded-lg px-1.5 text-[0.6875rem] font-semibold" style={{ color: "var(--bx-muted)" }}>
                {hace(n.creadoEn)}
                <ChevronDown size={14} style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform .3s cubic-bezier(.16,1,.3,1)" }} />
              </button>
            </div>
            <div className={`mt-0.5 text-[0.9375rem] leading-snug ${sinLeer ? "font-extrabold" : "font-bold"}`} style={{ color: "var(--bx-ink)" }}>{n.titulo}</div>
            <div className={`mt-0.5 text-[0.8125rem] leading-normal ${abierta ? "" : "line-clamp-2"}`} style={{ color: "var(--bx-muted)" }}>{n.mensaje}</div>
          </div>
        </div>
        <div className="grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out" style={{ gridTemplateRows: abierta ? "1fr" : "0fr", opacity: abierta ? 1 : 0, marginTop: abierta ? 12 : 0 }}>
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-2">
              {n.link && <button type="button" tabIndex={abierta ? 0 : -1} onClick={() => onAbrir(n)} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-[0.8125rem] font-extrabold" style={{ background: "#9be600", color: "#0b0b0b" }}>Ver</button>}
              {sinLeer && <button type="button" tabIndex={abierta ? 0 : -1} onClick={() => onLeer(n)} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border px-4 text-[0.8125rem] font-bold" style={{ borderColor: "var(--bx-line)", color: "var(--bx-ink)" }}>Leída</button>}
              <button type="button" tabIndex={abierta ? 0 : -1} onClick={irse} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-[0.8125rem] font-bold" style={{ background: "var(--bx-err-bg)", color: "var(--bx-err-fg)" }}><Trash2 size={15} />Borrar</button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

// La lista de la pestaña actual: arranca con 4 y "Ver más" suma otras 4. Se vuelve a armar (y a animar) al cambiar de filtro.
function Lista({ lista, limpiando, abierta, setAbierta, onAbrir, onLeer, onBorrar }) {
  const [visibles, setVisibles] = useState(DE_A)
  const ver = lista.slice(0, visibles)
  const resto = lista.length - ver.length
  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label="Notificaciones">
        {ver.map((n, i) => (
          <Tarjeta
            key={n.idNotificacion}
            n={n}
            indice={i >= DE_A ? i - Math.floor(i / DE_A) * DE_A : i}
            limpiar={limpiando}
            abierta={abierta === n.idNotificacion}
            onAlternar={() => setAbierta((a) => (a === n.idNotificacion ? null : n.idNotificacion))}
            onAbrir={onAbrir}
            onLeer={onLeer}
            onBorrar={onBorrar}
          />
        ))}
      </ul>
      {resto > 0 && (
        <button type="button" onClick={() => setVisibles((v) => v + DE_A)} className="bn-mas inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-[0.875rem] font-bold transition-colors duration-200" style={{ borderColor: "var(--bx-line)", color: "var(--bx-ink)", background: "transparent" }}>
          Ver más
          <span className="rounded-full px-2 py-0.5 text-[0.6875rem] font-extrabold" style={{ background: "var(--bx-ok-bg)", color: "var(--bx-ok-fg)" }}>{resto}</span>
        </button>
      )}
    </>
  )
}

export default function BandejaMovil({ notifs, cargando = false, error = false, onReintentar, filtro, onFiltro, noLeidas, onAbrir, onLeer, onBorrar, onLeerTodo, onBorrarTodo, aviso = null, titulo = "Notificaciones", encabezadoEn = null, className = "" }) {
  const [abierta, setAbierta] = useState(null)
  const [confirmar, setConfirmar] = useState(false)
  const [limpiando, setLimpiando] = useState(false)
  useEffect(() => {
    if (!confirmar) return undefined
    const t = setTimeout(() => setConfirmar(false), 3500)
    return () => clearTimeout(t)
  }, [confirmar])

  const lista = (notifs || []).filter((n) => filtro === "todas" || !n.leida)
  const total = (notifs || []).length

  const borrarTodo = () => {
    if (!confirmar) { setConfirmar(true); return }
    setConfirmar(false)
    setLimpiando(true)
    setTimeout(() => { onBorrarTodo(); setLimpiando(false) }, Math.min(lista.length, DE_A) * 70 + SALIDA_MS + 120)
  }

  const pastilla = (id, etiqueta, contador) => {
    const activa = filtro === id
    return (
      <button key={id} type="button" aria-pressed={activa} onClick={() => onFiltro(id)} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border text-[0.8125rem] font-bold transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.97]" style={{ background: activa ? "var(--bx-ink)" : "transparent", color: activa ? "var(--bx-bg)" : "var(--bx-ink)", borderColor: activa ? "var(--bx-ink)" : "var(--bx-line)" }}>
        {etiqueta}<span className="text-[0.6875rem] font-extrabold" style={{ opacity: 0.7 }}>{contador}</span>
      </button>
    )
  }

  // Cartel con las nuevas (en verde: es una buena noticia, no una alarma) y las acciones de toda la bandeja
  const fila = (
    <div className="bx bn-raiz bn-fila flex min-w-0 flex-1 items-center justify-between gap-2">
      {noLeidas > 0
        ? <span className="inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[0.75rem] font-extrabold" style={{ background: "var(--bx-ok-bg)", color: "var(--bx-ok-fg)", borderColor: "var(--bx-ok-line)" }}><span aria-hidden="true" className="bn-punto h-2 w-2 rounded-full" style={{ background: "#9be600" }} />{noLeidas} {noLeidas === 1 ? "nueva" : "nuevas"}</span>
        : <span className="inline-flex h-8 items-center rounded-full px-3 text-[0.75rem] font-bold" style={{ color: "var(--bx-muted)" }}>Al día</span>}
      <div className="flex items-center">
        <button type="button" onClick={onLeerTodo} disabled={noLeidas === 0} className="inline-flex h-11 items-center px-2 text-[0.8125rem] font-bold disabled:opacity-40" style={{ color: "var(--bx-ok-fg)" }}>Leer todo</button>
        <button type="button" onClick={borrarTodo} disabled={total === 0 || limpiando} className="inline-flex h-11 items-center px-2 text-[0.8125rem] font-bold disabled:opacity-40" style={{ color: confirmar ? "var(--bx-err-fg)" : "var(--bx-muted)" }}>
          {confirmar ? "¿Borrar todo?" : "Borrar todo"}
        </button>
      </div>
    </div>
  )

  return (
    <div className={`bx bn-raiz flex flex-col gap-4 ${className}`}>
      <style>{ESTILOS}</style>

      {encabezadoEn ? createPortal(fila, encabezadoEn) : <div className="flex">{fila}</div>}

      <h1 className="bn-titulo m-0 text-center text-[1.75rem] font-extrabold leading-tight tracking-[-0.01em]" style={{ color: "var(--bx-ink)" }}>{titulo}</h1>

      <div className="bn-filtros flex gap-2" role="group" aria-label="Filtrar notificaciones">
        {pastilla("todas", "Todas", total)}
        {pastilla("sin", "Sin leer", noLeidas)}
      </div>

      {aviso}

      {error && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border px-5 py-7 text-center" style={{ borderColor: "var(--bx-line)", background: "var(--bx-card)" }}>
          <div className="text-base font-bold" style={{ color: "var(--bx-ink)" }}>No pudimos cargar tus notificaciones</div>
          <div className="text-sm" style={{ color: "var(--bx-muted)" }}>Revisá tu conexión e intentá de nuevo.</div>
          {onReintentar && <button type="button" onClick={onReintentar} className="mt-1 inline-flex h-11 items-center rounded-full px-5 text-sm font-extrabold" style={{ background: "#9be600", color: "#0b0b0b" }}>Reintentar</button>}
        </div>
      )}
      {!error && cargando && <div aria-label="Cargando notificaciones" className="h-32 animate-pulse rounded-2xl" style={{ background: "var(--bx-card)" }} />}

      {!error && !cargando && lista.length === 0 && (
        <div className="bn-mas flex flex-col items-center gap-2 rounded-2xl border px-5 py-9 text-center" style={{ borderColor: "var(--bx-line)", background: "var(--bx-card)" }}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--bx-tile)", color: "var(--bx-ok-fg)" }}><Bell size={22} /></span>
          <div className="text-base font-bold" style={{ color: "var(--bx-ink)" }}>Estás al día</div>
          <div className="text-sm" style={{ color: "var(--bx-muted)" }}>{filtro === "sin" ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}</div>
        </div>
      )}

      {!error && lista.length > 0 && (
        <Lista key={filtro} lista={lista} limpiando={limpiando} abierta={abierta} setAbierta={setAbierta} onAbrir={onAbrir} onLeer={onLeer} onBorrar={onBorrar} />
      )}
    </div>
  )
}
