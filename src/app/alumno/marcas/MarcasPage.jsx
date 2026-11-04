import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Dumbbell, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/lib/notificar"
import apiClient from "@/api"
import { logrosConEstado, sincronizarLogros } from "@/lib/logros"
import { formatearValor } from "@/lib/ranking"
import LogroCelebracion from "@/components/LogroCelebracion"
import { Cargando } from "@/components/Cargando"
import { TituloPagina } from "@/components/TituloPagina"
import RankingBox from "../ranking/RankingBox"

/*
 * Mis RM: elegís el ejercicio, ponés el peso y guardás. En la otra pestaña está el ranking del box.
 * Los ejercicios los carga el administrador (Ejercicios del RM).
 */

const hoyLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const fmtFecha = (f) => new Date(`${f}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })

// "4:32" → 272 · "1:02:10" → 3730 · "90" → 90 (segundos)
const parseTiempo = (txt) => {
  const partes = String(txt).trim().split(":").map(Number)
  if (partes.length === 0 || partes.some((n) => Number.isNaN(n) || n < 0)) return null
  return partes.reduce((acc, n) => acc * 60 + n, 0)
}

const ETIQUETA = { peso: "Peso (kg)", repeticiones: "Repeticiones", tiempo: "Tiempo (min:seg)" }
const PLACEHOLDER = { peso: "100", repeticiones: "20", tiempo: "4:32" }
const VISIBLES = 3

const etiquetaCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
const campoCls = "h-12 w-full rounded-xl border border-border bg-background/60 px-3.5 text-base font-bold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-foreground/30 focus:border-lime-500"

export default function MarcasPage() {
  const [params, setParams] = useSearchParams()
  const vista = params.get("vista") === "ranking" ? "ranking" : "mis"
  const [marcas, setMarcas] = useState([])
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [idEj, setIdEj] = useState("") // ejercicio abierto en la ventana de carga
  const [valor, setValor] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [verTodas, setVerTodas] = useState({})
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos") // todos | con | sin RM cargado
  const [aEliminar, setAEliminar] = useState(null)
  const [logrosNuevos, setLogrosNuevos] = useState([])

  const cargar = async () => {
    try {
      const [m, e] = await Promise.all([apiClient.get("/marcas"), apiClient.get("/marcas/ejercicios")])
      setMarcas(m.data?.data || [])
      setEjercicios(e.data?.data || [])
    } catch {
      toast.error("No se pudieron cargar tus RM")
    } finally {
      setCargando(false)
    }
  }
  useEffect(() => { cargar() }, [])

  const ejercicio = ejercicios.find((e) => String(e.idCatalogo) === String(idEj))
  const tipo = ejercicio?.tipoMarca || "peso"
  const abrirEjercicio = (e) => { setValor(""); setIdEj(String(e.idCatalogo)) }
  const cerrarEjercicio = () => { setIdEj(""); setValor("") }

  // Tras guardar: revisar si desbloqueó algún logro de marcas (los de clases se sincronizan en el dashboard)
  const revisarLogros = async () => {
    try {
      const r = await apiClient.get("/marcas/resumen")
      const stats = { totalClases: 0, racha: 0, ...(r.data?.data || r.data) }
      const cumplidos = logrosConEstado(stats).filter((l) => l.completado).map((l) => l.codigo)
      const nuevos = await sincronizarLogros(cumplidos)
      if (nuevos.length) setLogrosNuevos((prev) => [...prev, ...nuevos])
    } catch {
      /* sin logros nuevos */
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!ejercicio || guardando) return
    let serie
    if (tipo === "peso") {
      const peso = Number(String(valor).replace(",", "."))
      if (!(peso > 0 && peso < 1000)) { toast.error("Poné un peso válido (en kg)"); return }
      serie = { peso, repeticiones: 1 }
    } else if (tipo === "repeticiones") {
      const reps = Number(valor)
      if (!Number.isInteger(reps) || reps <= 0) { toast.error("Poné una cantidad de repeticiones válida"); return }
      serie = { repeticiones: reps }
    } else {
      const seg = parseTiempo(valor)
      if (!seg || seg <= 0) { toast.error("Poné un tiempo válido, por ejemplo 4:32"); return }
      serie = { tiempoSeg: seg }
    }
    setGuardando(true)
    try {
      const res = await apiClient.post("/marcas", { idCatalogo: ejercicio.idCatalogo, fecha: hoyLocal(), series: [serie] })
      const r = res.data?.data || res.data
      if (r.esPR) toast.success(r.primera ? `Primer RM de ${ejercicio.nombre}: ${formatearValor(tipo, r.valorMejor)}` : `¡Nuevo RM! ${ejercicio.nombre}: ${formatearValor(tipo, r.valorMejor)}`)
      else toast.info(`Guardado. Tu mejor RM sigue siendo ${formatearValor(tipo, r.mejorPrevio)}.`)
      setValor("")
      cerrarEjercicio()
      await cargar()
      revisarLogros()
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar el RM")
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    const m = aEliminar
    setAEliminar(null)
    if (!m) return
    try {
      await apiClient.delete(`/marcas/${m.idMarca}`)
      toast.success("RM eliminado")
      cargar()
    } catch {
      toast.error("No se pudo eliminar el RM")
    }
  }

  // Historial por ejercicio (las marcas ya vienen de la más nueva a la más vieja)
  const grupos = useMemo(() => {
    const map = new Map()
    marcas.forEach((m) => {
      if (!map.has(m.idCatalogo)) map.set(m.idCatalogo, { idCatalogo: m.idCatalogo, nombre: m.nombre, tipo: m.tipoMarca, marcas: [] })
      map.get(m.idCatalogo).marcas.push(m)
    })
    return [...map.values()].map((g) => {
      const mejor = g.marcas.reduce((a, b) => ((g.tipo === "tiempo" ? b.valorMejor < a.valorMejor : b.valorMejor > a.valorMejor) ? b : a))
      return { ...g, mejor }
    })
  }, [marcas])

  const ejerciciosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const cargados = new Set(marcas.map((m) => m.idCatalogo))
    return ejercicios.filter((e) => (!q || String(e.nombre).toLowerCase().includes(q)) && (filtro === "todos" || (filtro === "con") === cargados.has(e.idCatalogo)))
  }, [ejercicios, marcas, busqueda, filtro])

  const cambiarVista = (v) => setParams(v === "ranking" ? { vista: "ranking" } : {}, { replace: true })

  return (
    <div className="space-y-4">
      <LogroCelebracion logros={aEliminar ? [] : logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />
      <TituloPagina descripcion={"Cargá tu RM de cada ejercicio y mirá cómo estás en el ranking del box."}>Mis RM</TituloPagina>

      <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border p-1" role="tablist" aria-label="Mis RM o ranking">
        {[["mis", "Mis RM"], ["ranking", "Ranking"]].map(([clave, texto]) => (
          <button key={clave} type="button" role="tab" aria-selected={vista === clave} onClick={() => cambiarVista(clave)}
            className={`h-11 rounded-lg text-sm font-black uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${vista === clave ? "bg-lime-400 text-black" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}>
            {texto}
          </button>
        ))}
      </div>

      {vista === "ranking" ? (
        <RankingBox />
      ) : cargando ? (
        <Cargando filas={3} className="py-2" />
      ) : ejercicios.length === 0 ? (
        <Card data-guia="marcas-lista" className="border-border bg-card p-10 text-center">
          <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-bold text-foreground">Todavía no hay ejercicios cargados</p>
          <p className="mt-1 text-sm text-muted-foreground">El box los va a agregar pronto y vas a poder cargar tu RM de cada uno.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un ejercicio" aria-label="Buscar ejercicio"
                className="h-12 w-full rounded-xl border border-border bg-background/60 pl-10 pr-3 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm" />
            </div>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar ejercicios"
              className="h-12 w-full rounded-xl border border-border bg-background/60 px-3 text-base font-bold text-foreground outline-none focus:border-lime-500 sm:text-sm">
              <option value="todos">Todos los ejercicios</option>
              <option value="con">Con RM cargado</option>
              <option value="sin">Sin RM cargado</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground">Tocá un ejercicio para cargar o actualizar tu RM.</p>
          <div data-guia="marcas-lista" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {ejerciciosFiltrados.map((e) => {
              const g = grupos.find((x) => x.idCatalogo === e.idCatalogo)
              return (
                <button key={e.idCatalogo} type="button" data-guia={e === ejercicios[0] ? "marcas-nueva" : undefined} onClick={() => abrirEjercicio(e)}
                  className={`flex min-h-[118px] flex-col justify-between rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${g ? "border-lime-500/40 bg-lime-400/[0.06] hover:border-lime-500" : "border-border bg-card hover:border-lime-500/60"}`}>
                  <span className="text-sm font-black uppercase leading-tight tracking-tight text-foreground">{e.nombre}</span>
                  {g ? (
                    <span>
                      <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-lime-700 dark:text-lime-400">Tu RM</span>
                      <span className="block text-2xl font-black leading-none tabular-nums text-lime-700 dark:text-lime-400">{formatearValor(g.tipo, g.mejor.valorMejor)}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-bold text-foreground/50"><Plus className="h-4 w-4" aria-hidden="true" /> Cargar</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Cargar / actualizar el RM de un ejercicio, con su historial */}
      <Dialog open={!!ejercicio} onOpenChange={(o) => { if (!o) cerrarEjercicio() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {ejercicio && (() => {
            const g = grupos.find((x) => x.idCatalogo === ejercicio.idCatalogo)
            const todas = !!verTodas[ejercicio.idCatalogo]
            const visibles = g ? (todas ? g.marcas : g.marcas.slice(0, VISIBLES)) : []
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-black uppercase tracking-tight">{ejercicio.nombre}</DialogTitle>
                  <DialogDescription>{g ? `Tu RM actual: ${formatearValor(tipo, g.mejor.valorMejor)}` : "Todavía no cargaste ningún RM de este ejercicio."}</DialogDescription>
                </DialogHeader>
                <form onSubmit={guardar} className="space-y-3">
                  <div>
                    <label htmlFor="rm-valor" className={etiquetaCls}>{ETIQUETA[tipo]}</label>
                    <input id="rm-valor" autoFocus value={valor} onChange={(e) => setValor(e.target.value)} inputMode={tipo === "tiempo" ? "text" : "decimal"} placeholder={PLACEHOLDER[tipo]} className={campoCls} />
                  </div>
                  <Button type="submit" disabled={!valor || guardando}
                    className="h-12 w-full rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black hover:bg-lime-300 disabled:opacity-40">
                    {guardando ? "Guardando…" : "Guardar RM"}
                  </Button>
                </form>
                {g && (
                  <div>
                    <p className={etiquetaCls}>Historial</p>
                    <ul className="overflow-hidden rounded-xl border border-border">
                      {visibles.map((m) => (
                        <li key={m.idMarca} className="flex items-center gap-3 border-b border-border/60 px-3.5 py-2 last:border-b-0">
                          <span className="min-w-0 flex-1 text-sm text-muted-foreground">{fmtFecha(m.fecha)}</span>
                          {m.esPR ? <span className="rounded border border-lime-400/30 bg-lime-400/10 px-1.5 py-px text-[9px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">RM</span> : null}
                          <span className="text-sm font-black tabular-nums text-foreground">{formatearValor(g.tipo, m.valorMejor)}</span>
                          <button type="button" onClick={() => setAEliminar({ ...m, tipoMarca: g.tipo })} aria-label={`Eliminar el RM del ${fmtFecha(m.fecha)}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ul>
                    {g.marcas.length > VISIBLES && (
                      <button type="button" onClick={() => setVerTodas((p) => ({ ...p, [ejercicio.idCatalogo]: !p[ejercicio.idCatalogo] }))}
                        className="mt-2 w-full text-center text-[11px] font-bold uppercase tracking-wider text-foreground/50 hover:text-foreground">
                        {todas ? "Ver menos" : `Ver todo el historial (${g.marcas.length})`}
                      </button>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!aEliminar} onOpenChange={(o) => { if (!o) setAEliminar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">¿Eliminar este RM?</DialogTitle>
            <DialogDescription>
              {aEliminar ? `Se va a borrar el RM de ${formatearValor(aEliminar.tipoMarca, aEliminar.valorMejor)} del ${fmtFecha(aEliminar.fecha)}. Esta acción no se puede deshacer.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button onClick={eliminar} className="bg-red-600 font-bold text-white hover:bg-red-500">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
