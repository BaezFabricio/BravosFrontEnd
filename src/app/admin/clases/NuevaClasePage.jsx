import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "../celular/rutas"
import Escritorio from "./NuevaClasePage.escritorio.jsx"
import Movil from "./NuevaClasePage.movil.jsx"
import Celular from "../celular/CrearClase.jsx"

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) la clase nueva usa el diseño nuevo
// (editar una clase sigue como estaba); la tableta sigue como estaba.
export default function NuevaClasePageDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Escritorio {...props} />
  return celular ? <Celular {...props} /> : <Movil {...props} />
}
