import { useLocation } from "react-router-dom"
import { useAnchoCelular } from "@/lib/useEscritorio"

// Pantallas del admin que ya tienen el diseño nuevo para celular (menos de 768 px). El resto sigue como estaba.
const LISTAS = [
  /^\/admin\/clases\/editar\/\d+\/?$/,
  /^\/admin\/clases\/nueva\/?$/,
  /^\/admin\/?$/,
  /^\/admin\/mas\/?$/,
  /^\/admin\/usuarios\/?$/,
  /^\/admin\/usuarios\/nuevo\/?$/,
  /^\/admin\/usuarios\/\d+\/?$/,
  /^\/admin\/usuarios\/\d+\/editar\/?$/,
  /^\/admin\/usuarios\/abonos\/carga-masiva\/?$/,
  /^\/admin\/clases\/?$/,
  /^\/admin\/planes\/?$/,
  /^\/admin\/reportes\/?$/,
  /^\/admin\/check-in\/?$/,
  /^\/admin\/novedades\/?$/,
  /^\/admin\/ejercicios-rm\/?$/,
  /^\/admin\/avisos\/?$/,
  /^\/admin\/perfiles\/?$/,
  /^\/admin\/configuracion\/?$/,
  /^\/admin\/perfil\/?$/,
  /^\/mi-configuracion\/?$/,
]

// Pantallas de formulario: sin menú inferior ni mascota (el botón principal queda abajo)
const SIN_MENU = [
  /^\/admin\/clases\/editar\/\d+\/?$/,
  /^\/admin\/clases\/nueva\/?$/,
  /^\/admin\/usuarios\/\d+\/?$/, // ficha del usuario: el menú tapaba las acciones de abajo
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
