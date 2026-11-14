import { useAnchoPanel } from "@/lib/useEscritorio"
import Escritorio from "./DetalleUsuarioPage.escritorio.jsx"
import Movil from "./DetalleUsuarioPage.movil.jsx"

// Desde 1024 px el diseño de escritorio de la referencia; por debajo (celular y tableta) el de siempre, sin cambios.
export default function DetalleUsuarioPageDespacho(props) {
  const escritorio = useAnchoPanel()
  return escritorio ? <Escritorio {...props} /> : <Movil {...props} />
}
