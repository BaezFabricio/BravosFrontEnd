import { useContext } from "react"
import { createPortal } from "react-dom"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { useAnchoPanel } from "@/lib/useEscritorio"

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
  const escritorio = useAnchoPanel()
  if (slot === false) {
    return (
      <>
        <h1 className={className}>{children}</h1>
        {descripcion && <p className="mt-1 text-sm text-foreground/60">{descripcion}</p>}
      </>
    )
  }
  if (slot === null) return null
  if (!escritorio) {
    // Celular y tableta: el título de siempre
    return createPortal(
      <div className="min-w-0">
        <h1 className="truncate text-lg font-black uppercase leading-tight tracking-tight text-foreground sm:text-xl">{children}</h1>
        {descripcion && <p className="hidden truncate text-xs leading-tight text-foreground/55 sm:block">{descripcion}</p>}
      </div>,
      slot
    )
  }
  return createPortal(
    <div className="min-w-0">
      <h1 className="bv-admin-titulo truncate text-foreground" style={{ margin: "2px 0px 0px", font: "800 22px Archivo" }}>{children}</h1>
      {descripcion && <p className="truncate text-muted-foreground" style={{ font: "500 13px Archivo" }}>{descripcion}</p>}
    </div>,
    slot
  )
}
