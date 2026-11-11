import { useAnchoPanel } from "@/lib/useEscritorio"
import MiPlanMovil from "./MiPlanMovil"
import MiPlanEscritorio from "./MiPlanEscritorio"

// Desde 1024 px: diseño de escritorio; por debajo, el del celular (MiPlanMovil.jsx)
export default function MiPlanPage() {
  const escritorio = useAnchoPanel()
  return escritorio ? <MiPlanEscritorio /> : <MiPlanMovil />
}
