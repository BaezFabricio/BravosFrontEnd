import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import apiClient from '@/api'

export default function NuevaRutinaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    nivel: 'principiante',
    duracion: '',
    descripcion: '',
    alumnos: [],
  })

  useEffect(() => {
    apiClient.get('/rutinas/alumnos-disponibles')
      .then(res => setAlumnosDisponibles(res.data?.data || []))
      .catch(err => console.error('Error al cargar alumnos disponibles:', err))
  }, [])

  const toggleAlumno = (idAlumno) => {
    setFormData(prev => ({
      ...prev,
      alumnos: prev.alumnos.includes(idAlumno)
        ? prev.alumnos.filter(id => id !== idAlumno)
        : [...prev.alumnos, idAlumno],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await apiClient.post('/rutinas', formData)
      navigate('/profesor/rutinas')
    } catch (err) {
      console.error('Error creando rutina:', err)
      setError(err.response?.data?.message || 'No se pudo crear la rutina.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/profesor/rutinas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Rutinas
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Crear Nueva Rutina</h1>
        <p className="text-muted-foreground">Diseña una nueva rutina de entrenamiento para tus alumnos</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Detalles de la Rutina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre" className="font-medium">Nombre de la rutina *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: WOD Intensivo"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nivel" className="font-medium">Nivel</Label>
                <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                  <SelectTrigger id="nivel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principiante">Principiante</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion" className="font-medium">Duración</Label>
                <Input
                  id="duracion"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  placeholder="Ej: 45 min"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="font-medium">Descripción *</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalla los ejercicios, series, repeticiones, objetivos y cualquier nota importante..."
                className="w-full px-3 py-2 bg-secondary border border-input rounded text-sm min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">Incluye calentamiento, ejercicio principal, metcon y enfriamiento</p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Asignar alumnos</Label>
              <div className="border border-border rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                {alumnosDisponibles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay alumnos activos disponibles.</p>
                )}
                {alumnosDisponibles.map((alumno) => (
                  <label key={alumno.idAlumno} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={formData.alumnos.includes(alumno.idAlumno)}
                      onCheckedChange={() => toggleAlumno(alumno.idAlumno)}
                    />
                    {alumno.nombrecompleto}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t border-border pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.nombre || !formData.descripcion}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Guardando...' : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Rutina
                  </>
                )}
              </Button>
              <Link to="/profesor/rutinas" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
