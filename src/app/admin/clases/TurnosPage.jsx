import EsqueletoPantalla from "@/components/EsqueletoPantalla"
import { lazy, Suspense } from "react"
import { useAnchoPanel } from "@/lib/useEscritorio"
const Escritorio = lazy(() => import("./TurnosPage.escritorio.jsx"))
const Movil = lazy(() => import("./TurnosPage.movil.jsx"))

// Desde 1024 px el diseño de escritorio de la referencia; por debajo (celular y tableta) el de siempre, sin cambios.
export default function TurnosPageDespacho(props) {
  const escritorio = useAnchoPanel()
  return <Suspense fallback={<EsqueletoPantalla />}>{escritorio ? <Escritorio {...props} /> : <Movil {...props} />}</Suspense>
}
