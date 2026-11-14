import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "./celular/rutas"
import Escritorio from "./layout.escritorio.jsx"
import Movil from "./layout.movil.jsx"
import LayoutCelular from "./celular/LayoutCelular.jsx"

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) las pantallas que ya tienen el diseño nuevo usan su marco;
// el resto (y las tabletas) siguen como estaban.
export default function layoutDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Escritorio {...props} />
  return celular ? <LayoutCelular {...props} /> : <Movil {...props} />
}
