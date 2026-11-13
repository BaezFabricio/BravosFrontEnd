// Componentes compartidos del panel de administración (rediseño según handoff_admin/README.md).
// Todos usan los tokens del admin (--background, --card, --border, --primary...) definidos en index.css
// para html.bv-admin, así se ven bien en modo oscuro y claro.

// Botón: "principal" siempre lima con texto negro; "secundario" con borde; "peligro" en rojo.
const VARIANTES_BOTON = {
  principal: "bg-lime-400 text-[#0b0b0b] hover:bg-lime-300 font-extrabold tracking-[.04em]",
  secundario: "border border-border text-foreground hover:bg-[rgba(128,128,128,.14)] font-bold",
  peligro: "border border-red-500/40 text-red-700 dark:text-[#ff8a80] hover:bg-red-500/10 font-bold",
}

export function BotonAdmin({ variante = "secundario", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${VARIANTES_BOTON[variante]} ${className}`}
      {...props}
    />
  )
}

// Chip de estado: ok (verde), aviso (amarillo), error (rojo), info (celeste)
const TONOS_CHIP = {
  ok: "border-lime-600/30 bg-lime-400/10 text-lime-700 dark:text-lime-400",
  aviso: "border-yellow-500/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-[#ff8a80]",
  info: "border-sky-500/30 bg-sky-400/10 text-sky-700 dark:text-[#8cc8ff]",
}

export function ChipEstado({ tono = "info", children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${TONOS_CHIP[tono]} ${className}`}>
      {children}
    </span>
  )
}

// Tarjeta: borde 1px y radio 16 px, fondo de tarjeta
export function TarjetaAdmin({ className = "", ...props }) {
  return <section className={`overflow-hidden rounded-2xl border border-border bg-card ${className}`} {...props} />
}

// Campo de texto con mensaje de error debajo (aria-invalid y aria-describedby enlazados)
export function CampoAdmin({ id, label, error, ayuda, ...props }) {
  const idError = error ? `${id}-error` : undefined
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</label>
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(" ") || undefined}
        className={`h-12 w-full rounded-[10px] border bg-background px-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring ${error ? "border-red-500" : "border-border"}`}
        {...props}
      />
      {ayuda && <p id={idAyuda} className="mt-1.5 text-[13px] text-muted-foreground">{ayuda}</p>}
      {error && <p id={idError} className="mt-1 text-[13px] font-semibold text-red-700 dark:text-[#ff8a80]">{error}</p>}
    </div>
  )
}

// Interruptor accesible (role="switch")
export function InterruptorAdmin({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${checked ? "border-lime-500 bg-lime-400" : "border-border bg-muted"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} aria-hidden="true" />
    </button>
  )
}

// Estado vacío: ícono, título y texto (y acción opcional)
export function EstadoVacio({ icono: Icono, titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {Icono && <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-lime-400/10 text-lime-700 dark:text-lime-400"><Icono className="h-6 w-6" aria-hidden="true" /></span>}
      <p className="text-base font-bold text-foreground">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-muted-foreground">{texto}</p>}
      {accion}
    </div>
  )
}

// Esqueleto de carga: bloques que parpadean (se respeta reducir movimiento)
export function EsqueletoAdmin({ filas = 3, className = "" }) {
  return (
    <div className={`space-y-3 p-5 ${className}`} role="status" aria-label="Cargando">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-[10px] bg-muted motion-reduce:animate-none" />
      ))}
    </div>
  )
}
