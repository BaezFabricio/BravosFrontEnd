import { lazy, Suspense } from "react"
import { useAnchoPanel } from "@/lib/useEscritorio"
const Escritorio = lazy(() => import("./DatosBancarios.escritorio.jsx"))
const Movil = lazy(() => import("./DatosBancarios.movil.jsx"))

// Desde 1024 px el diseño de escritorio de la referencia; por debajo (celular y tableta) el de siempre, sin cambios.
export default function DatosBancariosDespacho(props) {
  const escritorio = useAnchoPanel()
  return <Suspense fallback={null}>{escritorio ? <Escritorio {...props} /> : <Movil {...props} />}</Suspense>
}
