import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Loader2, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/api"
import { toast } from '@/lib/notificar'

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  precio: "",
  cantidadCreditos: "",
  tipo: "ClaseCross",
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [planEditando, setPlanEditando] = useState(null)
  const [formData, setFormData] = useState(FORM_VACIO)
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
      console.error("Error al obtener planes:", err)
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

  const abrirNuevo = () => {
    setPlanEditando(null)
    setFormData(FORM_VACIO)
    setDialogOpen(true)
  }

  const abrirEditar = (plan) => {
    setPlanEditando(plan)
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion || "",
      precio: plan.precio,
      cantidadCreditos: plan.cantidadCreditos,
      tipo: plan.tipo || "ClaseCross",
    })
    setDialogOpen(true)
  }

  const guardarPlan = async () => {
    if (!formData.nombre || formData.precio === "" || formData.cantidadCreditos === "") {
      toast.error("Nombre, precio y cantidad de créditos son obligatorios.")
      return
    }

    setGuardando(true)

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        cantidadCreditos: Number(formData.cantidadCreditos),
        tipo: formData.tipo,
      }

      if (planEditando) {
        await apiClient.put(`/planes/${planEditando.idPlan}`, payload)
      } else {
        await apiClient.post("/planes", payload)
      }

      toast.success(planEditando ? "Plan actualizado exitosamente" : "Plan creado exitosamente")
      setDialogOpen(false)
      await cargarPlanes()
    } catch (err) {
      console.error("Error al guardar plan:", err)
      toast.error("No se pudo guardar el plan", { description: err.response?.data?.message })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!deleteDialog.plan) return
    setEliminando(true)
    try {
      await apiClient.delete(`/planes/${deleteDialog.plan.idPlan}`)
      toast.success("Plan eliminado exitosamente")
      setDeleteDialog({ open: false, plan: null })
      await cargarPlanes()
    } catch (err) {
      console.error("Error al eliminar plan:", err)
      toast.error("No se pudo eliminar el plan", { description: err.response?.data?.message })
      setDeleteDialog({ open: false, plan: null })
    } finally {
      setEliminando(false)
    }
  }

  const formatearPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(precio)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Planes y Membresías</h1>
          <p className="text-sm text-foreground/40 mt-1">Gestioná los planes de abono disponibles para los alumnos</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="sm:self-start bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Plan
        </button>
      </div>

      {error && (
        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((plan) => (
            <div key={plan.idPlan} className="border border-border bg-card">
              <div className="border-b border-border px-5 py-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</p>
                  <p className="font-black text-foreground text-sm mt-0.5">{plan.nombre}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border shrink-0">
                  {plan.tipo === "PlanificacionAtleta" ? "Planificación" : "CrossFit"}
                </span>
              </div>
              <div className="p-5 space-y-3">
                {plan.descripcion && (
                  <p className="text-sm text-foreground/40">{plan.descripcion}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Precio</p>
                  <span className="font-black text-foreground">{formatearPrecio(plan.precio)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Créditos</p>
                  <span className="font-semibold text-foreground">{plan.cantidadCreditos}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => abrirEditar(plan)}
                    className="flex-1 border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ open: true, plan })}
                    className="border border-red-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && planes.length === 0 && (
        <div className="border border-border bg-card p-12 text-center">
          <CreditCard className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-foreground/40 mb-4">Todavía no hay planes cargados.</p>
          <button
            onClick={abrirNuevo}
            className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Primer Plan
          </button>
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{planEditando ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: CLASE CROSSFIT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Plan de entrenamiento grupal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio *</Label>
                <Input
                  id="precio"
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="36000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditos">Créditos *</Label>
                <Input
                  id="creditos"
                  type="number"
                  value={formData.cantidadCreditos}
                  onChange={(e) => setFormData({ ...formData, cantidadCreditos: e.target.value })}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ClaseCross">Clase CrossFit</SelectItem>
                  <SelectItem value="PlanificacionAtleta">Planificación Atleta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarPlan}
              disabled={guardando}
              className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              className="border border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
