import { lazy, Suspense, useEffect } from "react"
import { precargarPantallasAdmin } from "./precarga"
import { useAnchoPanel } from "@/lib/useEscritorio"
import { useCelularActivo } from "./celular/rutas"
const Escritorio = lazy(() => import("./layout.escritorio.jsx"))
const Movil = lazy(() => import("./layout.movil.jsx"))
import LayoutCelular from "./celular/LayoutCelular.jsx"

// Desde 1024 px el diseño de escritorio; en celular (menos de 768 px) las pantallas que ya tienen el diseño nuevo usan su marco;
// el resto (y las tabletas) siguen como estaban.
export default function layoutDespacho(props) {
  const escritorio = useAnchoPanel()
  const celular = useCelularActivo()
  // Apenas se abre el panel, el resto de las pantallas se descargan en segundo plano para que al tocarlas se abran al instante
  useEffect(() => { precargarPantallasAdmin() }, [])
  if (escritorio) return <Suspense fallback={null}><Escritorio {...props} /></Suspense>
  return celular ? <LayoutCelular {...props} /> : <Movil {...props} />
}
