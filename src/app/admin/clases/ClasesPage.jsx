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
  ChevronDown,
  ChevronRight,
  History,
} from "lucide-react"
import apiClient from "@/api"
import { toast } from '@/lib/notificar'

export default function ClasesPage() {
  const [search, setSearch] = useState("")
  const [clases, setClases] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [permisos, setPermisos] = useState([])
  const [planesExpandidos, setPlanesExpandidos] = useState({})

  const [deleteDialog, setDeleteDialog] = useState({ open: false, clase: null })

  const obtenerDatos = async () => {
    try {
      setLoading(true)
      setError("")
      const [resClases, resPlanes] = await Promise.all([
        apiClient.get("/clases"),
        apiClient.get("/planes"),
      ])
      setClases(resClases.data?.data || resClases.data || [])
      const listaPlanes = resPlanes.data?.data || []
      setPlanes(listaPlanes)
      const expandido = {}
      listaPlanes.forEach(p => { expandido[p.idPlan] = true })
      expandido['sin-plan'] = true
      setPlanesExpandidos(expandido)
    } catch (error) {
      console.error("Error al obtener datos:", error)
      setError(error.response?.data?.message || error.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    obtenerDatos()
    const storedPermisos = localStorage.getItem("permisos")
    if (storedPermisos) {
      try { setPermisos(JSON.parse(storedPermisos)) } catch (err) { console.error(err) }
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
    planes.forEach(plan => {
      grupos[plan.idPlan] = { plan, clases: [] }
    })
    grupos['sin-plan'] = { plan: { nombre: 'Sin plan asignado', idPlan: null, tipo: null }, clases: [] }

    clasesFiltradas.forEach(clase => {
      const key = clase.idPlan ?? 'sin-plan'
      if (grupos[key]) {
        grupos[key].clases.push(clase)
      } else {
        grupos['sin-plan'].clases.push(clase)
      }
    })

    return Object.entries(grupos)
      .filter(([key, g]) => key !== 'sin-plan' || g.clases.length > 0)
      .map(([key, g]) => ({ key, ...g }))
  }, [planes, clasesFiltradas])

  const togglePlan = (key) => {
    setPlanesExpandidos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleDelete = async (claseId) => {
    try {
      const response = await apiClient.delete(`/clases/${claseId}`)
      if (response.data?.success || response.status === 200) {
        setClases(clases.filter((clase) => clase.idClase !== claseId))
        setDeleteDialog({ open: false, clase: null })
      } else {
        throw new Error(response.data?.message || "Error al eliminar la clase")
      }
    } catch (error) {
      console.error("Error al eliminar clase:", error)
      toast.error("No se pudo eliminar la clase", { description: error.response?.data?.message || error.message })
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Gestión de Clases</h1>
          <p className="text-sm text-foreground/40 mt-1">Clases organizadas por plan de membresía.</p>
        </div>
        {permisos.includes("clases:alta") && (
          <Link
            to="/admin/clases/nueva"
            className="inline-flex items-center bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Clase
          </Link>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-border">
        <button className="border-b-2 border-lime-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground">
          Clases
        </button>
        <Link
          to="/admin/clases/turnos"
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
        >
          Turnos
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, tipo, profesor o estado..."
          className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="border border-border bg-card p-6 text-center text-foreground/40">
          Cargando clases...
        </div>
      )}

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400">
          {error}
        </div>
      )}

      {/* Clases agrupadas por plan */}
      {!loading && !error && (
        <div className="space-y-6">
          {clasesAgrupadas.length === 0 ? (
            <div className="border border-border bg-card p-10 text-center">
              <p className="text-foreground/40">No hay planes creados. Creá un plan primero desde Planes y Membresías.</p>
            </div>
          ) : (
            clasesAgrupadas.map(({ key, plan, clases: clasesDelPlan }) => (
              <section key={key} className="border border-border bg-card">
                {/* Cabecera del plan */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b border-border bg-foreground/[0.02] cursor-pointer"
                  onClick={() => togglePlan(key)}
                >
                  <div className="flex items-center gap-3">
                    {planesExpandidos[key]
                      ? <ChevronDown className="h-4 w-4 text-foreground/40" />
                      : <ChevronRight className="h-4 w-4 text-foreground/40" />
                    }
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</p>
                      <p className="font-black text-foreground text-sm">{plan.nombre}</p>
                    </div>
                    {plan.tipo && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border">
                        {plan.tipo === "PlanificacionAtleta" ? "Planificación" : "CrossFit"}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-foreground/40">
                      {clasesDelPlan.length} {clasesDelPlan.length === 1 ? "clase" : "clases"}
                    </span>
                  </div>

                  {permisos.includes("clases:alta") && plan.idPlan && (
                    <Link
                      to={`/admin/clases/nueva?planId=${plan.idPlan}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-lime-400 hover:text-lime-300 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Nueva clase
                    </Link>
                  )}
                </div>

                {/* Lista de clases del plan */}
                {planesExpandidos[key] && (
                  <div className="divide-y divide-border">
                    {clasesDelPlan.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center px-5">
                        <p className="text-sm text-foreground/40">No hay clases creadas para este plan todavía.</p>
                        {permisos.includes("clases:alta") && plan.idPlan && (
                          <Link
                            to={`/admin/clases/nueva?planId=${plan.idPlan}`}
                            className="inline-flex items-center gap-1 bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-3 py-1.5 hover:bg-lime-300 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            Crear primera clase
                          </Link>
                        )}
                      </div>
                    )}
                    {clasesDelPlan.map((clase) => (
                      <div key={clase.idClase} className="px-5 py-3 hover:bg-foreground/[0.02] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Nombre + estado */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black uppercase tracking-wide text-foreground truncate">
                                  {clase.nombreClase}
                                </h3>
                                <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                                  clase.estado === "Activo"
                                    ? "bg-lime-400/10 text-lime-400 border-lime-400/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}>
                                  {clase.estado === "Activo" ? "Activa" : "Inactiva"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {clase.horaInicio && clase.horaFin && (
                                  <span className="flex items-center gap-1 text-xs text-foreground/60">
                                    <Clock className="h-3 w-3" />
                                    {clase.horaInicio.substring(0, 5)} - {clase.horaFin.substring(0, 5)}
                                  </span>
                                )}
                                {clase.nombreProfesor && (
                                  <span className="flex items-center gap-1 text-xs text-foreground/60">
                                    <User className="h-3 w-3" />
                                    {clase.nombreProfesor}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs">
                                  <Users className="h-3 w-3 text-foreground/40" />
                                  <span className={clase.cupoDisponible <= 0 ? "text-red-400" : "text-lime-400"}>
                                    {clase.cupoDisponible}
                                  </span>
                                  <span className="text-foreground/30">/{clase.cupoMaximo}</span>
                                </span>
                                {clase.fechaEspecifica ? (() => {
                                  const [y, m, d] = clase.fechaEspecifica.split('T')[0].split('-').map(Number)
                                  const fechaObj = new Date(y, m - 1, d)
                                  const label = fechaObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
                                  return (
                                    <div className="flex gap-1 flex-wrap items-center">
                                      <span className="border border-lime-400/20 bg-lime-400/5 px-1.5 py-px text-[9px] font-bold uppercase text-lime-400/70 capitalize">
                                        {label}
                                      </span>
                                      <span className="border border-lime-400/15 px-1.5 py-px text-[9px] font-bold uppercase text-lime-400/40">
                                        Única
                                      </span>
                                    </div>
                                  )
                                })() : clase.diasSemana && (() => {
                                  const proxima = proximaFecha(clase.diasSemana, clase.horaInicio)
                                  const fechaLabel = proxima
                                    ? proxima.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                                    : null
                                  return (
                                    <div className="flex gap-1 flex-wrap items-center">
                                      {clase.diasSemana.split(",").map((dia) => (
                                        <span key={dia} className="border border-border px-1.5 py-px text-[9px] font-bold uppercase text-foreground/50">
                                          {dia.trim().substring(0, 3)}
                                        </span>
                                      ))}
                                      {fechaLabel && (
                                        <span className="border border-foreground/10 px-1.5 py-px text-[9px] font-bold uppercase text-foreground/35">
                                          {fechaLabel}
                                        </span>
                                      )}
                                      <span className="border border-foreground/10 px-1.5 py-px text-[9px] font-bold uppercase text-foreground/30">
                                        Recurrente
                                      </span>
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>

                          {(permisos.includes("clases:modificacion") || permisos.includes("clases:baja")) && (
                            <div className="relative group shrink-0">
                              <button className="p-1.5 text-foreground/40 hover:text-foreground transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              <div className="absolute right-0 z-10 hidden w-36 border border-border bg-card shadow-lg group-hover:block">
                                {permisos.includes("clases:modificacion") && (
                                  <Link
                                    to={`/admin/clases/editar/${clase.idClase}${plan.idPlan ? `?planId=${plan.idPlan}` : ""}`}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </Link>
                                )}
                                {permisos.includes("clases:baja") && (
                                  <button
                                    onClick={() => setDeleteDialog({ open: true, clase })}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/5 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      )}

      {/* ── HISTORIAL DE CLASES ÚNICAS PASADAS ─────────────────────────── */}
      {historialClasesUnicas.length > 0 && (
        <section className="border border-border bg-card">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-foreground/[0.02]">
            <History className="h-4 w-4 text-foreground/30" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Historial</p>
              <p className="text-sm font-black text-foreground">Clases únicas realizadas</p>
            </div>
            <span className="text-[10px] font-bold text-foreground/30 ml-1">{historialClasesUnicas.length}</span>
          </div>
          <div className="divide-y divide-border">
            {historialClasesUnicas.map((clase) => {
              const fechaStr = clase.fechaEspecifica?.split('T')[0]
              const [y, m, d] = fechaStr ? fechaStr.split('-').map(Number) : []
              const fechaLabel = fechaStr
                ? new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : '—'
              return (
                <div key={clase.idClase} className="px-5 py-3 opacity-60 hover:opacity-80 transition-opacity">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black uppercase tracking-wide text-foreground truncate">{clase.nombreClase}</h3>
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-foreground/10 text-foreground/30">
                          Realizada
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-foreground/50 capitalize">{fechaLabel}</span>
                        {clase.horaInicio && clase.horaFin && (
                          <span className="flex items-center gap-1 text-xs text-foreground/40">
                            <Clock className="h-3 w-3" />
                            {clase.horaInicio.substring(0, 5)} - {clase.horaFin.substring(0, 5)}
                          </span>
                        )}
                        {clase.nombreProfesor && (
                          <span className="flex items-center gap-1 text-xs text-foreground/40">
                            <User className="h-3 w-3" />
                            {clase.nombreProfesor}
                          </span>
                        )}
                      </div>
                    </div>
                    {permisos.includes("clases:baja") && (
                      <button
                        onClick={() => setDeleteDialog({ open: true, clase })}
                        className="p-1.5 text-foreground/20 hover:text-red-400 transition-colors shrink-0"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Modal de eliminar */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md border border-border bg-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-red-400">Eliminar Clase</h2>
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
                  className="border border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/5 transition-colors"
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
