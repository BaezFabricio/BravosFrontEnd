import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from '@/lib/notificar'
import RichTextEditor from "@/components/RichTextEditor"

const DIAS = [
  { key: "LUNES",    label: "Lun" },
  { key: "MARTES",   label: "Mar" },
  { key: "MIERCOLES",label: "Mié" },
  { key: "JUEVES",   label: "Jue" },
  { key: "VIERNES",  label: "Vie" },
  { key: "SABADO",   label: "Sáb" },
]

const TURNOS = [
  { nombre: "Mañana",   horaInicio: "06:00", horaFin: "12:00" },
  { nombre: "Mediodía", horaInicio: "12:00", horaFin: "17:00" },
  { nombre: "Noche",    horaInicio: "17:00", horaFin: "22:00" },
]

const HORAS = Array.from({ length: 18 }, (_, i) => String(i + 5).padStart(2, "0"))
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

// Selector de hora: HH : MM
function TimeSelect({ value, onChange, hasError }) {
  const [hh, mm] = value ? value.split(":") : ["", ""]

  const handleH = (h) => onChange(h ? `${h}:${mm || "00"}` : "")
  const handleM = (m) => onChange(m ? `${hh || "05"}:${m}` : "")

  const selectClass = "flex-1 bg-card text-sm text-foreground px-2 py-2 outline-none appearance-none text-center cursor-pointer border-0"

  return (
    <div
      className={`flex items-center border bg-card ${hasError ? "border-red-500/50" : "border-border"}`}
      style={{ colorScheme: "dark" }}
    >
      <select value={hh || ""} onChange={e => handleH(e.target.value)} className={selectClass}>
        <option value="">HH</option>
        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-foreground/20 font-black px-0.5 shrink-0">:</span>
      <select value={mm || ""} onChange={e => handleM(e.target.value)} className={selectClass}>
        <option value="">MM</option>
        {MINUTOS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  )
}

// Selector de fecha: Día / Mes / Año
function DateSelect({ value, onChange }) {
  const today = new Date()
  const anios = Array.from({ length: 8 }, (_, i) => today.getFullYear() - 1 + i)
  const dias  = Array.from({ length: 31 }, (_, i) => i + 1)

  const parsear = (v) => {
    if (!v) return { dia: "", mes: "", anio: "" }
    const d = new Date(v + "T00:00:00")
    return { dia: d.getDate(), mes: d.getMonth(), anio: d.getFullYear() }
  }

  const init = parsear(value)
  const [dia,  setDia]  = useState(init.dia)
  const [mes,  setMes]  = useState(init.mes)
  const [anio, setAnio] = useState(init.anio)

  const emit = (d, m, y) => {
    if (d !== "" && m !== "" && y !== "") {
      const dd = String(d).padStart(2, "0")
      const mm = String(Number(m) + 1).padStart(2, "0")
      onChange(`${y}-${mm}-${dd}`)
    } else {
      onChange("")
    }
  }

  const selectClass = "bg-card border-0 text-sm text-foreground px-2 py-2 outline-none appearance-none cursor-pointer flex-1 text-center"

  return (
    <div className="flex items-center border border-border bg-card" style={{ colorScheme: "dark" }}>
      <select value={dia} onChange={e => { const v = e.target.value; setDia(v); emit(v, mes, anio) }} className={selectClass}>
        <option value="">Día</option>
        {dias.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <span className="text-foreground/20 font-black">/</span>
      <select value={mes} onChange={e => { const v = e.target.value; setMes(v); emit(dia, v, anio) }} className={selectClass}>
        <option value="">Mes</option>
        {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
      <span className="text-foreground/20 font-black">/</span>
      <select value={anio} onChange={e => { const v = e.target.value; setAnio(v); emit(dia, mes, v) }} className={selectClass}>
        <option value="">Año</option>
        {anios.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  )
}

export default function NuevaClasePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planIdDesdeUrl = searchParams.get("planId") || ""

  const [isLoading, setIsLoading]     = useState(false)
  const [errors, setErrors]           = useState({})
  const [profesores, setProfesores]   = useState([])
  const [loadingProfesores, setLoadingProfesores] = useState(true)
  const [planes, setPlanes]           = useState([])
  const [publicarProgramado, setPublicarProgramado] = useState(false)

  const [esClaseUnica, setEsClaseUnica] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    idPlan: planIdDesdeUrl,
    horaInicio: "",
    horaFin: "",
    idProfesor: "",
    capacidadMaxima: "15",
    diasSemana: [],
    fechaEspecifica: "",
    descripcion: "",
    rutina: "",
    publicarDatetime: "",
  })

  const set = (campo, valor) => setFormData(prev => ({ ...prev, [campo]: valor }))

  useEffect(() => {
    const storedPermisos = localStorage.getItem("permisos")
    let tieneAcceso = false
    if (storedPermisos) {
      try { if (JSON.parse(storedPermisos).includes("clases:alta")) tieneAcceso = true }
      catch (err) { console.error(err) }
    }
    if (!tieneAcceso) { navigate("/admin/clases"); return }

    const token = localStorage.getItem("token")
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    fetch("http://localhost:3001/api/vv1/profesores", { headers })
      .then(r => r.json())
      .then(r => { if (r.success) setProfesores(r.data) })
      .catch(err => toast.error("Error al cargar profesores", { description: err.message }))
      .finally(() => setLoadingProfesores(false))

    fetch("http://localhost:3001/api/vv1/planes", { headers })
      .then(r => r.json())
      .then(r => setPlanes(r.data || []))
      .catch(err => console.error("Error al cargar planes:", err))
  }, [navigate])

  const toggleDia = (dia) => {
    set("diasSemana", formData.diasSemana.includes(dia)
      ? formData.diasSemana.filter(d => d !== dia)
      : [...formData.diasSemana, dia]
    )
  }

  const duracionMinutos = () => {
    if (!formData.horaInicio || !formData.horaFin) return null
    const [h1, m1] = formData.horaInicio.split(":").map(Number)
    const [h2, m2] = formData.horaFin.split(":").map(Number)
    const dur = (h2 * 60 + m2) - (h1 * 60 + m1)
    return dur > 0 ? dur : null
  }

  const validate = () => {
    const e = {}
    if (!formData.nombre.trim()) e.nombre = "Requerido"
    if (!formData.idProfesor) e.idProfesor = "Requerido"
    if (!formData.horaInicio) e.horario = "Seleccioná hora de inicio"
    if (!formData.horaFin) e.horario = "Seleccioná hora de fin"
    if (formData.horaInicio && formData.horaFin && formData.horaInicio >= formData.horaFin)
      e.horario = "La hora de fin debe ser posterior al inicio"
    if (!formData.capacidadMaxima || parseInt(formData.capacidadMaxima) <= 0) e.capacidadMaxima = "Debe ser mayor a 0"
    if (parseInt(formData.capacidadMaxima) > 20) e.capacidadMaxima = "Máximo 20 alumnos"
    if (esClaseUnica) {
      if (!formData.fechaEspecifica) e.diasSemana = "Seleccioná la fecha de la clase"
    } else {
      if (formData.diasSemana.length === 0) e.diasSemana = "Seleccioná al menos un día"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      const turnoSeleccionado = TURNOS.find(t =>
        formData.horaInicio >= t.horaInicio && formData.horaInicio < t.horaFin
      ) || TURNOS[0]

      const fechaPublicacion = (publicarProgramado && formData.publicarDatetime)
        ? new Date(formData.publicarDatetime).toISOString().slice(0, 19).replace('T', ' ')
        : null

      const token = localStorage.getItem("token")
      const payload = {
        nombreClase: formData.nombre,
        tipoClase: "Grupal",
        cupoMaximo: parseInt(formData.capacidadMaxima),
        cupoDisponible: parseInt(formData.capacidadMaxima),
        estado: "Activo",
        idGimnasio: 1,
        idProfesor: parseInt(formData.idProfesor),
        ...(esClaseUnica
          ? { fechaEspecifica: formData.fechaEspecifica }
          : { diasSemana: formData.diasSemana }
        ),
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        turno: turnoSeleccionado.nombre,
        idPlan: formData.idPlan ? parseInt(formData.idPlan) : null,
        fechaPublicacion,
        rutina: {
          descripcion: formData.descripcion,
          ejercicios: formData.rutina,
        },
      }

      const response = await fetch("http://localhost:3001/api/vv1/clases", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message || "Error al crear la clase")
      toast.success("Clase creada exitosamente")
      navigate("/admin/clases")
    } catch (error) {
      toast.error("Error al crear la clase", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const planSeleccionado = planes.find(p => String(p.idPlan) === String(formData.idPlan))
  const dur = duracionMinutos()

  const field = "w-full bg-transparent border border-border text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none focus:border-foreground/40 transition-colors"
  const fieldError = "w-full bg-transparent border border-red-500/50 text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none focus:border-red-400 transition-colors"


  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start gap-4">
        <Link to="/admin/clases" className="mt-1 p-1.5 text-foreground/30 hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Nueva Clase</h1>
          <p className="text-sm text-foreground/65 mt-0.5">
            {planSeleccionado
              ? <>Plan: <span className="text-foreground/60">{planSeleccionado.nombre}</span></>
              : "Completá los campos para registrar la clase"
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">

          {/* ── IZQUIERDA: contenido ── */}
          <div className="border border-border divide-y divide-border">

            <div className="p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Nombre de la clase *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e => set("nombre", e.target.value)}
                placeholder="Ej: WOD Competitivo"
                className={errors.nombre ? fieldError : field}
              />
              {errors.nombre && <p className="mt-1.5 text-xs text-red-400">{errors.nombre}</p>}
            </div>

            <div className="p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Descripción</label>
              <RichTextEditor
                value={formData.descripcion}
                onChange={v => set("descripcion", v)}
                placeholder="Breve descripción para que los alumnos entiendan de qué se trata..."
                minHeight={90}
              />
            </div>

            <div className="p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Rutina de la clase</label>
              <RichTextEditor
                value={formData.rutina}
                onChange={v => set("rutina", v)}
                placeholder={"Calentamiento: ...\n\nEjercicio principal: ...\n\nMetcon: ..."}
                minHeight={200}
              />
            </div>

            {/* Notificación por email programada */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block">Notificar alumnos por email</label>
                  <p className="text-xs text-foreground/60 mt-0.5">Avisá automáticamente a todos los alumnos activos cuando la clase esté lista para reservar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPublicarProgramado(!publicarProgramado); set("publicarDatetime", "") }}
                  className={`shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                    publicarProgramado
                      ? "border-primary/30 text-primary bg-primary/5"
                      : "border-border text-foreground/25 hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {publicarProgramado ? <><Eye className="h-3 w-3" />Programado</> : <><EyeOff className="h-3 w-3" />Sin aviso</>}
                </button>
              </div>

              {publicarProgramado && (
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={formData.publicarDatetime}
                    onChange={e => set("publicarDatetime", e.target.value)}
                    className="w-full bg-card border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors"
                    style={{ colorScheme: "dark" }}
                  />
                  {formData.publicarDatetime && (
                    <p className="text-xs text-primary">
                      📧 Email enviado el {new Date(formData.publicarDatetime).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })} a las {formData.publicarDatetime.slice(11, 16)} hs
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── DERECHA: configuración ── */}
          <div className="border border-border divide-y divide-border sticky top-6 self-start">

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Coach *</label>
              <select
                value={formData.idProfesor}
                onChange={e => set("idProfesor", e.target.value)}
                disabled={loadingProfesores}
                style={{ colorScheme: "dark" }}
                className={`w-full bg-card border ${errors.idProfesor ? "border-red-500/50" : "border-border"} text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors`}
              >
                <option value="">{loadingProfesores ? "Cargando..." : "Seleccionar..."}</option>
                {profesores.map(p => <option key={p.idProfesor} value={p.idProfesor}>{p.nombreProfesor}</option>)}
              </select>
              {errors.idProfesor && <p className="mt-1.5 text-xs text-red-400">{errors.idProfesor}</p>}
            </div>

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Cupo máximo *</label>
              <input
                type="number" min="1" max="20"
                value={formData.capacidadMaxima}
                onChange={e => set("capacidadMaxima", e.target.value)}
                className={errors.capacidadMaxima ? fieldError : field}
              />
              {errors.capacidadMaxima && <p className="mt-1.5 text-xs text-red-400">{errors.capacidadMaxima}</p>}
            </div>

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-3">Horario *</label>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-foreground/60 mb-1.5">Inicio</p>
                  <TimeSelect value={formData.horaInicio} onChange={v => set("horaInicio", v)} hasError={!!errors.horario && !formData.horaInicio} />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/60 mb-1.5">Fin</p>
                  <TimeSelect value={formData.horaFin} onChange={v => set("horaFin", v)} hasError={!!errors.horario && !formData.horaFin} />
                </div>
              </div>
              {errors.horario && <p className="mt-1.5 text-[10px] text-red-400">{errors.horario}</p>}
              {dur && !errors.horario && (
                <p className="mt-1.5 text-[10px] text-foreground/60">{dur} min de duración</p>
              )}
            </div>

            <div className="p-4">
              {/* Toggle recurrente / única */}
              <div className="flex items-center gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => { setEsClaseUnica(false); set("fechaEspecifica", "") }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    !esClaseUnica
                      ? "border-lime-400/40 bg-lime-400/10 text-lime-400"
                      : "border-border text-foreground/30 hover:text-foreground"
                  }`}
                >
                  Recurrente
                </button>
                <button
                  type="button"
                  onClick={() => { setEsClaseUnica(true); set("diasSemana", []) }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    esClaseUnica
                      ? "border-lime-400/40 bg-lime-400/10 text-lime-400"
                      : "border-border text-foreground/30 hover:text-foreground"
                  }`}
                >
                  Única
                </button>
              </div>

              {esClaseUnica ? (
                <div>
                  <p className="text-[10px] text-foreground/50 mb-1.5">Fecha de la clase *</p>
                  <DateSelect value={formData.fechaEspecifica} onChange={v => set("fechaEspecifica", v)} />
                  <p className="text-[10px] text-foreground/35 mt-1.5">La clase no se repetirá. Pasada esa fecha desaparece automáticamente.</p>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Días de la semana *</label>
                  <div className="grid grid-cols-3 gap-1">
                    {DIAS.map(({ key, label }) => (
                      <button
                        key={key} type="button" onClick={() => toggleDia(key)}
                        className={`py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                          formData.diasSemana.includes(key)
                            ? "border-lime-400/40 bg-lime-400/10 text-lime-400"
                            : "border-border text-foreground/30 hover:text-foreground hover:border-foreground/20"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.diasSemana && <p className="mt-2 text-xs text-red-400">{errors.diasSemana}</p>}
            </div>

            <div className="p-4 space-y-2">
              <button
                type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-xs py-3 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Guardando..." : "Crear Clase"}
              </button>
              <Link
                to="/admin/clases"
                className="block w-full text-center border border-border py-2.5 text-xs font-bold uppercase tracking-widest text-foreground/30 hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
