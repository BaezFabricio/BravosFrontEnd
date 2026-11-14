import { EstadoVacio } from "@/components/admin/kit"
import { Cargando } from '@/components/Cargando'
import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, CreditCard, Users, Layers, MoreVertical, Copy } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmarAdmin } from "@/components/ModalAdmin"
import apiClient from "@/api"
import { toast } from '@/lib/notificar'
import { partesDescripcion } from "@/lib/planes"
import EditorPlan from "./EditorPlan"
import TiposClaseDialog from "./TiposClaseDialog"
import { useTiposClase } from "@/lib/tiposClase"
import { TituloPagina } from "@/components/TituloPagina"

const leerPermisos = () => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }

export default function PlanesPage() {
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { tipos, recargar: recargarTipos } = useTiposClase()
  const [tiposAbierto, setTiposAbierto] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [planEditando, setPlanEditando] = useState(null)
  const [plantilla, setPlantilla] = useState(null) // Duplicar: datos de otro plan para crear uno nuevo
  const [guardando, setGuardando] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState({ open: false, plan: null })

  const cargarPlanes = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await apiClient.get("/planes")
      setPlanes(response.data?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los planes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchPlanes = async () => {
      await cargarPlanes()
    }
    fetchPlanes()
  }, [])

  const permisos = leerPermisos()
  const [apertura, setApertura] = useState(0) // cada apertura del editor empieza de cero con los datos del plan

  const abrirNuevo = () => {
    setPlanEditando(null)
    setPlantilla(null)
    setApertura(a => a + 1)
    setDialogOpen(true)
  }

  const abrirDuplicar = (plan) => {
    setPlanEditando(null)
    setPlantilla({ ...plan, nombre: plan.nombre + " (copia)" })
    setApertura(a => a + 1)
    setDialogOpen(true)
  }

  const abrirEditar = (plan) => {
    setPlanEditando(plan)
    setPlantilla(null)
    setApertura(a => a + 1)
    setDialogOpen(true)
  }

  // El editor valida los campos y arma el payload; el servidor vuelve a validarlo
  const guardarPlan = async (payload) => {

    if (planEditando) {
      const planOriginal = planEditando
      setDialogOpen(false)
      setPlanes(prev => prev.map(p => p.idPlan === planOriginal.idPlan ? { ...p, ...payload } : p))
      try {
        await apiClient.put(`/planes/${planOriginal.idPlan}`, payload)
        toast.success("Plan actualizado exitosamente")
      } catch (err) {
        setPlanes(prev => prev.map(p => p.idPlan === planOriginal.idPlan ? planOriginal : p))
        toast.error("No se pudo guardar el plan", { description: err.response?.data?.message })
      }
    } else {
      setGuardando(true)
      try {
        await apiClient.post("/planes", payload)
        toast.success("Plan creado exitosamente")
        setDialogOpen(false)
        await cargarPlanes()
      } catch (err) {
        toast.error("No se pudo guardar el plan", { description: err.response?.data?.message })
      } finally {
        setGuardando(false)
      }
    }
  }

  const confirmarEliminar = async () => {
    if (!deleteDialog.plan) return
    const planAEliminar = deleteDialog.plan
    setDeleteDialog({ open: false, plan: null })
    setPlanes(prev => prev.filter(p => p.idPlan !== planAEliminar.idPlan))
    try {
      await apiClient.delete(`/planes/${planAEliminar.idPlan}`)
      toast.success("Plan eliminado exitosamente")
    } catch (err) {
      setPlanes(prev => [...prev, planAEliminar])
      toast.error("No se pudo eliminar el plan", { description: err.response?.data?.message })
    }
  }

  const formatearPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(precio)

  const totalAlumnosActivos = planes.reduce((t, p) => t + (Number(p.alumnosActivos) || 0), 0)
  const grupos = Object.values(planes.reduce((acc, p) => {
    const clave = p.tipo || "sin-tipo"
    if (!acc[clave]) acc[clave] = { clave, nombre: p.nombreTipo || p.tipo || "Sin tipo asignado", planes: [] }
    acc[clave].planes.push(p)
    return acc
  }, {}))

  return (
    <div className="space-y-6">
      <TituloPagina descripcion={"Los planes de abono que pueden comprar los alumnos"}>Planes y membresías</TituloPagina>
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{`${planes.length} ${planes.length === 1 ? "plan" : "planes"} · ${totalAlumnosActivos} ${totalAlumnosActivos === 1 ? "alumno activo" : "alumnos activos"}`}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTiposAbierto(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0px 16px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", whiteSpace: "nowrap", cursor: "pointer" }}
            >
              <Layers className="h-4 w-4" />
              Tipos de clase
            </button>
            {permisos.includes("membresias:alta") && (
              <button
                onClick={abrirNuevo}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 13px Archivo", letterSpacing: "0.04em", whiteSpace: "nowrap", cursor: "pointer" }}
              >
                <Plus className="h-4 w-4" />
                NUEVO PLAN
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="lg:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:self-start">
          <button
            onClick={() => setTiposAbierto(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-border px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)] sm:w-auto"
          >
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            Tipos de clase
          </button>
          {permisos.includes("membresias:alta") && (
            <button
              onClick={abrirNuevo}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-lime-400 px-4 text-[13px] font-extrabold uppercase tracking-[.04em] text-[#0b0b0b] transition-colors hover:bg-lime-300 sm:w-auto"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              NUEVO PLAN
            </button>
          )}
        </div>
      </div>

      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Cargando filas={3} className="py-4" />
      ) : (
        <>
          <div className="hidden lg:block">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {grupos.map((grupo) => (
            <section key={grupo.clave} aria-label={`Tipo de clase ${grupo.nombre}`} style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
                <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 18px Archivo" }}>{grupo.nombre}</h2>
                <div style={{ marginTop: 2, font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{`${grupo.planes.length} ${grupo.planes.length === 1 ? "plan" : "planes"}`}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 190px 190px 190px 200px", gap: 16, padding: "12px 22px", borderBottom: "1px solid var(--sh-line)", font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                <span>Plan</span><span>Precio</span><span>Créditos</span><span>Alumnos activos</span><span />
              </div>
              {grupo.planes.map((plan) => {
                const corta = partesDescripcion(plan.descripcion).corta
                const activos = Number(plan.alumnosActivos) || 0
                const creditos = Number(plan.cantidadCreditos) || 0
                const porClase = creditos > 0 ? Math.round(Number(plan.precio) / creditos) : null
                return (
                  <div key={plan.idPlan} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 190px 190px 190px 200px", alignItems: "center", gap: 16, padding: "16px 22px", borderTop: "1px solid var(--sh-line)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: "800 17px Archivo" }}>{plan.nombre}</div>
                      {corta && <div style={{ marginTop: 2, font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{corta}</div>}
                    </div>
                    <div>
                      <div style={{ font: "800 22px Archivo", fontVariantNumeric: "tabular-nums" }}>{formatearPrecio(plan.precio)}</div>
                      {porClase !== null && <div style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{`≈ ${formatearPrecio(porClase)} por clase`}</div>}
                    </div>
                    <div>
                      <div style={{ font: "800 22px Archivo", color: "var(--primary)" }}>
                        {creditos} <span style={{ font: "700 13px Archivo", color: "var(--foreground)" }}>créditos</span>
                      </div>
                      <div style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{plan.creditosPorSemana ? `Hasta ${plan.creditosPorSemana} por semana` : "Sin tope semanal"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, font: "600 14px Archivo", color: activos > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {activos > 0 ? activos : "Ninguno"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      {permisos.includes("membresias:modificacion") && (
                        <button
                          onClick={() => abrirEditar(plan)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0px 14px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer" }}
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </button>
                      )}
                      {(permisos.includes("membresias:alta") || permisos.includes("membresias:baja")) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label={`Más acciones de ${plan.nombre}`}
                              style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", cursor: "pointer" }}
                            >
                              <MoreVertical className="h-[18px] w-[18px]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[232px] p-1.5" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                            {permisos.includes("membresias:alta") && (
                              <DropdownMenuItem onClick={() => abrirDuplicar(plan)} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold">
                                <Copy className="h-4 w-4" aria-hidden="true" /> Duplicar
                              </DropdownMenuItem>
                            )}
                            {permisos.includes("membresias:baja") && (
                              <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, plan })} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold" style={{ color: "var(--sh-danger)" }}>
                                <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar plan
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
          </div>
          <div className="lg:hidden">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {planes.map((plan) => {
            const corta = partesDescripcion(plan.descripcion).corta
            const activos = Number(plan.alumnosActivos) || 0
            const hayDatoActivos = plan.alumnosActivos !== undefined // si el servidor no lo manda, no se muestra un 0 falso
            return (
              <article key={plan.idPlan} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Plan</p>
                  <span className="shrink-0 rounded-md border border-border bg-foreground/5 px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-foreground/60">
                    {plan.nombreTipo || plan.tipo}
                  </span>
                </div>
                <h2 className="mt-1 text-[18px] font-extrabold leading-tight text-foreground">{plan.nombre}</h2>
                {corta && <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">{corta}</p>}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted px-3.5 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Precio</p>
                    <p className="mt-0.5 text-xl font-black tabular-nums text-foreground">{formatearPrecio(plan.precio)}</p>
                  </div>
                  <div className="rounded-xl bg-muted px-3.5 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Créditos</p>
                    <p className="mt-0.5 text-xl font-black tabular-nums text-lime-700 dark:text-lime-400">{plan.cantidadCreditos} <span className="text-xs font-bold text-foreground/55">clases{plan.creditosPorSemana ? ` · ${plan.creditosPorSemana} por semana` : ""}</span></p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {hayDatoActivos ? <span className="flex items-center gap-1.5 font-semibold text-foreground/70">
                    <Users className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                    {activos === 0 ? "Sin alumnos activos" : `${activos} ${activos === 1 ? "alumno activo" : "alumnos activos"}`}
                  </span> : <span />}
                </div>

                <div className="mt-4 flex gap-2 border-t border-border pt-4">
                  {permisos.includes("membresias:modificacion") && (
                    <button
                      onClick={() => abrirEditar(plan)}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-border text-[13px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)]"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                  {permisos.includes("membresias:baja") && (
                    <button
                      onClick={() => setDeleteDialog({ open: true, plan })}
                      aria-label={`Eliminar el plan ${plan.nombre}`}
                      className="flex min-h-11 w-11 items-center justify-center rounded-[10px] border border-red-500/30 text-red-700 transition-colors hover:bg-red-500/10 dark:text-[#ff8a80]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
          </div>
        </>
      )}

      {!loading && !error && planes.length === 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <EstadoVacio
            icono={CreditCard}
            titulo="Todavía no hay planes cargados"
            texto="Sin un plan, los alumnos no pueden reservar sus clases."
            accion={<button type="button" onClick={abrirNuevo} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-lime-400 px-4 text-[13px] font-extrabold uppercase tracking-[.04em] text-[#0b0b0b] hover:bg-lime-300"><Plus className="h-4 w-4" aria-hidden="true" /> CREAR PLAN</button>}
          />
        </div>
      )}

      {/* Crear / editar plan */}
      <EditorPlan
        key={apertura}
        open={dialogOpen}
        plan={planEditando}
        plantilla={plantilla}
        tipos={tipos}
        onClose={() => setDialogOpen(false)}
        onGuardar={guardarPlan}
        guardando={guardando}
        puedeVerClases={permisos.includes("clases:consulta")}
        puedeCrearClases={permisos.includes("clases:alta")}
      />

      {/* Tipos de clase: crear, renombrar, desactivar */}
      <TiposClaseDialog
        open={tiposAbierto}
        onClose={() => setTiposAbierto(false)}
        tipos={tipos}
        onCambio={async () => { await recargarTipos(); await cargarPlanes() }}
        puedeCrear={permisos.includes("membresias:alta")}
        puedeEditar={permisos.includes("membresias:modificacion")}
        puedeBorrar={permisos.includes("membresias:baja")}
      />

      {/* Confirmar: eliminar un plan */}
      <ConfirmarAdmin abierto={deleteDialog.open} onCerrar={() => setDeleteDialog({ open: false, plan: null })}
        titulo={deleteDialog.plan ? "¿Eliminar " + deleteDialog.plan.nombre + "?" : ""} textoAccion="Eliminar plan" onConfirmar={confirmarEliminar}
        texto={(() => {
          const n = Number(deleteDialog.plan?.alumnosActivos) || 0
          return (n === 0 ? "Ningún alumno lo tiene activo." : n + (n === 1 ? " alumno lo tiene activo." : " alumnos lo tienen activo.")) + " No se puede deshacer."
        })()} />
    </div>
  )
}
