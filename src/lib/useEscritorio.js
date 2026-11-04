import { useEffect, useState } from "react"

// Login y registro: desde 768 px se muestra el diseño de escritorio; por debajo, el de celular.
// Las pantallas de estado del acceso (verificar cuenta, recuperar acceso, elegir módulo) usan useAnchoAcceso: desde 900 px.
function useConsulta(consulta) {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const f = () => setCoincide(mq.matches)
    mq.addEventListener("change", f)
    return () => mq.removeEventListener("change", f)
  }, [consulta])
  return coincide
}

export const useEscritorio = () => useConsulta("(min-width: 768px)")
export const useAnchoAcceso = () => useConsulta("(min-width: 900px)")
