import { useState, useEffect } from "react"
import {
  Shield, Plus, Check, Users, Calendar, CreditCard, Settings,
  LayoutDashboard, Loader2, ChevronDown, ChevronRight,
  User, ClipboardCheck, FileText, Dumbbell, Trash2, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

const modulosAdminConfig = [
  { id: "dashboard",     nombre: "Dashboard",     icon: LayoutDashboard },
  { id: "usuarios",      nombre: "Usuarios",      icon: Users },
  { id: "clases",        nombre: "Clases",        icon: Calendar },
  { id: "reservas",      nombre: "Reservas",      icon: Calendar },
  { id: "creditos",      nombre: "Créditos",      icon: CreditCard },
  { id: "membresias",    nombre: "Membresías",    icon: CreditCard },
  { id: "perfiles",      nombre: "Perfiles",      icon: Shield },
  { id: "configuracion", nombre: "Configuración", icon: Settings },
]
const modulosAlumnoConfig = [
  { id: "alumno",          nombre: "Panel Alumno: General",   icon: User },
  { id: "alumno_reservas", nombre: "Panel Alumno: Reservas",  icon: Calendar },
  { id: "alumno_creditos", nombre: "Panel Alumno: Créditos",  icon: CreditCard },
]
const modulosProfesorConfig = [
  { id: "profesor",          nombre: "Panel Profesor: Asistencia", icon: ClipboardCheck },
  { id: "profesor_rutinas",  nombre: "Panel Profesor: Rutinas",    icon: FileText },
  { id: "profesor_perfil",   nombre: "Panel Profesor: Perfil",     icon: User },
]
const modulosConfig = [...modulosAdminConfig, ...modulosAlumnoConfig, ...modulosProfesorConfig]

const permisosConfig = [
  { id: "alta",        nombre: "Alta",        color: "lime",   descripcion: "Crear registros" },
  { id: "consulta",    nombre: "Consulta",    color: "blue",   descripcion: "Ver información" },
  { id: "modificacion",nombre: "Modificación",color: "amber",  descripcion: "Editar registros" },
  { id: "baja",        nombre: "Baja",        color: "red",    descripcion: "Eliminar registros" },
]

const PERMISO_COLORS = {
  lime:  { ring: "ring-lime-400/60",  bg: "bg-lime-400",  check: "text-black",        badge: "bg-lime-400/10 text-lime-400 border-lime-400/20" },
  blue:  { ring: "ring-blue-400/60",  bg: "bg-blue-400",  check: "text-white",        badge: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  amber: { ring: "ring-amber-400/60", bg: "bg-amber-400", check: "text-black",        badge: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  red:   { ring: "ring-red-400/60",   bg: "bg-red-500",   check: "text-white",        badge: "bg-red-400/10 text-red-400 border-red-400/20" },
}

const PERMISOS_POR_MODULO = {
  dashboard:      { alta: "Ver estadísticas",    consulta: "Ver reportes",       modificacion: "Configurar vista",    baja: "Limpiar datos" },
  usuarios:       { alta: "Crear usuario",        consulta: "Ver usuarios",       modificacion: "Editar usuario",      baja: "Eliminar usuario" },
  clases:         { alta: "Crear clase",          consulta: "Ver clases",         modificacion: "Editar clase",        baja: "Cancelar/Eliminar" },
  reservas:       { alta: "Crear reserva",        consulta: "Ver reservas",       modificacion: "Editar reserva",      baja: "Cancelar reserva" },
  creditos:       { alta: "Agregar créditos",     consulta: "Ver créditos",       modificacion: "Editar créditos",     baja: "Quitar créditos" },
  membresias:     { alta: "Crear membresía",      consulta: "Ver membresías",     modificacion: "Editar membresía",    baja: "Eliminar membresía" },
  perfiles:       { alta: "Crear perfil",         consulta: "Ver perfiles",       modificacion: "Editar permisos",     baja: "Eliminar perfil" },
  configuracion:  { alta: "Agregar config.",      consulta: "Ver configuración",  modificacion: "Editar configuración",baja: "Resetear config." },
  alumno:             { alta: "Acceder al panel", consulta: "Ver dashboard",      modificacion: "Editar perfil",       baja: "Darse de baja" },
  alumno_reservas:    { alta: "Hacer reserva",    consulta: "Ver mis reservas",   modificacion: "Modificar reserva",   baja: "Cancelar reserva" },
  alumno_creditos:    { alta: "Comprar créditos", consulta: "Ver mis créditos",   modificacion: "Ver historial",       baja: "—" },
  profesor:           { alta: "Tomar asistencia", consulta: "Ver asistencias",    modificacion: "Editar asistencia",   baja: "Eliminar asistencia" },
  profesor_rutinas:   { alta: "Crear rutina",     consulta: "Ver rutinas",        modificacion: "Editar rutina",       baja: "Eliminar rutina" },
  profesor_perfil:    { alta: "—",                consulta: "Ver perfil",         modificacion: "Editar perfil",       baja: "—" },
}

const crearModulosVacios = () => {
  const m = {}
  modulosConfig.forEach(mod => {
    m[mod.id] = { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } }
  })
  return m
}

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([])
  const [editDialog, setEditDialog] = useState({ open: false, perfil: null, isNew: false })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, perfil: null })
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", modulos: crearModulosVacios() })
  const [isLoading, setIsLoading] = useState(false)
  const [expandedModulos, setExpandedModulos] = useState({})
  const [adminMasterOpen, setAdminMasterOpen] = useState(true)
  const [alumnoMasterOpen, setAlumnoMasterOpen] = useState(false)
  const [profesorMasterOpen, setProfesorMasterOpen] = useState(false)

  const cargarPerfiles = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const [resPerfiles, resUsuarios] = await Promise.all([
        fetch("http://localhost:3001/api/vv1/perfiles", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/api/vv1/usuarios",  { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ])
      const datos = await resPerfiles.json()
      const arrayReal = Array.isArray(datos?.data) ? datos.data : Array.isArray(datos) ? datos : []

      const mapaConteos = {}
      if (resUsuarios?.ok) {
        const datosU = await resUsuarios.json()
        const usuariosArray = Array.isArray(datosU?.data) ? datosU.data : Array.isArray(datosU) ? datosU : []
        usuariosArray.forEach(u => {
          const key = String(u.idPerfil ?? u.id_perfil ?? u.perfil ?? u.rol ?? u.tipo ?? "")
          if (key) mapaConteos[key] = (mapaConteos[key] || 0) + 1
        })
      }

      setPerfiles(arrayReal.map(perfil => {
        const modulosCompletos = crearModulosVacios()
        if (perfil.modulos) {
          Object.keys(perfil.modulos).forEach(key => {
            if (modulosCompletos[key]) modulosCompletos[key] = {
              activo: perfil.modulos[key].activo || false,
              permisos: {
                alta: perfil.modulos[key].permisos?.alta || false,
                baja: perfil.modulos[key].permisos?.baja || false,
                consulta: perfil.modulos[key].permisos?.consulta || false,
                modificacion: perfil.modulos[key].permisos?.modificacion || false,
              }
            }
          })
        }
        let usuariosCount = (() => {
          if (Array.isArray(perfil.usuarios)) return perfil.usuarios.length
          if (typeof perfil.usuarios === 'number') return perfil.usuarios
          if (typeof perfil.usuariosCount === 'number') return perfil.usuariosCount
          if (typeof perfil.cantidadUsuarios === 'number') return perfil.cantidadUsuarios
          return null
        })()
        if (usuariosCount === null) {
          usuariosCount = mapaConteos[String(perfil.idPerfil ?? perfil.id_perfil ?? "")] || 0
        }
        return {
          ...perfil,
          id_perfil: perfil.idPerfil,
          nombre: perfil.nombrePerfil || perfil.nombre,
          modulos: modulosCompletos,
          usuarios: usuariosCount,
        }
      }))
    } catch (error) {
      console.error("Error cargando perfiles:", error)
      setPerfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { cargarPerfiles() }, [])

  const openEditDialog = (perfil) => {
    setExpandedModulos({})
    if (perfil) {
      const expansiones = {}
      let abrirAdmin = false, abrirAlumno = false, abrirProfesor = false
      if (perfil.modulos) {
        Object.keys(perfil.modulos).forEach(key => {
          if (Object.values(perfil.modulos[key].permisos || {}).some(v => v)) {
            expansiones[key] = true
            if (key.startsWith("alumno")) abrirAlumno = true
            else if (key.startsWith("profesor")) abrirProfesor = true
            else abrirAdmin = true
          }
        })
      }
      setExpandedModulos(expansiones)
      setAdminMasterOpen(abrirAdmin)
      setAlumnoMasterOpen(abrirAlumno)
      setProfesorMasterOpen(abrirProfesor)
      setFormData({ nombre: perfil.nombrePerfil || perfil.nombre || "", descripcion: perfil.descripcion || "", modulos: JSON.parse(JSON.stringify(perfil.modulos || crearModulosVacios())) })
      setEditDialog({ open: true, perfil, isNew: false })
    } else {
      setFormData({ nombre: "", descripcion: "", modulos: crearModulosVacios() })
      setAdminMasterOpen(true)
      setAlumnoMasterOpen(false)
      setProfesorMasterOpen(false)
      setEditDialog({ open: true, perfil: null, isNew: true })
    }
  }

  const marcarTodosLosPermisos = () => {
    const accesoCompleto = {}
    const abrirTodos = {}
    modulosConfig.forEach(m => {
      accesoCompleto[m.id] = { activo: true, permisos: { alta: true, baja: true, consulta: true, modificacion: true } }
      abrirTodos[m.id] = true
    })
    setFormData(prev => ({ ...prev, modulos: accesoCompleto }))
    setExpandedModulos(abrirTodos)
    setAdminMasterOpen(true)
    setAlumnoMasterOpen(true)
    setProfesorMasterOpen(true)
  }

  const togglePermiso = (moduloId, tipo) => {
    setFormData(prev => {
      const actual = prev.modulos[moduloId] || { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } }
      const nuevos = { ...actual.permisos, [tipo]: !actual.permisos[tipo] }
      return { ...prev, modulos: { ...prev.modulos, [moduloId]: { activo: Object.values(nuevos).some(Boolean), permisos: nuevos } } }
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    const permisos = []
    Object.keys(formData.modulos).forEach(moduloId => {
      const m = formData.modulos[moduloId]
      if (m?.permisos) Object.keys(m.permisos).forEach(accionId => { if (m.permisos[accionId]) permisos.push({ modulo: moduloId, nombreAccion: accionId }) })
    })
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:3001/api/vv1/perfiles", {
        method: editDialog.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idPerfil: editDialog.isNew ? undefined : editDialog.perfil?.idPerfil, nombrePerfil: formData.nombre, descripcion: formData.descripcion, permisos }),
      })
      if (!res.ok) throw new Error("Error al guardar")
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
    const id = deleteDialog.perfil.idPerfil || deleteDialog.perfil.id_perfil
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:3001/api/vv1/perfiles/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Error al eliminar")
      setDeleteDialog({ open: false, perfil: null })
      await cargarPerfiles()
    } catch (error) {
      console.error("Error al eliminar el perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderFilaModulo = (modulo) => {
    const isExpanded = !!expandedModulos[modulo.id]
    const permisos = formData.modulos[modulo.id]?.permisos || { alta: false, baja: false, consulta: false, modificacion: false }
    const Icon = modulo.icon
    const tieneAlguno = Object.values(permisos).some(Boolean)

    return (
      <div key={modulo.id} className="border-b border-border/10 last:border-0">
        <button
          type="button"
          onClick={() => setExpandedModulos(prev => ({ ...prev, [modulo.id]: !prev[modulo.id] }))}
          className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg transition-colors w-full text-left ${isExpanded ? "bg-lime-400/10 text-lime-400" : "hover:bg-muted text-foreground"}`}
        >
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm font-medium flex-1">{modulo.nombre}</span>
          {tieneAlguno && !isExpanded && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20">
              {Object.values(permisos).filter(Boolean).length} perm.
            </span>
          )}
        </button>

        {isExpanded && (
          <div className="ml-8 mb-2 grid grid-cols-2 gap-1 mt-1">
            {permisosConfig.map(permiso => {
              const activo = !!permisos[permiso.id]
              const c = PERMISO_COLORS[permiso.color]
              const etiqueta = PERMISOS_POR_MODULO[modulo.id]?.[permiso.id] || permiso.nombre
              if (etiqueta === "—") return null
              return (
                <button
                  key={permiso.id}
                  type="button"
                  onClick={() => togglePermiso(modulo.id, permiso.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    activo ? `${c.badge} border` : "border-border/30 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${activo ? `${c.bg} border-transparent` : "border-muted-foreground/30"}`}>
                    {activo && <Check className={`h-2.5 w-2.5 ${c.check}`} />}
                  </div>
                  <span className="leading-tight">{etiqueta}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const modulosActivos = (perfil) =>
    Object.values(perfil.modulos || {}).filter(m => m.activo || Object.values(m.permisos || {}).some(Boolean)).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Perfiles y Permisos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configurá el acceso de cada rol al sistema</p>
        </div>
        <Button className="bg-lime-400 hover:bg-lime-300 text-black font-bold shrink-0 self-start sm:self-auto" onClick={() => openEditDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Perfil
        </Button>
      </div>

      {/* Loading */}
      {isLoading && perfiles.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Grid de perfiles */}
      {perfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {perfiles.map((perfil, index) => {
            const key = perfil.id_perfil || perfil.idPerfil || index
            const activos = modulosActivos(perfil)
            const modNombres = Object.keys(perfil.modulos || {}).filter(k => {
              const m = perfil.modulos[k]
              return m.activo || Object.values(m.permisos || {}).some(Boolean)
            })

            return (
              <div key={key} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-muted-foreground/30 transition-colors">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-lime-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate">{perfil.nombre || perfil.nombrePerfil || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground truncate">{perfil.descripcion || "Sin descripción"}</p>
                    </div>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                    <Users className="h-3 w-3" /> {perfil.usuarios || 0}
                  </span>
                </div>

                {/* Módulos activos */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{activos} módulo{activos !== 1 ? 's' : ''} asignado{activos !== 1 ? 's' : ''}</p>
                  <div className="flex flex-wrap gap-1">
                    {modNombres.slice(0, 6).map(k => (
                      <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground">
                        {k}
                      </span>
                    ))}
                    {modNombres.length > 6 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground">
                        +{modNombres.length - 6}
                      </span>
                    )}
                    {modNombres.length === 0 && (
                      <span className="text-[10px] text-muted-foreground italic">Sin permisos asignados</span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1 border-t border-border/50">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8" onClick={() => openEditDialog(perfil)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                    const idReal = perfil.id_perfil || perfil.idPerfil
                    setDeleteDialog({ open: true, perfil: { ...perfil, id_perfil: idReal, idPerfil: idReal } })
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && perfiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <Shield className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">Sin perfiles configurados</p>
          <p className="text-xs text-muted-foreground">Creá el primer perfil para asignar permisos</p>
        </div>
      )}

      {/* Guía de permisos */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Tipos de permisos</p>
        <div className="flex flex-wrap gap-3">
          {permisosConfig.map(p => {
            const c = PERMISO_COLORS[p.color]
            return (
              <div key={p.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${c.badge}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${c.bg}`} />
                <span className="font-bold">{p.nombre}</span>
                <span className="text-muted-foreground">— {p.descripcion}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">
              {editDialog.isNew ? "Crear nuevo perfil" : "Editar perfil"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Perfil</Label>
                <Input id="nombre" className="bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 h-10"
                  value={formData.nombre} onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descripcion" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción</Label>
                <Input id="descripcion" className="bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 h-10"
                  value={formData.descripcion} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Módulos y Permisos</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs border-lime-400/40 text-lime-500 hover:bg-lime-400/10 hover:text-lime-400" onClick={marcarTodosLosPermisos}>
                  Acceso completo
                </Button>
              </div>

              <div className="bg-muted/30 rounded-xl border border-border/50 overflow-hidden">

                {/* Admin */}
                <div>
                  <button type="button" onClick={() => setAdminMasterOpen(!adminMasterOpen)}
                    className="flex items-center gap-2.5 py-3 px-4 w-full text-left font-bold text-sm text-lime-400 bg-lime-400/5 border-b border-lime-400/10 hover:bg-lime-400/10 transition-colors">
                    {adminMasterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Panel Administrador</span>
                  </button>
                  {adminMasterOpen && (
                    <div className="px-3 py-2 space-y-0.5 border-b border-border/20">
                      {modulosAdminConfig.map(renderFilaModulo)}
                    </div>
                  )}
                </div>

                {/* Alumno */}
                <div>
                  <button type="button" onClick={() => setAlumnoMasterOpen(!alumnoMasterOpen)}
                    className="flex items-center gap-2.5 py-3 px-4 w-full text-left font-bold text-sm text-blue-400 bg-blue-400/5 border-b border-blue-400/10 hover:bg-blue-400/10 transition-colors">
                    {alumnoMasterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>Panel Alumno</span>
                  </button>
                  {alumnoMasterOpen && (
                    <div className="px-3 py-2 space-y-0.5 border-b border-border/20">
                      {modulosAlumnoConfig.map(renderFilaModulo)}
                    </div>
                  )}
                </div>

                {/* Profesor */}
                <div>
                  <button type="button" onClick={() => setProfesorMasterOpen(!profesorMasterOpen)}
                    className="flex items-center gap-2.5 py-3 px-4 w-full text-left font-bold text-sm text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 transition-colors">
                    {profesorMasterOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Dumbbell className="h-4 w-4 shrink-0" />
                    <span>Panel Profesor</span>
                  </button>
                  {profesorMasterOpen && (
                    <div className="px-3 py-2 space-y-0.5">
                      {modulosProfesorConfig.map(renderFilaModulo)}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog({ open: false, perfil: null, isNew: false })}>Cancelar</Button>
            <Button className="bg-lime-400 hover:bg-lime-300 text-black font-bold" onClick={handleSave} disabled={isLoading || !formData.nombre}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialog.isNew ? "Crear perfil" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">Eliminar perfil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro que querés eliminar el perfil <span className="font-bold text-foreground">"{deleteDialog.perfil?.nombre}"</span>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, perfil: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
