import { useState } from "react"
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

  const [clases, setClases] = useState([
    {
      id: "1",
      nombre: "Funcional WOD",
      turno: "Mañana",
      horaInicio: "07:00",
      horaFin: "08:00",
      instructor: "Pablo Ruiz",
      capacidadMaxima: 15,
      reservas: 12,
      diasSemana: ["LUNES", "MIERCOLES", "VIERNES"],
      activa: true,
    },
    {
      id: "2",
      nombre: "Funcional",
      turno: "Mañana",
      horaInicio: "09:30",
      horaFin: "10:30",
      instructor: "Maria Gomez",
      capacidadMaxima: 12,
      reservas: 8,
      diasSemana: ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"],
      activa: true,
    },
    {
      id: "3",
      nombre: "WOD Intensivo",
      turno: "Noche",
      horaInicio: "18:00",
      horaFin: "19:00",
      instructor: "Diego Torres",
      capacidadMaxima: 20,
      reservas: 18,
      diasSemana: ["LUNES", "MIERCOLES", "VIERNES", "SABADO"],
      activa: true,
    },
  ])

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    clase: null,
  })

  const filteredClases = clases.filter(
    (clase) =>
      clase.nombre.toLowerCase().includes(search.toLowerCase()) ||
      clase.instructor.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (claseId) => {
    setClases(clases.filter((clase) => clase.id !== claseId))
    setDeleteDialog({ open: false, clase: null })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Gestión de Clases</h1>

            <span
              title="Administra los horarios y clases disponibles. Organiza por turnos y define capacidades máximas."
              className="flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700"
            >
              ?
            </span>
          </div>

          <p className="text-muted-foreground">Crea y gestiona las clases del gimnasio.</p>
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
        <button className="border-b-2 border-red-600 px-4 py-2 font-semibold text-gray-900">Clases</button>

        <Link to="/admin/clases/turnos" className="px-4 py-2 text-gray-500 hover:text-gray-900">
          Turnos
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          placeholder="Buscar por nombre de clase o instructor..."
          className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Listado */}
      <div className="space-y-4">
        {filteredClases.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-muted-foreground">No hay clases que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          filteredClases.map((clase) => (
            <div key={clase.id} className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-foreground">{clase.nombre}</h3>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${clase.activa ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {clase.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Turno</p>
                      <p className="font-semibold text-foreground">{clase.turno}</p>
                    </div>

                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock className="h-3 w-3" /> HORARIO</p>
                      <p className="font-semibold text-foreground">{clase.horaInicio} - {clase.horaFin}</p>
                    </div>

                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><User className="h-3 w-3" /> INSTRUCTOR</p>
                      <p className="font-semibold text-foreground">{clase.instructor}</p>
                    </div>

                    <div>
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Users className="h-3 w-3" /> CAPACIDAD</p>
                      <p className="font-semibold text-foreground">
                        <span className={clase.reservas >= clase.capacidadMaxima ? "text-destructive" : "text-success"}>
                          {clase.reservas}
                        </span>
                        /{clase.capacidadMaxima}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Días</p>

                    <div className="flex flex-wrap gap-2">
                      {clase.diasSemana.map((dia) => (
                        <span key={dia} className="rounded-full border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700">{dia.substring(0, 3)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="relative group">
                  <button className="rounded-lg p-2 hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>

                  <div className="absolute right-0 z-10 hidden w-36 rounded-lg border border-gray-200 bg-white shadow-md group-hover:block">
                    <Link to={`/admin/clases/${clase.id}/editar`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Edit className="h-4 w-4" /> Editar
                    </Link>

                    <button onClick={() => setDeleteDialog({ open: true, clase })} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" /> Eliminar
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
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-600">Eliminar Clase</h2>

            <p className="mt-2 text-sm text-gray-600">¿Estás segura de eliminar la clase <strong>{deleteDialog.clase?.nombre}</strong>? Esta acción no se puede deshacer.</p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteDialog({ open: false, clase: null })} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancelar</button>

              <button onClick={() => deleteDialog.clase && handleDelete(deleteDialog.clase.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
