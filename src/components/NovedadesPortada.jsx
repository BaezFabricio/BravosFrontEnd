import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { ArrowLeft } from "lucide-react"
import { DialogoNovedad, FilaNovedad, FotoNovedad, TextoConEnlaces } from "@/components/Novedades"
import { colorDe, esReciente, estiloTitulo, tipoDe } from "@/lib/novedades"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

/*
 * Novedades del box (solo para quien tiene sesión).
 * - Portada (landing): lista de las vigentes, con miniatura.
 * - Módulo del alumno: lista compacta de las vigentes (con "Ver todas" si hay más de un límite) y el aviso.
 * - Aviso (conAviso): al entrar, si hay novedades que este dispositivo todavía no vio, aparece UN solo aviso con TODAS
 *   las publicadas: las nuevas arriba y destacadas, las anteriores debajo. Se puede volver a abrir desde el botón de la barra.
 *   Tocar una fila abre su detalle. Al cerrar el aviso, se dan por vistas.
 */
const CLAVE = (id) => `bravos-novedad-vista-${id}`
const yaVista = (id) => { try { return localStorage.getItem(CLAVE(id)) === "1" } catch { return false } }
const marcarVista = (id) => { try { localStorage.setItem(CLAVE(id), "1") } catch { /* sin almacenamiento: volverá a aparecer */ } }

export default function NovedadesPortada({ conAviso = false, compacta = false, limite = null, soloAviso = false }) {
  const [historial, setHistorial] = useState([]) // todas las publicadas (vigentes y vencidas), la más nueva primero
  const [cargado, setCargado] = useState(false) // ya llegó la respuesta (aunque sea vacía)
  const [abierta, setAbierta] = useState(null) // detalle de una novedad (pop-up)
  const [resumen, setResumen] = useState(false) // aviso con la lista completa
  const [detalleAviso, setDetalleAviso] = useState(null) // novedad que se lee dentro del mismo aviso

  const lista = historial.filter((n) => n.vigente) // lo que se muestra en la portada y en el módulo

  // El botón de novedades (barra del alumno) vuelve a abrir el aviso con todas
  useEffect(() => {
    const abrirAviso = () => { if (historial.length) setResumen(true) }
    window.addEventListener("bravos:abrir-novedades", abrirAviso)
    return () => window.removeEventListener("bravos:abrir-novedades", abrirAviso)
  }, [historial])

  useEffect(() => {
    if (!haySesion()) return
    let vigente = true
    apiClient.get("/novedades/historial")
      .then((r) => {
        if (!vigente) return
        const todas = r.data?.data || r.data || []
        setHistorial(todas)
        setCargado(true)
        if (conAviso && todas.some((n) => !yaVista(n.idNovedad))) setResumen(true)
      })
      .catch(() => setCargado(true))
    return () => { vigente = false }
  }, [conAviso])

  // Sin novedades no se muestra nada, salvo en el módulo del alumno (compacta), que dice que no hay ninguna
  if (!haySesion() || (lista.length === 0 && !(compacta && cargado))) return null

  // Al cerrar el aviso, todas las que mostró quedan vistas en este dispositivo
  const cerrarResumen = () => {
    historial.forEach((n) => marcarVista(n.idNovedad))
    setResumen(false)
    setDetalleAviso(null)
  }

  const nuevas = historial.filter((n) => esReciente(n.fecha))
  const anteriores = historial.filter((n) => !esReciente(n.fecha))
  const visibles = limite ? lista.slice(0, limite) : lista

  return (
    <>
      {soloAviso ? null : compacta ? (
        <section aria-labelledby="novedades-titulo" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="novedades-titulo" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">
              <span className="h-2 w-2 rounded-full bg-[#9be600]" aria-hidden="true" />
              Novedades
            </h2>
            {limite && (
              <Link to="/alumno/novedades" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">Ver todas →</Link>
            )}
          </div>
          {lista.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-zinc-950 px-5 py-6 text-center text-sm font-bold uppercase tracking-[0.1em] text-white/50">
              No hay noticias disponibles por ahora
            </p>
          )}
          <div className={`relative ${limite && lista.length > limite ? "pb-14" : ""}`}>
            <ul className="grid gap-3 md:grid-cols-3">
              {visibles.map((n) => (
                <li key={n.idNovedad} className="rounded-xl border border-white/10 bg-zinc-950 px-3 text-white">
                  <FilaNovedad novedad={n} compacta onAbrir={() => setAbierta(n)} />
                </li>
              ))}
            </ul>
            {limite && lista.length > limite && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
                <div className="absolute inset-x-0 bottom-2 flex justify-center">
                  <Link to="/alumno/novedades" className="rounded-full border border-white/20 bg-zinc-950 px-5 py-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-white/10">
                    Ver todas las novedades →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        <section id="novedades" aria-labelledby="novedades-titulo" className="scroll-mt-24 border-t border-white/10 bg-zinc-950 py-10 text-white md:py-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="novedades-titulo" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">
              <span className="h-2 w-2 rounded-full bg-[#9be600]" aria-hidden="true" />
              Novedades
            </h2>
            <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {lista.map((n) => (
                <li key={n.idNovedad}>
                  <FilaNovedad novedad={n} onAbrir={() => setAbierta(n)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Aviso: todas las publicadas. Las nuevas arriba y destacadas; las anteriores debajo. Con scroll. */}
      <Dialog open={resumen} onOpenChange={(o) => { if (!o) cerrarResumen() }}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-3xl border-white/10 bg-zinc-950 p-0 text-white sm:max-w-lg">
          <div className="border-b border-white/10 px-6 pb-4 pt-6">
            <DialogTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">Novedades del box</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/60">
              {nuevas.length > 0 ? `${nuevas.length} ${nuevas.length === 1 ? "nueva" : "nuevas"}` : "Sin novedades nuevas"}
              {anteriores.length > 0 ? ` · ${anteriores.length} ${anteriores.length === 1 ? "anterior" : "anteriores"}` : ""}. Tocá una para leerla.
            </DialogDescription>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {detalleAviso ? (
              <article className="space-y-4">
                <button type="button" onClick={() => setDetalleAviso(null)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#9be600] hover:text-[#b5ff1a]">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a las novedades
                </button>
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
                  <FotoNovedad novedad={detalleAviso} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
                  {esReciente(detalleAviso.fecha) && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">Nuevo</span>
                  )}
                  <span>{detalleAviso.fecha} · {tipoDe(detalleAviso.tipo).nombre}</span>
                </div>
                <h3 className="text-3xl leading-tight" style={estiloTitulo()}>{detalleAviso.titulo}</h3>
                <p className="whitespace-pre-line text-base leading-relaxed text-white/80">
                  <TextoConEnlaces texto={detalleAviso.texto} />
                </p>
                {detalleAviso.hasta && (
                  <p className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: colorDe(detalleAviso).hex }}>
                    Vigente hasta el {detalleAviso.hasta}
                  </p>
                )}
                {detalleAviso.enlace && (
                  <a href={detalleAviso.enlace} target="_blank" rel="noopener noreferrer"
                    className="flex h-12 w-full items-center justify-center rounded-2xl border-2 px-5 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
                    style={{ borderColor: colorDe(detalleAviso).hex, color: colorDe(detalleAviso).hex }}>
                    {detalleAviso.enlaceTexto || "Ver más"} ↗
                  </a>
                )}
              </article>
            ) : (<>
            {nuevas.length > 0 && (
              <>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9be600]">Nuevas</p>
                <ul className="space-y-2">
                  {nuevas.map((n) => (
                    <li key={n.idNovedad} className="rounded-xl border border-[#9be600]/40 bg-zinc-900 px-3 shadow-[0_0_0_1px_rgba(155,230,0,0.08)]">
                      <FilaNovedad novedad={n} compacta onAbrir={() => setDetalleAviso(n)} />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {anteriores.length > 0 && (
              <>
                <p className="mb-2 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Anteriores</p>
                <ul className="space-y-2">
                  {anteriores.map((n) => (
                    <li key={n.idNovedad} className="rounded-xl border border-white/10 bg-zinc-950 px-3">
                      <FilaNovedad novedad={n} compacta onAbrir={() => setDetalleAviso(n)} />
                    </li>
                  ))}
                </ul>
              </>
            )}
            </>)}
          </div>

          <div className="border-t border-white/10 p-4">
            <button type="button" onClick={cerrarResumen}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#9be600] text-sm font-black uppercase tracking-[0.12em] text-black hover:bg-[#b5ff1a]">
              Seguir
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogoNovedad novedad={abierta} abierta={!!abierta} onCerrar={() => setAbierta(null)} />
    </>
  )
}
