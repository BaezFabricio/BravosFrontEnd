import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, Calendar, Users, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpTooltip } from '@/components/ui/help-tooltip'

// 🟢 VARIABLES LOCALES AUTOCONTENIDAS (Para eliminar el error de Vite sin crear archivos)
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
  },
  {
    id: 2,
    actividad: "Funcional",
    tipo: "entrenamiento_especifico",
    fecha: "2026-06-09",
    horario: "19:00 - 20:00",
    profesorId: 1,
    profesor: "Pablo Ruiz",
    descripcion: "Circuito Metabólico de 4 Estaciones (40'' ON / 20'' OFF):\n1. Battle Ropes\n2. Kettlebell Swings",
    alumnos: ["Mariana Gómez"]
  }
];

export default function RutinasPage() {
  const [rutinas] = useState(mockRutinas.filter(r => r.profesorId === PROFESOR_ID_ACTUAL))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/profesor" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Rutinas Asignadas</h1>
              <HelpTooltip content="Aquí puedes ver todas tus rutinas de entrenamiento. Selecciona una clase para ver los ejercicios y entrenamientos específicos asignados a ese grupo de alumnos." />
            </div>
            <p className="text-muted-foreground">Entrenamientos y ejercicios planificados</p>
          </div>
          <Link to="/profesor/rutinas/nueva">

          </Link>
        </div>
      </div>

      {/* Grid de rutinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rutinas.map((rutina) => (
          <Card key={rutina.id} className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{rutina.actividad}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={rutina.tipo === 'clase_general' ? 'default' : 'secondary'}>
                      {rutina.tipo === 'clase_general' ? 'Clase General' : 'Entrenamiento Específico'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rutina.alumnos.length} alumnos
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Detalles */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{rutina.fecha}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{rutina.horario}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{rutina.profesor}</span>
                </div>
                {rutina.descripcion && (
                  <div className="text-muted-foreground mt-2 p-2 bg-secondary/50 rounded text-xs">
                    {rutina.descripcion}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Link to={`/profesor/rutinas/${rutina.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`¿Eliminar rutina ${rutina.actividad}?`)) {
                      fetch(`/api/rutinas/${rutina.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rutinaId: rutina.id }),
                      })
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rutinas.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes rutinas asignadas aún.</p>
            <Link to="/profesor/rutinas/nueva">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Rutina
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}