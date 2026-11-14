import { useAnchoPanel } from "@/lib/useEscritorio"
import Escritorio from "./CheckinAdminPage.escritorio.jsx"
import Movil from "./CheckinAdminPage.movil.jsx"

// Desde 1024 px el diseño de escritorio de la referencia; por debajo (celular y tableta) el de siempre, sin cambios.
export default function CheckinAdminPageDespacho(props) {
  const escritorio = useAnchoPanel()
  return escritorio ? <Escritorio {...props} /> : <Movil {...props} />
}
