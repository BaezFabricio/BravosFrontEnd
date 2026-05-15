import { useState } from "react"
import { Shield, Plus, Pencil, Trash2, Check, Users, Calendar, CreditCard, Settings, LayoutDashboard, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const modulosConfig = [
  { id: "dashboard", nombre: "Dashboard", icon: LayoutDashboard },
  { id: "usuarios", nombre: "Usuarios", icon: Users },
  { id: "clases", nombre: "Clases", icon: Calendar },
  { id: "reservas", nombre: "Reservas", icon: Calendar },
  { id: "creditos", nombre: "Créditos", icon: CreditCard },
  { id: "membresias", nombre: "Membresías", icon: CreditCard },
  { id: "perfiles", nombre: "Perfiles", icon: Shield },
  { id: "configuracion", nombre: "Configuración", icon: Settings },
]

const permisosConfig = [
  { id: "alta", nombre: "Alta", color: "green", descripcion: "Crear nuevos registros" },
  { id: "baja", nombre: "Baja", color: "red", descripcion: "Eliminar registros" },
  { id: "consulta", nombre: "Consulta", color: "blue", descripcion: "Ver información" },
  { id: "modificacion", nombre: "Modificación", color: "amber", descripcion: "Editar registros" },
]

const crearModulosVacios = () => {
  const modulos = {}
  modulosConfig.forEach((m) => {
    modulos[m.id] = { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } }
  })
  return modulos
}

const crearModulosCompletos = () => {
  const modulos = {}
  modulosConfig.forEach((m) => {
    modulos[m.id] = { activo: true, permisos: { alta: true, baja: true, consulta: true, modificacion: true } }
  })
  return modulos
}

const perfilesIniciales = [
  {
    id: "admin",
    nombre: "Administrador",
    descripcion: "Acceso completo",
    usuarios: 2,
    modulos: crearModulosCompletos(),
  },
  {
    id: "profesor",
    nombre: "Profesor",
    descripcion: "Gestión de clases",
    usuarios: 5,
    modulos: {
      dashboard: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      usuarios: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      clases: { activo: true, permisos: { alta: true, baja: false, consulta: true, modificacion: true } },
      reservas: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      creditos: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
      membresias: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
      perfiles: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
      configuracion: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
    },
  },
  {
    id: "alumno",
    nombre: "Alumno",
    descripcion: "Reservas y consultas",
    usuarios: 186,
    modulos: {
      dashboard: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      usuarios: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
      clases: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      reservas: { activo: true, permisos: { alta: true, baja: true, consulta: true, modificacion: false } },
      creditos: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      membresias: { activo: true, permisos: { alta: false, baja: false, consulta: true, modificacion: false } },
      perfiles: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
      configuracion: { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } },
    },
  },
]

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState(perfilesIniciales)
  const [editDialog, setEditDialog] = useState({ open: false, perfil: null, isNew: false })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, perfil: null })
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    modulos: crearModulosVacios(),
  })
  const [isLoading, setIsLoading] = useState(false)

  const openEditDialog = (perfil) => {
    if (perfil) {
      setFormData({
        nombre: perfil.nombre,
        descripcion: perfil.descripcion,
        modulos: JSON.parse(JSON.stringify(perfil.modulos)),
      })
      setEditDialog({ open: true, perfil, isNew: false })
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        modulos: crearModulosVacios(),
      })
      setEditDialog({ open: true, perfil: null, isNew: true })
    }
  }

  const toggleModulo = (moduloId) => {
    setFormData((prev) => {
      const moduloActual = prev.modulos[moduloId]
      const nuevoActivo = !moduloActual.activo
      return {
        ...prev,
        modulos: {
          ...prev.modulos,
          [moduloId]: {
            activo: nuevoActivo,
            permisos: nuevoActivo
              ? moduloActual.permisos
              : { alta: false, baja: false, consulta: false, modificacion: false },
          },
        },
      }
    })
  }

  const togglePermiso = (moduloId, tipo) => {
    setFormData((prev) => ({
      ...prev,
      modulos: {
        ...prev.modulos,
        [moduloId]: {
          ...prev.modulos[moduloId],
          permisos: {
            ...prev.modulos[moduloId].permisos,
            [tipo]: !prev.modulos[moduloId].permisos[tipo],
          },
        },
      },
    }))
  }

  const contarPermisos = (modulos) => {
    let count = 0
    Object.values(modulos).forEach((m) => {
      if (m.activo) {
        if (m.permisos.alta) count++
        if (m.permisos.baja) count++
        if (m.permisos.consulta) count++
        if (m.permisos.modificacion) count++
      }
    })
    return count
  }

  const contarModulosActivos = (modulos) => {
    return Object.values(modulos).filter((m) => m.activo).length
  }

  const handleSave = async () => {
    setIsLoading(true)

    const body = {
      id: editDialog.isNew ? undefined : editDialog.perfil?.id,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      modulos: formData.modulos,
    }

    try {
      const response = await fetch("/api/perfiles", {
        method: editDialog.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Error al guardar")

      await new Promise((resolve) => setTimeout(resolve, 500))
      
      if (editDialog.isNew) {
        setPerfiles([
          ...perfiles,
          {
            id: `perfil-${Date.now()}`,
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            usuarios: 0,
            modulos: formData.modulos,
          },
        ])
      } else if (editDialog.perfil) {
        setPerfiles(
          perfiles.map((p) =>
            p.id === editDialog.perfil?.id
              ? { ...p, nombre: formData.nombre, descripcion: formData.descripcion, modulos: formData.modulos }
              : p
          )
        )
      }
      
      setEditDialog({ open: false, perfil: null, isNew: false })
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.perfil) return
    setIsLoading(true)

    try {
      const response = await fetch("/api/perfiles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteDialog.perfil.id }),
      })

      if (!response.ok) throw new Error("Error al eliminar")

      await new Promise((resolve) => setTimeout(resolve, 500))
      setPerfiles(perfiles.filter((p) => p.id !== deleteDialog.perfil?.id))
      setDeleteDialog({ open: false, perfil: null })
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      green: { bg: "bg-green-600", border: "border-green-600", text: "text-green-600" },
      red: { bg: "bg-red-600", border: "border-red-600", text: "text-red-600" },
      blue: { bg: "bg-blue-600", border: "border-blue-600", text: "text-blue-600" },
      amber: { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-500" },
    }
    return colors[color] || colors.green
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Perfiles y Permisos</h1>
            <HelpTooltip content="Los perfiles definen que puede hacer cada tipo de usuario en el sistema. Cada perfil tiene modulos con permisos de alta, baja, consulta y modificacion." />
          </div>
          <p className="text-muted-foreground">Administra los roles y sus permisos</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openEditDialog(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {perfiles.map((perfil) => (
          <Card key={perfil.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {perfil.nombre}
                </CardTitle>
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  {perfil.usuarios} usuarios
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{perfil.descripcion}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {contarModulosActivos(perfil.modulos)} módulos · {contarPermisos(perfil.modulos)} permisos
                </p>
                <div className="flex flex-wrap gap-1">
                  {modulosConfig.map((modulo) => {
                    const m = perfil.modulos[modulo.id]
                    return m?.activo ? (
                      <Badge key={modulo.id} variant="secondary" className="text-xs">
                        {modulo.nombre}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(perfil)}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Editar
                </Button>
                {perfil.usuarios === 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => setDeleteDialog({ open: true, perfil })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tipos de Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {permisosConfig.map((permiso) => (
              <div key={permiso.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getColorClasses(permiso.color).bg}`}></div>
                <span className="text-sm text-foreground">{permiso.nombre} - {permiso.descripcion}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.isNew ? "Crear Nuevo Perfil" : "Editar Perfil"}</DialogTitle>
            <DialogDescription>
              {editDialog.isNew ? "Define un nuevo perfil con permisos específicos" : "Modifica los permisos de este perfil"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Perfil</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Recepcionista"
                  className="bg-secondary border-border"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  placeholder="Describe las responsabilidades"
                  className="bg-secondary border-border"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Módulos y Permisos</Label>
              <p className="text-sm text-muted-foreground">
                Activa un módulo para configurar sus permisos específicos
              </p>
              
              <div className="space-y-1 bg-secondary/30 rounded-lg p-4">
                {modulosConfig.map((modulo, index) => {
                  const Icon = modulo.icon
                  const moduloData = formData.modulos[modulo.id]
                  const isActivo = moduloData?.activo || false
                  const permisos = moduloData?.permisos || { alta: false, baja: false, consulta: false, modificacion: false }
                  const isLast = index === modulosConfig.length - 1
                  
                  return (
                    <div key={modulo.id}>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => toggleModulo(modulo.id)}
                          className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors flex-1 text-left ${
                            isActivo 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          {isActivo ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="font-medium">{modulo.nombre}</span>
                          {isActivo && (
                            <div className="flex gap-1 ml-auto">
                              {permisos.alta && <div className="w-2 h-2 rounded-full bg-green-600"></div>}
                              {permisos.baja && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                              {permisos.consulta && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                              {permisos.modificacion && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                            </div>
                          )}
                        </button>
                      </div>

                      {isActivo && (
                        <div className="ml-3 mt-1 mb-2">
                          {permisosConfig.map((permiso, permisoIndex) => {
                            const isPermisoLast = permisoIndex === permisosConfig.length - 1
                            const isPermisoActivo = permisos[permiso.id]
                            const colorClasses = getColorClasses(permiso.color)
                            
                            return (
                              <div key={permiso.id} className="flex items-stretch">
                                <div className="flex items-center w-6 shrink-0">
                                  <div className="relative w-full h-full flex items-center">
                                    <div 
                                      className={`absolute left-2 w-px bg-border ${
                                        isPermisoLast ? "h-1/2 top-0" : "h-full"
                                      }`}
                                    ></div>
                                    <div className="absolute left-2 w-3 h-px bg-border"></div>
                                  </div>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => togglePermiso(modulo.id, permiso.id)}
                                  className={`flex items-center gap-2 py-1.5 px-3 my-0.5 rounded-md transition-all flex-1 text-left border ${
                                    isPermisoActivo 
                                      ? `${colorClasses.border} ${colorClasses.bg}/10` 
                                      : "border-transparent hover:bg-secondary/50"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                    isPermisoActivo 
                                      ? `${colorClasses.bg} ${colorClasses.border} text-white` 
                                      : "border-muted-foreground/40"
                                  }`}>
                                    {isPermisoActivo && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className={`text-sm ${isPermisoActivo ? colorClasses.text : "text-muted-foreground"}`}>
                                    {permiso.nombre}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                                    - {permiso.descripcion}
                                  </span>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, perfil: null, isNew: false })}>
              Cancelar
            </Button>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={isLoading || !formData.nombre}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialog.isNew ? "Crear Perfil" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Eliminar Perfil</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el perfil &quot;{deleteDialog.perfil?.nombre}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, perfil: null })}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
