import { useCelularActivo } from "../admin/celular/rutas"
import { panelesPermitidos } from "@/lib/paneles"
import MiConfiguracionPage from "./MiConfiguracionPage.jsx"
import Celular from "../admin/celular/Preferencias.jsx"

// Preferencias: el diseño nuevo es del admin en celular; el alumno y el profesor siguen con el de siempre.
export default function MiConfiguracionDespacho(props) {
  const celular = useCelularActivo()
  const esAdmin = panelesPermitidos().admin
  return celular && esAdmin ? <Celular {...props} /> : <MiConfiguracionPage {...props} />
}
