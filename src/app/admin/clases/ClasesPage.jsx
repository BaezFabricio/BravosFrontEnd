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
// 🟢 1. IMPORTANTE: Traemos tu cliente configurado que ya inyecta los tokens automáticamente
import apiClient from "@/api"
import { toast } from '@/lib/notificar'

export default function ClasesPage() {
  const [search, setSearch] = useState("")
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [permisos, setPermisos] = useState([])

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    clase: null,
  })

  // 🟢 2. CORRECCIÓN DEL GET: Reemplazamos fetch por apiClient
  const obtenerClases = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get("/clases")
      
      // Axios maneja la respuesta parseada directo en .data
      // Si usás successResponse en tu backend, los registros viajan en response.data.data
      const listaOriginal = response.data?.data || response.data || []

      setClases(listaOriginal)
    } catch (error) {
      console.error("Error al obtener clases:", error)
      const msgError = error.response?.data?.message || error.message || "Error al obtener las clases"
      setError(`No se pudieron cargar las clases: ${msgError}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    obtenerClases()

    const storedPermisos = localStorage.getItem("permisos")
    if (storedPermisos) {
      try {
        setPermisos(JSON.parse(storedPermisos))
      } catch (err) {
        console.error("Error al parsear permisos en ClasesPage:", err)
      }
    }
  }, [])

  const filteredClases = clases.filter((clase) =>
    clase.nombreClase?.toLowerCase().includes(search.toLowerCase()) ||
    clase.tipoClase?.toLowerCase().includes(search.toLowerCase()) ||
    clase.estado?.toLowerCase().includes(search.toLowerCase()) ||
    clase.nombreProfesor?.toLowerCase().includes(search.toLowerCase())
  )

  // 🟢 3. CORRECCIÓN DEL DELETE: Reemplazamos fetch por apiClient.delete
  const handleDelete = async (claseId) => {
    try {
      const response = await apiClient.delete(`/clases/${claseId}`)

      // Evaluamos el éxito usando la estructura estándar de Axios y tu backend
      if (response.data?.success || response.status === 200) {
        setClases(clases.filter((clase) => clase.idClase !== claseId))
        setDeleteDialog({ open: false, clase: null })
      } else {
        throw new Error(response.data?.message || "Error al eliminar la clase")
      }
    } catch (error) {
      console.error("Error al eliminar clase:", error)
      const msgError = error.response?.data?.message || error.message
      toast.error("No se pudo eliminar la clase", { description: msgError })
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Gestión de Clases</h1>
          <p className="text-sm text-foreground/40 mt-1">Crea y gestiona las clases del gimnasio.</p>
        </div>
        {permisos.includes("clases:alta") && (
          <Link
            to="/admin/clases/nueva"
            className="inline-flex items-center bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Clase
          </Link>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-border">
        <button className="border-b-2 border-lime-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground">
          Clases
        </button>
        <Link
          to="/admin/clases/turnos"
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
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
        <div className="border border-border bg-card p-6 text-center text-foreground/40">
          Cargando clases...
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400">
          {error}
        </div>
      )}

      {/* Listado */}
      <div className="space-y-4">
        {!loading && filteredClases.length === 0 ? (
          <div className="border border-border bg-card p-10 text-center">
            <p className="text-foreground/40">
              No hay clases que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          filteredClases.map((clase) => (
            <div
              key={clase.idClase}
              className="border border-border bg-card p-5 transition hover:border-white/12"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
                      {clase.nombreClase}
                    </h3>

                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                        clase.estado === "Activo"
                          ? "bg-lime-400/10 text-lime-400 border-lime-400/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {clase.estado === "Activo" ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tipo</p>
                      <p className="text-sm font-semibold text-foreground">{clase.tipoClase}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Horario
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {clase.horaInicio && clase.horaFin
                          ? `${clase.horaInicio.substring(0, 5)} - ${clase.horaFin.substring(0, 5)}`
                          : "Sin horario asignado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <User className="h-3 w-3" /> Profesor
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {clase.nombreProfesor || `Profesor ID: ${clase.idProfesor}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Cupos
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        <span className={clase.cupoDisponible <= 0 ? "text-red-400" : "text-lime-400"}>
                          {clase.cupoDisponible}
                        </span>
                        <span className="text-foreground/40">/{clase.cupoMaximo}</span>
                      </p>
                    </div>
                  </div>

                  {/* Días */}
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Días</p>
                    <div className="flex flex-wrap gap-2">
                      {clase.diasSemana ? (
                        clase.diasSemana.split(",").map((dia) => (
                          <span
                            key={dia}
                            className="border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-foreground/50"
                          >
                            {dia.substring(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span className="border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Sin días asignados
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {(permisos.includes("clases:modificacion") || permisos.includes("clases:baja")) && (
                  <div className="relative group">
                    <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    <div className="absolute right-0 z-10 hidden w-36 border border-border bg-card shadow-lg group-hover:block">
                      {permisos.includes("clases:modificacion") && (
                        <Link
                          to={`/admin/clases/editar/${clase.idClase}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Link>
                      )}
                      <button
                        onClick={() => setDeleteDialog({ open: true, clase })}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/5 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de eliminar */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md border border-border bg-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-red-400">Eliminar Clase</h2>

            <p className="mt-3 text-sm text-foreground/60">
              ¿Estás seguro de eliminar la clase{" "}
              <strong className="text-foreground">{deleteDialog.clase?.nombreClase}</strong>? Esta acción
              no se puede deshacer.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialog({ open: false, clase: null })}
                className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Cancelar
              </button>
              {permisos.includes("clases:baja") && (
                <button
                  onClick={() => deleteDialog.clase && handleDelete(deleteDialog.clase.idClase)}
                  className="border border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}