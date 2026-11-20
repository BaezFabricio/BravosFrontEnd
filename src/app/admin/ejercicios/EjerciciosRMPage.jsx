import EsqueletoPantalla from "@/components/EsqueletoPantalla"
import { lazy, Suspense } from "react"
import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "../celular/rutas"
const Escritorio = lazy(() => import("./EjerciciosRMPage.escritorio.jsx"))
const Movil = lazy(() => import("./EjerciciosRMPage.movil.jsx"))
const Celular = lazy(() => import("../celular/Ejercicios.jsx"))

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) el diseño nuevo; la tableta sigue como estaba.
export default function EjerciciosRMPageDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  if (escritorio) return <Suspense fallback={<EsqueletoPantalla />}><Escritorio {...props} /></Suspense>
  return <Suspense fallback={<EsqueletoPantalla />}>{celular ? <Celular {...props} /> : <Movil {...props} />}</Suspense>
}
