import { useContext } from "react"
import { createPortal } from "react-dom"
import { SlotTituloContext } from "@/lib/slotTitulo"

/*
 * Título de cada pantalla, con su descripción. En los paneles de administrador y profesor no se dibuja en el cuerpo de
 * la página sino en la barra de arriba (header), para ahorrar alto. El layout del panel ofrece ese lugar
 * (SlotTituloContext) y cada pantalla escribe su título con <TituloPagina descripcion="...">, que lo lleva allí.
 *   - context false:  no hay panel con barra de título (sitio público, panel del alumno): se dibuja normal en la página.
 *   - context null:   el panel todavía no tiene el lugar listo (primer instante): no se dibuja nada para evitar un parpadeo.
 *   - context nodo:   se dibuja dentro de la barra. La descripción se ve desde pantallas medianas (en el celular no entra).
 */
export function TituloPagina({ children, descripcion, className = "text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl" }) {
  const slot = useContext(SlotTituloContext)
  if (slot === false) {
    return (
      <>
        <h1 className={className}>{children}</h1>
        {descripcion && <p className="mt-1 text-sm text-foreground/60">{descripcion}</p>}
      </>
    )
  }
  if (slot === null) return null
  return createPortal(
    <div className="min-w-0">
      <h1 className="truncate text-lg font-black uppercase leading-tight tracking-tight text-foreground sm:text-xl">{children}</h1>
      {descripcion && <p className="hidden truncate text-xs leading-tight text-foreground/55 sm:block">{descripcion}</p>}
    </div>,
    slot
  )
}
