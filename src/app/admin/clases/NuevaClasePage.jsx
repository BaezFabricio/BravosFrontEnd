import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"

export default function NuevaClasePage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

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
    instructor: "",
    capacidadMaxima: "",
    diasSemana: [],
    descripcion: "",
  })

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.instructor.trim()) {
      newErrors.instructor = "El instructor es requerido"
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = "La hora de inicio es requerida"
    }

    if (!formData.horaFin) {
      newErrors.horaFin = "La hora de fin es requerida"
    }

    if (!formData.capacidadMaxima) {
      newErrors.capacidadMaxima = "La capacidad máxima es requerida"
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

    if (formData.capacidadMaxima && parseInt(formData.capacidadMaxima) <= 0) {
      newErrors.capacidadMaxima = "La capacidad debe ser mayor a 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const payload = {
        nombre: formData.nombre,
        turnoId: formData.turnoId,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        instructor: formData.instructor,
        capacidadMaxima: parseInt(formData.capacidadMaxima),
        diasSemana: formData.diasSemana,
        descripcion: formData.descripcion,
      }

      console.log("Enviando clase:", payload)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess(true)

      setTimeout(() => {
        navigate("/admin/clases")
      }, 1500)
    } catch (error) {
      setErrors({ general: "Error al crear la clase. Intenta de nuevo." })
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

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/clases"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Crear Nueva Clase
          </h1>
          <p className="text-muted-foreground">
            Configura una nueva clase con horario y detalles.
          </p>
        </div>
      </div>

      {/* Mensaje de éxito */}
        {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success bg-popover p-4 text-success">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium text-foreground">
            Clase creada exitosamente. Redirigiendo...
          </p>
        </div>
      )}

      {/* Mensaje de error */}
        {errors.general && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-popover p-4 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium text-foreground">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
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
              <label className={labelClass}>Instructor *</label>

              <input
                type="text"
                value={formData.instructor}
                onChange={(e) =>
                  setFormData({ ...formData, instructor: e.target.value })
                }
                placeholder="Ej: Pablo Ruiz"
                className={errors.instructor ? inputErrorClass : inputClass}
              />

              {errors.instructor && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.instructor}
                </p>
              )}
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

        {/* Horario */}
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

        {/* Capacidad */}
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Capacidad</h2>
          </div>

          <div className="p-6">
            <label className={labelClass}>Capacidad Máxima *</label>

            <input
              type="number"
              min="1"
              value={formData.capacidadMaxima}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacidadMaxima: e.target.value,
                })
              }
              placeholder="Ej: 15"
              className={errors.capacidadMaxima ? inputErrorClass : inputClass}
            />

            {errors.capacidadMaxima && (
              <p className="mt-1 text-xs text-red-400">
                {errors.capacidadMaxima}
              </p>
            )}
          </div>
        </section>

        {/* Días */}
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

        {/* Botones */}
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
                Creando...
              </>
            ) : (
              "Crear Clase"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}