import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Loader2, Dumbbell, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import apiClient from '@/api'
import VideoPlayer from '@/components/VideoPlayer'

function VariantesEjercicio({ ejercicio }) {
  const [open, setOpen] = useState(false)
  const [variantes, setVariantes] = useState(ejercicio.variantes || [])
  const [form, setForm] = useState({ nombre: '', descripcion: '', limitacion: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleAdd = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const res = await apiClient.post(`/ejercicios/${ejercicio.idEjercicio}/variantes`, form)
      setVariantes(prev => [...prev, res.data.data])
      setForm({ nombre: '', descripcion: '', limitacion: '' })
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (idVariante) => {
    setDeleting(idVariante)
    try {
      await apiClient.delete(`/ejercicios/${ejercicio.idEjercicio}/variantes/${idVariante}`)
      setVariantes(prev => prev.filter(v => v.idVariante !== idVariante))
    } catch {
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="border-t border-border/50 mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <span className="font-black uppercase tracking-widest">
          Variantes ({variantes.length})
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {variantes.length > 0 && (
            <div className="space-y-2">
              {variantes.map(v => (
                <div key={v.idVariante} className="flex items-start gap-2 bg-foreground/5 border border-border/50 rounded px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{v.nombre}</p>
                    {v.limitacion && (
                      <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-widest mt-0.5">
                        Para: {v.limitacion}
                      </p>
                    )}
                    {v.descripcion && (
                      <p className="text-xs text-foreground/50 mt-1">{v.descripcion}</p>
                    )}
                    {v.videoUrl && <VideoPlayer url={v.videoUrl} label="Ver video" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(v.idVariante)}
                    disabled={deleting === v.idVariante}
                    className="shrink-0 p-1 text-foreground/25 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {deleting === v.idVariante
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Agregar variante</p>
            <input
              type="text"
              placeholder="Nombre de la variante *"
              value={form.nombre}
              onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full bg-transparent border border-border text-xs text-foreground placeholder:text-foreground/25 px-2 py-1.5 outline-none focus:border-foreground/40"
            />
            <input
              type="text"
              placeholder="Para qué limitación (ej: rodilla, espalda...)"
              value={form.limitacion}
              onChange={e => setForm(prev => ({ ...prev, limitacion: e.target.value }))}
              className="w-full bg-transparent border border-border text-xs text-foreground placeholder:text-foreground/25 px-2 py-1.5 outline-none focus:border-foreground/40"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={form.descripcion}
              onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full bg-transparent border border-border text-xs text-foreground placeholder:text-foreground/25 px-2 py-1.5 outline-none focus:border-foreground/40"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !form.nombre.trim()}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-lime-400/10 border border-lime-400/20 text-lime-400 hover:bg-lime-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DetalleRutinaPage() {
  const { id } = useParams()
  const [rutina, setRutina] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiClient.get(`/rutinas/${id}`)
      .then(res => setRutina(res.data?.data))
      .catch(() => {
        setError('Rutina no encontrada o no tenés permiso para verla.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !rutina) {
    return (
      <div className="space-y-4">
        <Link to="/profesor/rutinas">
          <button type="button" className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </Link>
        <div className="border border-red-500/20 bg-card p-8 text-center">
          <p className="text-red-400">{error || 'Rutina no encontrada.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/profesor/rutinas" className="inline-flex items-center text-sm text-foreground/40 hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Rutinas
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">{rutina.nombre}</h1>
        {rutina.nombreClase && (
          <p className="text-sm text-foreground/40 mt-1">Clase: <span className="text-foreground font-semibold">{rutina.nombreClase}</span></p>
        )}
      </div>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-5 py-3 flex flex-wrap gap-2 items-center">
          {rutina.categoria && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-lime-400/10 text-lime-400 border border-lime-400/20 rounded-md">
              {rutina.categoria}
            </span>
          )}
          {rutina.nivel && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border rounded-md">
              {rutina.nivel}
            </span>
          )}
          {rutina.duracion && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border rounded-md flex items-center gap-1">
              <Clock className="h-3 w-3" /> {rutina.duracion}
            </span>
          )}
        </div>
        <div className="p-5 space-y-6">
          {(() => {
            let descHtml = rutina.descripcion || ""
            let rutinaHtml = ""
            try {
              const parsed = JSON.parse(rutina.descripcion || "")
              if (parsed && typeof parsed === "object") {
                descHtml = parsed.desc || ""
                rutinaHtml = parsed.rutina || ""
              }
            } catch { /* plain HTML, use as-is */ }

            return (
              <>
                {descHtml && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Descripción</p>
                    <div
                      className="text-sm text-foreground/70 prose prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground [&_em]:italic"
                      dangerouslySetInnerHTML={{ __html: descHtml }}
                    />
                  </div>
                )}
                {rutinaHtml && (
                  <div className="space-y-1 border-t border-border pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Rutina</p>
                    <div
                      className="text-sm text-foreground/70 prose prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground [&_em]:italic"
                      dangerouslySetInnerHTML={{ __html: rutinaHtml }}
                    />
                  </div>
                )}
              </>
            )
          })()}

          {rutina.ejercicios?.length > 0 && (
            <div className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ejercicios</p>
              </div>
              <div className="space-y-2">
                {rutina.ejercicios.map((ej, idx) => (
                  <div key={ej.idEjercicio} className="border border-border bg-white/2">
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                        <span className="text-sm font-semibold text-foreground">{ej.nombre}</span>
                      </div>
                      <VideoPlayer url={ej.videoUrl} label="Ver video" />
                    </div>
                    <VariantesEjercicio ejercicio={ej} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {rutina.alumnos?.length > 0 && (
            <div className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alumnos asignados</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {rutina.alumnos.map((alumno) => (
                  <span key={alumno.idAlumno} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border">
                    {alumno.nombrecompleto}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
