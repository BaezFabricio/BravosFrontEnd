import EsqueletoPantalla from "@/components/EsqueletoPantalla"
import { lazy, Suspense } from "react"
import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "../celular/rutas"
const Escritorio = lazy(() => import("./PlanesPage.escritorio.jsx"))
const Movil = lazy(() => import("./PlanesPage.movil.jsx"))
const Celular = lazy(() => import("../celular/Planes.jsx"))

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) el diseño nuevo; la tableta sigue como estaba.
export default function PlanesPageDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Suspense fallback={<EsqueletoPantalla />}><Escritorio {...props} /></Suspense>
  return <Suspense fallback={<EsqueletoPantalla />}>{celular ? <Celular {...props} /> : <Movil {...props} />}</Suspense>
}
