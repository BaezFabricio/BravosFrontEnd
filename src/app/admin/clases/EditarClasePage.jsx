import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from '@/lib/notificar'
import apiClient from "@/api"
import RichTextEditor from "@/components/RichTextEditor"

const DIAS = [
  { key: "LUNES",     label: "Lun" },
  { key: "MARTES",    label: "Mar" },
  { key: "MIERCOLES", label: "Mié" },
  { key: "JUEVES",    label: "Jue" },
  { key: "VIERNES",   label: "Vie" },
  { key: "SABADO",    label: "Sáb" },
]

const TURNOS = [
  { nombre: "Mañana",   horaInicio: "06:00", horaFin: "12:00" },
  { nombre: "Mediodía", horaInicio: "12:00", horaFin: "17:00" },
  { nombre: "Noche",    horaInicio: "17:00", horaFin: "22:00" },
]

const HORAS   = Array.from({ length: 18 }, (_, i) => String(i + 5).padStart(2, "0"))
const MINUTOS = ["00", "15", "30", "45"]
const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function TimeSelect({ value, onChange, hasError }) {
  const [hh, mm] = value ? value.split(":") : ["", ""]
  const handleH = (h) => onChange(h ? `${h}:${mm || "00"}` : "")
  const handleM = (m) => onChange(m ? `${hh || "05"}:${m}` : "")
  const selectClass = "flex-1 bg-card text-sm text-foreground px-2 py-2 outline-none appearance-none text-center cursor-pointer border-0"
  return (
    <div className={`flex items-center border bg-card ${hasError ? "border-red-500/50" : "border-border"}`} style={{ colorScheme: "dark" }}>
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

function DateSelect({ value, onChange }) {
  const today = new Date()
  const parsed = value ? new Date(value + "T00:00:00") : null
  const dia  = parsed ? parsed.getDate() : ""
  const mes  = parsed ? parsed.getMonth() : ""
  const anio = parsed ? parsed.getFullYear() : ""
  const rebuild = (d, m, y) => {
    if (!d || m === "" || !y) { onChange(""); return }
    onChange(`${y}-${String(Number(m) + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`)
  }
  const dias  = Array.from({ length: 31 }, (_, i) => i + 1)
  const anios = Array.from({ length: 3  }, (_, i) => today.getFullYear() + i)
  const s = "bg-card border-0 text-sm text-foreground px-2 py-2 outline-none appearance-none cursor-pointer flex-1 text-center"
  return (
    <div className="flex items-center border border-border bg-card" style={{ colorScheme: "dark" }}>
      <select value={dia} onChange={e => rebuild(e.target.value, mes, anio)} className={s}>
        <option value="">Día</option>
        {dias.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <span className="text-foreground/20 font-black">/</span>
      <select value={mes} onChange={e => rebuild(dia, e.target.value, anio)} className={s}>
        <option value="">Mes</option>
        {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
      <span className="text-foreground/20 font-black">/</span>
      <select value={anio} onChange={e => rebuild(dia, mes, e.target.value)} className={s}>
        <option value="">Año</option>
        {anios.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  )
}

export default function EditarClasePage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const planIdDesdeUrl = searchParams.get("planId")
  const navigate = useNavigate()

  const [isLoading, setIsLoading]       = useState(false)
  const [loadingData, setLoadingData]   = useState(true)
  const [errors, setErrors]             = useState({})
  const [profesores, setProfesores]     = useState([])
  const [planes, setPlanes]             = useState([])
  const [loadingProfesores, setLoadingProfesores] = useState(true)
  const [publicarProgramado, setPublicarProgramado] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "", horaInicio: "", horaFin: "",
    idProfesor: "", capacidadMaxima: "15",
    diasSemana: [], descripcion: "", rutina: "",
    estado: "Activo", publicarFecha: "", publicarHora: "",
    idPlan: null,
  })

  const set = (campo, valor) => setFormData(prev => ({ ...prev, [campo]: valor }))

  useEffect(() => {
    const storedPermisos = localStorage.getItem("permisos")
    let ok = false
    try { ok = JSON.parse(storedPermisos || "[]").includes("clases:modificacion") } catch {}
    if (!ok) { navigate("/admin/clases"); return }

    const token = localStorage.getItem("token")
    const h = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    Promise.all([
      fetch(`http://localhost:3001/api/vv1/clases/${id}`, { headers: h }).then(r => r.json()),
      fetch("http://localhost:3001/api/vv1/profesores", { headers: h }).then(r => r.json()),
      apiClient.get("/planes").then(r => r.data).catch(() => ({ success: false })),
    ]).then(([resClase, resProfes, resPlanes]) => {
      if (resPlanes.success) setPlanes(resPlanes.data || [])
      if (resClase.success) {
        const c = resClase.data
        // descripcion puede ser JSON {desc, rutina} (rich text) o plain text (viejo)
        let descripcionCargada = ""
        let rutinaCargada = ""
        const rawDesc = c.rutina?.descripcion || ""
        try {
          const parsed = JSON.parse(rawDesc)
          if (parsed && typeof parsed.rutina !== "undefined") {
            descripcionCargada = parsed.desc || ""
            rutinaCargada = parsed.rutina || ""
          } else {
            descripcionCargada = rawDesc
          }
        } catch {
          descripcionCargada = rawDesc
          // Formato viejo: ejercicios como array
          rutinaCargada = Array.isArray(c.rutina?.ejercicios)
            ? c.rutina.ejercicios.map(e => e.nombre).join("\n")
            : (typeof c.rutina?.ejercicios === "string" ? c.rutina.ejercicios : "")
        }

        setFormData({
          nombre: c.nombreClase || "",
          horaInicio: c.horaInicio ? c.horaInicio.substring(0, 5) : "",
          horaFin: c.horaFin ? c.horaFin.substring(0, 5) : "",
          idProfesor: c.idProfesor ? String(c.idProfesor) : "",
          capacidadMaxima: c.cupoDisponible ? String(c.cupoDisponible) : "15",
          diasSemana: c.diasSemana ? c.diasSemana.split(",").map(d => d.trim()) : [],
          descripcion: descripcionCargada,
          rutina: rutinaCargada,
          estado: c.estado || "Activo",
          publicarFecha: "", publicarHora: "",
          idPlan: c.idPlan || (planIdDesdeUrl ? parseInt(planIdDesdeUrl) : null),
        })
      }
      if (resProfes.success) setProfesores(resProfes.data)
    })
    .catch(err => toast.error("Error al cargar datos", { description: err.message }))
    .finally(() => { setLoadingData(false); setLoadingProfesores(false) })
  }, [id, navigate])

  const toggleDia = (dia) => set("diasSemana",
    formData.diasSemana.includes(dia)
      ? formData.diasSemana.filter(d => d !== dia)
      : [...formData.diasSemana, dia]
  )

  const duracionMinutos = () => {
    if (!formData.horaInicio || !formData.horaFin) return null
    const [h1,m1] = formData.horaInicio.split(":").map(Number)
    const [h2,m2] = formData.horaFin.split(":").map(Number)
    const dur = (h2*60+m2)-(h1*60+m1)
    return dur > 0 ? dur : null
  }

  const validate = () => {
    const e = {}
    if (!formData.nombre.trim()) e.nombre = "Requerido"
    if (!formData.idProfesor) e.idProfesor = "Requerido"
    if (!formData.horaInicio) e.horario = "Seleccioná hora de inicio"
    if (!formData.horaFin)   e.horario = "Seleccioná hora de fin"
    if (formData.horaInicio && formData.horaFin && formData.horaInicio >= formData.horaFin)
      e.horario = "La hora de fin debe ser posterior al inicio"
    if (!formData.capacidadMaxima || parseInt(formData.capacidadMaxima) <= 0) e.capacidadMaxima = "Debe ser mayor a 0"
    if (parseInt(formData.capacidadMaxima) > 20) e.capacidadMaxima = "Máximo 20 alumnos"
    if (formData.diasSemana.length === 0) e.diasSemana = "Seleccioná al menos un día"
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

      let publicarEn = null
      if (publicarProgramado && formData.publicarFecha && formData.publicarHora) {
        publicarEn = `${formData.publicarFecha}T${formData.publicarHora}:00`
      }

      const token = localStorage.getItem("token")
      const payload = {
        nombreClase: formData.nombre,
        tipoClase: "Grupal",
        cupoMaximo: 20,
        cupoDisponible: parseInt(formData.capacidadMaxima),
        estado: formData.estado,
        idGimnasio: null,
        idProfesor: parseInt(formData.idProfesor),
        idPlan: formData.idPlan || null,
        diasSemana: formData.diasSemana,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        turno: turnoSeleccionado.nombre,
        rutina: {
          descripcion: formData.descripcion,
          ejercicios: formData.rutina,
          publicarEn,
        },
      }

      const response = await fetch(`http://localhost:3001/api/vv1/clases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message || "Error al editar la clase")
      toast.success("Clase editada exitosamente")
      navigate("/admin/clases")
    } catch (error) {
      toast.error("Error al editar la clase", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const dur = duracionMinutos()
  const resumenPublicacion = (() => {
    if (!formData.publicarFecha || !formData.publicarHora) return null
    const [y, m, d] = formData.publicarFecha.split("-").map(Number)
    const [hh, mm] = formData.publicarHora.split(":")
    return `${d} de ${MESES[m - 1]} ${y} a las ${hh}:${mm}`
  })()

  const field = "w-full bg-transparent border border-border text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none focus:border-foreground/40 transition-colors"
  const fieldError = "w-full bg-transparent border border-red-500/50 text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none focus:border-red-400 transition-colors"

  if (loadingData) return (
    <div className="border border-border bg-card p-10 text-center text-foreground/40">Cargando datos de la clase...</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link to="/admin/clases" className="mt-1 p-1.5 text-foreground/30 hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Editar Clase</h1>
          <p className="text-sm text-foreground/50 mt-0.5">Modificá los datos de la clase.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">

          {/* ── IZQUIERDA ── */}
          <div className="border border-border divide-y divide-border">

            <div className="p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Nombre de la clase *</label>
              <input type="text" value={formData.nombre} onChange={e => set("nombre", e.target.value)}
                placeholder="Ej: WOD Competitivo" className={errors.nombre ? fieldError : field} />
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

            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block">Publicar rutina</label>
                  <p className="text-xs text-foreground/60 mt-0.5">La clase siempre es reservable. La rutina se revela cuando vos decidas.</p>
                </div>
                <button type="button"
                  onClick={() => { setPublicarProgramado(!publicarProgramado); set("publicarFecha", ""); set("publicarHora", "") }}
                  className={`shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                    publicarProgramado
                      ? "border-primary/30 text-primary bg-primary/5"
                      : "border-border text-foreground/25 hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {publicarProgramado ? <><Eye className="h-3 w-3" />Programada</> : <><EyeOff className="h-3 w-3" />Inmediata</>}
                </button>
              </div>
              {publicarProgramado && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-foreground/60 mb-1.5">Fecha</p>
                      <DateSelect value={formData.publicarFecha} onChange={v => set("publicarFecha", v)} />
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground/60 mb-1.5">Hora</p>
                      <TimeSelect value={formData.publicarHora} onChange={v => set("publicarHora", v)} />
                    </div>
                  </div>
                  {resumenPublicacion && <p className="text-xs text-primary">Rutina visible desde el {resumenPublicacion}</p>}
                </div>
              )}
            </div>
          </div>

          {/* ── DERECHA ── */}
          <div className="border border-border divide-y divide-border sticky top-6 self-start">

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Plan / Categoría</label>
              <select value={formData.idPlan ?? ""} onChange={e => set("idPlan", e.target.value ? parseInt(e.target.value) : null)}
                style={{ colorScheme: "dark" }}
                className="w-full bg-card border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors">
                <option value="">Sin plan asignado</option>
                {planes.map(p => <option key={p.idPlan} value={p.idPlan}>{p.nombre}</option>)}
              </select>
            </div>

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Coach *</label>
              <select value={formData.idProfesor} onChange={e => set("idProfesor", e.target.value)}
                disabled={loadingProfesores} style={{ colorScheme: "dark" }}
                className={`w-full bg-card border ${errors.idProfesor ? "border-red-500/50" : "border-border"} text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors`}>
                <option value="">{loadingProfesores ? "Cargando..." : "Seleccionar..."}</option>
                {profesores.map(p => <option key={p.idProfesor} value={p.idProfesor}>{p.nombreProfesor}</option>)}
              </select>
              {errors.idProfesor && <p className="mt-1.5 text-xs text-red-400">{errors.idProfesor}</p>}
            </div>

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Estado</label>
              <select value={formData.estado} onChange={e => set("estado", e.target.value)}
                style={{ colorScheme: "dark" }}
                className="w-full bg-card border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Cupo máximo *</label>
              <input type="number" min="1" max="20" value={formData.capacidadMaxima}
                onChange={e => set("capacidadMaxima", e.target.value)}
                className={errors.capacidadMaxima ? fieldError : field} />
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
              {dur && !errors.horario && <p className="mt-1.5 text-[10px] text-foreground/60">{dur} min de duración</p>}
            </div>

            <div className="p-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Días *</label>
              <div className="grid grid-cols-3 gap-1">
                {DIAS.map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => toggleDia(key)}
                    className={`py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                      formData.diasSemana.includes(key)
                        ? "border-lime-400/40 bg-lime-400/10 text-lime-400"
                        : "border-border text-foreground/30 hover:text-foreground hover:border-foreground/20"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {errors.diasSemana && <p className="mt-2 text-xs text-red-400">{errors.diasSemana}</p>}
            </div>

            <div className="p-4 space-y-2">
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-xs py-3 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
              <Link to="/admin/clases"
                className="block w-full text-center border border-border py-2.5 text-xs font-bold uppercase tracking-widest text-foreground/30 hover:text-foreground hover:border-foreground/20 transition-colors">
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
