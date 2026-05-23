import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Filter,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getUsuarios, cambiarEstadoUsuario, eliminarUsuario } from "@/api"

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

const roleLabels = {
  admin: "Administrador",
  profesor: "Profesor",
  alumno: "Alumno",
}

export default function UsuariosPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, action: "" })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar usuarios de la API al montar el componente
  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getUsuarios()
      // Nos aseguramos de que 'data' sea un array válido antes de guardarlo
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      setError("No se pudieron cargar los usuarios. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✨ FILTRO BLINDADO CONTRA CAMPOS NULOS O MAYÚSCULAS DE LA BASE DE DATOS
  const filteredUsers = users.filter((user) => {
    // Normalizamos textos básicos para evitar errores con .toLowerCase()
    const nombreUser = user?.nombre ? String(user.nombre).toLowerCase() : ""
    const dniUser = user?.dni ? String(user.dni) : ""
    const emailUser = user?.email ? String(user.email).toLowerCase() : ""
    
    // Validamos y limpiamos las propiedades que indexan configuraciones visuales (evita el crash de pantalla negra)
    const estadoUser = user?.estado ? String(user.estado).toLowerCase().trim() : "activo"
    const perfilUser = user?.perfil ? String(user.perfil).toLowerCase().trim() : "alumno"
    const membresiaUser = user?.membresia ? String(user.membresia).toLowerCase().trim() : "vencida"

    // Guardamos los valores corregidos temporalmente en el objeto del usuario para el renderizado seguro abajo
    user.estado = statusConfig[estadoUser] ? estadoUser : "activo"
    user.perfil = roleLabels[perfilUser] ? perfilUser : "alumno"
    user.membresia = membershipConfig[membresiaUser] ? membresiaUser : "vencida"

    const matchesSearch =
      nombreUser.includes(search.toLowerCase()) ||
      dniUser.includes(search) ||
      emailUser.includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || user.estado === statusFilter
    const matchesRole = roleFilter === "all" || user.perfil === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await cambiarEstadoUsuario(userId, newStatus)
      setUsers(users.map((u) => (u.id === userId ? { ...u, estado: newStatus } : u)))
    } catch (err) {
      console.error("Error al cambiar estado:", err)
      setError("Error al cambiar el estado del usuario")
    }
    setConfirmDialog({ open: false, user: null, action: "" })
  }

  const handleDeleteUser = async (userId) => {
    setIsDeleting(true)
    try {
      await eliminarUsuario(userId)
      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      console.error("Error al eliminar usuario:", err)
      setError("Error al eliminar el usuario")
    } finally {
      setIsDeleting(false)
      setDeleteDialog({ open: false, user: null })
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <HelpTooltip content="Aquí puedes ver, crear, editar, suspender o eliminar usuarios del sistema. Usa los filtros para encontrar usuarios específicos." />
          </div>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <Link to="/admin/usuarios/nuevo">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
            <HelpTooltip content="Crear un nuevo usuario en el sistema con todos sus datos personales y asignarle un perfil." iconClassName="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o email..."
                className="pl-9 bg-secondary border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <HelpTooltip content="Escribe el nombre, DNI o email del usuario que buscas. La búsqueda se actualiza automáticamente." />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los perfiles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="profesor">Profesor</SelectItem>
                <SelectItem value="alumno">Alumno</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" className="border-border">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <HelpTooltip content="Descarga un archivo Excel con todos los usuarios filtrados actualmente." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">DNI</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Teléfono</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Perfil</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Membresía</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Créditos</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{user.nombre}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-foreground">{user.dni}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-foreground">{user.telefono}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-foreground">{roleLabels[user.perfil]}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={statusConfig[user.estado].className}>
                          {statusConfig[user.estado].label}
                        </Badge>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <Badge variant="outline" className={membershipConfig[user.membresia].className}>
                          {membershipConfig[user.membresia].label}
                        </Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="font-medium text-foreground">{user.creditos}</span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/usuarios/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/usuarios/${user.id}/editar`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.estado === "activo" && (
                              <DropdownMenuItem
                                onClick={() => setConfirmDialog({ open: true, user, action: "suspend" })}
                                className="text-green-500"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                            {user.estado === "suspendido" && (
                              <DropdownMenuItem
                                onClick={() => setConfirmDialog({ open: true, user, action: "activate" })}
                                className="text-green-500"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            {user.estado !== "inactivo" && (
                                <DropdownMenuItem
                                onClick={() => setConfirmDialog({ open: true, user, action: "deactivate" })}
                                className="text-green-500"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Dar de Baja
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, user })}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar Permanente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogos de Confirmación de Estado */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "suspend" && "Suspender Usuario"}
              {confirmDialog.action === "activate" && "Activar Usuario"}
              {confirmDialog.action === "deactivate" && "Dar de Baja Usuario"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "suspend" &&
                `¿Estás seguro de suspender a ${confirmDialog.user?.nombre}? El usuario no podrá reservar clases ni usar sus créditos.`}
              {confirmDialog.action === "activate" &&
                `¿Estás seguro de activar a ${confirmDialog.user?.nombre}? El usuario podrá volver a usar el sistema.`}
              {confirmDialog.action === "deactivate" &&
                `¿Estás seguro de dar de baja a ${confirmDialog.user?.nombre}? Esta acción deshabilitará completamente al usuario.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, user: null, action: "" })}>
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.action === "activate" ? "default" : "destructive"}
              onClick={() => {
                if (confirmDialog.user) {
                  const newStatus =
                    confirmDialog.action === "suspend"
                      ? "suspendido"
                      : confirmDialog.action === "activate"
                        ? "activo"
                        : "inactivo"
                  handleStatusChange(confirmDialog.user.id, newStatus)
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Eliminación Permanente */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Usuario Permanentemente</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>{`¿Estás seguro de eliminar permanentemente a ${deleteDialog.user?.nombre}?`}</p>
              <p className="font-semibold text-destructive">
                Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario, incluyendo historial de reservas y créditos.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.user) {
                  handleDeleteUser(deleteDialog.user.id)
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}