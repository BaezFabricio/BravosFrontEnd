/*
 * Animación de carga de toda la app: bloques grises que parpadean con la forma de lo que va a aparecer.
 * Reemplaza a los textos "Cargando..." y a los círculos giratorios.
 */
export function Cargando({ filas = 3, className = '' }) {
  return (
    <div className="aparece-tarde">
      <div className={`space-y-3 bv-esq ${className}`} role="status" aria-label="Cargando">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="rounded-md border border-border bg-foreground/5 p-4">
            <div className="h-4 w-2/5 rounded bg-foreground/10" />
            <div className="mt-3 h-3 w-4/5 rounded bg-foreground/10" />
            <div className="mt-2 h-3 w-3/5 rounded bg-foreground/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Una sola línea, para textos que se completan solos (nombre, número…)
export function CargandoLinea({ ancho = 'w-24', className = '' }) {
  return (
    <span className="aparece-tarde inline-block align-middle">
      <span role="status" aria-label="Cargando" className={`inline-block h-3 ${ancho} bv-esq rounded bg-foreground/15 align-middle ${className}`} />
    </span>
  )
}

/*
 * Esqueleto de una pantalla completa de panel (resumen): ocupa todo el ancho y se arma igual que la pantalla real
 * (bloque de bienvenida, cuatro datos y dos columnas), para que al cargar el contenido no cambie la forma.
 */
export function EsqueletoPagina({ className = '' }) {
  return (
    <div className={`aparece-tarde w-full ${className}`}>
      <div className="bv-esq w-full space-y-4" role="status" aria-label="Cargando">
        <div className="h-36 w-full rounded-2xl border border-border bg-foreground/[0.06]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl border border-border bg-foreground/[0.05]" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-60 rounded-2xl border border-border bg-foreground/[0.05]" />
          <div className="h-60 rounded-2xl border border-border bg-foreground/[0.05]" />
        </div>
      </div>
    </div>
  )
}
