import { useEffect, useState } from 'react'
import { Mail, Phone, Save, Loader2, AlertCircle, Pencil } from 'lucide-react'
import { toast } from '@/lib/notificar'
import { TituloPagina } from "@/components/TituloPagina"
import FotoAmpliable from "@/components/FotoAmpliable"
import { Link } from "react-router-dom"
import { panelesPermitidos } from "@/lib/paneles"

const getIniciales = (name) => {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const inputCls = "h-12 w-full rounded-xl border border-border bg-background/60 px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-lime-500 disabled:opacity-70 sm:text-sm"
const etiqueta = "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground"

export default function ProfesorPerfilPage() {
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
      const res = await fetch('/api/profesores/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <TituloPagina descripcion={"Tus datos de contacto"}>Mi perfil</TituloPagina>

      {/* Si también es alumno, su membresía está en el panel de alumno */}
      {panelesPermitidos().alumno && (
        <Link
          to="/alumno/perfil"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <span className="text-sm font-semibold text-foreground">También sos alumno: ver mi membresía</span>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-lime-700 dark:text-lime-400">Ver</span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* TARJETA DE PERFIL */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-20 bg-lime-400/15" aria-hidden="true" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-7 text-center">
            <FotoAmpliable
              src={avatarUrl}
              alt={formData.nombre}
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-lime-400 text-2xl font-black text-black ring-4 ring-card"
            >
              {getIniciales(formData.nombre)}
            </FotoAmpliable>
            <p className="mt-4 text-2xl font-black uppercase leading-none tracking-tight text-foreground">{formData.nombre || "—"}</p>
            <p className="mt-2 break-all text-sm text-foreground/55">{formData.email || "—"}</p>
            <span className="mt-4 rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-lime-700 dark:text-lime-400">
              Profesor
            </span>
          </div>
        </section>

        {/* DATOS */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Datos personales</p>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="h-10 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex h-10 items-center gap-2 rounded-full bg-lime-400 px-4 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-widest text-foreground/70 transition-colors hover:border-lime-500 hover:text-foreground"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
            )}
          </div>

          <div className="space-y-5 p-5">
            <div className="space-y-1.5">
              <label className={etiqueta}>Nombre completo</label>
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
              <label className={etiqueta}>
                <Mail className="h-3.5 w-3.5" /> Correo electrónico
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
              <label className={etiqueta}>
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
              <div className="flex items-start gap-3 rounded-xl border border-lime-400/25 bg-lime-400/5 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" />
                <p className="text-xs text-foreground/60">Los cambios se aplican de inmediato al guardar.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
