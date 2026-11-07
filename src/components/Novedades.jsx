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
    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${className}`}
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
        <div className={`flex flex-wrap items-center gap-2 font-bold uppercase tracking-[0.1em] text-white/50 ${compacta ? "text-[10px]" : "text-[11px]"}`}>
          {esReciente(novedad.fecha) && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">Nuevo</span>
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
        {novedad.fecha && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">{novedad.fecha}</p>}
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
 * Contenido del detalle de una novedad (foto, título, mensaje, vigencia, botón de enlace).
 * Titulo y Texto son los elementos del título y del mensaje: en el pop-up son los del diálogo (accesibilidad);
 * en la vista previa, elementos comunes. Si no se pasa onCerrar, no muestra el botón de cerrar.
 */
export function ContenidoNovedad({ novedad, Titulo = "h3", Texto = "p", textoBoton = "Cerrar", onCerrar }) {
  const color = colorDe(novedad)
  return (
    <>
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <FotoNovedad novedad={novedad} />
        <EtiquetaNovedad novedad={novedad} className="absolute left-4 top-4" />
      </div>
      <div className="flex flex-col gap-4 p-6">
        {novedad.fecha && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">Publicada el {novedad.fecha}</p>}
        <Titulo className="text-[2.6rem]" style={{ ...estiloTitulo(), margin: 0 }}>{novedad.titulo}</Titulo>
        <Texto className="whitespace-pre-line text-base leading-relaxed text-white/80"><TextoConEnlaces texto={novedad.texto} /></Texto>
        {novedad.hasta && <p className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: color.hex }}>Vigente hasta el {fechaCorta(novedad.hasta)}</p>}
        {novedad.enlace && (
          <a href={novedad.enlace} target="_blank" rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-2xl border-2 px-5 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
            style={{ borderColor: color.hex, color: color.hex }}>
            {novedad.enlaceTexto || "Ver más"} ↗
          </a>
        )}
        {onCerrar && (
          <button type="button" onClick={onCerrar}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black uppercase tracking-[0.12em] transition-opacity hover:opacity-90"
            style={{ backgroundColor: color.hex, color: color.texto }}>
            {textoBoton}
          </button>
        )}
      </div>
    </>
  )
}

/** Pop-up (pantalla emergente) con el detalle completo de una novedad. */
export function DialogoNovedad({ novedad, abierta, onCerrar, textoBoton = "Cerrar" }) {
  return (
    <Dialog open={abierta} onOpenChange={(o) => { if (!o) onCerrar() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto gap-0 rounded-3xl border-white/10 bg-zinc-950 p-0 text-white sm:max-w-lg">
        {novedad && (
          <ContenidoNovedad novedad={novedad} Titulo={DialogTitle} Texto={DialogDescription} textoBoton={textoBoton} onCerrar={onCerrar} />
        )}
      </DialogContent>
    </Dialog>
  )
}
