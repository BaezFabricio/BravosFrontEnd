import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { DialogoNovedad, FilaNovedad } from "@/components/Novedades"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

/*
 * Novedades del box (solo para quien tiene sesión).
 * - Portada (landing): lista grande con miniatura.
 * - Módulo del alumno: lista compacta tipo diario (compacta), con un límite y un enlace a la página completa.
 * - conAviso: al entrar, si hay novedades que este dispositivo todavía no vio, aparece UN solo aviso con la lista.
 *   Tocar una fila abre su detalle. Al cerrar el aviso, se dan por vistas.
 */
const CLAVE = (id) => `bravos-novedad-vista-${id}`
const yaVista = (id) => { try { return localStorage.getItem(CLAVE(id)) === "1" } catch { return false } }
const marcarVista = (id) => { try { localStorage.setItem(CLAVE(id), "1") } catch { /* sin almacenamiento: volverá a aparecer */ } }

export default function NovedadesPortada({ conAviso = false, compacta = false, limite = null, soloAviso = false }) {
  const [lista, setLista] = useState([])
  const [abierta, setAbierta] = useState(null) // detalle de una novedad (pop-up)
  const [pendientes, setPendientes] = useState([]) // novedades nuevas para este dispositivo
  const [resumen, setResumen] = useState(false) // aviso con la lista (al entrar, o al abrirlo a mano)
  const [reabierto, setReabierto] = useState(false) // true si el alumno lo abrió con el botón (muestra todas)
  const [cargado, setCargado] = useState(false) // ya llegó la respuesta (aunque sea vacía)

  // El botón de novedades (barra del alumno) abre el aviso con todas
  useEffect(() => {
    const abrirATodas = () => {
      if (!lista.length) return
      setPendientes(lista)
      setReabierto(true)
      setResumen(true)
    }
    window.addEventListener("bravos:abrir-novedades", abrirATodas)
    return () => window.removeEventListener("bravos:abrir-novedades", abrirATodas)
  }, [lista])

  useEffect(() => {
    if (!haySesion()) return
    let vigente = true
    apiClient.get("/novedades/vigentes")
      .then((r) => {
        if (!vigente) return
        const todas = r.data?.data || r.data || []
        setLista(todas)
        setCargado(true)
        const nuevas = todas.filter((n) => !yaVista(n.idNovedad))
        if (conAviso && nuevas.length) {
          setPendientes(nuevas)
          setResumen(true)
        }
      })
      .catch(() => setCargado(true))
    return () => { vigente = false }
  }, [conAviso])

  // Sin novedades no se muestra nada, salvo en el módulo del alumno (compacta), que dice que no hay ninguna
  if (!haySesion() || (lista.length === 0 && !(compacta && cargado))) return null

  // Al cerrar el aviso de entrada, todas las que mostró quedan vistas en este dispositivo
  const cerrarResumen = () => {
    pendientes.forEach((n) => marcarVista(n.idNovedad))
    setResumen(false)
    setPendientes([])
    setReabierto(false)
  }

  const abrirDesdeResumen = (n) => {
    cerrarResumen()
    setAbierta(n)
  }

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
              {visibles.map((n) => (
                <li key={n.idNovedad}>
                  <FilaNovedad novedad={n} onAbrir={() => setAbierta(n)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Dialog open={resumen} onOpenChange={(o) => { if (!o) cerrarResumen() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-white/10 bg-zinc-950 p-6 text-white sm:max-w-lg">
          <DialogTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">Novedades del box</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/60">
            {reabierto
              ? "Todas las novedades del box. Tocá una para leerla."
              : `${pendientes.length === 1 ? "Tenés 1 novedad nueva." : `Tenés ${pendientes.length} novedades nuevas.`} Tocá una para leerla.`}
          </DialogDescription>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {pendientes.map((n) => (
              <li key={n.idNovedad}>
                <FilaNovedad novedad={n} compacta onAbrir={() => abrirDesdeResumen(n)} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={cerrarResumen}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#9be600] text-sm font-black uppercase tracking-[0.12em] text-black hover:bg-[#b5ff1a]">
            Seguir
          </button>
        </DialogContent>
      </Dialog>

      <DialogoNovedad novedad={abierta} abierta={!!abierta} onCerrar={() => setAbierta(null)} />
    </>
  )
}
