import EsqueletoPantalla from "@/components/EsqueletoPantalla"
import { lazy, Suspense } from "react"
import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "../celular/rutas"
const Escritorio = lazy(() => import("./NuevaClasePage.escritorio.jsx"))
const Movil = lazy(() => import("./NuevaClasePage.movil.jsx"))
const Celular = lazy(() => import("../celular/CrearClase.jsx"))

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) la clase nueva usa el diseño nuevo
// (editar una clase sigue como estaba); la tableta sigue como estaba.
export default function NuevaClasePageDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Suspense fallback={<EsqueletoPantalla />}><Escritorio {...props} /></Suspense>
  return <Suspense fallback={<EsqueletoPantalla />}>{celular ? <Celular {...props} /> : <Movil {...props} />}</Suspense>
}
