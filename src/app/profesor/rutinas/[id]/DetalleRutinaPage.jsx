import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Loader2, Dumbbell } from 'lucide-react'
import apiClient from '@/api'
import VideoPlayer from '@/components/VideoPlayer'

export default function DetalleRutinaPage() {
  const { id } = useParams()
  const [rutina, setRutina] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiClient.get(`/rutinas/${id}`)
      .then(res => setRutina(res.data?.data))
      .catch(err => {
        console.error('Error al cargar la rutina:', err)
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
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-lime-400/10 text-lime-400 border border-lime-400/20">
              {rutina.categoria}
            </span>
          )}
          {rutina.nivel && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border">
              {rutina.nivel}
            </span>
          )}
          {rutina.duracion && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border flex items-center gap-1">
              <Clock className="h-3 w-3" /> {rutina.duracion}
            </span>
          )}
        </div>
        <div className="p-5 space-y-6">
          {rutina.descripcion && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Descripción</p>
              <div
                className="text-sm text-foreground/70 prose prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: rutina.descripcion }}
              />
            </div>
          )}

          {rutina.ejercicios?.length > 0 && (
            <div className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ejercicios</p>
              </div>
              <div className="space-y-2">
                {rutina.ejercicios.map((ej, idx) => (
                  <div key={ej.idEjercicio} className="border border-border bg-white/2 p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                      <span className="text-sm font-semibold text-foreground">{ej.nombre}</span>
                    </div>
                    <VideoPlayer url={ej.videoUrl} label="Ver video" />
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
