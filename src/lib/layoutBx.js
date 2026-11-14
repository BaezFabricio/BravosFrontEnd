import { createContext } from "react"

// true dentro del marco de escritorio del alumno (LayoutEscritorio). Las pantallas compartidas con otros paneles
// (como Mi perfil) lo usan para saber si les toca el diseño nuevo o el de siempre.
export const LayoutBxContext = createContext(false)

// true dentro del panel admin. Mi perfil usa el diseño de escritorio del admin (referencia 15) solo en escritorio.
export const LayoutAdminContext = createContext(false)
