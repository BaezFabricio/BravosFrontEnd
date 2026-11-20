import { Component } from "react"
import { useLocation } from "react-router-dom"
import { esErrorDeArchivoViejo, recuperarDeVersionVieja } from "@/lib/recuperarVersion"

/*
 * Red de seguridad de toda la app: si una pantalla falla al dibujarse, en vez de dejar todo en negro se muestra un aviso con
 * botones para reintentar o volver al inicio. Si la falla es de una versión vieja de la app (un archivo que ya no existe
 * tras una actualización), se limpia la copia guardada y se recarga sola.
 * Se reinicia sola al cambiar de pantalla.
 */
class Limite extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) {
    console.error("[pantalla] Falló al dibujarse:", error, info?.componentStack)
    if (esErrorDeArchivoViejo(error)) recuperarDeVersionVieja()
  }

  componentDidUpdate(previas) {
    if (this.state.error && previas.clave !== this.props.clave) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const viejo = esErrorDeArchivoViejo(error)
    return (
      <div role="alert" className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-5 py-10 text-foreground">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <p className="m-0 text-lg font-extrabold">{viejo ? "Actualizando la app…" : "Esta pantalla no pudo abrirse"}</p>
          <p className="mx-0 mb-5 mt-2 text-sm leading-snug text-foreground/70">
            {viejo
              ? "Hay una versión nueva. Se recarga sola; si no, tocá el botón."
              : "Algo falló al mostrarla. Probá de nuevo; si sigue igual, volvé al inicio."}
          </p>
          <div className="flex flex-col gap-2.5">
            <button type="button" onClick={() => (viejo ? window.location.reload() : this.setState({ error: null }))}
              className="h-12 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
              {viejo ? "Recargar" : "Reintentar"}
            </button>
            {!viejo && (
              <button type="button" onClick={() => { window.location.href = "/" }}
                className="h-12 rounded-xl border border-border text-sm font-bold transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
                Ir al inicio
              </button>
            )}
          </div>
          {!viejo && error?.message && <p className="mb-0 mt-4 break-words text-[0.6875rem] text-foreground/40">{String(error.message).slice(0, 160)}</p>}
        </div>
      </div>
    )
  }
}

// Para cualquier pieza suelta (por ejemplo los avisos): si falla, no se dibuja nada, pero el resto de la app sigue funcionando
class Silencioso extends Component {
  state = { fallo: false }
  static getDerivedStateFromError() { return { fallo: true } }
  componentDidCatch(error) { console.error("[pieza] Falló y se ocultó:", error) }
  render() { return this.state.fallo ? null : this.props.children }
}
export function PiezaSegura({ children }) { return <Silencioso>{children}</Silencioso> }

// Última red de seguridad, por fuera de todo (no depende del router): si algo falla fuera de las pantallas, se muestra el aviso en vez de negro
export function ErrorBoundaryRaiz({ children }) { return <Limite clave="raiz">{children}</Limite> }

// Se reinicia solo al cambiar de pantalla (la dirección es la "clave")
export default function ErrorBoundary({ children }) {
  const { pathname } = useLocation()
  return <Limite clave={pathname}>{children}</Limite>
}
