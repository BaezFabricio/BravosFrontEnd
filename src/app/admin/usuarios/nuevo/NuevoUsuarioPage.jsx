import { useCelularActivo } from "../../celular/rutas"
import Base from "./NuevoUsuarioPage.base.jsx"
import Celular from "../../celular/NuevoUsuario.jsx"

// En celular (menos de 768 px) el diseño nuevo; en pantallas más grandes, el de siempre.
export default function NuevoUsuarioPageDespacho(props) {
  const celular = useCelularActivo()
  return celular ? <Celular {...props} /> : <Base {...props} />
}
