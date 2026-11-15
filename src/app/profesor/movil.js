import { createContext, useContext, useEffect, useState } from "react"

// Celular del profesor: menos de 768 px (referencia 02-profesor-celular.html)
const CONSULTA_MOVIL = "(max-width: 767px)"

export function useEsMovil() {
  const [movil, setMovil] = useState(() => window.matchMedia(CONSULTA_MOVIL).matches)
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_MOVIL)
    const alCambiar = () => setMovil(consulta.matches)
    consulta.addEventListener("change", alCambiar)
    return () => consulta.removeEventListener("change", alCambiar)
  }, [])
  return movil
}

// Cabecera del celular: la pantalla dice su título, subtítulo y a dónde vuelve (flecha en lugar del logo).
// La layout la dibuja; cada página la pide con useCabeceraMovil (null = la cabecera por defecto de la ruta).
export const CabeceraMovilContext = createContext({ set: () => {} })

export function useCabeceraMovil(cabecera) {
  const { set } = useContext(CabeceraMovilContext)
  const titulo = cabecera?.titulo
  const sub = cabecera?.sub
  const conVolver = Boolean(cabecera?.onVolver)
  const volver = cabecera?.onVolver
  useEffect(() => {
    if (!titulo) { set(null); return undefined }
    set({ titulo, sub, onVolver: conVolver ? volver : null })
    return () => set(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, sub, conVolver, set])
}
