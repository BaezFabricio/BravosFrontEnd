import { createContext } from "react"

// Elemento raíz del panel (admin o alumno de escritorio) donde se montan los menús desplegables, listas y ventanas.
// Como el panel se achica con "zoom" según el ancho (ver useZoomLienzo), lo que se monta afuera quedaría más grande.
export const ContenedorPortal = createContext(null)
