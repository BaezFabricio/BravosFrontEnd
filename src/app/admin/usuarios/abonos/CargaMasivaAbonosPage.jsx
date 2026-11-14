import { lazy, Suspense } from "react"
import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "../../celular/rutas"
const Escritorio = lazy(() => import("./CargaMasivaAbonosPage.escritorio.jsx"))
const Movil = lazy(() => import("./CargaMasivaAbonosPage.movil.jsx"))
const Celular = lazy(() => import("../../celular/Abonos.jsx"))

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) el diseño nuevo; la tableta sigue como estaba.
export default function CargaMasivaAbonosPageDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Suspense fallback={null}><Escritorio {...props} /></Suspense>
  return <Suspense fallback={null}>{celular ? <Celular {...props} /> : <Movil {...props} />}</Suspense>
}
