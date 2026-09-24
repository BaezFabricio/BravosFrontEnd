import { useEffect, useMemo, useState } from "react"
import { Plus, Trophy, Trash2, ChevronDown, Dumbbell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/lib/notificar"
import apiClient from "@/api"
import { logrosConEstado, sincronizarLogros } from "@/lib/logros"
import LogroCelebracion from "@/components/LogroCelebracion"

const TIPOS = [
  { value: "peso", label: "Peso (kg)" },
  { value: "repeticiones", label: "Repeticiones" },
  { value: "tiempo", label: "Tiempo" },
]

const hoyLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const fmtTiempo = (seg) => {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = Math.round(seg % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`
}

const fmtValor = (tipo, v) =>
  tipo === "peso" ? `${v} kg` : tipo === "tiempo" ? fmtTiempo(v) : `${v} reps`

// "4:32" → 272 · "1:02:10" → 3730 · "90" → 90 (segundos)
const parseTiempo = (txt) => {
  const partes = String(txt).trim().split(":").map(Number)
  if (partes.length === 0 || partes.some((n) => Number.isNaN(n) || n < 0)) return null
  return partes.reduce((acc, n) => acc * 60 + n, 0)
}

const fmtFecha = (f) =>
  new Date(`${f}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })

const fmtSerie = (tipo, s) => {
  if (tipo === "peso") return `${s.repeticiones ? `${s.repeticiones} × ` : ""}${s.peso} kg`
  if (tipo === "repeticiones") return `${s.repeticiones} reps`
  return fmtTiempo(s.tiempoSeg)
}

const serieVacia = () => ({ repeticiones: "", peso: "", tiempo: "" })

const inputCls =
  "w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 transition-colors"
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5"

const VISIBLES = 3

function FilaMarca({ m, tipo, onEliminar }) {
  return (
    <div className="px-4 py-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-foreground">{fmtValor(tipo, m.valorMejor)}</span>
          {m.esPR ? (
            <span className="text-[9px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400 border border-lime-400/30 bg-lime-400/10 px-1.5 py-px">PR</span>
          ) : null}
          <span className="text-xs text-muted-foreground">{fmtFecha(m.fecha)}</span>
        </div>
        <ul className="mt-2 space-y-0.5">
          {m.series.map((s) => (
            <li key={s.numero} className="flex items-baseline gap-2 text-sm">
              <span className="w-16 shrink-0 text-[10px] font-black uppercase tracking-widest text-foreground/40">Serie {s.numero}</span>
              <span className="font-semibold text-foreground">{fmtSerie(tipo, s)}</span>
            </li>
          ))}
        </ul>
        {m.notas && <p className="text-xs text-foreground/40 mt-1.5 italic">{m.notas}</p>}
      </div>
      <button onClick={() => onEliminar(m)} title="Eliminar"
        className="shrink-0 p-1.5 text-foreground/30 hover:text-red-700 dark:hover:text-red-400 transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function FormularioMarca({ ejercicios, onClose, onGuardada }) {
  const [idSel, setIdSel] = useState("")
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [tipoNuevo, setTipoNuevo] = useState("peso")
  const [modo, setModo] = useState("simple")
  const [nSeries, setNSeries] = useState("3")
  const [simple, setSimple] = useState(serieVacia())
  const [series, setSeries] = useState([serieVacia()])
  const [fecha, setFecha] = useState(hoyLocal())
  const [notas, setNotas] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const esOtro = idSel === "otro"
  const ejercicio = ejercicios.find((e) => String(e.idCatalogo) === idSel)
  const tipo = esOtro ? tipoNuevo : ejercicio?.tipoMarca

  const setSerie = (i, campo, valor) =>
    setSeries((prev) => prev.map((s, idx) => (idx === i ? { ...s, [campo]: valor } : s)))

  const construirSeries = () => {
    const filas =
      modo === "simple"
        ? Array.from({ length: Math.max(1, Math.min(30, Number(nSeries) || 1)) }, () => simple)
        : series
    const out = []
    for (const f of filas) {
      if (tipo === "peso") out.push({ peso: f.peso, repeticiones: f.repeticiones })
      else if (tipo === "repeticiones") out.push({ repeticiones: f.repeticiones })
      else {
        const seg = parseTiempo(f.tiempo)
        if (!seg) return null
        out.push({ tiempoSeg: seg })
      }
    }
    return out
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!idSel) return toast.error("Elegí un ejercicio")
    if (esOtro && !nombreNuevo.trim()) return toast.error("Escribí el nombre del ejercicio")
    const armadas = construirSeries()
    if (!armadas) return toast.error("Revisá el tiempo: usá el formato mm:ss (ej. 4:32)")
    try {
      setGuardando(true)
      const body = {
        fecha,
        notas: notas.trim() || undefined,
        series: armadas,
        ...(esOtro ? { nombreNuevo: nombreNuevo.trim(), tipoMarca: tipoNuevo } : { idCatalogo: Number(idSel) }),
      }
      const res = await apiClient.post("/marcas", body)
      setResultado(res.data?.data || res.data)
      onGuardada()
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar la marca")
    } finally {
      setGuardando(false)
    }
  }

  if (resultado) {
    const r = resultado
    const mejora =
      r.esPR && !r.primera && r.mejorPrevio != null
        ? r.tipoMarca === "tiempo"
          ? `Bajaste ${fmtTiempo(r.mejorPrevio - r.valorMejor)}`
          : `Mejoraste +${Math.round((r.valorMejor - r.mejorPrevio) * 100) / 100}${r.tipoMarca === "peso" ? " kg" : " reps"}`
        : null
    return (
      <div className="text-center py-6 space-y-4">
        <style>{`
          @keyframes prPop { 0% { transform: scale(0) rotate(-20deg) } 60% { transform: scale(1.25) rotate(6deg) } 100% { transform: scale(1) rotate(0) } }
          @keyframes prRing { 0% { transform: scale(.7); opacity: .7 } 100% { transform: scale(2); opacity: 0 } }
        `}</style>
        <div className="relative mx-auto w-16 h-16">
          {r.esPR && <span className="absolute inset-0 rounded-2xl border-2 border-lime-400" style={{ animation: "prRing 1.2s ease-out 0.4s 2" }} />}
          <div className="relative w-16 h-16 rounded-2xl bg-lime-400/20 flex items-center justify-center" style={{ animation: "prPop 0.7s cubic-bezier(.2,.9,.3,1.3) both" }}>
            <Trophy className="h-8 w-8 text-lime-700 dark:text-lime-400" />
          </div>
        </div>
        {r.esPR ? (
          <>
            <p className="text-2xl font-black text-lime-700 dark:text-lime-400 uppercase tracking-tight">¡Nuevo PR!</p>
            <p className="text-lg font-bold text-foreground">{fmtValor(r.tipoMarca, r.valorMejor)}</p>
            {r.primera ? (
              <p className="text-sm text-muted-foreground">Es tu primera marca en este ejercicio.</p>
            ) : (
              mejora && <p className="text-sm text-muted-foreground">{mejora}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xl font-black text-foreground uppercase">Marca guardada</p>
            <p className="text-sm text-muted-foreground">
              Tu mejor marca sigue siendo {fmtValor(r.tipoMarca, r.mejorPrevio)}. ¡A seguir!
            </p>
          </>
        )}
        <Button onClick={onClose} className="bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wide">
          Listo
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label className={labelCls}>Ejercicio</label>
        <select className={inputCls} value={idSel} onChange={(e) => setIdSel(e.target.value)}>
          <option value="">Elegí un ejercicio…</option>
          <optgroup label="Ejercicios">
            {ejercicios.filter((e) => !e.propio).map((e) => (
              <option key={e.idCatalogo} value={e.idCatalogo}>{e.nombre}</option>
            ))}
          </optgroup>
          {ejercicios.some((e) => e.propio) && (
            <optgroup label="Mis ejercicios">
              {ejercicios.filter((e) => e.propio).map((e) => (
                <option key={e.idCatalogo} value={e.idCatalogo}>{e.nombre}</option>
              ))}
            </optgroup>
          )}
          <option value="otro">Otro (escribir ejercicio)</option>
        </select>
      </div>

      {esOtro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nombre del ejercicio</label>
            <input className={inputCls} value={nombreNuevo} maxLength={100} placeholder="Ej. Sentadilla búlgara"
              onChange={(e) => setNombreNuevo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Tipo de marca</label>
            <select className={inputCls} value={tipoNuevo} onChange={(e) => setTipoNuevo(e.target.value)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {tipo && (
        <>
          <div className="flex items-center justify-between">
            <label className={`${labelCls} mb-0`}>Series</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 border border-border rounded-md w-52">
              {[["simple", "Simple"], ["detallada", "Detallada"]].map(([m, label]) => (
                <button key={m} type="button" onClick={() => setModo(m)}
                  className={`py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-center transition-colors ${
                    modo === m
                      ? "bg-lime-400 text-black shadow-sm"
                      : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {modo === "simple" ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Series</label>
                <input type="number" min="1" max="30" className={inputCls} value={nSeries} onChange={(e) => setNSeries(e.target.value)} />
              </div>
              {tipo !== "tiempo" && (
                <div>
                  <label className={labelCls}>Reps</label>
                  <input type="number" min="1" className={inputCls} value={simple.repeticiones}
                    onChange={(e) => setSimple({ ...simple, repeticiones: e.target.value })} />
                </div>
              )}
              {tipo === "peso" && (
                <div>
                  <label className={labelCls}>Peso (kg)</label>
                  <input type="number" min="0" step="0.5" className={inputCls} value={simple.peso}
                    onChange={(e) => setSimple({ ...simple, peso: e.target.value })} />
                </div>
              )}
              {tipo === "tiempo" && (
                <div className="col-span-2">
                  <label className={labelCls}>Tiempo (mm:ss)</label>
                  <input className={inputCls} placeholder="4:32" value={simple.tiempo}
                    onChange={(e) => setSimple({ ...simple, tiempo: e.target.value })} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {series.map((s, i) => (
                <div key={i} className="flex items-end gap-2">
                  <span className="w-6 pb-2 text-xs font-black text-foreground/40">{i + 1}</span>
                  {tipo !== "tiempo" && (
                    <div className="flex-1">
                      {i === 0 && <label className={labelCls}>Reps</label>}
                      <input type="number" min="1" className={inputCls} value={s.repeticiones}
                        onChange={(e) => setSerie(i, "repeticiones", e.target.value)} />
                    </div>
                  )}
                  {tipo === "peso" && (
                    <div className="flex-1">
                      {i === 0 && <label className={labelCls}>Peso (kg)</label>}
                      <input type="number" min="0" step="0.5" className={inputCls} value={s.peso}
                        onChange={(e) => setSerie(i, "peso", e.target.value)} />
                    </div>
                  )}
                  {tipo === "tiempo" && (
                    <div className="flex-1">
                      {i === 0 && <label className={labelCls}>Tiempo (mm:ss)</label>}
                      <input className={inputCls} placeholder="4:32" value={s.tiempo}
                        onChange={(e) => setSerie(i, "tiempo", e.target.value)} />
                    </div>
                  )}
                  <button type="button" disabled={series.length === 1}
                    onClick={() => setSeries((p) => p.filter((_, idx) => idx !== i))}
                    className="p-2 text-foreground/30 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-20 transition-colors"
                    title="Quitar serie">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {series.length < 30 && (
                <button type="button" onClick={() => setSeries((p) => [...p, { ...p[p.length - 1] }])}
                  className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground border border-dashed border-border px-3 py-1.5 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Agregar serie
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" max={hoyLocal()} className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Notas (opcional)</label>
          <input className={inputCls} maxLength={255} placeholder="Ej. con cinturón, versión RX" value={notas}
            onChange={(e) => setNotas(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={guardando || !tipo}
        className="w-full bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wide">
        {guardando ? "Guardando..." : "Guardar marca"}
      </Button>
    </form>
  )
}

export default function MarcasPage() {
  const [marcas, setMarcas] = useState([])
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [expandido, setExpandido] = useState({})
  const [logrosNuevos, setLogrosNuevos] = useState([])
  const [aEliminar, setAEliminar] = useState(null)
  const [cerrados, setCerrados] = useState({})

  const cargar = async () => {
    try {
      const [m, e] = await Promise.all([apiClient.get("/marcas"), apiClient.get("/marcas/ejercicios")])
      setMarcas(m.data?.data || [])
      setEjercicios(e.data?.data || [])
    } catch {
      toast.error("No se pudieron cargar tus marcas")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Tras guardar una marca: revisar si desbloqueó algún logro de marcas (los de clases se sincronizan en el dashboard)
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

  const eliminar = async () => {
    const m = aEliminar
    setAEliminar(null)
    if (!m) return
    try {
      await apiClient.delete(`/marcas/${m.idMarca}`)
      toast.success("Marca eliminada")
      cargar()
    } catch {
      toast.error("No se pudo eliminar la marca")
    }
  }

  // Agrupa el historial por ejercicio (las marcas ya vienen de la más nueva a la más vieja)
  const grupos = useMemo(() => {
    const map = new Map()
    marcas.forEach((m) => {
      if (!map.has(m.idCatalogo)) map.set(m.idCatalogo, { idCatalogo: m.idCatalogo, nombre: m.nombre, tipo: m.tipoMarca, marcas: [] })
      map.get(m.idCatalogo).marcas.push(m)
    })
    return [...map.values()].map((g) => {
      const mejor = g.marcas.reduce((a, b) =>
        (g.tipo === "tiempo" ? b.valorMejor < a.valorMejor : b.valorMejor > a.valorMejor) ? b : a
      )
      return { ...g, mejor }
    })
  }, [marcas])

  return (
    <div className="space-y-6">
      <LogroCelebracion logros={abierto || aEliminar ? [] : logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Mis marcas</h1>
          <p className="text-sm text-muted-foreground mt-1">Registrá tus marcas personales y mirá cómo progresás.</p>
        </div>
        <Button onClick={() => setAbierto(true)}
          className="shrink-0 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wide">
          <Plus className="h-4 w-4 mr-1" /> Nueva marca
        </Button>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground animate-pulse">Cargando tus marcas...</p>
      ) : grupos.length === 0 ? (
        <Card className="bg-card border-border p-10 text-center">
          <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold text-foreground">Todavía no registraste marcas</p>
          <p className="text-sm text-muted-foreground mt-1">Cargá tu primera marca y desbloqueá el logro "Primer PR".</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {grupos.map((g) => {
            const abiertoG = !!expandido[g.idCatalogo]
            const visibles = g.marcas.slice(0, VISIBLES)
            const resto = g.marcas.slice(VISIBLES)
            return (
              <Card key={g.idCatalogo} className="bg-card border-border overflow-hidden gap-0 py-0">
                <button
                  onClick={() => setCerrados((p) => ({ ...p, [g.idCatalogo]: !p[g.idCatalogo] }))}
                  aria-expanded={!cerrados[g.idCatalogo]}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-black text-foreground uppercase tracking-tight truncate">{g.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {g.marcas.length} marca{g.marcas.length !== 1 ? "s" : ""} · última {fmtFecha(g.marcas[0].fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Mejor</p>
                      <p className="text-xl font-black text-lime-700 dark:text-lime-400">{fmtValor(g.tipo, g.mejor.valorMejor)}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-foreground/40 transition-transform duration-300 ${cerrados[g.idCatalogo] ? "" : "rotate-180"}`} />
                  </div>
                </button>

                <div className={`grid transition-all duration-300 ease-out ${cerrados[g.idCatalogo] ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
                  <div className="overflow-hidden min-h-0">
                <div className="border-t border-border divide-y divide-border">
                  {visibles.map((m) => <FilaMarca key={m.idMarca} m={m} tipo={g.tipo} onEliminar={setAEliminar} />)}
                </div>

                {resto.length > 0 && (
                  <>
                    <div className={`grid transition-all duration-300 ease-out ${abiertoG ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden min-h-0">
                        <div className="border-t border-border divide-y divide-border">
                          {resto.map((m) => <FilaMarca key={m.idMarca} m={m} tipo={g.tipo} onEliminar={setAEliminar} />)}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setExpandido((p) => ({ ...p, [g.idCatalogo]: !p[g.idCatalogo] }))}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-border text-[11px] font-bold uppercase tracking-wider text-foreground/50 hover:text-foreground hover:bg-foreground/[0.03] transition-colors">
                      {abiertoG ? "Ver menos" : `Ver historial completo (${g.marcas.length})`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${abiertoG ? "rotate-180" : ""}`} />
                    </button>
                  </>
                )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!aEliminar} onOpenChange={(o) => { if (!o) setAEliminar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">¿Eliminar esta marca?</DialogTitle>
            <DialogDescription>
              {aEliminar ? `Se va a borrar la marca de ${fmtValor(aEliminar.tipoMarca, aEliminar.valorMejor)} del ${fmtFecha(aEliminar.fecha)}. Esta acción no se puede deshacer.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button onClick={eliminar} className="bg-red-600 hover:bg-red-500 text-white font-bold">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Nueva marca</DialogTitle>
          </DialogHeader>
          {abierto && (
            <FormularioMarca ejercicios={ejercicios} onClose={() => setAbierto(false)} onGuardada={() => { cargar(); revisarLogros() }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
