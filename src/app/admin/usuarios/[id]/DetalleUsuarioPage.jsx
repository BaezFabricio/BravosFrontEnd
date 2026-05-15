import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Pencil, UserX, UserCheck, History, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const user = {
  id: "1",
  nombre: "María García",
  dni: "32456789",
  email: "maria@email.com",
  telefono: "+54 11 1234 5678",
  perfil: "alumno",
  estado: "activo",
  membresia: "vigente",
  creditos: 12,
  creditosUsados: 8,
  fechaRegistro: "2024-01-15",
  ultimoAcceso: "2024-03-10",
  vencimientoMembresia: "2024-04-15",
}

const reservas = [
  { id: "1", clase: "Funcional WOD", fecha: "2024-03-10", hora: "08:00", coach: "Pablo Ruiz", asistio: true },
  { id: "2", clase: "Funcional", fecha: "2024-03-08", hora: "09:30", coach: "Maria Gomez", asistio: true },
  { id: "3", clase: "Funcional WOD", fecha: "2024-03-05", hora: "18:00", coach: "Pablo Ruiz", asistio: false },
  { id: "4", clase: "Open Box", fecha: "2024-03-03", hora: "11:00", coach: "Diego Torres", asistio: true },
]

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function DetalleUsuarioPage() {
  const navigate = useNavigate()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState({ open: false, action: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(user.estado)

  const status = statusConfig[currentStatus]
  const membership = membershipConfig[user.membresia]

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/usuarios/${user.id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          estado: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar estado")
      }

      setCurrentStatus(newStatus)
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
      setStatusDialog({ open: false, action: "" })
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar usuario")
      }

      navigate("/admin/usuarios")
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
      setDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/usuarios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.nombre}</h1>
            <p className="text-muted-foreground">Detalle del usuario</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/usuarios/${user.id}/editar`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          {currentStatus === "activo" ? (
            <Button 
              variant="outline" 
              className="text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10"
              onClick={() => setStatusDialog({ open: true, action: "suspend" })}
            >
              <UserX className="mr-2 h-4 w-4" />
              Suspender
            </Button>
          ) : currentStatus !== "inactivo" ? (
            <Button 
              variant="outline" 
              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
              onClick={() => setStatusDialog({ open: true, action: "activate" })}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Activar
            </Button>
          ) : null}
          <Button 
            variant="outline" 
            className="text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium text-foreground">{user.nombre}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">DNI</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {user.dni}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user.telefono}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {user.fechaRegistro}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Último Acceso</p>
                <p className="font-medium text-foreground">{user.ultimoAcceso}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuario</span>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Membresía</span>
                <Badge variant="outline" className={membership.className}>
                  {membership.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vencimiento</span>
                <span className="text-sm font-medium text-foreground">{user.vencimientoMembresia}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Perfil</span>
                <span className="text-sm font-medium text-foreground capitalize">{user.perfil}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Créditos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-primary">{user.creditos}</p>
                <p className="text-sm text-muted-foreground">disponibles</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usados este mes</span>
                  <span className="font-medium text-foreground">{user.creditosUsados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total del plan</span>
                  <span className="font-medium text-foreground">{user.creditos + user.creditosUsados}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historial de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Clase</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Hora</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Coach</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="border-b border-border">
                    <td className="p-4 font-medium text-foreground">{reserva.clase}</td>
                    <td className="p-4 text-foreground">{reserva.fecha}</td>
                    <td className="p-4 text-foreground">{reserva.hora}</td>
                    <td className="p-4 text-foreground">{reserva.coach}</td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={
                          reserva.asistio
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }
                      >
                        {reserva.asistio ? "Asistió" : "No asistió"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {statusDialog.action === "suspend" ? "Suspender Usuario" : "Activar Usuario"}
            </DialogTitle>
            <DialogDescription>
              {statusDialog.action === "suspend"
                ? `¿Estás seguro de suspender a ${user.nombre}? El usuario no podrá reservar clases ni usar sus créditos.`
                : `¿Estás seguro de activar a ${user.nombre}? El usuario podrá volver a usar el sistema.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, action: "" })}>
              Cancelar
            </Button>
            <Button
              variant={statusDialog.action === "activate" ? "default" : "destructive"}
              onClick={() => handleStatusChange(statusDialog.action === "suspend" ? "suspendido" : "activo")}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Usuario Permanentemente</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>{`¿Estás seguro de eliminar permanentemente a ${user.nombre}?`}</p>
              <p className="font-semibold text-destructive">
                Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario, incluyendo historial de reservas y créditos.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Permanentemente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
