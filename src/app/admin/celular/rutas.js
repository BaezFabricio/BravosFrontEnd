import { useLocation } from "react-router-dom"
import { useAnchoCelular } from "@/lib/useEscritorio"

// Pantallas del admin que ya tienen el diseño nuevo para celular (menos de 768 px). El resto sigue como estaba.
const LISTAS = [/^\/admin\/?$/, /^\/admin\/mas\/?$/]

export const esRutaCelular = (pathname) => LISTAS.some((r) => r.test(pathname))

/** true si hay que mostrar el diseño nuevo de celular en la ruta actual */
export function useCelularActivo() {
  const celular = useAnchoCelular()
  const { pathname } = useLocation()
  return celular && esRutaCelular(pathname)
}
