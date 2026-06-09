import { Link } from 'react-router-dom'

const turnos = [
  { id: '1', nombre: 'Mañana', horaInicio: '06:00', horaFin: '12:00' },
  { id: '2', nombre: 'Siesta', horaInicio: '12:00', horaFin: '17:00' },
  { id: '3', nombre: 'Noche', horaInicio: '17:00', horaFin: '22:00' },
]

export default function TurnosPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turnos</h1>
          <p className="text-muted-foreground">Gestiona los turnos disponibles en el gimnasio.</p>
        </div>

        <Link to="/admin/clases/nueva" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent">
          Crear Turno
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {turnos.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{t.nombre}</p>
                <p className="text-sm text-muted-foreground">{t.horaInicio} - {t.horaFin}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
