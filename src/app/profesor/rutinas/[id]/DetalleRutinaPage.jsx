import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Calendar, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
const PROFESOR_ID_ACTUAL = 1;
const mockRutinas = [
  {
    id: 1,
    actividad: "WOD Intensivo",
    tipo: "clase_general",
    fecha: "2026-06-08",
    horario: "18:00 - 19:00",
    profesorId: 1,
    profesor: "Pablo Ruiz",
    descripcion: "Warm-up:\n3 Rounds of:\n- 10 Air Squats\n- 5 Push-ups\n\nWOD (AMRAP 15 Mins):\n- 5 Power Cleans\n- 10 Toes-to-bar",
    alumnos: ["Fabricio Luis Baez", "Lucas Alarcón"]
  }
];

export default function DetalleRutinaPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const rutinaId = parseInt(id)
  const rutina = mockRutinas.find(r => r.id === rutinaId && r.profesorId === PROFESOR_ID_ACTUAL)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(
    rutina || {
      id: 0,
      actividad: '',
      tipo: 'clase_general',
      fecha: '',
      horario: '',
      profesorId: PROFESOR_ID_ACTUAL,
      profesor: '',
      descripcion: '',
      alumnos: [],
    }
  )

  if (!rutina && rutinaId !== 0) {
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
            <p className="text-destructive">Rutina no encontrada o no tienes permiso para verla.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await fetch('/api/rutinas', {
        method: rutina ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setIsEditing(false)
      navigate('/profesor/rutinas')
    } catch (error) {
      console.log('Error guardando rutina:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rutina? Esta acción no se puede deshacer.')) return
    try {
      await fetch(`/api/rutinas/${rutina?.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      navigate('/profesor/rutinas')
    } catch (error) {
      console.log('Error eliminando rutina:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/profesor/rutinas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Rutinas
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Rutina' : 'Detalle de Rutina'}
          </h1>
          {rutina && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="actividad" className="text-sm font-medium">Actividad</Label>
                  <Input
                    id="actividad"
                    value={formData.actividad}
                    onChange={(e) => setFormData({ ...formData, actividad: e.target.value })}
                    placeholder="Ej: Clase CrossFit"
                  />
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{formData.actividad}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={formData.tipo === 'clase_general' ? 'default' : formData.tipo === 'entrenamiento_especifico' ? 'secondary' : 'outline'}>
                      {formData.tipo === 'clase_general' ? 'Clase General' : formData.tipo === 'entrenamiento_especifico' ? 'Entrenamiento Específico' : 'Planificación'}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              {isEditing ? (
                <>
                  <Label htmlFor="fecha" className="text-sm font-medium">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Fecha</span>
                  </div>
                  <p className="text-foreground">{formData.fecha}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <>
                  <Label htmlFor="horario" className="text-sm font-medium">Horario</Label>
                  <Input
                    id="horario"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    placeholder="Ej: 19:00"
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Horario</span>
                  </div>
                  <p className="text-foreground">{formData.horario}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">Alumnos</span>
              </div>
              <p className="text-foreground">{formData.alumnos.length}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            {isEditing ? (
              <>
                <Label htmlFor="descripcion" className="text-sm font-medium">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalla los ejercicios y objetivos de esta rutina..."
                  className="w-full px-3 py-2 bg-secondary border border-input rounded text-sm min-h-[120px]"
                />
              </>
            ) : (
              <>
                <h3 className="font-medium">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{formData.descripcion}</p>
              </>
            )}
          </div>

          {formData.alumnos.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="font-medium">Alumnos Asignados</h3>
              <div className="flex flex-wrap gap-2">
                {formData.alumnos.map((alumno) => (
                  <Badge key={alumno} variant="secondary">
                    {alumno}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2 border-t border-border pt-4">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false)
                setFormData(rutina || formData)
              }}>
                Cancelar
              </Button>
              {rutina && (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10 ml-auto"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}