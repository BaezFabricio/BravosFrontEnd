import { useAnchoPanel } from "@/lib/useEscritorio"
import Escritorio from "./NuevaClasePage.escritorio.jsx"
import Movil from "./NuevaClasePage.movil.jsx"

// Desde 1024 px el diseño de escritorio de la referencia; por debajo (celular y tableta) el de siempre, sin cambios.
export default function NuevaClasePageDespacho(props) {
  const escritorio = useAnchoPanel()
  return escritorio ? <Escritorio {...props} /> : <Movil {...props} />
}
