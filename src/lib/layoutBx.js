import { createContext } from "react"

// true dentro del marco de escritorio del alumno (LayoutEscritorio). Las pantallas compartidas con otros paneles
// (como Mi perfil) lo usan para saber si les toca el diseño nuevo o el de siempre.
export const LayoutBxContext = createContext(false)
