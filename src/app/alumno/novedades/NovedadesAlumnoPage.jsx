import { useEffect, useState } from "react"
import apiClient from "@/api"
import { DialogoNovedad, FotoNovedad, TarjetaNovedad } from "@/components/Novedades"
import { colorDe, esReciente, estiloTitulo, tipoDe } from "@/lib/novedades"

/*
 * "Todas" de las novedades del alumno: todas las publicadas (también las vencidas), las nuevas primero y destacadas,
 * y después las anteriores. Al tocar una se abre el detalle.
 */
export default function NovedadesAlumnoPage() {
  const [lista, setLista] = useState(null)
  const [abierta, setAbierta] = useState(null)

  useEffect(() => {
    let vigente = true
    apiClient.get("/novedades/historial")
      .then((r) => { if (vigente) setLista(r.data?.data || r.data || []) })
      .catch(() => { if (vigente) setLista([]) })
    return () => { vigente = false }
  }, [])

  if (lista === null) return <p className="p-6 text-sm text-muted-foreground">Cargando novedades…</p>

  // "Nuevas": publicadas en los últimos 7 días (el servidor ya las manda de la más nueva a la más vieja)
  const nuevas = lista.filter((n) => esReciente(n.fecha))
  const anteriores = lista.filter((n) => !esReciente(n.fecha))
  const [destacada, ...otrasNuevas] = nuevas

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">Novedades del box</p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">Todas las novedades</h1>
      </header>

      {lista.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Todavía no hay novedades.</p>
      )}

      {destacada && (
        <section className="space-y-4" aria-labelledby="nuevas-titulo">
          <h2 id="nuevas-titulo" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">
            <span className="h-2 w-2 rounded-full bg-[#9be600]" aria-hidden="true" /> Nuevas
          </h2>
          <button type="button" onClick={() => setAbierta(destacada)}
            className="group grid w-full overflow-hidden rounded-3xl bg-zinc-950 text-left text-white ring-1 ring-white/10 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden">
              <FotoNovedad novedad={destacada} className="transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-3 p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">Nuevo</span>
                <span>{destacada.fecha} · {tipoDe(destacada.tipo).nombre}</span>
              </div>
              <h3 className="text-[2.4rem] leading-none" style={estiloTitulo()}>{destacada.titulo}</h3>
              <p className="line-clamp-4 text-base leading-relaxed text-white/70">{destacada.texto}</p>
              <span className="mt-auto pt-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: colorDe(destacada).hex }}>Leer la novedad →</span>
            </div>
          </button>

          {otrasNuevas.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {otrasNuevas.map((n) => (
                <TarjetaNovedad key={n.idNovedad} novedad={n} onAbrir={() => setAbierta(n)} />
              ))}
            </div>
          )}
        </section>
      )}

      {anteriores.length > 0 && (
        <section className="space-y-4" aria-labelledby="anteriores-titulo">
          <h2 id="anteriores-titulo" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Anteriores</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {anteriores.map((n) => (
              <TarjetaNovedad key={n.idNovedad} novedad={n} onAbrir={() => setAbierta(n)} />
            ))}
          </div>
        </section>
      )}

      <DialogoNovedad novedad={abierta} abierta={!!abierta} onCerrar={() => setAbierta(null)} />
    </div>
  )
}
