import { useLocation } from "react-router-dom"
import { useAnchoCelular } from "@/lib/useEscritorio"

// Pantallas del admin que ya tienen el diseño nuevo para celular (menos de 768 px). El resto sigue como estaba.
const LISTAS = [
  /^\/mi-configuracion\/?$/,
  /^\/admin\/perfil\/?$/,
  /^\/admin\/configuracion\/?$/,
  /^\/admin\/perfiles\/?$/,
  /^\/admin\/avisos\/?$/,
  /^\/admin\/ejercicios-rm\/?$/,
  /^\/admin\/novedades\/?$/,
  /^\/admin\/check-in\/?$/,
  /^\/admin\/reportes\/?$/,
  /^\/admin\/usuarios\/abonos\/carga-masiva\/?$/,
  /^\/admin\/usuarios\/\d+\/?$/,
  /^\/admin\/usuarios\/\d+\/editar\/?$/,
  /^\/admin\/usuarios\/nuevo\/?$/,
  /^\/admin\/clases\/?$/,
  /^\/admin\/planes\/?$/,
  /^\/admin\/?$/,
  /^\/admin\/mas\/?$/,
  /^\/admin\/usuarios\/?$/,
]
const SIN_MENU = [
  /^\/mi-configuracion\/?$/,
  /^\/admin\/perfil\/?$/,
  /^\/admin\/usuarios\/\d+\/editar\/?$/,
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
