import { createContext } from "react"

/*
 * Lugar del título de la pantalla en la barra de arriba (header) de un panel. Ver components/TituloPagina.jsx.
 *   false: no hay barra de título (sitio público, panel del alumno); null: el panel todavía no lo tiene listo; nodo: dónde dibujar.
 */
export const SlotTituloContext = createContext(false)
