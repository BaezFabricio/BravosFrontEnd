import EsqueletoPantalla from "@/components/EsqueletoPantalla"
import { lazy, Suspense } from "react"
import { useCelularActivo } from "../admin/celular/rutas"
import { panelesPermitidos } from "@/lib/paneles"
import MiConfiguracionPage from "./MiConfiguracionPage.jsx"
const Celular = lazy(() => import("../admin/celular/Preferencias.jsx"))

// Preferencias: el diseño nuevo es del admin en celular; el alumno y el profesor siguen con el de siempre.
export default function MiConfiguracionDespacho(props) {
  const celular = useCelularActivo()
  const esAdmin = panelesPermitidos().admin
  return celular && esAdmin ? <Suspense fallback={<EsqueletoPantalla />}><Celular {...props} /></Suspense> : <MiConfiguracionPage {...props} />
}
