import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

/*
 * Foto de perfil que se agranda al tocarla (con el mouse o con el dedo). Toca la foto, se abre grande en el medio
 * de la pantalla; se cierra tocando la foto, el fondo, la tecla Esc o el gesto de "atrás".
 *   - className: el círculo de la foto (tamaño, borde, color de fondo, etc.).
 *   - children: lo que se muestra si la persona no tiene foto (las iniciales). Sin foto no hay nada para ampliar.
 */
export default function FotoAmpliable({ src, alt = "", className = "", children }) {
  const [abierta, setAbierta] = useState(false)
  const hayFoto = Boolean(src && String(src).trim())

  if (!hayFoto) return <div className={className}>{children}</div>

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label={alt ? `Ver la foto de ${alt} en grande` : "Ver la foto en grande"}
        className={`${className} cursor-zoom-in transition-transform hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500`}
      >
        <img src={src} alt="" className="h-full w-full object-cover" />
      </button>

      <Dialog open={abierta} onOpenChange={setAbierta}>
        <DialogContent showCloseButton={false} className="w-auto max-w-[min(92vw,640px)] gap-0 border-0 bg-transparent p-0 shadow-none sm:max-w-[min(92vw,640px)]">
          <DialogTitle className="sr-only">{alt ? `Foto de ${alt}` : "Foto de perfil"}</DialogTitle>
          <img
            src={src}
            alt={alt}
            onClick={() => setAbierta(false)}
            className="mx-auto max-h-[80vh] w-auto max-w-full cursor-zoom-out rounded-2xl object-contain shadow-2xl"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
