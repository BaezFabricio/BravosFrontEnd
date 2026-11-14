import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  User,
  CalendarDays,
  ChevronRight,
  Users,
  Copy,
  X,
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
import DetalleClaseDialog from "./DetalleClaseDialog"
import PestanasClases from "./PestanasClases"
import { ConfirmarAdmin } from "@/components/ModalAdmin"
import { yaTermino, fechaDeClase } from "./utilClases"

// Marcación de la referencia (pantalla 03). Colores de los tokens del tema; sin datos de anotados ni cupos
// (la lista de clases no los trae). En el historial y en los diálogos se mantienen los estilos actuales.
const CARD = { borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)" }
const BOTON_LIMA = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", padding: "0px 18px", borderRadius: "10px", border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 14px Archivo", letterSpacing: "0.03em", whiteSpace: "nowrap", textDecoration: "none", cursor: "pointer" }

const IconoMas = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
)

export default function ClasesPage() {
  const [search, setSearch] = useState("")
  const [clases, setClases] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [permisos, setPermisos] = useState([])
  const [parametros] = useSearchParams()
  const [pestana, setPestana] = useState(parametros.get("pestana") === "historial" ? "historial" : "clases")
  const [planFiltro, setPlanFiltro] = useState("all")

  const [deleteDialog, setDeleteDialog] = useState({ open: false, clase: null })
  const [claseDetalle, setClaseDetalle] = useState(null) // clase realizada de la que se ve el detalle

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
      try { setPermisos(JSON.parse(storedPermisos)) } catch { /* nada: sin permisos guardados */ }
    }
  }, [])

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
  const totalHistorial = clases.filter((c) => yaTermino(c)).length
  const historialFiltrado = historialClasesUnicas.filter((c) => planFiltro === "all" || (c.tipoPlan ?? "sin-plan") === planFiltro)
  const historialPorMes = []
  for (const c of historialFiltrado) {
    const etiqueta = fechaDeClase(c.fechaEspecifica).toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(" de ", " ").toUpperCase()
    let g = historialPorMes.find((x) => x.etiqueta === etiqueta)
    if (!g) { g = { etiqueta, clases: [] }; historialPorMes.push(g) }
    g.clases.push(c)
  }

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

  // Fecha de la caja de cada clase: la próxima (si es semanal) o la única
  const fechaDeCaja = (clase) => {
    const f = clase.fechaEspecifica
      ? (() => { const [y, m, d] = clase.fechaEspecifica.split("T")[0].split("-").map(Number); return new Date(y, m - 1, d) })()
      : proximaFecha(clase.diasSemana, clase.horaInicio)
    if (!f) return null
    return {
      dia: f.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "").toUpperCase(),
      numero: f.getDate(),
      mes: f.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toUpperCase(),
    }
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

  // Fila de una clase de la referencia: caja con la fecha, nombre, estado, horario y coach, y su menú
  const FilaClase = ({ clase }) => {
    const caja = fechaDeCaja(clase)
    const activa = clase.estado === "Activo"
    // Anotados de la próxima fecha (los trae el backend: reservas activas). Sin lugares = cupo lleno
    const anotados = Number(clase.anotados) || 0
    const cupo = Number(clase.cupoMaximo) || 0
    const libres = Math.max(0, cupo - anotados)
    const llena = cupo > 0 && libres === 0
    const porcentaje = cupo > 0 ? Math.min(100, Math.round(anotados / cupo * 100)) : 0
    return (
      <li style={{ display: "flex", alignItems: "center", gap: "18px", padding: "16px 16px 16px 22px", borderTop: "1px solid var(--border)" }}>
        <span style={{ width: "56px", height: "60px", flexShrink: 0, borderRadius: "12px", border: "1px solid rgba(155, 230, 0, 0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ font: "700 10px Archivo", letterSpacing: "0.08em", color: "var(--primary)" }}>{caja?.dia ?? "—"}</span>
          <span style={{ font: "900 26px / 1 \"Big Shoulders Stencil Display\"", color: "var(--foreground)" }}>{caja?.numero ?? "—"}</span>
          <span style={{ font: "600 10px Archivo", color: "var(--muted-foreground)" }}>{caja?.mes ?? ""}</span>
        </span>
        <span style={{ flex: "1 1 0%", minWidth: "0px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ font: "800 16px Archivo" }}>{clase.nombreClase}</span>
            <span style={{ padding: "2px 8px", borderRadius: "999px", background: !activa ? "var(--sh-track)" : llena ? "var(--sh-warn-bg)" : "var(--sh-active-bg)", border: `1px solid ${!activa ? "var(--sh-control-line)" : llena ? "var(--sh-warn-line)" : "rgba(155, 230, 0, 0.3)"}`, color: !activa ? "var(--muted-foreground)" : llena ? "var(--sh-warn)" : "var(--primary)", font: "700 11px Archivo" }}>
              {!activa ? "Inactiva" : llena ? "Llena" : "Activa"}
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", marginTop: "6px", font: "500 14px Archivo", color: "var(--sh-link)" }}>
            {clase.horaInicio && clase.horaFin && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--foreground)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                <Clock className="h-[15px] w-[15px]" aria-hidden="true" />
                {`${clase.horaInicio.substring(0, 5)} – ${clase.horaFin.substring(0, 5)}`}
              </span>
            )}
            {clase.nombreProfesor && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User className="h-[15px] w-[15px]" aria-hidden="true" />
                {`Coach ${clase.nombreProfesor}`}
              </span>
            )}
          </span>
        </span>

        <span style={{ width: "190px", flexShrink: 0 }}>
          <span style={{ display: "flex", justifyContent: "space-between", gap: "8px", font: "600 13px Archivo", color: "var(--sh-link)" }}>
            <span>{`${anotados} anotados`}</span>
            <span style={{ color: llena ? "var(--sh-warn)" : "var(--sh-link)" }}>{llena ? "Sin lugares" : `${libres} libres de ${cupo}`}</span>
          </span>
          <span style={{ display: "block", marginTop: "6px", height: "6px", borderRadius: "3px", background: "var(--sh-track)", overflow: "hidden" }}>
            <span className="bv-barra" style={{ display: "block", height: "100%", width: `${porcentaje}%`, background: llena ? "var(--sh-warn)" : "var(--primary)" }} />
          </span>
        </span>

        {(permisos.includes("clases:modificacion") || permisos.includes("clases:baja") || permisos.includes("clases:alta")) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={`Acciones de ${clase.nombreClase}`}
                style={{ width: "44px", height: "44px", flexShrink: 0, borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <MoreVertical className="h-[18px] w-[18px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[232px] p-1.5" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
              <DropdownMenuItem onClick={() => setClaseDetalle(clase)} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold">
                <Users className="h-4 w-4" aria-hidden="true" /> Ver anotados
              </DropdownMenuItem>
              {permisos.includes("clases:modificacion") && (
                <DropdownMenuItem asChild>
                  <Link to={`/admin/clases/editar/${clase.idClase}`} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold">
                    <Edit className="h-4 w-4" aria-hidden="true" /> Editar clase
                  </Link>
                </DropdownMenuItem>
              )}
              {permisos.includes("clases:alta") && (
                <DropdownMenuItem asChild>
                  <Link to={`/admin/clases/nueva?duplicar=${clase.idClase}`} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold">
                    <Copy className="h-4 w-4" aria-hidden="true" /> Duplicar
                  </Link>
                </DropdownMenuItem>
              )}
              {permisos.includes("clases:baja") && (
                <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, clase })} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold" style={{ color: "var(--sh-danger)" }}>
                  <X className="h-4 w-4" aria-hidden="true" /> Cancelar clase
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    )
  }

  // Una clase ya realizada (historial): fecha en caja, nombre, "Realizada", horario y coach, asistencia y "Ver detalle"
  const FilaRealizada = ({ clase, primera }) => {
    const d = fechaDeClase(clase.fechaEspecifica)
    const dia = d.getDate()
    const mes = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toUpperCase()
    const corta = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(".", "")
    const asistieron = Number(clase.asistieron) || 0
    const cupo = Number(clase.cupoMaximo) || 0
    const partes = [corta]
    if (clase.horaInicio && clase.horaFin) partes.push(clase.horaInicio.substring(0, 5) + " a " + clase.horaFin.substring(0, 5))
    if (clase.nombreProfesor) partes.push("Coach " + clase.nombreProfesor)
    return (
      <li style={{ display: "flex", alignItems: "center", gap: "18px", padding: "14px 16px 14px 22px", borderTop: primera ? 0 : "1px solid var(--border)" }}>
        <span style={{ width: "48px", height: "52px", flexShrink: 0, borderRadius: "10px", border: "1px solid var(--sh-control-line)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ font: "900 22px / 1 \"Big Shoulders Stencil Display\"", color: "var(--foreground)" }}>{dia}</span>
          <span style={{ font: "600 10px Archivo", color: "var(--muted-foreground)" }}>{mes}</span>
        </span>
        <span style={{ flex: "1 1 0%", minWidth: "0px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ font: "800 16px Archivo" }}>{clase.nombreClase}</span>
            <span style={{ padding: "2px 8px", borderRadius: "999px", background: "var(--sh-active-bg)", border: "1px solid rgba(155, 230, 0, 0.3)", color: "var(--primary)", font: "700 11px Archivo" }}>Realizada</span>
          </span>
          <span style={{ display: "block", marginTop: "3px", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{partes.join(" · ")}</span>
        </span>
        <span style={{ font: "600 13px Archivo", color: "var(--sh-link)", whiteSpace: "nowrap" }}>{`${asistieron} de ${cupo} asistieron`}</span>
        <button type="button" onClick={() => setClaseDetalle(clase)} aria-label={`Ver el detalle de ${clase.nombreClase}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", color: "var(--primary)", font: "700 13px Archivo", cursor: "pointer", whiteSpace: "nowrap", padding: "0px 8px" }}>
          Ver detalle <ChevronRight className="h-[14px] w-[14px]" aria-hidden="true" />
        </button>
        {permisos.includes("clases:baja") && (
          <button type="button" onClick={() => setDeleteDialog({ open: true, clase })} aria-label={`Eliminar ${clase.nombreClase} del historial`}
            style={{ width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--muted-foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Trash2 className="h-[16px] w-[16px]" aria-hidden="true" />
          </button>
        )}
      </li>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <TituloPagina descripcion={pestana === "historial" ? "Clases que ya se dictaron" : "Las próximas clases, por tipo. Cuando pasan, se mueven al Historial."}>Clases</TituloPagina>

      <PestanasClases activa={pestana} cantidad={totalHistorial} onCambiar={setPestana} />

      {/* Buscador */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ position: "relative", flex: "1 1 0%", minWidth: "320px", maxWidth: "560px" }}>
          <span style={{ position: "absolute", left: "14px", top: "14px", color: "var(--muted-foreground)", display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" /></svg>
          </span>
          <input
            type="search"
            aria-label="Buscar clases"
            placeholder="Buscar por nombre o coach"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: "46px", padding: "0px 14px 0px 42px", borderRadius: "10px", border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }}
          />
        </label>
        {clasesAgrupadas.length > 1 && (
          <div role="group" aria-label="Filtrar por tipo de clase" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(pestana === "historial"
              ? [{ key: "all", nombre: "Todos", cantidad: historialClasesUnicas.length }, ...clasesAgrupadas.map((g) => ({ key: g.key, nombre: g.plan.nombre, cantidad: historialClasesUnicas.filter((c) => (c.tipoPlan ?? "sin-plan") === g.key).length }))]
              : [{ key: "all", nombre: "Todos", cantidad: clasesFiltradas.length }, ...clasesAgrupadas.map((g) => ({ key: g.key, nombre: g.plan.nombre, cantidad: g.clases.length }))]
            ).map((op) => {
              const elegido = planFiltro === op.key
              return (
                <button key={op.key} type="button" onClick={() => setPlanFiltro(op.key)} aria-pressed={elegido}
                  style={{ height: "40px", padding: "0px 14px", borderRadius: "999px", border: `1px solid ${elegido ? "var(--foreground)" : "var(--sh-control-line)"}`, background: elegido ? "var(--foreground)" : "transparent", color: elegido ? "var(--background)" : "var(--foreground)", font: "700 13px Archivo", whiteSpace: "nowrap", cursor: "pointer" }}>
                  <span>{op.nombre}</span>{" · "}<span>{op.cantidad}</span>
                </button>
              )
            })}
          </div>
        )}
        {pestana === "historial" && <span style={{ font: "500 15px Archivo", color: "var(--muted-foreground)" }}>{historialFiltrado.length + (historialFiltrado.length === 1 ? " clase" : " clases")}</span>}
      </div>

      {loading && (
        <Cargando filas={2} className="py-2" />
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* ── PESTAÑA CLASES ── */}
      {!loading && !error && pestana === "clases" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {clasesAgrupadas.length === 0 ? (
            <div style={{ ...CARD, padding: "40px", textAlign: "center" }}>
              <p style={{ margin: 0, color: "var(--muted-foreground)" }}>No hay tipos de clase creados. Creá uno desde Planes y Membresías &gt; Tipos de clase.</p>
            </div>
          ) : gruposVisibles.map(({ key, plan, clases: clasesDelPlan }) => {
            const activas = clasesDelPlan.filter((c) => c.estado === "Activo").length
            return (
              <section key={key} aria-label={`Tipo de clase ${plan.nombre}`} style={{ ...CARD, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: "1 1 0%", minWidth: "0px" }}>
                    <h2 className="bv-admin-titulo" style={{ margin: "0px", font: "800 18px Archivo" }}>{plan.nombre}</h2>
                    <div style={{ font: "600 13px Archivo", color: activas > 0 ? "var(--primary)" : "var(--muted-foreground)", marginTop: "3px" }}>
                      {`${activas} ${activas === 1 ? "clase activa" : "clases activas"}`}
                    </div>
                  </div>
                  {clasesDelPlan.length > 0 && permisos.includes("clases:alta") && plan.idPlan && (
                    <Link to={`/admin/clases/nueva?tipo=${encodeURIComponent(plan.idPlan)}`} style={{ ...BOTON_LIMA, height: "44px" }}>
                      <IconoMas /> CREAR CLASE
                    </Link>
                  )}
                </div>

                {clasesDelPlan.length > 0 ? (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {clasesDelPlan.map((clase) => <FilaClase key={clase.idClase} clase={clase} />)}
                  </ul>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "22px" }}>
                    <span style={{ width: "48px", height: "48px", flexShrink: 0, borderRadius: "12px", background: "var(--sh-avatar)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                      <CalendarDays className="h-[22px] w-[22px]" aria-hidden="true" />
                    </span>
                    <div style={{ flex: "1 1 0%", minWidth: "0px" }}>
                      <div style={{ font: "700 15px Archivo" }}>{`Todavía no hay clases de ${plan.nombre}`}</div>
                      <div style={{ font: "400 14px Archivo", color: "var(--muted-foreground)", marginTop: "2px" }}>Creala y los alumnos ya pueden reservarla.</div>
                    </div>
                    {permisos.includes("clases:alta") && plan.idPlan && (
                      <Link to={`/admin/clases/nueva?tipo=${encodeURIComponent(plan.idPlan)}`} style={{ ...BOTON_LIMA, height: "46px", padding: "0px 20px" }}>
                        <IconoMas /> CREAR CLASE
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* ── PESTAÑA HISTORIAL ── */}
      {!loading && !error && pestana === "historial" && (
        historialFiltrado.length === 0 ? (
          <div style={{ ...CARD, padding: "40px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
              {historialClasesUnicas.length === 0 ? "Todavía no hay clases realizadas." : "No hay clases que coincidan con la búsqueda."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {historialPorMes.map((grupo) => (
              <section key={grupo.etiqueta} aria-label={grupo.etiqueta}>
                <h2 className="bv-admin-titulo" style={{ margin: "0px 0px 10px", font: "700 11px Archivo", letterSpacing: "0.12em", color: "var(--muted-foreground)" }}>{grupo.etiqueta}</h2>
                <ul style={{ ...CARD, listStyle: "none", margin: 0, padding: 0, overflow: "hidden" }}>
                  {grupo.clases.map((clase, i) => <FilaRealizada key={clase.idClase} clase={clase} primera={i === 0} />)}
                </ul>
              </section>
            ))}
          </div>
        )
      )}

      {/* Detalle de una clase realizada: datos, rutina y quiénes reservaron */}
      <DetalleClaseDialog key={claseDetalle?.idClase ?? "ninguna"} clase={claseDetalle} onCerrar={() => setClaseDetalle(null)} />

      {/* Confirmar: cancelar una clase próxima o eliminar una ya realizada del historial */}
      {(() => {
        const c = deleteDialog.clase
        const realizada = c ? yaTermino(c) : false
        const hora = c?.horaInicio && c?.horaFin ? c.horaInicio.substring(0, 5) + " a " + c.horaFin.substring(0, 5) : ""
        const dia = c?.fechaEspecifica ? fechaDeClase(c.fechaEspecifica).toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(".", "") : ""
        const texto = !c ? "" : realizada
          ? c.nombreClase + " · " + dia + (hora ? ", " + hora : "") + ". Se borra también su registro de asistencia. No se puede deshacer."
          : c.nombreClase + (hora ? " · " + hora : "") + ". Se cancelan las reservas y les avisamos a los anotados. No se puede deshacer."
        return (
          <ConfirmarAdmin abierto={deleteDialog.open} onCerrar={() => setDeleteDialog({ open: false, clase: null })}
            titulo={realizada ? "¿Eliminar esta clase del historial?" : "¿Cancelar esta clase?"} texto={texto}
            textoAccion={realizada ? "Eliminar" : "Cancelar clase"}
            onConfirmar={() => c && handleDelete(c.idClase)} />
        )
      })()}
    </div>
  )
}
