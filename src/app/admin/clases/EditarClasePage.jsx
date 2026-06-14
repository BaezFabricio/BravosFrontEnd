import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"

export default function EditarClasePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const [profesores, setProfesores] = useState([])
  const [loadingProfesores, setLoadingProfesores] = useState(true)

  const turnos = [
    { id: "1", nombre: "Mañana", horaInicio: "06:00", horaFin: "12:00" },
    { id: "2", nombre: "Siesta", horaInicio: "12:00", horaFin: "17:00" },
    { id: "3", nombre: "Noche", horaInicio: "17:00", horaFin: "22:00" },
  ]

  const diasSemanaOptions = [
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
  ]

  const [formData, setFormData] = useState({
    nombre: "",
    turnoId: "1",
    horaInicio: "",
    horaFin: "",
    idProfesor: "",
    capacidadMaxima: "",
    diasSemana: [],
    descripcion: "",
    estado: "Activo",
  })

  const obtenerProfesores = async () => {
    try {
      setLoadingProfesores(true)

      const response = await fetch("http://localhost:3001/api/vv1/profesores")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al obtener profesores")
      }

      setProfesores(result.data)
    } catch (error) {
      console.error("Error al obtener profesores:", error)
      setErrors({
        general: `Error al cargar profesores: ${error.message}`,
      })
    } finally {
      setLoadingProfesores(false)
    }
  }

  const obtenerClase = async () => {
    try {
      setLoadingData(true)

      const response = await fetch(`http://localhost:3001/api/vv1/clases/${id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al obtener la clase")
      }

      const clase = result.data

      const turnoEncontrado = turnos.find(
        (turno) => turno.nombre === clase.turno
      )

      setFormData({
        nombre: clase.nombreClase || "",
        turnoId: turnoEncontrado ? turnoEncontrado.id : "1",
        horaInicio: clase.horaInicio ? clase.horaInicio.substring(0, 5) : "",
        horaFin: clase.horaFin ? clase.horaFin.substring(0, 5) : "",
        idProfesor: clase.idProfesor ? clase.idProfesor.toString() : "",
        capacidadMaxima: clase.cupoDisponible
          ? clase.cupoDisponible.toString()
          : "",
        diasSemana: clase.diasSemana ? clase.diasSemana.split(",") : [],
        descripcion: "",
        estado: clase.estado || "Activo",
      })
    } catch (error) {
      console.error("Error al obtener clase:", error)
      setErrors({
        general: `Error al cargar la clase: ${error.message}`,
      })
    } finally {
      setLoadingData(false)
    }
  }

 useEffect(() => {
  const storedPermisos = localStorage.getItem("permisos")
  let tieneAcceso = false

  if (storedPermisos) {
    try {
      const lista = JSON.parse(storedPermisos)
      if (lista.includes("clases:modificacion")) {
        tieneAcceso = true
      }
    } catch (err) {
      console.error("Error validando permisos de edición:", err)
    }
  }

  // 🔴 SI NO TIENE EL TILDE, LO REBOTA AUTOMÁTICAMENTE A SU PANEL
  if (!tieneAcceso) {
    navigate("/admin/clases")
    return
  }
    obtenerProfesores()
    obtenerClase()
  }, [id])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.idProfesor) {
      newErrors.idProfesor = "El profesor es requerido"
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = "La hora de inicio es requerida"
    }

    if (!formData.horaFin) {
      newErrors.horaFin = "La hora de fin es requerida"
    }

    if (!formData.capacidadMaxima) {
      newErrors.capacidadMaxima = "La capacidad es requerida"
    }

    if (formData.capacidadMaxima && parseInt(formData.capacidadMaxima) <= 0) {
      newErrors.capacidadMaxima = "La capacidad debe ser mayor a 0"
    }

    if (formData.capacidadMaxima && parseInt(formData.capacidadMaxima) > 20) {
      newErrors.capacidadMaxima = "El cupo disponible no puede superar 20"
    }

    if (formData.diasSemana.length === 0) {
      newErrors.diasSemana = "Selecciona al menos un día"
    }

    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        newErrors.horaFin = "La hora de fin debe ser posterior a la de inicio"
      }
    }

    const turno = turnos.find((t) => t.id === formData.turnoId)

    if (turno) {
      if (formData.horaInicio && formData.horaInicio < turno.horaInicio) {
        newErrors.horaInicio = `La hora de inicio debe ser posterior a ${turno.horaInicio}`
      }

      if (formData.horaFin && formData.horaFin > turno.horaFin) {
        newErrors.horaFin = `La hora de fin debe ser anterior a ${turno.horaFin}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const turnoSeleccionado = turnos.find(
        (turno) => turno.id === formData.turnoId
      )

      const payload = {
        nombreClase: formData.nombre,
        tipoClase: "Grupal",
        cupoMaximo: 20,
        cupoDisponible: parseInt(formData.capacidadMaxima),
        estado: formData.estado,
        idGimnasio: null,
        idProfesor: parseInt(formData.idProfesor),

        diasSemana: formData.diasSemana,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        turno: turnoSeleccionado?.nombre || "",
      }

      console.log("Editando clase:", payload)

      const response = await fetch(`http://localhost:3001/api/vv1/clases/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al editar la clase")
      }

      setSuccess(true)

      setTimeout(() => {
        navigate("/admin/clases")
      }, 1500)
    } catch (error) {
      console.error("Error al editar clase:", error)
      setErrors({
        general: `Error al editar la clase: ${error.message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTurno = turnos.find((t) => t.id === formData.turnoId)

  const cardClass = "rounded-xl border border-border bg-card p-0 shadow-sm"
  const cardHeaderClass = "border-b border-border bg-secondary px-6 py-4"
  const titleClass = "text-lg font-bold text-foreground"
  const labelClass = "text-sm font-semibold text-muted-foreground"

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"

  const inputErrorClass =
    "mt-1 w-full rounded-lg border border-destructive bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-destructive"

  if (loadingData) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          Cargando datos de la clase...
        </div>
      </div>
    )
  }

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
            Editar Clase
          </h1>
          <p className="text-muted-foreground">
            Modifica los datos de la clase seleccionada.
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success bg-popover p-4 text-success">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium text-foreground">
            Clase editada exitosamente. Redirigiendo...
          </p>
        </div>
      )}

      {errors.general && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-popover p-4 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium text-foreground">
            {errors.general}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Información Básica</h2>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className={labelClass}>Nombre de la Clase *</label>

              <input
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Funcional WOD"
                className={errors.nombre ? inputErrorClass : inputClass}
              />

              {errors.nombre && (
                <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Profesor *</label>

              <select
                value={formData.idProfesor}
                onChange={(e) =>
                  setFormData({ ...formData, idProfesor: e.target.value })
                }
                className={errors.idProfesor ? inputErrorClass : inputClass}
                disabled={loadingProfesores}
              >
                {loadingProfesores ? (
                  <option value="">Cargando profesores...</option>
                ) : (
                  profesores.map((profesor) => (
                    <option
                      key={profesor.idProfesor}
                      value={profesor.idProfesor}
                      className="bg-input text-foreground"
                    >
                    
                      {profesor.nombreProfesor || "Staff Bravos"}
                    </option>
                  ))
                )}
              </select>

              {errors.idProfesor && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.idProfesor}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Estado *</label>

              <select
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                className={inputClass}
              >
                <option value="Activo" className="bg-input text-foreground">
                  Activo
                </option>
                <option value="Inactivo" className="bg-input text-foreground">
                  Inactivo
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Descripción</label>

              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Breve descripción de la clase"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Horario</h2>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className={labelClass}>Turno *</label>

              <select
                value={formData.turnoId}
                onChange={(e) =>
                  setFormData({ ...formData, turnoId: e.target.value })
                }
                className={inputClass}
              >
                {turnos.map((turno) => (
                  <option
                    key={turno.id}
                    value={turno.id}
                    className="bg-input text-foreground"
                  >
                    {turno.nombre} ({turno.horaInicio} - {turno.horaFin})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Hora Inicio *</label>

                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, horaInicio: e.target.value })
                  }
                  className={errors.horaInicio ? inputErrorClass : inputClass}
                />

                {errors.horaInicio && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.horaInicio}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Hora Fin *</label>

                <input
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) =>
                    setFormData({ ...formData, horaFin: e.target.value })
                  }
                  className={errors.horaFin ? inputErrorClass : inputClass}
                />

                {errors.horaFin && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.horaFin}
                  </p>
                )}
              </div>
            </div>

            {selectedTurno && (
              <div className="rounded-lg border border-border bg-secondary p-3">
                <p className="text-xs text-muted-foreground">
                  Este turno opera entre{" "}
                  <span className="font-semibold text-foreground">
                    {selectedTurno.horaInicio}
                  </span>{" "}
                  y{" "}
                  <span className="font-semibold text-foreground">
                    {selectedTurno.horaFin}
                  </span>
                  .
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Capacidad</h2>
          </div>

          <div className="p-6">
            <label className={labelClass}>Cupos disponibles *</label>

            <input
              type="number"
              min="1"
              max="20"
              value={formData.capacidadMaxima}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacidadMaxima: e.target.value,
                })
              }
              placeholder="Ej: 14"
              className={errors.capacidadMaxima ? inputErrorClass : inputClass}
            />

            <p className="mt-1 text-xs text-muted-foreground">
              El cupo máximo permitido es 20. Este valor representa los cupos
              disponibles actuales.
            </p>

            {errors.capacidadMaxima && (
              <p className="mt-1 text-xs text-red-400">
                {errors.capacidadMaxima}
              </p>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Días de la Semana</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {diasSemanaOptions.map((dia) => (
                <label
                  key={dia}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-input p-3 text-sm text-foreground hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    checked={formData.diasSemana.includes(dia)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          diasSemana: [...formData.diasSemana, dia],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          diasSemana: formData.diasSemana.filter(
                            (d) => d !== dia
                          ),
                        })
                      }
                    }}
                    className="h-4 w-4"
                  />

                  <span>{dia}</span>
                </label>
              ))}
            </div>

            {errors.diasSemana && (
              <p className="mt-2 text-xs text-red-400">
                {errors.diasSemana}
              </p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/admin/clases"
            className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-center text-sm font-semibold text-foreground hover:bg-secondary"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}