import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "../celular/rutas"
import Escritorio from "./UsuariosPage.escritorio.jsx"
import Movil from "./UsuariosPage.movil.jsx"
import Celular from "../celular/Usuarios.jsx"

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) el diseño nuevo; la tableta sigue como estaba.
export default function UsuariosPageDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Escritorio {...props} />
  return celular ? <Celular {...props} /> : <Movil {...props} />
}
