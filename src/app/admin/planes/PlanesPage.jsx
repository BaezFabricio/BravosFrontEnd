import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const [formError, setFormError] = useState("")

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
    setFormError("")
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
    setFormError("")
    setDialogOpen(true)
  }

  const guardarPlan = async () => {
    if (!formData.nombre || formData.precio === "" || formData.cantidadCreditos === "") {
      setFormError("Nombre, precio y cantidad de créditos son obligatorios.")
      return
    }

    setGuardando(true)
    setFormError("")

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

      setDialogOpen(false)
      await cargarPlanes()
    } catch (err) {
      console.error("Error al guardar plan:", err)
      setFormError(err.response?.data?.message || "No se pudo guardar el plan.")
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!deleteDialog.plan) return
    setEliminando(true)
    try {
      await apiClient.delete(`/planes/${deleteDialog.plan.idPlan}`)
      setDeleteDialog({ open: false, plan: null })
      await cargarPlanes()
    } catch (err) {
      console.error("Error al eliminar plan:", err)
      setError(err.response?.data?.message || "No se pudo eliminar el plan.")
      setDeleteDialog({ open: false, plan: null })
    } finally {
      setEliminando(false)
    }
  }

  const formatearPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(precio)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planes y Membresías</h1>
          <p className="text-muted-foreground">Gestioná los planes de abono disponibles para los alumnos</p>
        </div>
        <Button onClick={abrirNuevo} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((plan) => (
            <Card key={plan.idPlan} className="border-border">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {plan.tipo === "PlanificacionAtleta" ? "Planificación Atleta" : "Clase CrossFit"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.descripcion && (
                  <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Precio</span>
                  <span className="font-bold text-foreground">{formatearPrecio(plan.precio)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créditos</span>
                  <span className="font-medium text-foreground">{plan.cantidadCreditos}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => abrirEditar(plan)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => setDeleteDialog({ open: true, plan })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && planes.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Todavía no hay planes cargados.</p>
            <Button onClick={abrirNuevo} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{planEditando ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {formError}
              </div>
            )}

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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarPlan} disabled={guardando} className="bg-primary hover:bg-primary/90">
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
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
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, plan: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
