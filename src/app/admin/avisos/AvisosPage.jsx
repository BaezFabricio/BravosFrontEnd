import { useAnchoPanel } from "@/lib/useEscritorio"
import Escritorio from "./AvisosPage.escritorio.jsx"
import Movil from "./AvisosPage.movil.jsx"

// Desde 1024 px el diseño de escritorio de la referencia; por debajo (celular y tableta) el de siempre, sin cambios.
export default function AvisosPageDespacho(props) {
  const escritorio = useAnchoPanel()
  return escritorio ? <Escritorio {...props} /> : <Movil {...props} />
}
