import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

/**
 * "Volver" de todo el sistema: vuelve a la pantalla anterior si se llegó desde otra del sitio;
 * si se entró directo (un enlace, recargar la página), va a "a" en lugar de salir de la app.
 */
export function useVolver(a = "/") {
  const navigate = useNavigate()
  return () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate(a, { replace: true }))
}

/**
 * Botón "Volver" con un solo aspecto en todos los módulos: píldora con flecha y texto,
 * en su propia fila arriba del contenido. En computadora es más chico (lg:), para gastar menos alto; en el
 * celular mantiene el tamaño de un botón táctil.
 */
export function BotonVolver({ a = "/", texto = "Volver", className = "" }) {
  const volver = useVolver(a)
  return (
    <button type="button" onClick={volver}
      className={`flex min-h-[40px] w-fit shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold lg:min-h-[30px] lg:gap-1 lg:px-3 lg:text-xs text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${className}`}>
      <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" aria-hidden="true" />
      {texto}
    </button>
  )
}
