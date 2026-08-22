import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import apiClient from '@/api'

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarRutinas = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/rutinas')
      setRutinas(res.data?.data || [])
    } catch (err) {
      console.error('Error al cargar rutinas:', err)
      setError('No pudimos cargar tus rutinas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchRutinas = async () => {
      await cargarRutinas()
    }
    fetchRutinas()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/profesor" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Rutinas</h1>
          <p className="text-muted-foreground">Rutinas asignadas a tus clases por el administrador</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rutinas.map((rutina) => (
            <Card key={rutina.idRutina} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rutina.nombre}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {rutina.nivel && <Badge variant="default">{rutina.nivel}</Badge>}
                      {rutina.duracion && <Badge variant="outline" className="text-xs">{rutina.duracion}</Badge>}
                      <Badge variant="outline" className="text-xs">
                        {rutina.cantidadAlumnos} alumnos
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rutina.descripcion && (
                  <div className="text-muted-foreground p-2 bg-secondary/50 rounded text-xs whitespace-pre-wrap line-clamp-4">
                    {rutina.descripcion}
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <Link to={`/profesor/rutinas/${rutina.idRutina}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && rutinas.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Todavía no tenés rutinas asignadas. El administrador debe asignar una rutina a tus clases.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
