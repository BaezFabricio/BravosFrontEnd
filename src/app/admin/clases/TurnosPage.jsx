import { Link } from "react-router-dom"
import { ArrowLeft, Clock } from "lucide-react"

export default function TurnosPage() {
  const turnos = [
    {
      id: 1,
      nombre: "Mañana",
      horaInicio: "06:00",
      horaFin: "12:00",
    },
    {
      id: 2,
      nombre: "Siesta",
      horaInicio: "12:00",
      horaFin: "17:00",
    },
    {
      id: 3,
      nombre: "Noche",
      horaInicio: "17:00",
      horaFin: "22:00",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/clases"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de Turnos
          </h1>
          <p className="text-muted-foreground">
            Consulta los turnos disponibles para las clases.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {turnos.map((turno) => (
          <div
            key={turno.id}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {turno.nombre}
              </h2>
            </div>

            <p className="text-sm font-semibold text-foreground">
              {turno.horaInicio} - {turno.horaFin}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}