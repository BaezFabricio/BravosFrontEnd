import { LayoutDashboard, Dumbbell, GraduationCap } from "lucide-react"

// Paneles del sistema (uno por rol). Los usa la pantalla de elección y el selector del encabezado.
export const PANELES = [
  { key: "admin", label: "Administrador", descripcion: "Gestión del gimnasio", icon: LayoutDashboard, href: "/admin" },
  { key: "alumno", label: "Alumno", descripcion: "Tu panel de clases y abonos", icon: Dumbbell, href: "/alumno" },
  { key: "profesor", label: "Profesor", descripcion: "Tus rutinas y clases", icon: GraduationCap, href: "/profesor" },
]

// Fuente única de "a qué paneles puede entrar el usuario según sus permisos".
// El mismo criterio lo usan el guard de rutas, el selector de panel y el menú
// de perfil: si difieren, aparece un panel al que después no se puede entrar
// (o al revés).

const PREFIJOS_ADMIN = [
  "usuarios:", "dashboard:", "perfiles:", "membresias:",
  "clases:", "reservas:", "creditos:", "configuracion:",
]

export function getPermisos() {
  try {
    const permisos = JSON.parse(localStorage.getItem("permisos") || "[]")
    return Array.isArray(permisos) ? permisos : []
  } catch {
    return []
  }
}

export function panelesPermitidos(permisos = getPermisos()) {
  return {
    admin: permisos.some((p) => PREFIJOS_ADMIN.some((pre) => p.startsWith(pre))),
    alumno: permisos.some((p) => p.startsWith("alumno")),
    profesor: permisos.some((p) => p.startsWith("profesor")),
  }
}
