import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, Eye, Users, ChevronRight, BookOpen, AlertCircle } from 'lucide-react'
import apiClient from '@/api'
import { GymLoader } from '@/components/GymLoader'

const NIVEL_COLOR = {
  principiante: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  intermedio:   'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  avanzado:     'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = () => {
    apiClient.get('/rutinas')
      .then(res => setRutinas(res.data?.data || []))
      .catch(() => setError('No pudimos cargar tus rutinas.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    const onVisible = () => { if (!document.hidden) cargar() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  if (loading) return <GymLoader />

  // Agrupar por clase
  const grupos = {}
  for (const r of rutinas) {
    const clave = r.nombreClase || '__sin_clase__'
    if (!grupos[clave]) grupos[clave] = []
    grupos[clave].push(r)
  }

  const clases = Object.keys(grupos).sort((a, b) => {
    if (a === '__sin_clase__') return 1
    if (b === '__sin_clase__') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Mis Rutinas
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Rutinas asignadas a tus clases por el administrador
          </p>
        </div>
        {rutinas.length > 0 && (
          <div className="text-right">
            <p className="text-3xl font-black text-primary">{rutinas.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">rutinas</p>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* VACÍO */}
      {!error && rutinas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-primary/50" />
          </div>
          <p className="font-semibold text-foreground">Sin rutinas asignadas</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            El administrador todavía no asignó rutinas a tus clases.
          </p>
        </div>
      )}

      {/* GRUPOS POR CLASE */}
      {!error && clases.map(clave => {
        const esGrupoSinClase = clave === '__sin_clase__'
        const lista = grupos[clave]
        return (
          <div key={clave} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

            {/* Header del grupo */}
            <div className="border-b border-border bg-secondary px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {esGrupoSinClase ? 'Sin clase asignada' : clave}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{lista.length} rutina{lista.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Lista de rutinas */}
            <div className="divide-y divide-border">
              {lista.map(rutina => (
                <div
                  key={rutina.idRutina}
                  className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-secondary/30 transition-colors gap-3"
                >
                  {/* Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{rutina.nombre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {rutina.nivel && (
                          <span className={`text-[10px] font-black px-2 py-0.5 uppercase tracking-widest ${NIVEL_COLOR[rutina.nivel?.toLowerCase()] || 'bg-foreground/5 text-foreground/50 border border-border'}`}>
                            {rutina.nivel}
                          </span>
                        )}
                        {rutina.categoria && (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border uppercase tracking-widest">
                            {rutina.categoria}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {rutina.cantidadAlumnos} alumno{rutina.cantidadAlumnos !== 1 ? 's' : ''}
                        </span>
                        {rutina.duracion && (
                          <span className="text-[10px] text-muted-foreground">· {rutina.duracion}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acción */}
                  <Link
                    to={`/profesor/rutinas/${rutina.idRutina}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ver</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
