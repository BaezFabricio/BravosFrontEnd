/*
 * Animación de carga de toda la app: bloques grises que parpadean con la forma de lo que va a aparecer.
 * Reemplaza a los textos "Cargando..." y a los círculos giratorios.
 */
export function Cargando({ filas = 3, className = '' }) {
  return (
    <div className="aparece-tarde">
      <div className={`space-y-3 animate-pulse ${className}`} role="status" aria-label="Cargando">
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
      <span role="status" aria-label="Cargando" className={`inline-block h-3 ${ancho} animate-pulse rounded bg-foreground/15 align-middle ${className}`} />
    </span>
  )
}
