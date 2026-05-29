import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Pencil, UserX, UserCheck, Trash2, Loader2 } from "lucide-react"
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
import { cambiarEstadoUsuario, eliminarUsuario, getUsuarioById, normalizarUsuario } from "@/api"

const reservas = [
  { id: "1", clase: "Funcional WOD", fecha: "2024-03-10", hora: "08:00", coach: "Pablo Ruiz", asistio: true },
  { id: "2", clase: "Funcional", fecha: "2024-03-08", hora: "09:30", coach: "Maria Gomez", asistio: true },
  { id: "3", clase: "Funcional WOD", fecha: "2024-03-05", hora: "18:00", coach: "Pablo Ruiz", asistio: false },
  { id: "4", clase: "Open Box", fecha: "2024-03-03", hora: "11:00", coach: "Diego Torres", asistio: true },
]

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function DetalleUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState({ open: false, action: "" })
  const [error, setError] = useState("")

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setIsLoading(true)
        setError("")
        const data = await getUsuarioById(id)
        setUser(normalizarUsuario(data))
      } catch (fetchError) {
        console.error("Error al cargar detalle del usuario:", fetchError)
        setError("No se pudo cargar el detalle del usuario.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarUsuario()
    }
  }, [id])

  const status = statusConfig[user?.estado] || statusConfig.activo
  const membership = membershipConfig[user?.membresia] || membershipConfig.vencida

  const handleStatusChange = async (newStatus) => {
    try {
      setIsActionLoading(true)
      await cambiarEstadoUsuario(id, newStatus)
      setUser((currentUser) => ({ ...currentUser, estado: newStatus }))
    } catch (statusError) {
      console.error("Error al actualizar estado:", statusError)
      setError("No se pudo actualizar el estado del usuario.")
    } finally {
      setIsActionLoading(false)
      setStatusDialog({ open: false, action: "" })
    }
  }

  const handleDelete = async () => {
    try {
      setIsActionLoading(true)
      await eliminarUsuario(id)
      navigate("/admin/usuarios")
    } catch (deleteError) {
      console.error("Error al eliminar usuario:", deleteError)
      setError("No se pudo eliminar el usuario.")
    } finally {
      setIsActionLoading(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Cargando usuario...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
        <Link to="/admin/usuarios">
          <Button variant="outline">Volver a usuarios</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/usuarios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user?.nombre}</h1>
            <p className="text-muted-foreground">Detalle del usuario</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/usuarios/${id}/editar`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          {user?.estado === "activo" ? (
            <Button
              variant="outline"
              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
              onClick={() => setStatusDialog({ open: true, action: "suspend" })}
            >
              <UserX className="mr-2 h-4 w-4" />
              Suspender
            </Button>
          ) : user?.estado !== "inactivo" ? (
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
                <p className="font-medium text-foreground">{user?.nombre}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">DNI</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {user?.dni}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user?.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user?.telefono}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {user?.fechaRegistro || "Sin dato"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Último Acceso</p>
                <p className="font-medium text-foreground">{user?.ultimoAcceso || "Sin dato"}</p>
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
                <span className="text-sm text-muted-foreground">Perfil</span>
                <span className="text-sm font-medium text-foreground capitalize">{user?.perfil}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Créditos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-primary">{user?.creditos ?? 0}</p>
                <p className="text-sm text-muted-foreground">disponibles</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Reservas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Clase</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Hora</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Coach</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="border-b border-border">
                    <td className="p-4 text-foreground">{reserva.clase}</td>
                    <td className="p-4 text-foreground">{reserva.fecha}</td>
                    <td className="p-4 text-foreground">{reserva.hora}</td>
                    <td className="p-4 text-foreground">{reserva.coach}</td>
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
                ? `¿Estás seguro de suspender a ${user?.nombre}? El usuario no podrá reservar clases ni usar sus créditos.`
                : `¿Estás seguro de activar a ${user?.nombre}? El usuario podrá volver a usar el sistema.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, action: "" })}>
              Cancelar
            </Button>
            <Button
              variant={statusDialog.action === "activate" ? "default" : "destructive"}
              onClick={() => handleStatusChange(statusDialog.action === "suspend" ? "suspendido" : "activo")}
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Usuario Permanentemente</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isActionLoading}>
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}