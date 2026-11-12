import { useAnchoPanel } from "@/lib/useEscritorio"
import DocumentosEscritorio from "./DocumentosEscritorio"
import DocumentosMovilNuevo from "./DocumentosMovilNuevo"

// Desde 1024 px: diseño de escritorio; por debajo, el del celular (DocumentosMovilNuevo)
export default function DocumentacionPage() {
  const escritorio = useAnchoPanel()
  return escritorio ? <DocumentosEscritorio /> : <DocumentosMovilNuevo />
}
