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
import { Input } from "@/components/ui/input"
import { HelpTooltip } from "@/components/ui/help-tooltip"
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
import { Button } from "@/components/ui/button"
import { cambiarEstadoUsuario, eliminarUsuario, normalizarUsuario } from "@/api"
import { toast } from '@/lib/notificar'

const getIniciales = (name) => {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Activa", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  por_vencer: { label: "Por Vencer", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
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

  // 🟢 ESTADO PARA LOS PERMISOS DEL USUARIO LOGUEADO
  const [permisos, setPermisos] = useState([])

  // Cargar usuarios y permisos al montar el componente
  useEffect(() => {
    cargarUsuarios()

    // 🟢 CARGAMOS LOS PERMISOS DESDE EL LOCALSTORAGE
    const storedPermisos = localStorage.getItem("permisos")
    if (storedPermisos) {
      try {
        setPermisos(JSON.parse(storedPermisos))
      } catch (err) {
        console.error("Error al parsear permisos en UsuariosPage:", err)
      }
    }
  }, [])

  const cargarUsuarios = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")

      // 🟢 FETCH DIRECTO AL BACKEND: Saltamos getUsuarios() para evitar filtros fantasmas
      const res = await fetch("http://localhost:3001/api/vv1/usuarios", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const resultado = await res.json()
      
      // 🔴 REVISIÓN CLAVE: Mirá este log en la consola del navegador (F12)
      console.log("📥 DATOS REALES QUE LLEGAN A LA TABLA:", resultado)

      const listaReal = resultado.data || resultado;
      setUsers(Array.isArray(listaReal) ? listaReal : [])
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      setError("No se pudieron cargar los usuarios. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✨ FILTRO BLINDADO CONTRA CAMPOS NULOS O MAYÚSCULAS DE LA BASE DE DATOS
  const filteredUsers = users
    .map((user) => {
      const normalized = normalizarUsuario ? normalizarUsuario(user) : user
      
      // 🟢 CAPTURA DIRECTA DE SQL: Si el backend manda nombrePerfil, lo usamos directo sin intermediarios
      const nombrePerfilReal = user.nombrePerfil || normalized.nombrePerfil || user.perfil || "";
      const idPerfilReal = user.idPerfil !== undefined ? user.idPerfil : normalized.idPerfil;
      const idReal = user.idUsuario || normalized.idUsuario || user.id || normalized.id;

      // 🟢 TRATAMIENTO DE MEMBRESÍA: Evita strings vacíos o roturas por mayúsculas
      let membresiaBackend = String(user.membresia || normalized.membresia || "").toLowerCase().trim();

      // Homologamos términos del backend al tipado del objeto de configuración local
      if (membresiaBackend === "activa" || membresiaBackend === "activo") {
        membresiaBackend = "vigente";
      }

      // Si viene nula o no coincide con los badges visuales, deducimos según el estado base del alumno
      if (!membershipConfig[membresiaBackend]) {
        membresiaBackend = (user.estado === "activo" || normalized.estado === "activo") ? "vigente" : "vencida";
      }

      return {
        ...normalized,
        ...user, // Inyectamos las propiedades crudas encima
        idUsuario: idReal,
        idPerfil: idPerfilReal,
        nombrePerfil: nombrePerfilReal, // Forzamos que se guarde el texto real que viene de la query
        estado: statusConfig[user.estado || normalized.estado] ? (user.estado || normalized.estado) : "activo",
        membresia: membresiaBackend
      }
    })
    .filter((user) => {
      const nombreUser = (user.nombre || user.nombrecompleto || "").toLowerCase()
      const dniUser = user.dni || ""
      const emailUser = (user.email || user.correo || "").toLowerCase()

      const matchesSearch =
        nombreUser.includes(search.toLowerCase()) ||
        dniUser.includes(search) ||
        emailUser.includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || user.estado === statusFilter
      
      // Filtro de roles por ID numérico o texto
      const stringPerfil = String(user.nombrePerfil || user.idPerfil || "").toLowerCase()
      const matchesRole = roleFilter === "all" || stringPerfil.includes(roleFilter.toLowerCase())
      
      return matchesSearch && matchesStatus && matchesRole
    })

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await cambiarEstadoUsuario(userId, newStatus)
      setUsers(users.map((u) => (u.id === userId ? { ...u, estado: newStatus } : u)))
    } catch (err) {
      console.error("Error al cambiar estado:", err)
      toast.error("Error al cambiar el estado del usuario")
    }
    setConfirmDialog({ open: false, user: null, action: "" })
  }

  const handleDeleteUser = async (userId) => {
    setIsDeleting(true)
    try {
      await eliminarUsuario(userId)
      setUsers(prev => prev.filter((u) => (u.idUsuario || u.id) !== userId))
      toast.success("Usuario eliminado correctamente")
    } catch (err) {
      console.error("Error al eliminar usuario:", err)
      toast.error("Error al eliminar el usuario", { description: err?.response?.data?.message || err.message })
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
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Gestión de Usuarios</h1>
          <p className="text-sm text-foreground/40 mt-1">Administra los usuarios del sistema</p>
        </div>

        {/* 🟢 PROTECCIÓN DEL BOTÓN NUEVO USUARIO (Requieres usuarios:alta) */}
        {permisos.includes("usuarios:alta") && (
          <Link
            to="/admin/usuarios/nuevo"
            className="inline-flex items-center bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Link>
        )}
      </div>

      <div className="border border-border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI o email..."
              className="pl-9 bg-secondary border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

          {/* 🟢 PROTECCIÓN DEL BOTÓN EXPORTAR */}
          {(permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver")) && (
            <button className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          )}
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuarios ({filteredUsers.length})</p>
        </div>
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <p className="text-foreground/40">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuario</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">DNI</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Perfil</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Membresía</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Créditos</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.idUsuario || user.id} className="hover:bg-foreground/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-xs overflow-hidden">
                            {user.avatarUrl
                              ? <img src={user.avatarUrl} alt={user.nombre} className="h-full w-full object-cover" />
                              : getIniciales(user.nombre)
                            }
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{user.nombre}</p>
                            <p className="text-xs text-foreground/40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-foreground">{user.dni}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-foreground">{user.telefono}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">
                          {user.nombrePerfil || user.perfil || "Sin Perfil"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const cfg = statusConfig[user.estado] || statusConfig.activo
                          const isActivo = user.estado === "activo"
                          const isSuspendido = user.estado === "suspendido"
                          return (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${isActivo ? "bg-lime-400/10 text-lime-400 border-lime-400/20" : isSuspendido ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : "bg-foreground/5 text-foreground/50 border-border"}`}>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {(() => {
                          const cfg = membershipConfig[user.membresia] || membershipConfig.vencida
                          const isVigente = user.membresia === "vigente" || user.membresia === "activa"
                          const isPorVencer = user.membresia === "por_vencer"
                          return (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${isVigente ? "bg-lime-400/10 text-lime-400 border-lime-400/20" : isPorVencer ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="font-semibold text-sm text-foreground">{user.creditos}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            
                            {/* 🟢 ACCIÓN: VER DETALLE */}
                            {(permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver")) && (
                              <DropdownMenuItem asChild>
                               <Link to={`/admin/usuarios/${user.idUsuario || user.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalle
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {/* 🟢 ACCIÓN: EDICIÓN */}
                            {permisos.includes("usuarios:modificacion") && (
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/usuarios/${user.idUsuario || user.id}/editar`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            )}
                            
                            {/* 🟢 ACCIONES DE CAMBIO DE ESTADO */}
                            {permisos.includes("usuarios:modificacion") && (
                              <>
                                <DropdownMenuSeparator />
                                {user.estado === "activo" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({ open: true, user, action: "suspend" })}
                                    className="text-yellow-500 px-4 py-2"
                                  >
                                    <UserX className="mr-3 h-5 w-5" />
                                    Suspender
                                  </DropdownMenuItem>
                                )}
                                
                                {user.estado === "suspendido" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({ open: true, user, action: "activate" })}
                                    className="text-green-500 px-4 py-2"
                                  >
                                    <UserCheck className="mr-3 h-5 w-5" />
                                    Activar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}

                            {/* 🟢 ACCIÓN: DAR DE BAJA */}
                            {permisos.includes("usuarios:baja") && user.estado !== "inactivo" && (
                              <DropdownMenuItem
                                onClick={() => setConfirmDialog({ open: true, user, action: "deactivate" })}
                                className="text-gray-500 px-4 py-2"
                              >
                                <UserX className="mr-3 h-5 w-5" />
                                Dar de Baja
                              </DropdownMenuItem>
                            )}

                            {/* 🟢 ACCIÓN: ELIMINAR PERMANENTE */}
                            {permisos.includes("usuarios:baja") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteDialog({ open: true, user })}
                                  className="text-destructive px-4 py-2"
                                >
                                  <Trash2 className="mr-3 h-5 w-5" />
                                  Eliminar Permanente
                                </DropdownMenuItem>
                              </>
                            )}

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
                  handleStatusChange(confirmDialog.user.idUsuario || confirmDialog.user.id, newStatus)
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
                  handleDeleteUser(deleteDialog.user.idUsuario || deleteDialog.user.id)
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