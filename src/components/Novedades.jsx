import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { colorDe, estiloTitulo, tipoDe } from "@/lib/novedades"

/*
 * Piezas compartidas de las novedades del box: la tarjeta con foto, la etiqueta, el título y el pop-up de detalle.
 * Cada novedad tiene su color y su tipografía (los elige el administrador). Mismo diseño en la portada y en la administración.
 */

/** Foto de la novedad; si no tiene, un bloque del color elegido con el título. */
export function FotoNovedad({ novedad, className = "" }) {
  const color = colorDe(novedad)
  if (novedad.imagen) {
    return <img src={novedad.imagen} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  }
  return (
    <div className={`flex h-full w-full items-end ${className}`} style={{ backgroundColor: color.hex, color: color.texto }}>
      <span className="p-4" style={{ ...estiloTitulo(novedad), fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>{tipoDe(novedad.tipo).nombre}</span>
    </div>
  )
}

export function EtiquetaNovedad({ novedad, className = "" }) {
  const color = colorDe(novedad)
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${className}`}
      style={{ backgroundColor: color.hex, color: color.texto }}>
      {tipoDe(novedad.tipo).nombre}
    </span>
  )
}

/** Tarjeta grande con foto, como las promociones de las apps de compras. Toda la tarjeta es un botón. */
export function TarjetaNovedad({ novedad, onAbrir, className = "" }) {
  const color = colorDe(novedad)
  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-3xl bg-zinc-900 text-left text-white ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${className}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <FotoNovedad novedad={novedad} className="transition-transform duration-500 group-hover:scale-105" />
        <EtiquetaNovedad novedad={novedad} className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {novedad.fecha && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">{novedad.fecha}</p>}
        <h3 className="text-[2rem]" style={estiloTitulo(novedad)}>{novedad.titulo}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-white/70">{novedad.texto}</p>
        <span className="mt-auto pt-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: color.hex }}>Ver más →</span>
      </div>
    </button>
  )
}

/** Texto del mensaje con los links clicables (solo http y https; el resto se muestra como texto). */
export function TextoConEnlaces({ texto }) {
  return String(texto || "").split(/(https?:\/\/[^\s<>"']+)/g).map((parte, i) => (
    i % 2 === 1
      ? <a key={i} href={parte} target="_blank" rel="noopener noreferrer" className="break-all font-bold underline underline-offset-4 text-[#9be600]">{parte}</a>
      : <span key={i}>{parte}</span>
  ))
}

/** Pop-up (pantalla emergente) con el detalle completo de una novedad. */
export function DialogoNovedad({ novedad, abierta, onCerrar, textoBoton = "Cerrar" }) {
  const color = novedad ? colorDe(novedad) : null
  return (
    <Dialog open={abierta} onOpenChange={(o) => { if (!o) onCerrar() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto gap-0 rounded-3xl border-white/10 bg-zinc-950 p-0 text-white sm:max-w-lg">
        {novedad && (
          <>
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <FotoNovedad novedad={novedad} />
              <EtiquetaNovedad novedad={novedad} className="absolute left-4 top-4" />
            </div>
            <div className="flex flex-col gap-4 p-6">
              {novedad.fecha && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">Publicada el {novedad.fecha}</p>}
              <DialogTitle className="text-[2.6rem]" style={estiloTitulo(novedad)}>{novedad.titulo}</DialogTitle>
              <DialogDescription className="whitespace-pre-line text-base leading-relaxed text-white/80"><TextoConEnlaces texto={novedad.texto} /></DialogDescription>
              {novedad.hasta && <p className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: color.hex }}>Vigente hasta el {novedad.hasta}</p>}
              {novedad.enlace && (
                <a href={novedad.enlace} target="_blank" rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center rounded-2xl border-2 px-5 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
                  style={{ borderColor: color.hex, color: color.hex }}>
                  {novedad.enlaceTexto || "Ver más"} ↗
                </a>
              )}
              <button type="button" onClick={onCerrar}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black uppercase tracking-[0.12em] transition-opacity hover:opacity-90"
                style={{ backgroundColor: color.hex, color: color.texto }}>
                {textoBoton}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
