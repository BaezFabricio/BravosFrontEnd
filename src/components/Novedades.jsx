import { ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { colorDe, esReciente, estiloTitulo, tipoDe } from "@/lib/novedades"

/*
 * Piezas compartidas de las novedades del box: la foto, la etiqueta, la fila de la portada, la tarjeta de la administración
 * y el detalle (pop-up). La vista previa de la administración usa las mismas piezas que ve el alumno.
 */

/** Foto de la novedad; si no tiene, un bloque del color elegido con el nombre del tipo (solo en la miniatura). */
export function FotoNovedad({ novedad, className = "", pequena = false }) {
  const color = colorDe(novedad)
  if (novedad.imagen) {
    return <img src={novedad.imagen} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  }
  return (
    <div className={`flex h-full w-full items-end ${className}`} style={{ backgroundColor: color.hex, color: color.texto }}>
      {pequena && <span className="p-2" style={{ ...estiloTitulo(), fontSize: "1.1rem" }}>{tipoDe(novedad.tipo).nombre}</span>}
    </div>
  )
}

export function EtiquetaNovedad({ novedad, className = "" }) {
  const color = colorDe(novedad)
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[0.625rem] font-black uppercase tracking-[0.14em] ${className}`}
      style={{ backgroundColor: color.hex, color: color.texto }}>
      {tipoDe(novedad.tipo).nombre}
    </span>
  )
}

/** Fecha yyyy-mm-dd (como llega del servidor) a dd/mm/aaaa. */
const fechaCorta = (iso) => {
  const [a, m, d] = String(iso || "").slice(0, 10).split("-")
  return a && m && d ? `${d}/${m}/${a}` : iso
}

/** Fila de la lista de la portada: miniatura, etiqueta "Nuevo", fecha · tipo y título. */
export function FilaNovedad({ novedad, onAbrir, compacta = false }) {
  return (
    <button type="button" onClick={onAbrir}
      className={`group flex w-full items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600] ${compacta ? "gap-3 py-3" : "gap-4 py-4 md:gap-5"}`}>
      <div className={`shrink-0 overflow-hidden rounded-lg ${compacta ? "h-12 w-16" : "h-20 w-28 rounded-xl md:h-24 md:w-36"}`}>
        <FotoNovedad novedad={novedad} pequena className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`flex flex-wrap items-center gap-2 font-bold uppercase tracking-[0.1em] text-white/50 ${compacta ? "text-[0.625rem]" : "text-[0.6875rem]"}`}>
          {esReciente(novedad.fecha) && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[0.625rem] font-black text-black">Nuevo</span>
          )}
          <span>{novedad.fecha} · {tipoDe(novedad.tipo).nombre}</span>
        </div>
        <p className={`${compacta ? "mt-0.5 line-clamp-2 text-base" : "mt-1.5 line-clamp-2 text-xl md:text-2xl"}`} style={{ ...estiloTitulo(), lineHeight: 1.05 }}>{novedad.titulo}</p>
      </div>
    </button>
  )
}

/** Tarjeta grande con foto, para la grilla de la administración. Toda la tarjeta es un botón. */
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
        {novedad.fecha && <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white/50">{novedad.fecha}</p>}
        <h3 className="text-[2rem]" style={estiloTitulo()}>{novedad.titulo}</h3>
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

/**
 * Detalle de una novedad (pop-up), estilo noticia: encabezado con título, fecha y enlace externo;
 * cuerpo con scroll (foto y texto); y un botón "Cerrar" abajo. El color de la novedad marca la línea del encabezado y el botón.
 */
export function DialogoNovedad({ novedad, abierta, onCerrar, textoBoton = "Cerrar" }) {
  const color = novedad ? colorDe(novedad) : null
  return (
    <Dialog open={abierta} onOpenChange={(o) => { if (!o) onCerrar() }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border-white/10 bg-zinc-950 p-0 text-white sm:max-w-2xl">
        {novedad && (
          <>
            <div className="flex items-start gap-4 bg-zinc-900 px-5 py-4" style={{ boxShadow: `inset 0 -2px 0 ${color.hex}` }}>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-2xl leading-tight" style={estiloTitulo()}>{novedad.titulo}</DialogTitle>
                <p className="mt-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  {novedad.fecha} · {tipoDe(novedad.tipo).nombre}
                </p>
              </div>
              {novedad.enlace && (
                <a href={novedad.enlace} target="_blank" rel="noopener noreferrer"
                  aria-label={novedad.enlaceTexto || "Abrir enlace"} title={novedad.enlaceTexto || "Abrir enlace"}
                  className="mr-8 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                  <ExternalLink className="h-5 w-5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                <FotoNovedad novedad={novedad} />
              </div>
              <DialogDescription className="whitespace-pre-line p-5 text-base leading-relaxed text-white/80">
                <TextoConEnlaces texto={novedad.texto} />
              </DialogDescription>
              {novedad.hasta && (
                <p className="px-5 pb-5 text-xs font-bold uppercase tracking-[0.1em]" style={{ color: color.hex }}>
                  Vigente hasta el {fechaCorta(novedad.hasta)}
                </p>
              )}
            </div>

            <div className="border-t border-white/10 bg-zinc-900 p-3">
              <button type="button" onClick={onCerrar}
                className="flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-black uppercase tracking-[0.12em] transition-opacity hover:opacity-90"
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
