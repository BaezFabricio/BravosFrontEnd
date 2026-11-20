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
    const raiz = this.props.clave === "raiz" // la red de seguridad de toda la app tapa la pantalla; la de una pantalla deja el menú a la vista
    return (
      <div role="alert" className={`fa ${raiz ? "" : "fa-aqui"}`}>
        <div className="fa-caja">
          <img className="fa-logo" src="/logo.jpg" alt="" />
          <p className="fa-tag">{viejo ? "Hay una versión nueva" : "Algo salió mal"}</p>
          <h1 className="fa-titulo">{viejo ? "Actualizando la app" : "Esta pantalla no cargó"}</h1>
          <p className="fa-texto">
            {viejo
              ? "Se recarga sola; si no, tocá el botón."
              : "Algo falló al mostrarla. Probá de nuevo; si sigue igual, volvé al inicio."}
          </p>
          <button type="button" className="fa-boton" onClick={() => (viejo ? window.location.reload() : this.setState({ error: null }))}>
            {viejo ? "Recargar" : "Reintentar"}
          </button>
          {!viejo && (
            <button type="button" className="fa-sec" onClick={() => { window.location.href = "/" }}>Ir al inicio</button>
          )}
          {!viejo && error?.message && (
            <details className="fa-det">
              <summary>Detalle técnico</summary>
              <pre>{String(error.message).slice(0, 200)}</pre>
            </details>
          )}
        </div>
        {!viejo && raiz && <img className="fa-perro" src="/acceso/dog-t.png" alt="" />}
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
