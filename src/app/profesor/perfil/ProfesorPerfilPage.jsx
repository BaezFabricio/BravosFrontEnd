import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Save, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/lib/notificar'

const getIniciales = (name) => {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const inputCls = `w-full border border-border bg-foreground/5 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-lime-400/50 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`

export default function ProfesorPerfilPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '' })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}")
    setFormData({
      nombre: user.nombrecompleto || user.nombre || "",
      email: user.email || user.correo || "",
      telefono: user.telefono || "",
    })
    setAvatarUrl(user.avatarUrl || "")
  }, [])

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch('/api/profesores/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success("Perfil actualizado")
      setIsEditing(false)
    } catch (err) {
      toast.error("No se pudo guardar", { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border bg-card px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profesor')}
            className="shrink-0 border border-border p-2 text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">Mi Perfil</h1>
            <p className="text-xs text-foreground/40">Información personal y datos de contacto</p>
          </div>
        </div>
        <div className="flex gap-2 pl-11 sm:pl-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AVATAR CARD */}
        <div className="border border-border bg-card p-6 flex flex-col items-center text-center gap-4">
          <div className="h-20 w-20 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-2xl overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt={formData.nombre} className="h-full w-full object-cover" />
              : getIniciales(formData.nombre)
            }
          </div>
          <div>
            <p className="font-bold text-foreground text-base leading-tight">{formData.nombre || "—"}</p>
            <p className="text-xs text-foreground/40 mt-1">{formData.email || "—"}</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-400/10 text-blue-400 border border-blue-400/20">
            Profesor
          </span>
        </div>

        {/* FORMULARIO */}
        <div className="lg:col-span-2 border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Datos Personales</p>
          </div>
          <div className="p-5 space-y-4">

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={set("nombre")}
                disabled={!isEditing}
                placeholder="Tu nombre"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={set("email")}
                disabled={!isEditing}
                placeholder="correo@ejemplo.com"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={set("telefono")}
                disabled={!isEditing}
                placeholder="+54 370 412 3456"
                className={inputCls}
              />
            </div>

            {isEditing && (
              <div className="flex items-start gap-3 border border-lime-400/20 bg-lime-400/5 px-4 py-3 mt-2">
                <AlertCircle className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/40">
                  Los cambios se aplican de inmediato al guardar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
