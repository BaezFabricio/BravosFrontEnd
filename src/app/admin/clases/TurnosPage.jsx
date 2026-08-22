import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Clock, Loader2, Calendar } from "lucide-react"
import apiClient from "@/api"

export default function TurnosPage() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get("/clases/turnos/resumen")
        setTurnos(response.data?.data || [])
      } catch (err) {
        console.error("Error al cargar turnos:", err)
        setError(err.response?.data?.message || "No se pudieron cargar los turnos.")
      } finally {
        setLoading(false)
      }
    }
    fetchTurnos()
  }, [])

  const formatearHora = (hora) => (hora ? hora.slice(0, 5) : "-")

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
            Turnos realmente usados por tus clases, con su rango horario y cantidad de horarios asignados.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {turnos.map((turno) => (
            <div
              key={turno.nombre}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  {turno.nombre}
                </h2>
              </div>

              <p className="text-sm font-semibold text-foreground">
                {formatearHora(turno.horaInicio)} - {formatearHora(turno.horaFin)}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{turno.cantidadClases} clase{turno.cantidadClases === 1 ? "" : "s"} · {turno.cantidadHorarios} horario{turno.cantidadHorarios === 1 ? "" : "s"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && turnos.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Todavía no hay horarios de clase cargados.</p>
        </div>
      )}
    </div>
  )
}
