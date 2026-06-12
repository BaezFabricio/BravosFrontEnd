import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// 🟢 VARIABLES LOCALES AUTOCONTENIDAS (Para eliminar el error de Vite sin crear archivos)
const PROFESOR_ID_ACTUAL = 1;
const actividadesAsignadas = [
  {
    nombre: "Funcional",
    horarios: ["06:00 - 07:00", "08:00 - 09:00", "17:00 - 18:00", "19:00 - 20:00"]
  },
  {
    nombre: "WOD Intensivo",
    horarios: ["07:00 - 08:00", "18:00 - 19:00"]
  },
  {
    nombre: "Open Box",
    horarios: ["09:00 - 10:30", "21:00 - 22:30"]
  }
];

export default function NuevaRutinaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    actividad: '',
    tipo: 'clase_general',
    fecha: new Date().toISOString().split('T')[0],
    horario: '18:00',
    descripcion: '',
    alumnos: [],
  })

  const horariosDisponibles = formData.actividad
    ? actividadesAsignadas.find(a => a.nombre === formData.actividad)?.horarios || []
    : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          profesorId: PROFESOR_ID_ACTUAL,
          profesor: 'Pablo Ruiz', 
        }),
      })

      if (response.ok) {
        navigate('/profesor/rutinas')
      } else {
        console.log('Error creando rutina:', response.statusText)
      }
    } catch (error) {
      console.log('Error:', error)
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
            {/* Actividad */}
            <div className="space-y-2">
              <Label htmlFor="actividad" className="font-medium">Actividad *</Label>
              <Select value={formData.actividad} onValueChange={(value) => setFormData({ ...formData, actividad: value, horario: '' })}>
                <SelectTrigger id="actividad">
                  <SelectValue placeholder="Selecciona una actividad" />
                </SelectTrigger>
                <SelectContent>
                  {actividadesAsignadas.map((act) => (
                    <SelectItem key={act.nombre} value={act.nombre}>
                      {act.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="font-medium">Tipo de Rutina *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clase_general">Clase General</SelectItem>
                  <SelectItem value="entrenamiento_especifico">Entrenamiento Específico</SelectItem>
                  <SelectItem value="planificacion">Planificación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grid: Fecha y Horario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" className="font-medium">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario" className="font-medium">Horario *</Label>
                <Select value={formData.horario} onValueChange={(value) => setFormData({ ...formData, horario: value })}>
                  <SelectTrigger id="horario" disabled={horariosDisponibles.length === 0}>
                    <SelectValue placeholder="Selecciona horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponibles.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="font-medium">Descripción *</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalla los ejercicios, series, repeticiones, objetivos and cualquier nota importante..."
                className="w-full px-3 py-2 bg-secondary border border-input rounded text-sm min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">Incluye calentamiento, ejercicio principal, metcon y enfriamiento</p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 border-t border-border pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.actividad || !formData.horario || !formData.descripcion}
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
                <Button variant="outline" className="w-full">
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