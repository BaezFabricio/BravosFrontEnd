import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Loader2, PlayCircle, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import apiClient from '@/api'

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !rutina) {
    return (
      <div className="space-y-4">
        <Link to="/profesor/rutinas">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error || 'Rutina no encontrada.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/profesor/rutinas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Rutinas
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{rutina.nombre}</h1>
        {rutina.nombreClase && (
          <p className="text-muted-foreground mt-1">Clase: <span className="text-foreground font-medium">{rutina.nombreClase}</span></p>
        )}
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {rutina.categoria && <Badge variant="default">{rutina.categoria}</Badge>}
            {rutina.nivel && <Badge variant="outline">{rutina.nivel}</Badge>}
            {rutina.duracion && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {rutina.duracion}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {rutina.descripcion && (
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Descripción</h3>
              <p className="text-foreground whitespace-pre-wrap">{rutina.descripcion}</p>
            </div>
          )}

          {rutina.ejercicios?.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Ejercicios</h3>
              </div>
              <div className="space-y-2">
                {rutina.ejercicios.map((ej, idx) => (
                  <div key={ej.idEjercicio} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                      <span className="text-sm font-medium">{ej.nombre}</span>
                    </div>
                    {ej.videoUrl && (
                      <a href={ej.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                        <PlayCircle className="h-4 w-4" /> Ver video
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(rutina.alumnos?.length > 0) && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Alumnos asignados</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {rutina.alumnos.map((alumno) => (
                  <Badge key={alumno.idAlumno} variant="secondary">{alumno.nombrecompleto}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
