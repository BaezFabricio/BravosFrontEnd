import { Cargando } from '@/components/Cargando'
import { useState, useEffect } from "react"
import {
  Shield, Plus, Check, Users, Calendar, CreditCard, Settings,
  LayoutDashboard, Loader2, ChevronDown,
  User, ClipboardCheck, FileText, Dumbbell, Trash2, Pencil, ChevronUp, GraduationCap, X, Info, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { toast } from '@/lib/notificar'

const modulosAdminConfig = [
  { id: "dashboard",     nombre: "Resumen",       icon: LayoutDashboard },
  { id: "usuarios",      nombre: "Usuarios y Abonos", icon: Users },
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
  lime:  { ring: "ring-lime-400/60",  bg: "bg-lime-400",  check: "text-black",        badge: "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20" },
  blue:  { ring: "ring-blue-400/60",  bg: "bg-blue-400",  check: "text-white",        badge: "bg-blue-400/10 text-blue-700 dark:text-blue-400 border-blue-400/20" },
  amber: { ring: "ring-amber-400/60", bg: "bg-amber-400", check: "text-black",        badge: "bg-amber-400/10 text-amber-700 dark:text-amber-400 border-amber-400/20" },
  red:   { ring: "ring-red-400/60",   bg: "bg-red-500",   check: "text-white",        badge: "bg-red-400/10 text-red-700 dark:text-red-400 border-red-400/20" },
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
  alumno:             { alta: "Acceder al panel", consulta: "Ver resumen",        modificacion: "Editar perfil",       baja: "Darse de baja" },
  alumno_reservas:    { alta: "Hacer reserva",    consulta: "Ver mis reservas",   modificacion: "Modificar reserva",   baja: "Cancelar reserva" },
  alumno_creditos:    { alta: "Comprar créditos", consulta: "Ver mis créditos",   modificacion: "Ver historial",       baja: "—" },
  profesor:           { alta: "Tomar asistencia", consulta: "Ver asistencias",    modificacion: "Editar asistencia",   baja: "Eliminar asistencia" },
  profesor_rutinas:   { alta: "Crear rutina",     consulta: "Ver rutinas",        modificacion: "Editar rutina",       baja: "Eliminar rutina" },
  profesor_perfil:    { alta: "—",                consulta: "Ver perfil",         modificacion: "Editar perfil",       baja: "—" },
}

const DETALLE_MODULO = {
  dashboard: "Resumen y reportes", usuarios: "Usuarios y abonos", clases: "Clases y turnos", reservas: "Reservas de alumnos",
  creditos: "Créditos de alumnos", membresias: "Planes y pagos", perfiles: "Perfiles y permisos", configuracion: "Datos del sitio",
  alumno: "Inicio del alumno", alumno_reservas: "Reservar clases", alumno_creditos: "Créditos propios",
  profesor: "Tomar asistencia", profesor_rutinas: "Rutinas", profesor_perfil: "Perfil del profe",
}
const LETRA_PERMISO = { alta: "A", consulta: "C", modificacion: "M", baja: "B" }

// Ícono del perfil según a qué panel da acceso
const iconoPerfil = (perfil) => {
  const m = perfil.modulos || {}
  const usa = (pref) => Object.keys(m).some(k => k.startsWith(pref) && Object.values(m[k].permisos || {}).some(Boolean))
  const admin = modulosAdminConfig.some(x => Object.values(m[x.id]?.permisos || {}).some(Boolean))
  if (admin) return Shield
  if (usa("profesor")) return GraduationCap
  if (usa("alumno")) return Dumbbell
  return User
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
  const [pestanaEditor, setPestanaEditor] = useState("admin")
  const [abierto, setAbierto] = useState(null) // perfil desplegado en el celular
  const [filtroPerfil, setFiltroPerfil] = useState("all")

  const cargarPerfiles = async () => {
    setIsLoading(true)
    try {
      const [resPerfiles, resUsuarios] = await Promise.all([
        fetch("/api/vv1/perfiles", { headers: {  } }),
        fetch("/api/vv1/usuarios",  { headers: {  } }).catch(() => null),
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
    } catch {
      setPerfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { cargarPerfiles() }, [])

  const openEditDialog = (perfil) => {
    if (perfil) {
      // Abre en la pestaña del panel donde el perfil tiene permisos (admin, si no tiene ninguno)
      const m = perfil.modulos || {}
      const tiene = (lista) => lista.some(x => Object.values(m[x.id]?.permisos || {}).some(Boolean))
      setPestanaEditor(tiene(modulosAdminConfig) ? "admin" : tiene(modulosAlumnoConfig) ? "alumno" : tiene(modulosProfesorConfig) ? "profesor" : "admin")
      setFormData({ nombre: perfil.nombrePerfil || perfil.nombre || "", descripcion: perfil.descripcion || "", modulos: JSON.parse(JSON.stringify(perfil.modulos || crearModulosVacios())) })
      setEditDialog({ open: true, perfil, isNew: false })
    } else {
      setFormData({ nombre: "", descripcion: "", modulos: crearModulosVacios() })
      setPestanaEditor("admin")
      setEditDialog({ open: true, perfil: null, isNew: true })
    }
  }

  // Un permiso no aplica si su texto en PERMISOS_POR_MODULO es "—" (ej. dar de baja créditos propios)
  const aplica = (moduloId, accion) => PERMISOS_POR_MODULO[moduloId]?.[accion] !== "—"

  // Marca o desmarca todos los permisos (que apliquen) de una lista de módulos
  const marcarModulos = (lista, valor) => {
    setFormData(prev => {
      const modulos = { ...prev.modulos }
      lista.forEach(m => {
        const permisos = {}
        permisosConfig.forEach(p => { permisos[p.id] = valor && aplica(m.id, p.id) })
        modulos[m.id] = { activo: Object.values(permisos).some(Boolean), permisos }
      })
      return { ...prev, modulos }
    })
  }
  const todosMarcados = (lista) => lista.every(m => permisosConfig.every(p => !aplica(m.id, p.id) || formData.modulos[m.id]?.permisos?.[p.id]))

  const togglePermiso = (moduloId, tipo) => {
    setFormData(prev => {
      const actual = prev.modulos[moduloId] || { activo: false, permisos: { alta: false, baja: false, consulta: false, modificacion: false } }
      const nuevos = { ...actual.permisos, [tipo]: !actual.permisos[tipo] }
      return { ...prev, modulos: { ...prev.modulos, [moduloId]: { activo: Object.values(nuevos).some(Boolean), permisos: nuevos } } }
    })
  }

  const handleSave = async () => {
    const permisos = []
    Object.keys(formData.modulos).forEach(moduloId => {
      const m = formData.modulos[moduloId]
      if (m?.permisos) Object.keys(m.permisos).forEach(accionId => { if (m.permisos[accionId]) permisos.push({ modulo: moduloId, nombreAccion: accionId }) })
    })

    if (editDialog.isNew) {
      setIsLoading(true)
      try {
        const res = await fetch("/api/vv1/perfiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombrePerfil: formData.nombre, descripcion: formData.descripcion, permisos }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Error al guardar") }
        setEditDialog({ open: false, perfil: null, isNew: false })
        await cargarPerfiles()
        toast.success("Perfil creado exitosamente")
      } catch (err) {
        toast.error("No se pudo crear el perfil", { description: err.message })
      } finally {
        setIsLoading(false)
      }
    } else {
      const perfilOriginal = editDialog.perfil
      setEditDialog({ open: false, perfil: null, isNew: false })
      setPerfiles(prev => prev.map(p =>
        (p.idPerfil === perfilOriginal?.idPerfil)
          ? { ...p, nombre: formData.nombre, nombrePerfil: formData.nombre, descripcion: formData.descripcion, modulos: formData.modulos }
          : p
      ))
      try {
        const res = await fetch("/api/vv1/perfiles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idPerfil: perfilOriginal?.idPerfil, nombrePerfil: formData.nombre, descripcion: formData.descripcion, permisos }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Error al guardar") }
        toast.success("Perfil actualizado exitosamente")
      } catch (err) {
        setPerfiles(prev => prev.map(p => p.idPerfil === perfilOriginal?.idPerfil ? perfilOriginal : p))
        toast.error("No se pudo guardar el perfil", { description: err.message })
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.perfil) return
    const perfilAEliminar = deleteDialog.perfil
    const id = perfilAEliminar.idPerfil || perfilAEliminar.id_perfil
    setDeleteDialog({ open: false, perfil: null })
    setPerfiles(prev => prev.filter(p => (p.idPerfil || p.id_perfil) !== id))
    try {
      const res = await fetch(`/api/vv1/perfiles/${id}`, { method: "DELETE", headers: {  } })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Error al eliminar") }
      toast.success("Perfil eliminado")
    } catch (err) {
      setPerfiles(prev => [...prev, perfilAEliminar])
      toast.error("No se pudo eliminar el perfil", { description: err.message })
    }
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
        {/* Celular: botón ancho arriba de la lista. Computadora: botón chico al lado del título */}
        <button type="button" onClick={() => openEditDialog(null)}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black shadow-lg shadow-lime-500/20 hover:bg-lime-300 md:hidden">
          <Plus className="h-5 w-5" /> Crear nuevo perfil
        </button>
        <Button className="hidden md:inline-flex bg-lime-400 hover:bg-lime-300 text-black font-bold shrink-0 self-start sm:self-auto" onClick={() => openEditDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Perfil
        </Button>
      </div>

      {/* Loading */}
      {isLoading && perfiles.length === 0 && (
        <Cargando filas={3} className="py-4" />
      )}

      {/* ── CELULAR ── */}
      {perfiles.length > 0 && (() => {
        const totalUsuarios = perfiles.reduce((a, p) => a + (Number(p.usuarios) || 0), 0)
        const visibles = perfiles.filter((p, i) => filtroPerfil === "all" || String(p.id_perfil || p.idPerfil || i) === filtroPerfil)
        return (
          <div className="space-y-4 md:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400"><Shield className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/55">Perfiles</p>
                  <p className="text-lg font-black leading-tight text-foreground">{perfiles.length} <span className="text-xs font-bold text-foreground/55">creados</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-700 dark:text-sky-400"><Users className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/55">Usuarios</p>
                  <p className="text-lg font-black leading-tight text-foreground">{totalUsuarios} <span className="text-xs font-bold text-foreground/55">asignados</span></p>
                </div>
              </div>
            </div>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar perfiles">
              {[{ id: "all", nombre: `Todos (${perfiles.length})` }, ...perfiles.map((p, i) => ({ id: String(p.id_perfil || p.idPerfil || i), nombre: p.nombre || p.nombrePerfil }))].map(op => (
                <button key={op.id} type="button" onClick={() => setFiltroPerfil(op.id)} aria-pressed={filtroPerfil === op.id}
                  className={`min-h-[36px] shrink-0 rounded-full border px-3.5 text-xs font-black transition-colors ${filtroPerfil === op.id ? "border-lime-500 bg-lime-400 text-black" : "border-border bg-card text-foreground/70"}`}>
                  {op.nombre}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-foreground/60" aria-label="Permisos">
              <span className="font-black uppercase tracking-widest text-foreground/50">Permisos:</span>
              {permisosConfig.map(p => (
                <span key={p.id} className="flex items-center gap-1">
                  <span className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-black ${PERMISO_COLORS[p.color].bg} ${PERMISO_COLORS[p.color].check}`}>{LETRA_PERMISO[p.id]}</span>
                  {p.nombre}
                </span>
              ))}
            </div>

            <ul className="space-y-3">
              {visibles.map((perfil, index) => {
                const id = String(perfil.id_perfil || perfil.idPerfil || index)
                const estaAbierto = abierto === id
                const Icono = iconoPerfil(perfil)
                const conPermisos = modulosConfig.filter(m => Object.values(perfil.modulos?.[m.id]?.permisos || {}).some(Boolean))
                return (
                  <li key={id} className={`overflow-hidden rounded-2xl border bg-card ${estaAbierto ? "border-lime-500/50" : "border-border"}`}>
                    <button type="button" onClick={() => setAbierto(estaAbierto ? null : id)} aria-expanded={estaAbierto}
                      className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-500">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400"><Icono className="h-5 w-5" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black text-foreground">{perfil.nombre || perfil.nombrePerfil || "Sin nombre"}</span>
                          <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-black text-lime-700 dark:text-lime-400">{conPermisos.length} {conPermisos.length === 1 ? "módulo" : "módulos"}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-foreground/55">{perfil.descripcion || "Sin descripción"}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 text-xs font-bold text-foreground/70" aria-label={`${perfil.usuarios || 0} usuarios`}>
                        <Users className="h-3.5 w-3.5" aria-hidden="true" /> {perfil.usuarios || 0}
                      </span>
                      {estaAbierto ? <ChevronUp className="h-5 w-5 shrink-0 text-foreground/50" /> : <ChevronDown className="h-5 w-5 shrink-0 text-foreground/50" />}
                    </button>

                    {estaAbierto && (
                      <div className="border-t border-border px-4 pb-4 pt-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/55">Módulos y permisos</p>
                        {conPermisos.length === 0 ? (
                          <p className="mt-2 text-sm text-foreground/55">Este perfil todavía no tiene permisos.</p>
                        ) : (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {conPermisos.map(m => {
                              const per = perfil.modulos[m.id].permisos
                              return (
                                <div key={m.id} className="rounded-xl border border-border bg-background/50 p-2.5">
                                  <p className="truncate text-sm font-bold text-foreground">{m.nombre.replace(/^Panel (Alumno|Profesor): /, "")}</p>
                                  <p className="truncate text-[11px] text-foreground/50">{DETALLE_MODULO[m.id]}</p>
                                  <div className="mt-1.5 flex gap-1">
                                    {permisosConfig.map(p => (
                                      <span key={p.id} title={`${p.nombre}: ${per[p.id] ? "sí" : "no"}`}
                                        className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-black ${per[p.id] ? `${PERMISO_COLORS[p.color].bg} ${PERMISO_COLORS[p.color].check}` : "bg-foreground/5 text-foreground/25"}`}>
                                        {LETRA_PERMISO[p.id]}<span className="sr-only">{per[p.id] ? ` ${p.nombre}` : ` sin ${p.nombre}`}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <button type="button" onClick={() => openEditDialog(perfil)}
                            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black hover:bg-lime-300">
                            <Pencil className="h-4 w-4" /> Editar permisos
                          </button>
                          <button type="button" aria-label={`Eliminar el perfil ${perfil.nombre || ""}`}
                            onClick={() => { const idReal = perfil.id_perfil || perfil.idPerfil; setDeleteDialog({ open: true, perfil: { ...perfil, id_perfil: idReal, idPerfil: idReal } }) }}
                            className="flex min-h-[48px] w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })()}

      {/* ── COMPUTADORA: grilla de perfiles ── */}
      {perfiles.length > 0 && (
        <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
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
                      <Shield className="h-4 w-4 text-lime-700 dark:text-lime-400" />
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

      {/* Guía de permisos (computadora; en el celular está como leyenda arriba) */}
      <div className="hidden bg-card border border-border rounded-2xl p-5 md:block">
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
      {/* Crear / editar perfil: hoja a pantalla completa en el celular, ventana grande en la computadora */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="hoja-movil flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 rounded-none border-0 bg-background p-0 top-0 left-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <button type="button" onClick={() => setEditDialog({ open: false, perfil: null, isNew: false })} aria-label="Cerrar"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
              <X className="h-5 w-5" />
            </button>
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-base font-black uppercase tracking-wide text-foreground">
              {editDialog.isNew ? "Nuevo perfil" : "Editar perfil"}
            </DialogPrimitive.Title>
            {/* Guardar arriba, siempre a la vista */}
            <button type="button" onClick={handleSave} disabled={isLoading || !formData.nombre.trim()}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-lime-400 px-4 text-xs font-black uppercase tracking-wide text-black shadow-lg shadow-lime-500/20 hover:bg-lime-300 disabled:opacity-50">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
              {editDialog.isNew ? "Crear perfil" : "Guardar"}
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            {/* Identidad */}
            <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="sec-identidad">
              <div className="flex items-center justify-between gap-2">
                <h2 id="sec-identidad" className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground"><User className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Identidad del perfil</h2>
                <span className="text-[10px] font-bold text-foreground/50">El nombre es obligatorio</span>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="perfil-nombre" className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-foreground/55">Nombre del perfil</label>
                  <input id="perfil-nombre" maxLength={60} value={formData.nombre} onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Recepción"
                    className="h-11 w-full rounded-xl border border-border bg-background/60 px-3 text-base text-foreground outline-none focus:border-lime-500" />
                </div>
                <div>
                  <label htmlFor="perfil-desc" className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-foreground/55">Para qué sirve</label>
                  <textarea id="perfil-desc" maxLength={255} rows={2} value={formData.descripcion} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Ej: Carga abonos y toma reservas en el mostrador"
                    className="w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-lime-500" />
                </div>
              </div>
            </section>

            {/* Acceso maestro: todo en todos los paneles */}
            {(() => {
              const completo = todosMarcados(modulosConfig)
              return (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-foreground">Acceso total</p>
                    <p className="text-xs text-foreground/55">Todos los permisos de los tres paneles</p>
                  </div>
                  <button type="button" role="switch" aria-checked={completo} aria-label="Acceso total" onClick={() => marcarModulos(modulosConfig, !completo)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${completo ? "bg-lime-400" : "bg-foreground/15"}`}>
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${completo ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              )
            })()}

            {/* Módulos y permisos por panel */}
            <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="sec-permisos">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="sec-permisos" className="text-sm font-black uppercase tracking-wide text-foreground">Módulos y permisos</h2>
                <span className="text-[11px] font-semibold text-foreground/50">Tocá las letras para activarlas</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-foreground/60">
                {permisosConfig.map(p => (
                  <span key={p.id} className="flex items-center gap-1">
                    <span className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-black ${PERMISO_COLORS[p.color].bg} ${PERMISO_COLORS[p.color].check}`}>{LETRA_PERMISO[p.id]}</span>{p.nombre}
                  </span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border bg-background/60 p-1" role="tablist" aria-label="Panel">
                {[["admin", "Admin", Settings], ["alumno", "Alumno", User], ["profesor", "Profesor", GraduationCap]].map(([id, txt, Ic]) => (
                  <button key={id} type="button" role="tab" aria-selected={pestanaEditor === id} onClick={() => setPestanaEditor(id)}
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-colors ${pestanaEditor === id ? "bg-lime-400/15 text-lime-700 dark:text-lime-400" : "text-foreground/60"}`}>
                    <Ic className="h-4 w-4" aria-hidden="true" /> {txt}
                  </button>
                ))}
              </div>

              {(() => {
                const lista = pestanaEditor === "alumno" ? modulosAlumnoConfig : pestanaEditor === "profesor" ? modulosProfesorConfig : modulosAdminConfig
                const titulo = pestanaEditor === "alumno" ? "Panel del alumno" : pestanaEditor === "profesor" ? "Panel del profesor" : "Panel de administración"
                const todo = todosMarcados(lista)
                return (
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2 pb-2">
                      <p className="text-xs font-black uppercase tracking-wide text-foreground/70">{titulo}</p>
                      <button type="button" onClick={() => marcarModulos(lista, !todo)}
                        className="rounded-lg border border-lime-500/40 bg-lime-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-lime-700 dark:text-lime-400">
                        {todo ? "Quitar todo" : "Marcar todo"}
                      </button>
                    </div>
                    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {lista.map(m => {
                        const Icon = m.icon
                        const per = formData.modulos[m.id]?.permisos || {}
                        return (
                          <li key={m.id} className="flex items-center gap-2.5 bg-background/40 px-3 py-2.5">
                            <Icon className="h-4 w-4 shrink-0 text-foreground/50" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-foreground">{m.nombre.replace(/^Panel (Alumno|Profesor): /, "")}</p>
                              <p className="truncate text-[11px] text-foreground/50">{DETALLE_MODULO[m.id]}</p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              {permisosConfig.map(p => {
                                const vale = aplica(m.id, p.id)
                                const activo = vale && !!per[p.id]
                                return (
                                  <button key={p.id} type="button" disabled={!vale} onClick={() => togglePermiso(m.id, p.id)}
                                    aria-pressed={activo} aria-label={`${p.nombre} en ${m.nombre}${vale ? "" : " (no aplica)"}`}
                                    title={vale ? PERMISOS_POR_MODULO[m.id]?.[p.id] : "No aplica"}
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                                      !vale ? "cursor-not-allowed bg-foreground/[0.03] text-foreground/15"
                                        : activo ? `${PERMISO_COLORS[p.color].bg} ${PERMISO_COLORS[p.color].check}`
                                        : "border border-border bg-background text-foreground/45"
                                    }`}>
                                    {LETRA_PERMISO[p.id]}
                                  </button>
                                )
                              })}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })()}
            </section>

            {/* Cómo se aplican los cambios (lo que pasa de verdad) */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-foreground/65">
                Los permisos se aplican al instante en el sistema: lo que quites deja de funcionar enseguida. Los menús de cada persona
                se actualizan la próxima vez que inicie sesión. No podés dar permisos de gestión que vos no tengas.
              </p>
            </div>
          </div>

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
