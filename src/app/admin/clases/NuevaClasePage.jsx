import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"

export default function NuevaClasePage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const [profesores, setProfesores] = useState([])
  const [loadingProfesores, setLoadingProfesores] = useState(true)
  const [planes, setPlanes] = useState([])

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
    idPlan: "",
    turnoId: "1",
    horaInicio: "",
    horaFin: "",
    idProfesor: "",
    capacidadMaxima: "15",
    diasSemana: [],
    categoria: "",
    intensidad: "",
    descripcion: "",
    ejercicios: [{ nombre: "", videoUrl: "" }]
  })

  const actualizarEjercicio = (index, campo, valor) => {
    setFormData((prev) => {
      const ejercicios = [...prev.ejercicios]
      ejercicios[index] = { ...ejercicios[index], [campo]: valor }
      return { ...prev, ejercicios }
    })
  }

  const agregarEjercicio = () => {
    setFormData((prev) => ({ ...prev, ejercicios: [...prev.ejercicios, { nombre: "", videoUrl: "" }] }))
  }

  const quitarEjercicio = (index) => {
    setFormData((prev) => ({ ...prev, ejercicios: prev.ejercicios.filter((_, i) => i !== index) }))
  }

  useEffect(() => {
    const storedPermisos = localStorage.getItem("permisos")
    let tieneAcceso = false

    if (storedPermisos) {
      try {
        const lista = JSON.parse(storedPermisos)
        if (lista.includes("clases:alta")) {
          tieneAcceso = true
        }
      } catch (err) {
        console.error(err)
      }
    }

    if (!tieneAcceso) {
      navigate("/admin/clases")
      return
    }

    const obtenerProfesores = async () => {
      try {
        setLoadingProfesores(true)
        const token = localStorage.getItem("token") // 🟢 Recuperamos tu token

        const response = await fetch("http://localhost:3001/api/vv1/profesores", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}) // 🟢 Inyectamos cabecera JWT
          }
        })
        
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message || "Error al obtener profesores")
        }

        setProfesores(result.data)

        // Seleccionamos el primer profesor por defecto si existen
        if (result.data.length > 0) {
          // Usamos idUsuario o idProfesor según devuelva tu consulta
          const primerProfesorId = result.data[0].idUsuario || result.data[0].idProfesor
          setFormData((prev) => ({
            ...prev,
            idProfesor: primerProfesorId ? primerProfesorId.toString() : "",
          }))
        }
      } catch (error) {
        console.error("Error al obtener profesores por permisos:", error)
        setErrors({
          general: `Error al cargar profesores: ${error.message}. Asegurate de estar logueado correctamente.`,
        })
      } finally {
        setLoadingProfesores(false)
      }
    }

    obtenerProfesores()

    const token = localStorage.getItem("token")
    fetch("http://localhost:3001/api/vv1/planes", {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(r => r.json())
      .then(r => setPlanes(r.data || []))
      .catch(err => console.error("Error al cargar planes:", err))
  }, [navigate])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la clase es requerido"
    }

    if (!formData.idProfesor) {
      newErrors.idProfesor = "Debes asignar un profesor/coach"
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
      newErrors.capacidadMaxima = "El cupo máximo por seguridad del Box es 20"
    }

    if (formData.diasSemana.length === 0) {
      newErrors.diasSemana = "Selecciona al menos un día para la clase"
    }

    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        newErrors.horaFin = "La hora de fin debe ser posterior a la de inicio"
      }
    }

    const turno = turnos.find((t) => t.id === formData.turnoId)
    if (turno) {
      if (formData.horaInicio && formData.horaInicio < turno.horaInicio) {
        newErrors.horaInicio = `La hora de inicio debe corresponder al turno ${turno.nombre} (desde ${turno.horaInicio})`
      }
      if (formData.horaFin && formData.horaFin > turno.horaFin) {
        newErrors.horaFin = `La hora de fin debe corresponder al turno ${turno.nombre} (hasta ${turno.horaFin})`
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
      const turnoSeleccionado = turnos.find((turno) => turno.id === formData.turnoId)
      const token = localStorage.getItem("token") // 🟢 Recuperamos tu token para el alta

      const payload = {
        nombreClase: formData.nombre,
        tipoClase: "Grupal",
        cupoMaximo: parseInt(formData.capacidadMaxima),
        cupoDisponible: parseInt(formData.capacidadMaxima),
        estado: "Activo",
        idGimnasio: 1,
        idProfesor: parseInt(formData.idProfesor),
        diasSemana: formData.diasSemana,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        turno: turnoSeleccionado?.nombre || "",
        idPlan: formData.idPlan ? parseInt(formData.idPlan) : null,
        rutina: {
          categoria: formData.categoria,
          nivel: formData.intensidad,
          descripcion: formData.descripcion,
          ejercicios: formData.ejercicios.filter((ej) => ej.nombre.trim() !== ""),
        },
      }

      const response = await fetch("http://localhost:3001/api/vv1/clases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}) // 🟢 Inyectamos cabecera JWT aquí también
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al procesar el alta")
      }

      setSuccess(true)
      setTimeout(() => {
        navigate("/admin/clases")
      }, 1500)
    } catch (error) {
      console.error("Error al crear clase integral:", error)
      setErrors({
        general: `Error al procesar la solicitud: ${error.message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTurno = turnos.find((t) => t.id === formData.turnoId)

  const cardClass = "rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden"
  const cardHeaderClass = "border-b border-border bg-secondary px-6 py-4"
  const titleClass = "text-lg font-bold text-foreground"
  const labelClass = "text-sm font-semibold text-muted-foreground"
  const inputClass = "mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
  const inputErrorClass = "mt-1 w-full rounded-lg border border-destructive bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-destructive transition-all"

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
          <h1 className="text-2xl font-bold text-foreground">Crear Nueva Clase</h1>
          <p className="text-muted-foreground">Configura una disciplina vinculando especificaciones, coaches y horarios en tiempo real.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success bg-popover p-4 text-success animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium text-foreground">Clase y planificación creadas con éxito. Redirigiendo al listado...</p>
        </div>
      )}

      {errors.general && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-popover p-4 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium text-foreground">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* INFORMACIÓN BÁSICA */}
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
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: WOD Competitivo / Open Box"
                className={errors.nombre ? inputErrorClass : inputClass}
              />
              {errors.nombre && <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Coach / Profesor Responsable *</label>
                <select
                  value={formData.idProfesor}
                  onChange={(e) => setFormData({ ...formData, idProfesor: e.target.value })}
                  className={errors.idProfesor ? inputErrorClass : inputClass}
                  disabled={loadingProfesores}
                >
                  {loadingProfesores ? (
                    <option value="">Cargando profesores...</option>
                  ) : profesores.length === 0 ? (
                    <option value="">No hay profesores disponibles</option>
                  ) : (
                    profesores.map((p) => (
                      <option key={p.idProfesor} value={p.idProfesor} className="bg-input text-foreground">
                        {p.nombreProfesor}
                      </option>
                    ))
                  )}
                </select>
                {errors.idProfesor && <p className="mt-1 text-xs text-red-400">{errors.idProfesor}</p>}
              </div>

              <div>
                <label className={labelClass}>Plan de Membresía</label>
                <select
                  value={formData.idPlan}
                  onChange={(e) => setFormData({ ...formData, idPlan: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Sin restricción de plan</option>
                  {planes.map((plan) => (
                    <option key={plan.idPlan} value={plan.idPlan} className="bg-input text-foreground">
                      {plan.nombre}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Solo alumnos con este plan podrán reservar</p>
              </div>
            </div>

            <div>
              <label className={labelClass}>Capacidad / Cupo Máximo *</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.capacidadMaxima}
                onChange={(e) => setFormData({ ...formData, capacidadMaxima: e.target.value })}
                className={errors.capacidadMaxima ? inputErrorClass : inputClass}
              />
              {errors.capacidadMaxima && <p className="mt-1 text-xs text-red-400">{errors.capacidadMaxima}</p>}
            </div>
          </div>
        </section>

        {/* ESPECIFICACIONES CORPORATIVAS */}
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Planificación y Contenido Multimedia</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Categoría / Tipo de clase</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ej: WOD, Funcional, Halterofilia..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nivel / Intensidad</label>
                <input
                  type="text"
                  value={formData.intensidad}
                  onChange={(e) => setFormData({ ...formData, intensidad: e.target.value })}
                  placeholder="Ej: Principiante, RX, Scaled..."
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Descripción de la Disciplina</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Explicá brevemente en qué consiste la clase para orientar a los alumnos..."
                className={`${inputClass} min-h-[80px] resize-none`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Ejercicios de la Rutina</label>
                <button
                  type="button"
                  onClick={agregarEjercicio}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar ejercicio
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cada ejercicio puede tener su propio video de demostración. Los alumnos y el profesor los van a ver en la rutina de esta clase.
              </p>

              <div className="mt-3 space-y-3">
                {formData.ejercicios.map((ejercicio, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] items-start rounded-lg border border-border bg-secondary/40 p-3">
                    <input
                      type="text"
                      value={ejercicio.nombre}
                      onChange={(e) => actualizarEjercicio(index, "nombre", e.target.value)}
                      placeholder="Ej: Sentadilla con salto"
                      className={inputClass + " mt-0"}
                    />
                    <input
                      type="url"
                      value={ejercicio.videoUrl}
                      onChange={(e) => actualizarEjercicio(index, "videoUrl", e.target.value)}
                      placeholder="Video demostrativo (URL, opcional)"
                      className={inputClass + " mt-0"}
                    />
                    <button
                      type="button"
                      onClick={() => quitarEjercicio(index)}
                      disabled={formData.ejercicios.length === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE DE HORARIO Y TURNOS */}
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Asignación de Horarios</h2>
          </div>
          <div className="space-y-4 p-6">
            <div>
              <label className={labelClass}>Bloque Horario / Turno *</label>
              <select
                value={formData.turnoId}
                onChange={(e) => setFormData({ ...formData, turnoId: e.target.value })}
                className={inputClass}
              >
                {turnos.map((t) => (
                  <option key={t.id} value={t.id} className="bg-input text-foreground">
                    {t.nombre} ({t.horaInicio} - {t.horaFin} Hs)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Hora de Inicio *</label>
                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  className={errors.horaInicio ? inputErrorClass : inputClass}
                />
                {errors.horaInicio && <p className="mt-1 text-xs text-red-400">{errors.horaInicio}</p>}
              </div>

              <div>
                <label className={labelClass}>Hora de Fin *</label>
                <input
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  className={errors.horaFin ? inputErrorClass : inputClass}
                />
                {errors.horaFin && <p className="mt-1 text-xs text-red-400">{errors.horaFin}</p>}
              </div>
            </div>

            {selectedTurno && (
              <div className="rounded-lg border border-border bg-secondary p-3">
                <p className="text-xs text-muted-foreground">
                  Alerta de rango: Las clases creadas bajo este turno deben iniciar después de las <span className="font-semibold text-foreground">{selectedTurno.horaInicio}</span> y finalizar antes de las <span className="font-semibold text-foreground">{selectedTurno.horaFin}</span>.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SELECCIÓN DE DÍAS */}
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <h2 className={titleClass}>Días de la Semana</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {diasSemanaOptions.map((dia) => (
                <label
                  key={dia}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-input p-3 text-sm text-foreground hover:bg-secondary select-none transition-colors"
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
                          diasSemana: formData.diasSemana.filter((d) => d !== dia),
                        })
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>{dia}</span>
                </label>
              ))}
            </div>
            {errors.diasSemana && <p className="mt-2 text-xs text-red-400">{errors.diasSemana}</p>}
          </div>
        </section>

        {/* ACCIONES DEL FORMULARIO */}
        <div className="flex flex-col gap-3 sm:flex-row pt-2">
          <Link
            to="/admin/clases"
            className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando en Base de Datos...
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