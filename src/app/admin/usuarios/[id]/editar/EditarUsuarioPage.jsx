import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, Loader2, Save, User, Mail, Phone, CreditCard,
  ShieldCheck, ToggleLeft, AlertCircle, CheckCircle2
} from "lucide-react"
import { getUsuarioById } from "@/api"
import { GymLoader } from "@/components/GymLoader"
import { toast } from '@/lib/notificar'

const emptyForm = {
  nombre: "",
  dni: "",
  email: "",
  telefono: "",
  idPerfil: "",
  estado: "activo",
  avatarUrl: "",
}

const inputCls = (error) =>
  `w-full border ${error ? "border-red-500/40" : "border-border"} bg-foreground/5 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-lime-400/50 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-colors`

const Field = ({ label, icon: Icon, error, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="h-3 w-3" /> {error}
      </p>
    )}
  </div>
)

const getIniciales = (name) => {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

export default function EditarUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [perfilesBD, setPerfilesBD] = useState([])

  const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")

        const resPerfiles = await fetch("http://localhost:3001/api/vv1/perfiles", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const datosPerfiles = await resPerfiles.json()
        if (datosPerfiles.success && Array.isArray(datosPerfiles.data)) {
          setPerfilesBD(datosPerfiles.data)
        }

        const usuarioReal = await getUsuarioById(id)
        const idPerfilDetectado =
          usuarioReal.idPerfil || usuarioReal.id_perfil || usuarioReal.perfil || usuarioReal.rol || usuarioReal.tipo || ""

        setFormData({
          nombre: usuarioReal.nombre || usuarioReal.nombrecompleto || usuarioReal.fullName || "",
          dni: usuarioReal.dni || usuarioReal.documento || "",
          email: usuarioReal.email || usuarioReal.correo || usuarioReal.username || "",
          telefono: usuarioReal.telefono || usuarioReal.celular || usuarioReal.phone || "",
          idPerfil: String(idPerfilDetectado),
          estado: usuarioReal.estado || "activo",
          avatarUrl: usuarioReal.avatarUrl || "",
        })
      } catch {
        toast.error("No se pudo cargar la información del usuario.")
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargarTodo()
  }, [id])

  const validateForm = () => {
    const e = {}
    if (!formData.nombre?.trim()) e.nombre = "El nombre es requerido"
    if (!formData.dni?.trim()) e.dni = "El DNI es requerido"
    if (!formData.email?.trim()) e.email = "El email es requerido"
    if (!formData.telefono?.trim()) e.telefono = "El teléfono es requerido"
    if (!formData.idPerfil) e.idPerfil = "El perfil es requerido"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const payload = {
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        username: formData.email.trim().toLowerCase(),
        idPerfil: formData.idPerfil ? parseInt(formData.idPerfil) : null,
        estado: formData.estado,
      }
      const res = await fetch(`http://localhost:3001/api/vv1/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const resultado = await res.json()
      if (!res.ok) throw new Error(resultado.message || "Error al actualizar")
      toast.success("Usuario actualizado exitosamente")
      navigate(`/admin/usuarios/${id}`)
    } catch (err) {
      toast.error("Error al guardar los cambios", { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GymLoader text="Cargando datos del usuario..." />
      </div>
    )
  }

  const perfilSeleccionado = perfilesBD.find((p) => String(p.idPerfil) === formData.idPerfil)

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border bg-card px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/usuarios/${id}`)}
            className="shrink-0 border border-border p-2 text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">Editar Usuario</h1>
            <p className="text-xs text-foreground/40">Modificá los datos personales y el acceso asignado</p>
          </div>
        </div>
        <div className="flex gap-2 pl-11 sm:pl-0">
          <button
            type="button"
            onClick={() => navigate(`/admin/usuarios/${id}`)}
            disabled={isSaving}
            className="border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-3 py-2 hover:bg-lime-300 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* CUERPO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PANEL LATERAL — Vista previa del usuario */}
        <div className="space-y-4">
          <div className="border border-border bg-card p-6 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-lime-400 border-2 border-lime-400/40 flex items-center justify-center overflow-hidden">
              {formData.avatarUrl
                ? <img src={formData.avatarUrl} alt={formData.nombre} className="h-full w-full object-cover" />
                : <span className="text-2xl font-black text-black tracking-widest">{getIniciales(formData.nombre)}</span>
              }
            </div>
            <div>
              <p className="font-bold text-foreground text-base leading-tight">
                {formData.nombre || "Nombre del usuario"}
              </p>
              <p className="text-xs text-foreground/40 mt-1">{formData.email || "correo@ejemplo.com"}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                formData.estado === "activo"
                  ? "bg-lime-400/10 text-lime-400 border-lime-400/20"
                  : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
              }`}>
                {formData.estado === "activo" ? "Activo" : "Inactivo"}
              </span>
              {perfilSeleccionado && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border capitalize">
                  {perfilSeleccionado.nombrePerfil || perfilSeleccionado.nombre}
                </span>
              )}
            </div>
          </div>

          <div className="border border-border bg-card p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resumen de cambios</p>
            <div className="space-y-2 text-xs text-foreground/40">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                <span>DNI: <span className="text-foreground font-semibold">{formData.dni || "—"}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>Tel: <span className="text-foreground font-semibold">{formData.telefono || "—"}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Perfil: <span className="text-foreground font-semibold capitalize">{perfilSeleccionado?.nombrePerfil || "—"}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="lg:col-span-2 space-y-4">

          {/* Datos personales */}
          <div className="border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Datos Personales</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre Completo" icon={User} error={errors.nombre}>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={set("nombre")}
                    placeholder="Ej: Juan Pérez"
                    className={inputCls(errors.nombre)}
                  />
                </Field>

                <Field label="DNI" icon={CreditCard} error={errors.dni}>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={set("dni")}
                    placeholder="Ej: 30123456"
                    className={inputCls(errors.dni)}
                  />
                </Field>

                <Field label="Correo Electrónico" icon={Mail} error={errors.email}>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={set("email")}
                    placeholder="correo@ejemplo.com"
                    className={inputCls(errors.email)}
                  />
                </Field>

                <Field label="Teléfono" icon={Phone} error={errors.telefono}>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={set("telefono")}
                    placeholder="Ej: +54 370 412 3456"
                    className={inputCls(errors.telefono)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Acceso y permisos */}
          <div className="border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acceso y Permisos</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Perfil de acceso" icon={ShieldCheck} error={errors.idPerfil}>
                  <select
                    value={formData.idPerfil}
                    onChange={set("idPerfil")}
                    className={inputCls(errors.idPerfil)}
                  >
                    <option value="">Selecciona un perfil...</option>
                    {perfilesBD.map((p) => (
                      <option key={p.idPerfil} value={String(p.idPerfil)}>
                        {p.nombrePerfil || p.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Estado de la cuenta" icon={ToggleLeft} error={errors.estado}>
                  <select
                    value={formData.estado}
                    onChange={set("estado")}
                    className={inputCls(errors.estado)}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </Field>
              </div>

              {perfilSeleccionado && (
                <div className="flex items-start gap-3 border border-lime-400/20 bg-lime-400/5 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/40">
                    El perfil <span className="font-semibold text-foreground capitalize">{perfilSeleccionado.nombrePerfil || perfilSeleccionado.nombre}</span> otorgará los permisos correspondientes al usuario al guardar los cambios.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botón inferior */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/admin/usuarios/${id}`)}
              disabled={isSaving}
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
