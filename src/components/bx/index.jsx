import { useEffect, useId, useRef } from "react"
import { useContar } from "@/lib/useContar"
import { Link } from "react-router-dom"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AlertTriangle, ChevronRight, Minus, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

/*
 * Componentes del diseño del módulo Alumno (escritorio). Una sola variante por estilo.
 * Todos deben quedar dentro de un contenedor <Bx> (clase `.bx`, ver styles/bx.css), que trae los colores y la tipografía.
 * Referencia: handoff_alumno/README.md, secciones 1 a 3.
 */

// Contenedor raíz: activa los colores (oscuro/claro) y la tipografía del diseño
export function Bx({ className, ...props }) {
  return <div className={cn("bx", className)} {...props} />
}

// Contenido de cada pantalla: columna con separación de 24px (20px en algunas pantallas, con className="gap-5").
// El ancho máximo (1600px, centrado) y el margen de 24px los pone el marco de escritorio (LayoutEscritorio).
export function Pantalla({ className, ...props }) {
  return <div className={cn("bx-entrada flex w-full flex-col gap-6", className)} {...props} />
}

/* ───────── Botones ───────── */

const BASE_BOTON = "inline-flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-[background-color,border-color,color,transform,opacity] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 select-none"
const VARIANTES_BOTON = {
  // Una sola acción primaria lima por bloque
  primario: "bg-bx-lima text-bx-negro hover:bg-bx-lima-hover disabled:hover:bg-bx-lima",
  // Lo demás: botón secundario con borde
  secundario: "border border-bx-btn-line bg-transparent text-bx-ink hover:border-bx-lima hover:text-bx-ok-fg",
  // Acción destructiva: solo texto
  peligro: "bg-transparent text-bx-err-fg hover:bg-bx-err-bg",
  // Confirmar una acción destructiva dentro de un diálogo
  peligroSolido: "bg-bx-err-fg text-bx-card hover:opacity-90",
}
const TAMANOS_BOTON = { md: "h-11 px-[1.125rem]", lg: "h-[3.125rem] px-[1.375rem] text-[0.9375rem]" }

// Botón o enlace (si trae `to`). Mínimo 44px de alto.
export function Boton({ variante = "primario", tamano = "md", to, className, children, ...props }) {
  const clases = cn(BASE_BOTON, VARIANTES_BOTON[variante], TAMANOS_BOTON[tamano], className)
  if (to) return <Link to={to} className={clases} {...props}>{children}</Link>
  return <button type="button" className={clases} {...props}>{children}</button>
}

// Botón de solo ícono (44×44). `etiqueta` es obligatoria: es el aria-label.
export function BotonIcono({ etiqueta, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      className={cn("relative grid h-11 w-11 shrink-0 place-items-center rounded-[0.625rem] border border-bx-btn-line bg-bx-card text-bx-ink transition-[background-color,transform] duration-200 hover:bg-bx-surf active:scale-95", className)}
      {...props}
    >
      {children}
    </button>
  )
}

/* ───────── Chips ───────── */

const TONOS_CHIP = {
  ok: "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg",
  warn: "border-bx-warn-line bg-bx-warn-bg text-bx-warn-fg",
  err: "border-bx-err-line bg-bx-err-bg text-bx-err-fg",
  neutral: "border-bx-line bg-bx-surf text-bx-muted",
}

// Chip de estado (ok / warn / err / neutral)
export function Chip({ tono = "neutral", icono: Icono, className, children, ...props }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] font-bold", TONOS_CHIP[tono], className)} {...props}>
      {Icono && <Icono className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  )
}

// Insignia pequeña sobre fondo oscuro (NUEVO, VOS, contadores)
export function Insignia({ className, children, ...props }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-bx-chip px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.06em] text-bx-lima", className)} {...props}>
      {children}
    </span>
  )
}

// Filtros: chips con aria-pressed (el activo va invertido: ink/bg)
export function FiltroChips({ opciones, valor, onChange, etiqueta = "Filtrar", className }) {
  return (
    <div role="group" aria-label={etiqueta} className={cn("flex flex-wrap gap-2", className)}>
      {opciones.map((o) => {
        const activo = o.id === valor
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-[0.8125rem] font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-95",
              activo ? "border-bx-ink bg-bx-ink text-bx-bg" : "border-bx-btn-line bg-transparent text-bx-ink hover:border-bx-ink"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ───────── Pestañas ───────── */

// role="tablist". El subrayado lima se desliza de una pestaña a la otra. `items`: [{ id, label, contador? }]
export function Pestanas({ items, valor, onChange, etiqueta = "Secciones", className }) {
  const base = useId()
  const raiz = useRef(null)
  const barra = useRef(null)
  const primera = useRef(true)

  // Mide la pestaña activa y mueve el subrayado (sin pasar por el estado de React: es solo posición en pantalla)
  useEffect(() => {
    const mover = () => {
      const boton = document.getElementById(`${base}-${valor}`)
      const linea = barra.current
      if (!boton || !linea) return
      if (primera.current) linea.style.transition = "none" // la primera vez aparece en su lugar, sin recorrer desde la izquierda
      linea.style.width = `${boton.offsetWidth}px`
      linea.style.transform = `translateX(${boton.offsetLeft}px)`
      if (primera.current) { void linea.offsetWidth; linea.style.transition = ""; primera.current = false }
    }
    mover()
    const ro = new ResizeObserver(mover) // el número de la pestaña puede cambiar su ancho cuando llegan los datos
    Array.from(raiz.current?.children || []).forEach((c) => ro.observe(c))
    return () => ro.disconnect()
  }, [valor, items.length, base])

  return (
    <div ref={raiz} role="tablist" aria-label={etiqueta} className={cn("relative flex gap-6 border-b border-bx-line", className)}>
      {items.map((it) => {
        const activa = it.id === valor
        return (
          <button
            key={it.id}
            id={`${base}-${it.id}`}
            type="button"
            role="tab"
            aria-selected={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => onChange(it.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
              const i = items.findIndex((x) => x.id === it.id)
              const sig = items[(i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length]
              onChange(sig.id)
              document.getElementById(`${base}-${sig.id}`)?.focus()
            }}
            className={cn(
              "flex h-12 items-center gap-2 text-[0.9375rem] font-bold transition-colors duration-200",
              activa ? "text-bx-ink" : "text-bx-muted hover:text-bx-ink"
            )}
          >
            {it.label}
            {it.contador != null && (
              <span className={cn("grid h-[1.375rem] min-w-[1.375rem] place-items-center rounded-full px-1.5 text-[0.75rem] font-bold transition-colors duration-300", activa ? "bg-bx-lima text-bx-negro" : "bg-bx-track text-bx-ink")}>
                {it.contador}
              </span>
            )}
          </button>
        )
      })}
      <span ref={barra} aria-hidden="true" className="pointer-events-none absolute -bottom-px left-0 h-[0.1875rem] rounded-full bg-bx-lima transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
    </div>
  )
}

// Contenido que se abre y se cierra con suavidad (preguntas frecuentes, rutinas, historiales). Cerrado no se puede tocar ni leer.
export function Desplegable({ abierto, className, children }) {
  return (
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", abierto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0", className)} inert={!abierto}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

/* ───────── Tarjetas ───────── */

// Tarjeta (radio 16px)
export function Tarjeta({ as: Tag = "section", className, ...props }) {
  return <Tag className={cn("rounded-2xl border border-bx-line bg-bx-card p-6", className)} {...props} />
}

// Encabezado de una tarjeta: título + enlace opcional a la derecha ("Ver todas")
export function TituloTarjeta({ id, children, enlace, className }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 id={id} className="text-lg font-bold text-bx-ink">{children}</h2>
      {enlace}
    </div>
  )
}

// Enlace "Ver todas ›" (44px de alto, color de acción)
export function EnlaceVer({ to, children }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-bx-ok-fg hover:text-bx-ink">
      {children}
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  )
}

// Bloque "hero": siempre oscuro, con el logo de fondo muy tenue (radio 20px)
export function HeroCard({ className, children, logo = true, ...props }) {
  return (
    <section className={cn("relative overflow-hidden rounded-[1.25rem] border border-bx-hero-line bg-bx-hero p-[clamp(1.5rem,3vw,2.5rem)] text-[#ecefe4]", className)} {...props}>
      {logo && (
        <img
          src="/bravos-logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[38%] top-1/2 h-[17.75rem] w-[55rem] max-w-none -translate-y-1/2 -rotate-6 opacity-[0.05] [filter:grayscale(1)_brightness(1.4)] [mask-image:linear-gradient(125deg,#000_0%,rgba(0,0,0,.25)_45%,#000_55%,rgba(0,0,0,.15)_100%)]"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0)_35%,rgba(255,255,255,.03)_48%,rgba(255,255,255,0)_60%)]" />
      <div className="relative">{children}</div>
    </section>
  )
}

// Mini tarjeta de dato dentro de un hero (fondo #1a1a1a)
export function DatoHero({ etiqueta, valor, nota, className }) {
  const mostrado = useContar(valor)
  return (
    <div className={cn("rounded-xl border border-[#262626] bg-[#1a1a1a] p-5", className)}>
      <div className="text-[0.8125rem] font-semibold text-[#a3a698]">{etiqueta}</div>
      <div className="bx-num mt-2 text-[2.75rem] leading-none text-bx-lima">{mostrado}</div>
      {nota && <div className="mt-1.5 text-xs text-[#8b8e80]">{nota}</div>}
    </div>
  )
}

/* ───────── Progreso ───────── */

export function Progreso({ valor, max = 100, etiqueta, className, alto = 10, color = "bg-bx-barra" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      style={{ height: `${alto / 16}rem`, borderRadius: `${alto / 32}rem` }}
      className={cn("overflow-hidden bg-bx-track", className)}
    >
      <div className={cn("bx-barra h-full transition-[width] duration-700 ease-out", color)} style={{ width: `${pct}%`, borderRadius: `${alto / 32}rem` }} />
    </div>
  )
}

/* ───────── Estados: vacío, error, cargando ───────── */

// Vacío: mensaje + acción (centrado solo si `centrado`)
export function Vacio({ titulo, texto, accion, className }) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-xl border border-dashed border-bx-btn-line p-5", className)}>
      <div>
        <div className="text-[0.9375rem] font-bold text-bx-ink">{titulo}</div>
        {texto && <div className="text-sm text-bx-muted">{texto}</div>}
      </div>
      {accion}
    </div>
  )
}

// Error con "Reintentar" (role="alert")
export function ErrorBanner({ titulo, texto, onReintentar, className }) {
  return (
    <div role="alert" className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-bx-err-line bg-bx-err-bg px-5 py-4 text-bx-err-fg", className)}>
      <AlertTriangle className="h-[1.375rem] w-[1.375rem] shrink-0" aria-hidden="true" />
      <div className="min-w-[13.75rem] flex-1">
        <div className="text-[0.9375rem] font-bold">{titulo}</div>
        {texto && <div className="text-sm">{texto}</div>}
      </div>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="h-11 rounded-lg border border-bx-err-fg bg-transparent px-[1.125rem] text-sm font-bold text-bx-err-fg transition-colors hover:bg-bx-err-fg hover:text-bx-bg"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

// Esqueleto de carga (se anuncia con aria-busy)
export function Esqueleto({ alto = 84, etiqueta = "Cargando", className }) {
  return <div aria-busy="true" aria-label={etiqueta} style={{ height: `${alto / 16}rem` }} className={cn("bx-sk rounded-xl bg-bx-skeleton", className)} />
}

/* ───────── Diálogo ───────── */

// Diálogo (role="dialog" aria-modal; foco al abrir y Escape cierra; fondo rgba(0,0,0,.6)).
// `alerta` lo vuelve alertdialog (para confirmar acciones destructivas). Nunca abrir un diálogo encima de otro.
export function Dialogo({ abierto, onCerrar, titulo, descripcion, sobretitulo, alerta = false, ancho = 480, pie, pieClassName, cuerpoClassName, idEnfocar, children }) {
  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bx-overlay fixed inset-0 z-[100] bg-black/60" />
        <DialogPrimitive.Content
          role={alerta ? "alertdialog" : "dialog"}
          style={{ maxWidth: `${ancho / 16}rem` }}
          onOpenAutoFocus={(e) => {
            // Foco al abrir: en el botón que se indique (por defecto Radix enfoca el primero)
            const el = idEnfocar ? document.getElementById(idEnfocar) : null
            if (el) { e.preventDefault(); el.focus() }
          }}
          className="bx bx-modal fixed left-1/2 top-1/2 z-[101] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card text-bx-ink shadow-[0_1rem_2.5rem_rgba(0,0,0,.35)]"
        >
          <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
            <div className="min-w-0">
              {sobretitulo && <div className="mb-1.5 text-xs font-semibold tracking-[0.1em] text-bx-ok-fg">{sobretitulo}</div>}
              <DialogPrimitive.Title className="text-xl font-bold text-bx-ink">{titulo}</DialogPrimitive.Title>
              {descripcion
                ? <DialogPrimitive.Description className="mt-1 text-sm text-bx-muted">{descripcion}</DialogPrimitive.Description>
                : <DialogPrimitive.Description className="sr-only">{titulo}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close aria-label="Cerrar" className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-[0.625rem] text-bx-ink hover:bg-bx-surf">
              <X className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-3", cuerpoClassName)}>{children}</div>
          {pie && <div className={cn("flex flex-wrap items-center justify-end gap-3 border-t border-bx-line px-6 py-4", pieClassName)}>{pie}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ───────── Formularios ───────── */

// Input con label + ayuda + error (aria-invalid, aria-describedby). Radio 10px.
export function Campo({ etiqueta, ayuda, error, id, className, inputClassName, ...props }) {
  const auto = useId()
  const idc = id || auto
  const idAyuda = ayuda ? `${idc}-ayuda` : undefined
  const idError = error ? `${idc}-error` : undefined
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={idc} className="text-sm font-semibold text-bx-ink">{etiqueta}</label>
      <input
        id={idc}
        aria-invalid={error ? true : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-11 w-full rounded-[0.625rem] border bg-bx-surf px-3.5 text-[0.9375rem] text-bx-ink placeholder:text-bx-muted disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-bx-err-fg" : "border-bx-btn-line",
          inputClassName
        )}
        {...props}
      />
      {ayuda && !error && <p id={idAyuda} className="text-[0.8125rem] text-bx-muted">{ayuda}</p>}
      {error && <p id={idError} className="text-[0.8125rem] font-semibold text-bx-err-fg">{error}</p>}
    </div>
  )
}

// Stepper (−/+) con botones de 44px
export function Stepper({ valor, onChange, paso = 1, min = 0, max = Infinity, etiqueta, formato = (v) => v, className }) {
  const dec = () => onChange(Math.max(min, Math.round((valor - paso) * 100) / 100))
  const inc = () => onChange(Math.min(max, Math.round((valor + paso) * 100) / 100))
  return (
    <div role="group" aria-label={etiqueta} className={cn("inline-flex items-center gap-2", className)}>
      <button type="button" onClick={dec} disabled={valor <= min} aria-label={`Restar ${paso}`} className="grid h-11 w-11 place-items-center rounded-[0.625rem] border border-bx-btn-line bg-bx-surf text-bx-ink hover:border-bx-lima disabled:opacity-40">
        <Minus className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
      </button>
      <span className="min-w-[4.5rem] text-center text-lg font-bold tabular-nums text-bx-ink" aria-live="polite">{formato(valor)}</span>
      <button type="button" onClick={inc} disabled={valor >= max} aria-label={`Sumar ${paso}`} className="grid h-11 w-11 place-items-center rounded-[0.625rem] border border-bx-btn-line bg-bx-surf text-bx-ink hover:border-bx-lima disabled:opacity-40">
        <Plus className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
      </button>
    </div>
  )
}
