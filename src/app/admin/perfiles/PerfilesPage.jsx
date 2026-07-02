import { useState, useEffect } from "react"
import { 
  Shield, 
  Plus, 
  Check, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  LayoutDashboard, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  User,
  ClipboardCheck,
  FileText,
  Dumbbell
} from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Módulos Administrativos
const modulosAdminConfig = [
  { id: "dashboard", nombre: "Dashboard", icon: LayoutDashboard },
  { id: "usuarios", nombre: "Usuarios", icon: Users },
  { id: "clases", nombre: "Clases", icon: Calendar },
  { id: "reservas", nombre: "Reservas", icon: Calendar },
  { id: "creditos", nombre: "Créditos", icon: CreditCard },
  { id: "membresias", nombre: "Membresías", icon: CreditCard },
  { id: "perfiles", nombre: "Perfiles", icon: Shield },
  { id: "configuracion", nombre: "Configuración", icon: Settings },
]

// Sub-módulos del Panel Alumno
const modulosAlumnoConfig = [
  { id: "alumno", nombre: "Panel Alumno: General", icon: User },
  { id: "alumno_reservas", nombre: "Panel Alumno: Reservas", icon: Calendar },
  { id: "alumno_creditos", nombre: "Panel Alumno: Créditos", icon: CreditCard },
]

// Sub-módulos del Panel Profesor
const modulosProfesorConfig = [
  { id: "profesor", nombre: "Panel Profesor: Asistencia", icon: ClipboardCheck },
  { id: "profesor_rutinas", nombre: "Panel Profesor: Rutinas", icon: FileText },
  { id: "profesor_perfil", nombre: "Panel Profesor: Perfil", icon: User },
]

const modulosConfig = [...modulosAdminConfig, ...modulosAlumnoConfig, ...modulosProfesorConfig];

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

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([])
  const [editDialog, setEditDialog] = useState({ open: false, perfil: null, isNew: false })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, perfil: null })
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    modulos: crearModulosVacios(),
  })
  const [isLoading, setIsLoading] = useState(false)

  // Estados aislados para los acordeones maestros
  const [expandedModulos, setExpandedModulos] = useState({})
  const [adminMasterOpen, setAdminMasterOpen] = useState(true) 
  const [alumnoMasterOpen, setAlumnoMasterOpen] = useState(false) 
  const [profesorMasterOpen, setProfesorMasterOpen] = useState(false)

  const cargarPerfiles = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/vv1/perfiles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      const datos = await response.json()
      const arrayReal = datos && Array.isArray(datos.data) ? datos.data : (Array.isArray(datos) ? datos : null);

      // Intentamos recuperar usuarios para calcular conteos por perfil
      let usuariosArray = []
      try {
        const resUsuarios = await fetch("http://localhost:3001/api/vv1/usuarios", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const datosUsuarios = await resUsuarios.json()
        usuariosArray = Array.isArray(datosUsuarios.data) ? datosUsuarios.data : (Array.isArray(datosUsuarios) ? datosUsuarios : [])
      } catch (e) {
        console.warn("No se pudo cargar la lista de usuarios para contabilizar perfiles:", e)
      }

      // Construimos un mapa idPerfil => cantidad
      const mapaConteos = {}
      usuariosArray.forEach(u => {
        const idPerfilUser = u.idPerfil ?? u.id_perfil ?? u.perfil ?? u.rol ?? u.tipo ?? null
        if (idPerfilUser !== null && idPerfilUser !== undefined) {
          const key = String(idPerfilUser)
          mapaConteos[key] = (mapaConteos[key] || 0) + 1
        }
      })

      if (arrayReal) {
        const perfilesTraduccion = arrayReal.map(perfil => {
          const modulosCompletos = crearModulosVacios()
          if (perfil.modulos) {
            Object.keys(perfil.modulos).forEach(key => {
              if (modulosCompletos[key]) {
                modulosCompletos[key] = {
                  activo: perfil.modulos[key].activo || false,
                  permisos: {
                    alta: perfil.modulos[key].permisos?.alta || false,
                    baja: perfil.modulos[key].permisos?.baja || false,
                    consulta: perfil.modulos[key].permisos?.consulta || false,
                    modificacion: perfil.modulos[key].permisos?.modificacion || false,
                  }
                }
              }
            })
          }
          // Determinar cantidad de usuarios asignados a este perfil (soporta varias formas de respuesta)
          // Primero intentamos leer un conteo incluido en el objeto perfil
          let usuariosCount = (() => {
            if (Array.isArray(perfil.usuarios)) return perfil.usuarios.length
            if (Array.isArray(perfil.usuariosList)) return perfil.usuariosList.length
            if (typeof perfil.usuarios === 'number') return perfil.usuarios
            if (typeof perfil.usuariosCount === 'number') return perfil.usuariosCount
            if (typeof perfil.cantidadUsuarios === 'number') return perfil.cantidadUsuarios
            if (typeof perfil.totalUsuarios === 'number') return perfil.totalUsuarios
            const maybeNumber = Number(perfil.usuarios || perfil.usuariosCount || perfil.cantidadUsuarios || perfil.totalUsuarios)
            if (!Number.isNaN(maybeNumber)) return maybeNumber
            return null
          })()

          // Si no viene en la respuesta, buscamos en el mapa calculado desde /usuarios
          if (usuariosCount === null) {
            const key = String(perfil.idPerfil ?? perfil.id_perfil ?? perfil.id ?? perfil.idPerfil)
            usuariosCount = mapaConteos[key] || 0
          }

          return {
            ...perfil,
            id_perfil: perfil.idPerfil,
            nombre: perfil.nombrePerfil || perfil.nombre,
            descripcion: perfil.descripcion,
            modulos: modulosCompletos,
            usuarios: usuariosCount,
          }
        });
        setPerfiles(perfilesTraduccion);
      } else {
        setPerfiles([]);
      }
    } catch (error) {
      console.error("Error cargando perfiles:", error)
      setPerfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarPerfiles()
  }, [])

  const openEditDialog = (perfil) => {
    setExpandedModulos({})
    if (perfil) {
      setFormData({
        nombre: perfil.nombrePerfil || perfil.nombre || "",
        descripcion: perfil.descripcion || "",
        modulos: JSON.parse(JSON.stringify(perfil.modulos || crearModulosVacios())),
      })
      
      const expansionesIniciales = {}
      let abrirContenedorAlumno = false
      let abrirContenedorAdmin = false
      let abrirContenedorProfesor = false // 🟢 CORREGIDO: Faltaba inicializar esta variable local

      if (perfil.modulos) {
        Object.keys(perfil.modulos).forEach(key => {
          const tieneChecks = Object.values(perfil.modulos[key].permisos || {}).some(v => v === true)
          if (tieneChecks) {
            expansionesIniciales[key] = true
            if (key.startsWith("alumno")) {
               abrirContenedorAlumno = true
            } else if (key.startsWith("profesor")) {
               abrirContenedorProfesor = true // 🟢 CORREGIDO: Antes rompía silenciosamente por ReferenceError
            } else {
               abrirContenedorAdmin = true
            }
          }
        })
      }
      setExpandedModulos(expansionesIniciales)
      setAlumnoMasterOpen(abrirContenedorAlumno)
      setAdminMasterOpen(abrirContenedorAdmin || !perfil) 
      setProfesorMasterOpen(abrirContenedorProfesor) // 🟢 CORREGIDO: Se setea el estado con la lectura relacional
      setEditDialog({ open: true, perfil, isNew: false })
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        modulos: crearModulosVacios(),
      })
      setAdminMasterOpen(true)
      setAlumnoMasterOpen(false)
      setProfesorMasterOpen(false) // 🟢 CORREGIDO: Limpia el contenedor maestro al crear un perfil nuevo
      setEditDialog({ open: true, perfil: null, isNew: true })
    }
  }

  const marcarTodosLosPermisos = () => {
    const accesoCompleto = {}
    const abrirTodos = {}
    modulosConfig.forEach((m) => {
      accesoCompleto[m.id] = {
        activo: true,
        permisos: { alta: true, baja: true, consulta: true, modificacion: true }
      }
      abrirTodos[m.id] = true
    })
    setFormData((prev) => ({ ...prev, modulos: accesoCompleto }))
    setExpandedModulos(abrirTodos)
    setAdminMasterOpen(true)
    setAlumnoMasterOpen(true)
    setProfesorMasterOpen(true)
  }

  const toggleExpandVisual = (moduloId) => {
    setExpandedModulos(prev => ({ ...prev, [moduloId]: !prev[moduloId] }))
  }

  const togglePermiso = (moduloId, tipo) => {
    setFormData((prev) => {
      const moduloActual = prev.modulos[moduloId] || { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } }
      const nuevosPermisos = { ...moduloActual.permisos, [tipo]: !moduloActual.permisos[tipo] }
      const tienePermisosActivos = Object.values(nuevosPermisos).some(v => v === true)

      return {
        ...prev,
        modulos: {
          ...prev.modulos,
          [moduloId]: {
            activo: tienePermisosActivos,
            permisos: nuevosPermisos
          },
        },
      }
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    const listaPermisosFormateada = []
    
    Object.keys(formData.modulos).forEach((moduloId) => {
      const moduloData = formData.modulos[moduloId]
      if (moduloData && moduloData.permisos) {
        Object.keys(moduloData.permisos).forEach((accionId) => {
          if (moduloData.permisos[accionId]) {
            listaPermisosFormateada.push({
              modulo: moduloId,
              nombreAccion: accionId
            })
          }
        })
      }
    })

    const body = {
      idPerfil: editDialog.isNew ? undefined : editDialog.perfil?.idPerfil,
      nombrePerfil: formData.nombre,
      descripcion: formData.descripcion,
      permisos: listaPermisosFormateada
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/vv1/perfiles", {
        method: editDialog.isNew ? "POST" : "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Error al guardar")
      setEditDialog({ open: false, perfil: null, isNew: false })
      await cargarPerfiles()
    } catch (error) {
      console.error("Error al guardar el perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.perfil) return
    setIsLoading(true)
    const idParaEliminar = deleteDialog.perfil.idPerfil || deleteDialog.perfil.id_perfil;
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/vv1/perfiles/${idParaEliminar}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error("Error al eliminar")
      setDeleteDialog({ open: false, perfil: null })
      await cargarPerfiles() 
    } catch (error) {
      console.error("Error al eliminar el perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDelete = (perfil) => {
    const idReal = perfil.id_perfil || perfil.idPerfil;
    const perfilListo = { ...perfil, id_perfil: idReal, idPerfil: idReal };
    setDeleteDialog({ open: true, perfil: perfilListo });
  }

  const getColorClasses = (color) => {
    const colors = {
      green: { bg: "bg-green-500", border: "border-green-500", text: "text-green-500" },
      red: { bg: "bg-red-600", border: "border-red-600", text: "text-red-600" },
      blue: { bg: "bg-blue-600", border: "border-blue-600", text: "text-blue-600" },
      amber: { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-500" },
    }
    return colors[color] || colors.green
  }

  const renderFilaModulo = (modulo) => {
    const isExpanded = !!expandedModulos[modulo.id]
    const moduloData = formData.modulos[modulo.id] || { permisos: { alta: false, baja: false, consulta: false, modificacion: false } }
    const permisos = moduloData.permisos || { alta: false, baja: false, consulta: false, modificacion: false }
    const Icon = modulo.icon

    return (
      <div key={modulo.id} className="border-b border-border/10 last:border-0 pb-1">
        <button 
          type="button" 
          onClick={() => toggleExpandVisual(modulo.id)} 
          className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors w-full text-left ${isExpanded ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"}`}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <Icon className="h-4 w-4 shrink-0" />
          <span className="font-medium text-sm">{modulo.nombre}</span>
        </button>

        <div className={isExpanded ? "block ml-3 mt-1 mb-2" : "hidden"}>
          {permisosConfig.map((permiso) => {
            const isPermisoActivo = !!permisos[permiso.id]
            const colorClasses = getColorClasses(permiso.color)
            
            return (
              <div key={permiso.id} className="flex items-center py-1.5 px-3 my-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => togglePermiso(modulo.id, permiso.id)}
                  className={`flex items-center gap-2 flex-1 text-left py-1 px-2 rounded transition-colors ${
                    isPermisoActivo ? `${colorClasses.border} ${colorClasses.bg}/10 text-white` : "border-transparent hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    isPermisoActivo ? `${colorClasses.bg} ${colorClasses.border} text-white` : "border-muted-foreground/40"
                  }`}>
                    {isPermisoActivo && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm">{permiso.nombre}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfiles y Permisos</h1>
          <p className="text-muted-foreground">Administra los perfiles y sus permisos</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openEditDialog(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Perfil
        </Button>
      </div>

      {/* Grilla de Perfiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {perfiles && perfiles.map((perfil, index) => {
          const seguroKey = perfil.id_perfil || perfil.idPerfil || index;
          return (
            <Card key={seguroKey} className="bg-card border-border hover:border-muted-foreground/30 transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V4a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 4z"/></svg>
                    </span>
                    <CardTitle className="text-xl font-bold text-foreground">
                      {perfil.nombre || perfil.nombrePerfil || "Sin Nombre"}
                    </CardTitle>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 rounded-full">
                    {perfil.usuarios || 0} usuarios
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {perfil.descripcion || "Sin descripción disponible"}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1">
                <div className="text-xs text-muted-foreground mb-3">
                  {Object.values(perfil.modulos || {}).filter((modulo) => {
                    if (modulo.activo) return true
                    if (modulo.permisos) {
                      return Object.values(modulo.permisos).some(Boolean)
                    }
                    return false
                  }).length} módulos asignados
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {perfil.modulos && Object.keys(perfil.modulos).map((moduloName) => {
                    const tienePermiso = Object.values(perfil.modulos[moduloName]).some(v => v === true || (v && typeof v === 'object' && Object.values(v).some(x => x === true)));
                    if (!tienePermiso) return null;
                    return (
                      <span key={moduloName} className="px-2 py-0.5 text-xs font-medium bg-secondary/60 text-secondary-foreground rounded border border-border/40 font-mono">
                        {moduloName}
                      </span>
                    );
                  })}
                </div>
              </CardContent>

              <div className="p-6 pt-0 flex gap-2">
                <Button variant="outline" className="flex-1 h-9 flex items-center justify-center gap-2 text-sm font-medium border-border hover:bg-accent" onClick={() => openEditDialog(perfil)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  Editar
                </Button>
                <Button variant="destructive" className="h-9 px-3" onClick={() => handleOpenDelete(perfil)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Guía Visual Fija */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tipos de Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {permisosConfig.map((permiso) => (
              <div key={permiso.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getColorClasses(permiso.color).bg}`}></div>
                <span className="text-sm text-foreground"/>{permiso.nombre} - {permiso.descripcion}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Crear/Editar */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.isNew ? "Crear Nuevo Perfil" : "Editar Perfil"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Perfil</Label>
                <Input id="nombre" className="bg-secondary border-border" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input id="descripcion" className="bg-secondary border-border" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Módulos y Permisos</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs border-primary text-primary" onClick={marcarTodosLosPermisos}>
                  Seleccionar Acceso Completo
                </Button>
              </div>
              
              <div className="space-y-1 bg-secondary/30 rounded-lg p-4">
                
                {/* A. 🚀 PANEL MÓDULO ADMINISTRADOR */}
                <div className="mb-2">
                  <button 
                    type="button" 
                    onClick={() => setAdminMasterOpen(!adminMasterOpen)} 
                    className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors w-full text-left font-bold text-sm text-primary bg-primary/10 border border-primary/10`}
                  >
                    {adminMasterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Settings className="h-4 w-4 shrink-0 text-primary" />
                    <span>PANEL MÓDULO ADMINISTRADOR</span>
                  </button>

                  <div className={adminMasterOpen ? "block ml-4 pl-2 border-l border-primary/20 mt-1 space-y-1" : "hidden"}>
                    {modulosAdminConfig.map((modulo) => renderFilaModulo(modulo))}
                  </div>
                </div>

                {/* B. 🚀 PANEL MÓDULO ALUMNO */}
                <div className="border-t border-border/20 mt-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setAlumnoMasterOpen(!alumnoMasterOpen)} 
                    className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors w-full text-left font-bold text-sm text-emerald-400 bg-emerald-950/10 border border-emerald-500/10`}
                  >
                    {alumnoMasterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>PANEL MÓDULO ALUMNO</span>
                  </button>

                  <div className={alumnoMasterOpen ? "block ml-4 pl-2 border-l border-emerald-500/20 mt-1 space-y-1" : "hidden"}>
                    {modulosAlumnoConfig.map((modulo) => renderFilaModulo(modulo))}
                  </div>
                </div>

                {/* C. 🚀 PANEL MÓDULO PROFESOR */}
                <div className="border-t border-border/20 mt-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setProfesorMasterOpen(!profesorMasterOpen)} 
                    className="flex items-center gap-2 py-2 px-3 rounded-md transition-colors w-full text-left font-bold text-sm text-blue-400 bg-blue-950/10 border border-blue-500/10"
                  >
                    {profesorMasterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Dumbbell className="h-4 w-4 shrink-0 text-blue-400" />
                    <span>PANEL MÓDULO PROFESOR</span>
                  </button>

                  <div className={profesorMasterOpen ? "block ml-4 pl-2 border-l border-blue-500/20 mt-1 space-y-1" : "hidden"}>
                    {modulosProfesorConfig.map((modulo) => renderFilaModulo(modulo))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, perfil: null, isNew: false })}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={isLoading || !formData.nombre}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialog.isNew ? "Crear Perfil" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>¿Eliminar Perfil?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, perfil: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}