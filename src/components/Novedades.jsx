import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ESTILO_TITULO, tipoDe } from "@/lib/novedades"

/*
 * Piezas compartidas de las novedades del box: la tarjeta con foto, la etiqueta de tipo y el pop-up de detalle.
 * Mismo diseño en la portada (alumnos) y en la administración.
 */

/** Foto de la novedad; si no tiene, un bloque de color con el nombre del tipo. */
export function FotoNovedad({ novedad, className = "" }) {
  const t = tipoDe(novedad.tipo)
  if (novedad.imagen) {
    return <img src={novedad.imagen} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  }
  return (
    <div className={`flex h-full w-full items-end ${t.fondo} ${className}`}>
      <span className="p-4 text-black/80" style={{ ...ESTILO_TITULO, fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>{t.nombre}</span>
    </div>
  )
}

export function EtiquetaNovedad({ tipo, className = "" }) {
  const t = tipoDe(tipo)
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${t.etiqueta} ${className}`}>
      {t.nombre}
    </span>
  )
}

/** Tarjeta grande con foto, como las promociones de las apps de compras. Toda la tarjeta es un botón. */
export function TarjetaNovedad({ novedad, onAbrir, className = "" }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-3xl bg-zinc-900 text-left text-white ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-[#9be600]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600] ${className}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <FotoNovedad novedad={novedad} className="transition-transform duration-500 group-hover:scale-105" />
        <EtiquetaNovedad tipo={novedad.tipo} className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {novedad.fecha && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">{novedad.fecha}</p>}
        <h3 className="text-[2rem]" style={ESTILO_TITULO}>{novedad.titulo}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-white/70">{novedad.texto}</p>
        <span className="mt-auto pt-2 text-xs font-black uppercase tracking-[0.14em] text-[#9be600]">Ver más →</span>
      </div>
    </button>
  )
}

/** Pop-up (pantalla emergente) con el detalle completo de una novedad. */
export function DialogoNovedad({ novedad, abierta, onCerrar, textoBoton = "Cerrar" }) {
  return (
    <Dialog open={abierta} onOpenChange={(o) => { if (!o) onCerrar() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto gap-0 rounded-3xl border-white/10 bg-zinc-950 p-0 text-white sm:max-w-lg">
        {novedad && (
          <>
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <FotoNovedad novedad={novedad} />
              <EtiquetaNovedad tipo={novedad.tipo} className="absolute left-4 top-4" />
            </div>
            <div className="flex flex-col gap-4 p-6">
              {novedad.fecha && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">Publicada el {novedad.fecha}</p>}
              <DialogTitle className="text-[2.6rem]" style={ESTILO_TITULO}>{novedad.titulo}</DialogTitle>
              <DialogDescription className="whitespace-pre-line text-base leading-relaxed text-white/80">{novedad.texto}</DialogDescription>
              {novedad.hasta && <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9be600]">Vigente hasta el {novedad.hasta}</p>}
              <button type="button" onClick={onCerrar}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-[#9be600] px-5 text-sm font-black uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#b4f01a]">
                {textoBoton}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
