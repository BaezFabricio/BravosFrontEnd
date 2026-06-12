import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  User,
} from "lucide-react"

export default function ClasesPage() {
  const [search, setSearch] = useState("")
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    clase: null,
  })

  const obtenerClases = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("http://localhost:3001/api/vv1/clases")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al obtener las clases")
      }

      setClases(result.data)
    } catch (error) {
      console.error("Error al obtener clases:", error)
      setError(`No se pudieron cargar las clases: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    obtenerClases()
  }, [])

  const filteredClases = clases.filter((clase) =>
    clase.nombreClase?.toLowerCase().includes(search.toLowerCase()) ||
    clase.tipoClase?.toLowerCase().includes(search.toLowerCase()) ||
    clase.estado?.toLowerCase().includes(search.toLowerCase()) ||
    clase.nombreProfesor?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (claseId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/vv1/clases/${claseId}`,
        {
          method: "DELETE",
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al eliminar la clase")
      }

      setClases(clases.filter((clase) => clase.idClase !== claseId))
      setDeleteDialog({ open: false, clase: null })
    } catch (error) {
      console.error("Error al eliminar clase:", error)
      alert("No se pudo eliminar la clase")
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Gestión de Clases
            </h1>

            <span
              title="Administra las clases disponibles del gimnasio."
              className="flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700"
            >
              ?
            </span>
          </div>

          <p className="text-muted-foreground">
            Crea y gestiona las clases del gimnasio.
          </p>
        </div>

        <Link
          to="/admin/clases/nueva"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Clase
        </Link>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-gray-200">
        <button className="border-b-2 border-red-600 px-4 py-2 font-semibold text-foreground">
          Clases
        </button>

        <Link
          to="/admin/clases/turnos"
          className="px-4 py-2 text-muted-foreground hover:text-foreground"
        >
          Turnos
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          placeholder="Buscar por nombre, tipo, profesor o estado..."
          className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mensaje de carga */}
      {loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          Cargando clases...
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="rounded-xl border border-red-500 bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      )}

      {/* Listado */}
      <div className="space-y-4">
        {!loading && filteredClases.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-muted-foreground">
              No hay clases que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          filteredClases.map((clase) => (
            <div
              key={clase.idClase}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-foreground">
                      {clase.nombreClase}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        clase.estado === "Activo"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {clase.estado === "Activo" ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Tipo
                      </p>
                      <p className="font-semibold text-foreground">
                        {clase.tipoClase}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Horario
                      </p>
                      <p className="font-semibold text-foreground">
                        {clase.horaInicio && clase.horaFin
                          ? `${clase.horaInicio.substring(
                              0,
                              5
                            )} - ${clase.horaFin.substring(0, 5)}`
                          : "Sin horario asignado"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <User className="h-3 w-3" />
                        Profesor
                      </p>
                      <p className="font-semibold text-foreground">
                        {clase.nombreProfesor ||
                          `Profesor ID: ${clase.idProfesor}`}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Cupos
                      </p>
                      <p className="font-semibold text-foreground">
                        <span
                          className={
                            clase.cupoDisponible <= 0
                              ? "text-destructive"
                              : "text-success"
                          }
                        >
                          {clase.cupoDisponible}
                        </span>
                        /{clase.cupoMaximo}
                      </p>
                    </div>
                  </div>

                  {/* Días */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Días
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {clase.diasSemana ? (
                        clase.diasSemana.split(",").map((dia) => (
                          <span
                            key={dia}
                            className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-foreground"
                          >
                            {dia.substring(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
                          Sin días asignados
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="relative group">
                  <button className="rounded-lg p-2 hover:bg-muted">
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </button>

                  <div className="absolute right-0 z-10 hidden w-36 rounded-lg border border-border bg-card shadow-md group-hover:block">
                    <Link
                      to={`/admin/clases/${clase.idClase}/editar`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Link>

                    <button
                      onClick={() => setDeleteDialog({ open: true, clase })}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de eliminar */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-600">Eliminar Clase</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              ¿Estás segura de eliminar la clase{" "}
              <strong>{deleteDialog.clase?.nombreClase}</strong>? Esta acción
              no se puede deshacer.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialog({ open: false, clase: null })}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>

              <button
                onClick={() =>
                  deleteDialog.clase && handleDelete(deleteDialog.clase.idClase)
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}