import { useEffect, useState } from "react"

// Login y registro: desde 768 px se muestra el diseño de escritorio; por debajo, el de celular
export function useEscritorio() {
  const consulta = "(min-width: 768px)"
  const [escritorio, setEscritorio] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const f = () => setEscritorio(mq.matches)
    mq.addEventListener("change", f)
    return () => mq.removeEventListener("change", f)
  }, [])
  return escritorio
}
