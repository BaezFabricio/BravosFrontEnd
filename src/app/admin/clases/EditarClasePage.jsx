import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { toast } from '@/lib/notificar'
import apiClient from "@/api"

export default function EditarClasePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState({})

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
    capacidadMaxima: "",
    diasSemana: [],
    descripcion: "",
    estado: "Activo",
    categoria: "",
    intensidad: "",
    descripcionRutina: "",
    ejercicios: [{ nombre: "", videoUrl: "" }],
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

  const [uploadingIndex, setUploadingIndex] = useState(null)
  const fileInputRefs = useRef([])

  const handleVideoUpload = async (index, file) => {
    if (!file) return
    setUploadingIndex(index)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('video', file)
      const res = await apiClient.post('/ejercicios/upload-video', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      actualizarEjercicio(index, 'videoUrl', res.data?.data?.url || '')
      toast.success('Video subido correctamente')
    } catch (err) {
      toast.error('Error al subir el video', { description: err.response?.data?.message })
    } finally {
      setUploadingIndex(null)
    }
  }

  const obtenerProfesores = async () => {
    try {
      setLoadingProfesores(true)
      const token = localStorage.getItem("token")

      const response = await fetch("http://localhost:3001/api/vv1/profesores", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al obtener profesores")
      }

      setProfesores(result.data)
    } catch (error) {
      console.error("Error al obtener profesores:", error)
      toast.error("Error al cargar profesores", { description: error.message })
    } finally {
      setLoadingProfesores(false)
    }
  }

  const obtenerClase = async () => {
    try {
      setLoadingData(true)
      const token = localStorage.getItem("token")

      const response = await fetch(`http://localhost:3001/api/vv1/clases/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
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
        idPlan: clase.idPlan ? clase.idPlan.toString() : "",
        turnoId: turnoEncontrado ? turnoEncontrado.id : "1",
        horaInicio: clase.horaInicio ? clase.horaInicio.substring(0, 5) : "",
        horaFin: clase.horaFin ? clase.horaFin.substring(0, 5) : "",
        idProfesor: clase.idProfesor ? clase.idProfesor.toString() : "",
        capacidadMaxima: clase.cupoDisponible ? clase.cupoDisponible.toString() : "",
        diasSemana: clase.diasSemana ? clase.diasSemana.split(",") : [],
        descripcion: "",
        estado: clase.estado || "Activo",
        categoria: clase.rutina?.categoria || "",
        intensidad: clase.rutina?.nivel || "",
        descripcionRutina: clase.rutina?.descripcion || "",
        ejercicios:
          clase.rutina?.ejercicios && clase.rutina.ejercicios.length > 0
            ? clase.rutina.ejercicios.map((ej) => ({ nombre: ej.nombre, videoUrl: ej.videoUrl || "" }))
            : [{ nombre: "", videoUrl: "" }],
      })
    } catch (error) {
      console.error("Error al obtener clase:", error)
      toast.error("Error al cargar la clase", { description: error.message })
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

    const token = localStorage.getItem("token")
    fetch("http://localhost:3001/api/vv1/planes", {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(r => r.json())
      .then(r => setPlanes(r.data || []))
      .catch(err => console.error("Error al cargar planes:", err))
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
        idPlan: formData.idPlan ? parseInt(formData.idPlan) : null,
        rutina: {
          categoria: formData.categoria,
          nivel: formData.intensidad,
          descripcion: formData.descripcionRutina,
          ejercicios: formData.ejercicios.filter((ej) => ej.nombre.trim() !== ""),
        },
      }

      const token = localStorage.getItem("token")

      const response = await fetch(`http://localhost:3001/api/vv1/clases/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Error al editar la clase")
      }

      toast.success("Clase editada exitosamente")
      navigate("/admin/clases")
    } catch (error) {
      console.error("Error al editar clase:", error)
      toast.error("Error al editar la clase", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTurno = turnos.find((t) => t.id === formData.turnoId)

  const cardClass = "border border-border bg-card overflow-hidden"
  const cardHeaderClass = "border-b border-border px-5 py-3"
  const titleClass = "text-[10px] font-black uppercase tracking-widest text-muted-foreground"
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block"

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"

  const inputErrorClass =
    "mt-1 w-full rounded-lg border border-destructive bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-destructive"

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="border border-border bg-card p-6 text-center text-foreground/40">
          Cargando datos de la clase...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/clases"
          className="border border-border p-2 text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Editar Clase</h1>
          <p className="text-sm text-foreground/40 mt-1">Modifica los datos de la clase seleccionada.</p>
        </div>
      </div>

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Profesor *</label>
                <select
                  value={formData.idProfesor}
                  onChange={(e) => setFormData({ ...formData, idProfesor: e.target.value })}
                  className={errors.idProfesor ? inputErrorClass : inputClass}
                  disabled={loadingProfesores}
                >
                  <option value="">
                    {loadingProfesores ? "Cargando profesores..." : "Seleccionar profesor..."}
                  </option>
                  {!loadingProfesores && profesores.map((profesor) => (
                    <option key={profesor.idProfesor} value={profesor.idProfesor} className="bg-input text-foreground">
                      {profesor.nombreProfesor}
                    </option>
                  ))}
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
                value={formData.descripcionRutina}
                onChange={(e) => setFormData({ ...formData, descripcionRutina: e.target.value })}
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
                Cada ejercicio puede tener su propio video de demostración.
              </p>

              <div className="mt-3 space-y-3">
                {formData.ejercicios.map((ejercicio, index) => (
                  <div key={index} className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={ejercicio.nombre}
                        onChange={(e) => actualizarEjercicio(index, "nombre", e.target.value)}
                        placeholder="Ej: Sentadilla con salto"
                        className={inputClass + " mt-0 flex-1"}
                      />
                      <button
                        type="button"
                        onClick={() => quitarEjercicio(index)}
                        disabled={formData.ejercicios.length === 1}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={ejercicio.videoUrl}
                        onChange={(e) => actualizarEjercicio(index, "videoUrl", e.target.value)}
                        placeholder="URL de YouTube (opcional)"
                        className={inputClass + " mt-0 flex-1"}
                      />
                      <span className="text-xs text-muted-foreground shrink-0">o</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/avi"
                        className="hidden"
                        ref={el => fileInputRefs.current[index] = el}
                        onChange={(e) => handleVideoUpload(index, e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        disabled={uploadingIndex === index}
                        className="flex items-center gap-1 shrink-0 px-3 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
                      >
                        {uploadingIndex === index
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Upload className="h-4 w-4" />}
                        {uploadingIndex === index ? "Subiendo..." : "Subir"}
                      </button>
                    </div>
                    {ejercicio.videoUrl && !ejercicio.videoUrl.startsWith('http') && (
                      <p className="text-xs text-green-500">✓ Archivo subido: {ejercicio.videoUrl.split('/').pop()}</p>
                    )}
                  </div>
                ))}
              </div>
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
            className="flex-1 border border-border px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="flex flex-1 items-center justify-center bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
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