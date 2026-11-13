import { EstadoVacio } from "@/components/admin/kit"
import { Cargando } from '@/components/Cargando'
import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Loader2, CreditCard, Users, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [guardando, setGuardando] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState({ open: false, plan: null })
  const [eliminando, setEliminando] = useState(false)

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
    setApertura(a => a + 1)
    setDialogOpen(true)
  }

  const abrirEditar = (plan) => {
    setPlanEditando(plan)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TituloPagina descripcion={"Los planes de abono que pueden comprar los alumnos"}>Planes y membresías</TituloPagina>
        </div>
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

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Cargando filas={3} className="py-4" />
      ) : (
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

      {/* Dialog eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, plan: open ? deleteDialog.plan : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que querés eliminar el plan <strong>{deleteDialog.plan?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteDialog({ open: false, plan: null })}
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarEliminar}
              disabled={eliminando}
              className="border border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
