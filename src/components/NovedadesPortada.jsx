import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { DialogoNovedad, FilaNovedad, FotoNovedad, TextoConEnlaces } from "@/components/Novedades"
import { colorDe, esReciente, estiloTitulo, tipoDe } from "@/lib/novedades"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { EnlaceVer, Insignia, Vacio } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"

/*
 * Novedades del box (solo para quien tiene sesión).
 * - Portada (landing): lista de las vigentes, con miniatura.
 * - Módulo del alumno: lista compacta de las vigentes (con "Ver todas" si hay más de un límite) y el aviso.
 * - Aviso (conAviso): al entrar, si hay novedades que este dispositivo todavía no vio, aparece UNA sola ventana con TODAS
 *   las publicadas, completas (foto, texto y links), una abajo de otra: las nuevas primero y destacadas.
 *   Se puede volver a abrir desde el botón de la barra. Al cerrarla, se dan por vistas.
 */
const CLAVE = (id) => `bravos-novedad-vista-${id}`
const yaVista = (id) => { try { return localStorage.getItem(CLAVE(id)) === "1" } catch { return false } }
const marcarVista = (id) => { try { localStorage.setItem(CLAVE(id), "1") } catch { /* sin almacenamiento: volverá a aparecer */ } }

/* Una novedad completa dentro del aviso. */
function ArticuloAviso({ novedad, nueva }) {
  const color = colorDe(novedad)
  return (
    <article className={`px-6 py-6 ${nueva ? "bg-zinc-900/60" : ""}`}>
      <div className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black ${nueva ? "ring-1 ring-[#9be600]/50" : ""}`}>
        <FotoNovedad novedad={novedad} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-white/50">
        {nueva && <span className="rounded-full bg-white px-2 py-0.5 text-[0.625rem] font-black text-black">Nuevo</span>}
        <span>{novedad.fecha} · {tipoDe(novedad.tipo).nombre}</span>
      </div>
      <h3 className="mt-2 text-3xl leading-tight" style={estiloTitulo()}>{novedad.titulo}</h3>
      <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-white/80">
        <TextoConEnlaces texto={novedad.texto} />
      </p>
      {novedad.hasta && (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em]" style={{ color: color.hex }}>Vigente hasta el {novedad.hasta}</p>
      )}
      {novedad.enlace && (
        <a href={novedad.enlace} target="_blank" rel="noopener noreferrer"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border-2 px-5 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
          style={{ borderColor: color.hex, color: color.hex }}>
          {novedad.enlaceTexto || "Ver más"} ↗
        </a>
      )}
    </article>
  )
}

// variante "bx": diseño del módulo Alumno en escritorio (handoff, pantalla 01). Misma lógica, otra presentación.
export default function NovedadesPortada({ conAviso = false, compacta = false, limite = null, soloAviso = false, variante }) {
  const [historial, setHistorial] = useState([]) // todas las publicadas (vigentes y vencidas), la más nueva primero
  const [cargado, setCargado] = useState(false) // ya llegó la respuesta (aunque sea vacía)
  const [abierta, setAbierta] = useState(null) // detalle de una novedad (pop-up de las listas)
  const [resumen, setResumen] = useState(false) // aviso con todas las novedades

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
    let espera = null
    // Si la guía de Bravo está pendiente o abierta (panel del alumno), el aviso espera a que termine: dos ventanas
    // a la vez se pisan (la ventana de novedades bloquea los toques de la guía y no se podía avanzar ni saltarla).
    const abrirCuandoLibre = () => {
      if (!vigente) return
      const guia = window.__bravosGuia
      if (guia === "pendiente" || guia === "activa") { espera = setTimeout(abrirCuandoLibre, 400); return }
      setResumen(true)
    }
    apiClient.get("/novedades/historial")
      .then((r) => {
        if (!vigente) return
        const todas = r.data?.data || r.data || []
        setHistorial(todas)
        setCargado(true)
        if (conAviso && todas.some((n) => !yaVista(n.idNovedad))) abrirCuandoLibre()
      })
      .catch(() => setCargado(true))
    return () => { vigente = false; if (espera) clearTimeout(espera) }
  }, [conAviso])

  // Sin novedades no se muestra nada, salvo en el módulo del alumno (compacta), que dice que no hay ninguna
  if (!haySesion() || (lista.length === 0 && !(compacta && cargado))) return null

  // Al cerrar el aviso, todas las que mostró quedan vistas en este dispositivo
  const cerrarResumen = () => {
    historial.forEach((n) => marcarVista(n.idNovedad))
    setResumen(false)
  }

  const nuevas = historial.filter((n) => esReciente(n.fecha))
  const anteriores = historial.filter((n) => !esReciente(n.fecha))
  const visibles = limite ? lista.slice(0, limite) : lista

  return (
    <>
      {soloAviso ? null : compacta && variante === "bx" ? (
        <section aria-labelledby="novedades-titulo">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="novedades-titulo" className="text-lg font-bold text-bx-ink">Novedades</h2>
            {limite && <EnlaceVer to="/alumno/novedades">Ver todas</EnlaceVer>}
          </div>
          {lista.length === 0 && <Vacio titulo="No hay noticias disponibles por ahora" />}
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))] gap-3 p-0">
            {visibles.map((n) => (
              <li key={n.idNovedad}>
                <button
                  type="button"
                  onClick={() => setAbierta(n)}
                  className="flex h-full w-full items-center gap-3.5 rounded-xl border border-bx-line bg-bx-card p-3.5 text-left text-bx-ink transition-colors hover:border-bx-lima hover:bg-bx-surf"
                >
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-[0.625rem] ${n.tipo === "noticia" ? "bg-bx-chip text-bx-lima" : "bg-bx-tile text-bx-ok-fg"}`}>
                    <Ico d={n.tipo === "noticia" ? IC.news : IC.mega} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {esReciente(n.fecha) && <Insignia>NUEVO</Insignia>}
                      <span className="text-xs font-medium text-bx-muted">{n.fecha} · {tipoDe(n.tipo).nombre}</span>
                    </span>
                    <span className="mt-1 block truncate text-[0.9375rem] font-bold">{n.titulo}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : compacta ? (
        <section aria-labelledby="novedades-titulo" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="novedades-titulo" className="flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-lime-700 dark:text-[#9be600]">
              <span className="h-2 w-2 rounded-full bg-lime-700 dark:bg-[#9be600]" aria-hidden="true" />
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
            <h2 id="novedades-titulo" className="flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-[#9be600]">
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

      {/* Aviso: todas las novedades completas, en una sola ventana con scroll. Las nuevas primero y destacadas. */}
      <Dialog open={resumen} onOpenChange={(o) => { if (!o) cerrarResumen() }}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-3xl border-white/10 bg-zinc-950 p-0 text-white sm:max-w-2xl">
          <div className="border-b border-white/10 px-6 pb-4 pt-6">
            <DialogTitle className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-[#9be600]">Novedades del box</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/60">
              {nuevas.length > 0 ? `${nuevas.length} ${nuevas.length === 1 ? "nueva" : "nuevas"}` : "Sin novedades nuevas"}
              {anteriores.length > 0 ? ` · ${anteriores.length} ${anteriores.length === 1 ? "anterior" : "anteriores"}` : ""}.
            </DialogDescription>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {nuevas.length > 0 && (
              <>
                <p className="px-6 pt-5 text-[0.625rem] font-black uppercase tracking-[0.2em] text-[#9be600]">Nuevas</p>
                {nuevas.map((n) => (
                  <ArticuloAviso key={n.idNovedad} novedad={n} nueva />
                ))}
              </>
            )}
            {anteriores.length > 0 && (
              <>
                <p className="px-6 pt-5 text-[0.625rem] font-black uppercase tracking-[0.2em] text-white/40">Anteriores</p>
                {anteriores.map((n) => (
                  <ArticuloAviso key={n.idNovedad} novedad={n} />
                ))}
              </>
            )}
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
