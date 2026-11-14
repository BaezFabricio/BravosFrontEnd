import { useLocation } from "react-router-dom"
import { useAnchoCelular } from "@/lib/useEscritorio"

// Pantallas del admin que ya tienen el diseño nuevo para celular (menos de 768 px). El resto sigue como estaba.
const LISTAS = [
  /^\/admin\/usuarios\/nuevo\/?$/,
  /^\/admin\/clases\/?$/,
  /^\/admin\/planes\/?$/,
  /^\/admin\/?$/,
  /^\/admin\/mas\/?$/,
  /^\/admin\/usuarios\/?$/,
]

// Pantallas de formulario: sin menú inferior ni mascota (el botón principal queda abajo)
const SIN_MENU = [
  /^\/admin\/usuarios\/nuevo\/?$/,
]
export const sinMenuCelular = (pathname) => SIN_MENU.some((x) => x.test(pathname))

export const esRutaCelular = (pathname) => LISTAS.some((r) => r.test(pathname))

/** true si hay que mostrar el diseño nuevo de celular en la ruta actual */
export function useCelularActivo() {
  const celular = useAnchoCelular()
  const { pathname } = useLocation()
  return celular && esRutaCelular(pathname)
}
