import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  User,
  History,
  CalendarDays,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import apiClient from "@/api"
import { toast } from '@/lib/notificar'
import { Cargando } from '@/components/Cargando'
import { TituloPagina } from "@/components/TituloPagina"

export default function ClasesPage() {
  const [search, setSearch] = useState("")
  const [clases, setClases] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [permisos, setPermisos] = useState([])
  const [pestana, setPestana] = useState("clases")
  const [planFiltro, setPlanFiltro] = useState("all")

  const [deleteDialog, setDeleteDialog] = useState({ open: false, clase: null })

  const obtenerDatos = async () => {
    try {
      setLoading(true)
      setError("")
      // Los tipos de clase son opcionales: si fallan, la pantalla igual muestra las clases.
      const [resClases, resPlanes] = await Promise.allSettled([
        apiClient.get("/clases"),
        apiClient.get("/tipos-clase"),
      ])
      if (resClases.status === "rejected") throw resClases.reason
      setClases(resClases.value.data?.data || resClases.value.data || [])
      const listaPlanes = resPlanes.status === "fulfilled" ? (resPlanes.value.data?.data || []) : []
      setPlanes(listaPlanes)
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    obtenerDatos()
    const storedPermisos = localStorage.getItem("permisos")
    if (storedPermisos) {
      try { setPermisos(JSON.parse(storedPermisos)) } catch { }
    }
  }, [])

  const ahora = new Date()
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`

  const DIAS_NUM = { DOMINGO:0, LUNES:1, MARTES:2, MIERCOLES:3, JUEVES:4, VIERNES:5, SABADO:6 }

  // Devuelve la próxima fecha en que cae un día de la semana dado (hoy si la clase aún no pasó, o la próxima semana)
  const proximaFecha = (diasStr, horaInicioStr) => {
    if (!diasStr) return null
    const diasArr = diasStr.split(',').map(d => d.trim().toUpperCase())
    const base = new Date(); base.setSeconds(0, 0)
    let minDiff = null
    for (const dia of diasArr) {
      const td = DIAS_NUM[dia]
      if (td === undefined) continue
      let diff = (td - base.getDay() + 7) % 7
      // Si es hoy pero la hora ya pasó, empujar a la próxima semana
      if (diff === 0 && horaInicioStr) {
        const [hh, mm] = horaInicioStr.split(':').map(Number)
        const claseHoy = new Date(); claseHoy.setHours(hh, mm, 0, 0)
        if (base >= claseHoy) diff = 7
      }
      if (minDiff === null || diff < minDiff) minDiff = diff
    }
    if (minDiff === null) return null
    const f = new Date(); f.setHours(0,0,0,0); f.setDate(f.getDate() + minDiff)
    return f
  }

  // Una clase única "ya pasó" si su fecha es anterior a hoy,
  // o si es hoy pero su hora de fin ya transcurrió.
  const yaTermino = (clase) => {
    if (!clase.fechaEspecifica) return false
    const fecha = clase.fechaEspecifica.split('T')[0]
    if (fecha < hoy) return true
    if (fecha === hoy && clase.horaFin) {
      const [h, m] = clase.horaFin.split(':').map(Number)
      const fin = new Date(); fin.setHours(h, m, 0, 0)
      return ahora > fin
    }
    return false
  }

  const clasesFiltradas = clases.filter((clase) => {
    const matchBusqueda =
      clase.nombreClase?.toLowerCase().includes(search.toLowerCase()) ||
      clase.tipoClase?.toLowerCase().includes(search.toLowerCase()) ||
      clase.estado?.toLowerCase().includes(search.toLowerCase()) ||
      clase.nombreProfesor?.toLowerCase().includes(search.toLowerCase())
    return matchBusqueda && !yaTermino(clase)
  })

  const historialClasesUnicas = clases
    .filter((clase) => {
      const matchBusqueda =
        clase.nombreClase?.toLowerCase().includes(search.toLowerCase()) ||
        clase.nombreProfesor?.toLowerCase().includes(search.toLowerCase())
      return matchBusqueda && yaTermino(clase)
    })
    .sort((a, b) => b.fechaEspecifica.localeCompare(a.fechaEspecifica))

  const clasesAgrupadas = useMemo(() => {
    const grupos = {}
    // Un grupo por tipo de clase (CrossFit, Planificación Atleta…). Los tipos desactivados sin clases no se muestran.
    planes.forEach(t => {
      grupos[t.codigo] = { plan: { idPlan: t.codigo, nombre: t.nombre, tipo: null, activo: t.activo }, clases: [] }
    })
    grupos['sin-plan'] = { plan: { nombre: 'Sin tipo asignado', idPlan: null, tipo: null }, clases: [] }

    clasesFiltradas.forEach(clase => {
      const key = clase.tipoPlan ?? 'sin-plan'
      if (grupos[key]) {
        grupos[key].clases.push(clase)
      } else {
        grupos['sin-plan'].clases.push(clase)
      }
    })

    return Object.entries(grupos)
      .filter(([key, g]) => (key !== 'sin-plan' && g.plan.activo !== false) || g.clases.length > 0)
      .map(([key, g]) => ({ key, ...g }))
  }, [planes, clasesFiltradas])

  // Días en que hay clases del plan, abreviados (ej. "L-M-V"); las clases únicas no suman días fijos
  const INICIAL_DIA = { LUNES: "L", MARTES: "M", MIERCOLES: "X", JUEVES: "J", VIERNES: "V", SABADO: "S", DOMINGO: "D" }
  const ORDEN_DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"]
  const diasDelPlan = (lista) => {
    const dias = new Set()
    lista.forEach((c) => (c.diasSemana || "").split(",").map((d) => d.trim().toUpperCase()).forEach((d) => d && dias.add(d)))
    return ORDEN_DIAS.filter((d) => dias.has(d)).map((d) => INICIAL_DIA[d]).join("-")
  }
  const etiquetaTipo = (tipo) => (tipo === "PlanificacionAtleta" ? "Planificación" : tipo ? "CrossFit" : null)
  const iniciales = (nombre = "") => nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "—"
  const fechaCorta = (fechaISO) => {
    if (!fechaISO) return "—"
    const [y, m, d] = fechaISO.split("T")[0].split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
  }
  const gruposVisibles = clasesAgrupadas.filter((g) => planFiltro === "all" || g.key === planFiltro)

  const handleDelete = async (claseId) => {
    const claseAEliminar = deleteDialog.clase
    setDeleteDialog({ open: false, clase: null })
    setClases(prev => prev.filter(c => c.idClase !== claseId))
    try {
      await apiClient.delete(`/clases/${claseId}`)
    } catch (error) {
      setClases(prev => [...prev, claseAEliminar])
      toast.error("No se pudo eliminar la clase", { description: error.response?.data?.message || error.message })
    }
  }

  // Fila de una clase (horario, profesor, cupos, días) con su menú de acciones
  const FilaClase = ({ clase }) => (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-black uppercase tracking-wide text-foreground">{clase.nombreClase}</h3>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
            clase.estado === "Activo"
              ? "border-lime-400/20 bg-lime-400/10 text-lime-700 dark:text-lime-400"
              : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          }`}>
            {clase.estado === "Activo" ? "Activa" : "Inactiva"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/65">
          {clase.horaInicio && clase.horaFin && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" />{clase.horaInicio.substring(0, 5)} – {clase.horaFin.substring(0, 5)}</span>
          )}
          {clase.nombreProfesor && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" aria-hidden="true" />{clase.nombreProfesor}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            {/* Cupo de la clase (límite de reservas). cupoDisponible es un campo fijo que no baja con las reservas: no se muestra */}
            <span className="text-lime-700 dark:text-lime-400">{clase.cupoMaximo}</span>
            <span className="text-foreground/40">lugares</span>
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {clase.fechaEspecifica ? (
            <>
              <span className="rounded border border-lime-400/25 bg-lime-400/5 px-1.5 py-px text-[10px] font-bold uppercase text-lime-700 dark:text-lime-400">{fechaCorta(clase.fechaEspecifica)}</span>
              <span className="rounded border border-border px-1.5 py-px text-[10px] font-bold uppercase text-foreground/50">Única</span>
            </>
          ) : clase.diasSemana && (
            <>
              {clase.diasSemana.split(",").map((dia) => (
                <span key={dia} className="rounded border border-border px-1.5 py-px text-[10px] font-bold uppercase text-foreground/60">{dia.trim().substring(0, 3)}</span>
              ))}
              {(() => { const p = proximaFecha(clase.diasSemana, clase.horaInicio); return p ? <span className="text-[10px] text-foreground/45">· próxima {p.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span> : null })()}
            </>
          )}
        </div>
      </div>

      {(permisos.includes("clases:modificacion") || permisos.includes("clases:baja")) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`Acciones de ${clase.nombreClase}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/55 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {permisos.includes("clases:modificacion") && (
              <DropdownMenuItem asChild>
                <Link to={`/admin/clases/editar/${clase.idClase}`}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Link>
              </DropdownMenuItem>
            )}
            {permisos.includes("clases:baja") && (
              <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, clase })} className="text-red-700 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )

  // Una clase única ya realizada (historial)
  const FilaRealizada = ({ clase }) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-xs font-black text-foreground/70" aria-hidden="true">
        {iniciales(clase.nombreProfesor || clase.nombreClase)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black uppercase text-foreground">{clase.nombreClase}</p>
          <span className="shrink-0 rounded-md bg-lime-400/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Realizada</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-foreground/60">
          {fechaCorta(clase.fechaEspecifica)}
          {clase.horaInicio && clase.horaFin && ` · ${clase.horaInicio.substring(0, 5)} – ${clase.horaFin.substring(0, 5)}`}
          {clase.nombreProfesor && ` · Coach ${clase.nombreProfesor}`}
        </p>
      </div>
      {permisos.includes("clases:baja") && (
        <button type="button" onClick={() => setDeleteDialog({ open: true, clase })} aria-label={`Eliminar ${clase.nombreClase} del historial`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <TituloPagina descripcion={"Clases organizadas por tipo de clase. Para crear una, usá \"Crear clase\" en su tipo."}>Gestión de Clases</TituloPagina>
        </div>
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1" role="tablist" aria-label="Secciones de clases">
        <button type="button" role="tab" aria-selected={pestana === "clases"} onClick={() => setPestana("clases")}
          className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors ${pestana === "clases" ? "bg-lime-400/15 text-lime-700 dark:text-lime-400" : "text-foreground/60 hover:text-foreground"}`}>
          <CalendarDays className="h-4 w-4" aria-hidden="true" /> Clases
        </button>
        <Link to="/admin/clases/turnos" role="tab" aria-selected={false}
          className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-foreground/60 transition-colors hover:text-foreground">
          <Clock className="h-4 w-4" aria-hidden="true" /> Turnos
        </Link>
        <button type="button" role="tab" aria-selected={pestana === "historial"} onClick={() => setPestana("historial")}
          className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors ${pestana === "historial" ? "bg-lime-400/15 text-lime-700 dark:text-lime-400" : "text-foreground/60 hover:text-foreground"}`}>
          <History className="h-4 w-4" aria-hidden="true" /> Historial
          {historialClasesUnicas.length > 0 && (
            <span className="rounded-full bg-foreground/10 px-1.5 text-[10px] text-foreground/70">{historialClasesUnicas.length}</span>
          )}
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          aria-label="Buscar clases"
          placeholder={pestana === "historial" ? "Buscar por nombre o profesor..." : "Buscar por nombre, tipo, profesor o estado..."}
          className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground outline-none transition-colors focus:border-lime-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <Cargando filas={2} className="py-2" />
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* ── PESTAÑA CLASES ── */}
      {!loading && !error && pestana === "clases" && (
        <div className="space-y-4">
          {/* Filtro por plan */}
          {clasesAgrupadas.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar por tipo de clase">
              {[{ key: "all", nombre: "Todos", cantidad: clasesFiltradas.length }, ...clasesAgrupadas.map((g) => ({ key: g.key, nombre: g.plan.nombre, cantidad: g.clases.length }))].map((op) => (
                <button key={op.key} type="button" onClick={() => setPlanFiltro(op.key)} aria-pressed={planFiltro === op.key}
                  className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-black uppercase tracking-wide transition-colors ${
                    planFiltro === op.key ? "border-lime-500 bg-lime-400 text-black" : "border-border bg-card text-foreground/70"
                  }`}>
                  {op.nombre}
                  <span className={`rounded-full px-1.5 text-[10px] ${planFiltro === op.key ? "bg-black/15" : "bg-foreground/10"}`}>{op.cantidad}</span>
                </button>
              ))}
            </div>
          )}

          {clasesAgrupadas.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-foreground/55">No hay tipos de clase creados. Creá uno desde Planes y Membresías &gt; Tipos de clase.</p>
            </div>
          ) : gruposVisibles.map(({ key, plan, clases: clasesDelPlan }) => {
            const activas = clasesDelPlan.filter((c) => c.estado === "Activo").length
            const dias = diasDelPlan(clasesDelPlan)
            return (
              <section key={key} className="overflow-hidden rounded-2xl border border-border bg-card" aria-label={`Tipo de clase ${plan.nombre}`}>
                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {etiquetaTipo(plan.tipo) && (
                        <span className="rounded-md border border-border bg-foreground/5 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/60">{etiquetaTipo(plan.tipo)}</span>
                      )}
                      <span className="text-[11px] font-semibold text-lime-700 dark:text-lime-400">{activas} {activas === 1 ? "clase activa" : "clases activas"}</span>
                    </div>
                    <h2 className="mt-1.5 text-base font-black uppercase leading-tight text-foreground">{plan.nombre}</h2>
                  </div>
                  {permisos.includes("clases:alta") && plan.idPlan && (
                    <Link to={`/admin/clases/nueva?tipo=${encodeURIComponent(plan.idPlan)}`}
                      className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-lg border border-border bg-background/60 px-3 text-[11px] font-black uppercase tracking-wider text-foreground transition-colors hover:border-lime-500 hover:text-lime-700 dark:hover:text-lime-400">
                      <Plus className="h-3.5 w-3.5" /> Crear clase
                    </Link>
                  )}
                </div>

                {clasesDelPlan.length > 0 ? (
                  <div className="divide-y divide-border border-t border-border">
                    {clasesDelPlan.map((clase) => <FilaClase key={clase.idClase} clase={clase} />)}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <span className="flex items-center gap-2 text-xs text-foreground/55">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" aria-hidden="true" /> Sin clases creadas todavía
                    </span>
                  </div>
                )}
                {dias && (
                  <p className="border-t border-border px-4 py-2 text-[11px] font-semibold text-foreground/50">Días: {dias}</p>
                )}
              </section>
            )
          })}

          {/* Últimas clases únicas realizadas (las 2 más recientes) */}
          {historialClasesUnicas.length > 0 && (
            <section aria-labelledby="titulo-realizadas">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 id="titulo-realizadas" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/70">
                  <History className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Últimas clases realizadas
                </h2>
                <button type="button" onClick={() => setPestana("historial")} className="text-xs font-black uppercase tracking-wider text-lime-700 hover:underline dark:text-lime-400">
                  Ver todas ({historialClasesUnicas.length})
                </button>
              </div>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {historialClasesUnicas.slice(0, 2).map((clase) => <FilaRealizada key={clase.idClase} clase={clase} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── PESTAÑA HISTORIAL ── */}
      {!loading && !error && pestana === "historial" && (
        historialClasesUnicas.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-foreground/55">Todavía no hay clases únicas realizadas.</p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {historialClasesUnicas.map((clase) => <FilaRealizada key={clase.idClase} clase={clase} />)}
          </div>
        )
      )}

      {/* Modal de eliminar */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-red-700 dark:text-red-400">Eliminar Clase</h2>
            <p className="mt-3 text-sm text-foreground/60">
              ¿Estás seguro de eliminar la clase{" "}
              <strong className="text-foreground">{deleteDialog.clase?.nombreClase}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialog({ open: false, clase: null })}
                className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Cancelar
              </button>
              {permisos.includes("clases:baja") && (
                <button
                  onClick={() => deleteDialog.clase && handleDelete(deleteDialog.clase.idClase)}
                  className="border border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
