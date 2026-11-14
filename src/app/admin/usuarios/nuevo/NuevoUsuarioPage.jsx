import { lazy, Suspense } from "react"
import { useCelularActivo } from "../../celular/rutas"
const Base = lazy(() => import("./NuevoUsuarioPage.base.jsx"))
const Celular = lazy(() => import("../../celular/NuevoUsuario.jsx"))

// En celular (menos de 768 px) el diseño nuevo; en pantallas más grandes, el de siempre.
export default function NuevoUsuarioPageDespacho(props) {
  const celular = useCelularActivo()
  return <Suspense fallback={null}>{celular ? <Celular {...props} /> : <Base {...props} />}</Suspense>
}
