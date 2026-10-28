import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, Check, Minus, Plus, Pencil, Users, Clock, CalendarDays, Mail, Dumbbell, Power } from "lucide-react"
import { toast } from '@/lib/notificar'
import { AdminFormSkeleton } from "@/components/AdminPageSkeleton"
import RichTextEditor from "@/components/RichTextEditor"
import { Cargando } from '@/components/Cargando'
import { TituloPagina } from "@/components/TituloPagina"

// La descripción se guarda como JSON {desc, rutina}; las clases viejas tienen texto plano
// o los ejercicios como lista
function leerRutina(rutina) {
  const raw = rutina?.descripcion || ""
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.rutina !== "undefined") return { descripcion: parsed.desc || "", rutina: parsed.rutina || "" }
  } catch { /* texto plano */ }
  const ejercicios = Array.isArray(rutina?.ejercicios)
    ? rutina.ejercicios.map(e => e.nombre).join("\n")
    : (typeof rutina?.ejercicios === "string" ? rutina.ejercicios : "")
  return { descripcion: raw, rutina: ejercicios }
}

// La hora del aviso se guarda tal cual se eligió, en hora de Argentina (el servidor compara contra esa misma hora).
// Antes se mandaba convertida a UTC y el aviso salía 3 horas tarde. Nunca usar toISOString() para esto.
const dos = (n) => String(n).padStart(2, "0")
function horaLocalComoTexto(d) {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())} ${dos(d.getHours())}:${dos(d.getMinutes())}:00`
}

// Del servidor llega la misma fecha (como texto o como instante): se muestra en el campo datetime-local
function avisoLocal(fecha) {
  if (!fecha) return ""
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`
}

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
  { nombre: "Noche",    horaInicio: "17:00", horaFin: "24:00" }, // hasta la medianoche: las clases de las 22 y 23 horas también son del turno noche
]

// De las 05 a las 23 horas (antes llegaba solo hasta las 22 y no se podían cargar clases de noche)
const HORAS = Array.from({ length: 19 }, (_, i) => String(i + 5).padStart(2, "0"))
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

/*
 * Horarios de los turnos del box (se administran en Clases > Turnos), para elegir el de la clase con un toque en vez de
 * escribir la hora. Se muestran los del tipo de clase elegido (CrossFit, Planificación Atleta…), agrupados por turno.
 * Elegir uno completa la hora de inicio y de fin (y el turno); igual se pueden cambiar a mano más abajo.
 */
function HorariosDeTurno({ tipoPlan, horaInicio, horaFin, onElegir, compacto = false }) {
  const [lista, setLista] = useState(null) // null = cargando

  useEffect(() => {
    if (!tipoPlan) return
    let vigente = true
    fetch(`/api/vv1/turnos/horarios?tipoPlan=${encodeURIComponent(tipoPlan)}`)
      .then(r => r.json())
      .then(r => { if (vigente) setLista(Array.isArray(r.data) ? r.data : []) })
      .catch(() => { if (vigente) setLista([]) })
    return () => { vigente = false }
  }, [tipoPlan])

  if (!tipoPlan) return <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-foreground/60">Elegí primero el tipo de clase para ver los horarios del box.</p>
  if (lista === null) return <p className="text-xs text-foreground/55">Cargando horarios…</p>
  if (lista.length === 0) return <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-foreground/60">Todavía no hay horarios cargados para este tipo de clase. Podés cargarlos en Clases &gt; Turnos o elegir la hora a mano acá abajo.</p>

  const grupos = []
  for (const h of lista) {
    let g = grupos.find(x => x.turno === h.turno)
    if (!g) { g = { turno: h.turno, horarios: [] }; grupos.push(g) }
    g.horarios.push(h)
  }
  // Lista desplegable, agrupada por turno. El valor es el horario que coincide con la hora de inicio y fin ya cargadas
  const elegido = lista.find(h => h.horaInicio === horaInicio && h.horaFin === horaFin)
  return (
    <select
      aria-label="Horarios del box"
      value={elegido ? String(elegido.idTurnoHorario) : ""}
      onChange={e => {
        const h = lista.find(x => String(x.idTurnoHorario) === e.target.value)
        if (h) onElegir(h)
      }}
      className={`w-full cursor-pointer rounded-lg border border-border bg-card px-3 text-sm font-bold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${compacto ? "min-h-[40px]" : "min-h-[44px]"}`}
    >
      {!elegido && <option value="">Elegí un horario del box</option>}
      {grupos.map(g => (
        <optgroup key={g.turno} label={`Turno ${g.turno.toLowerCase()}`}>
          {g.horarios.map(h => (
            <option key={h.idTurnoHorario} value={h.idTurnoHorario}>
              {h.horaInicio} – {h.horaFin}{h.etiqueta ? ` · ${h.etiqueta}` : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

// Selector de hora: HH : MM
function TimeSelect({ value, onChange, hasError }) {
  const [hh, mm] = value ? value.split(":") : ["", ""]

  const handleH = (h) => onChange(h ? `${h}:${mm || "00"}` : "")
  const handleM = (m) => onChange(m ? `${hh || "05"}:${m}` : "")

  const selectClass = "flex-1 bg-card text-sm text-foreground px-2 py-2 outline-none appearance-none text-center cursor-pointer border-0"

  return (
    <div
      className={`flex items-center border bg-card ${hasError ? "border-red-600/50 dark:border-red-500/50" : "border-border"}`}
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

// Fecha y hora del aviso a los alumnos: dos listas (día/mes/año y hora/minutos), sin escribir en un campo de fecha.
// El valor sale como "AAAA-MM-DDTHH:mm" (hora de Argentina) o vacío si falta algo (vacío = se envía apenas se guarda).
function AvisoFechaHora({ value, onChange }) {
  const [fecha, setFecha] = useState(value ? value.slice(0, 10) : "")
  const [hora, setHora] = useState(value ? value.slice(11, 16) : "")

  const emitir = (f, h) => onChange(f && h ? `${f}T${h}` : "")
  const elegirDia = (f) => { setFecha(f); emitir(f, hora) }
  const elegirHora = (h) => { setHora(h); emitir(fecha, h) }

  let resumen = "Se envía apenas guardes la clase."
  if (fecha && hora) {
    const d = new Date(`${fecha}T12:00:00`)
    resumen = `Se envía el ${d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las ${hora} hs.`
  } else if (fecha) resumen = "Falta elegir la hora."
  else if (hora) resumen = "Falta elegir el día."

  return (
    <div className="space-y-3">
      <DateSelect value={fecha} onChange={elegirDia} />
      <TimeSelect value={hora} onChange={elegirHora} />
      <p className="text-xs font-semibold text-lime-700 dark:text-lime-400">{resumen}</p>
    </div>
  )
}

// Crear y editar una clase usan esta misma pantalla: con :id en la ruta, edita
export default function NuevaClasePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const [searchParams] = useSearchParams()
  const tipoDesdeUrl = esEdicion ? "" : (searchParams.get("tipo") || "")

  const [cargandoClase, setCargandoClase] = useState(esEdicion)
  const [isLoading, setIsLoading]     = useState(false)
  const [errors, setErrors]           = useState({})
  const [profesores, setProfesores]   = useState([])
  const [loadingProfesores, setLoadingProfesores] = useState(true)
  const [tipos, setTipos]             = useState([])
  const [publicarProgramado, setPublicarProgramado] = useState(false)

  const [esClaseUnica, setEsClaseUnica] = useState(true) // las clases son siempre de un solo día (ya no hay clases que se repiten)

  const [formData, setFormData] = useState({
    nombre: "",
    tipoPlan: tipoDesdeUrl,
    horaInicio: "",
    horaFin: "",
    idProfesor: "",
    capacidadMaxima: "15",
    diasSemana: [],
    fechaEspecifica: "",
    descripcion: "",
    rutina: "",
    publicarDatetime: "",
    estado: "Activo",
  })

  // Al corregir un campo se borra su error (el nombre del error a veces es otro: horario, días)
  const ERROR_DE = { horaInicio: "horario", horaFin: "horario", fechaEspecifica: "diasSemana" }
  // Turno del horario elegido de la lista del box (Mañana, Siesta, Noche…). Si después se cambia la hora a mano, se vuelve a calcular.
  const [turnoDeLista, setTurnoDeLista] = useState(null)
  const set = (campo, valor) => {
    if (campo === 'horaInicio' || campo === 'horaFin' || campo === 'tipoPlan') setTurnoDeLista(null)
    setFormData(prev => ({ ...prev, [campo]: valor }))
    setErrors(prev => {
      const clave = ERROR_DE[campo] || campo
      if (!prev[clave]) return prev
      const { [clave]: _, ...resto } = prev // eslint-disable-line no-unused-vars
      return resto
    })
  }

  useEffect(() => {
    const storedPermisos = localStorage.getItem("permisos")
    let tieneAcceso = false
    if (storedPermisos) {
      try { if (JSON.parse(storedPermisos).includes(esEdicion ? "clases:modificacion" : "clases:alta")) tieneAcceso = true }
      catch (err) { console.error(err) }
    }
    if (!tieneAcceso) { navigate("/admin/clases"); return }

    const headers = { "Content-Type": "application/json" }

    // Al editar: se cargan los datos de la clase antes de mostrar el formulario
    if (esEdicion) {
      fetch(`/api/vv1/clases/${id}`, { headers })
        .then(r => r.json())
        .then(r => {
          if (!r.success) throw new Error(r.message || "No se encontró la clase")
          const c = r.data
          const { descripcion, rutina } = leerRutina(c.rutina)
          const aviso = avisoLocal(c.fechaPublicacion)
          setEsClaseUnica(Boolean(c.fechaEspecifica))
          setPublicarProgramado(Boolean(aviso))
          setFormData({
            nombre: c.nombreClase || "",
            tipoPlan: c.tipoPlan || "",
            horaInicio: c.horaInicio ? c.horaInicio.substring(0, 5) : "",
            horaFin: c.horaFin ? c.horaFin.substring(0, 5) : "",
            idProfesor: c.idProfesor ? String(c.idProfesor) : "",
            // El límite real de reservas es cupoMaximo
            capacidadMaxima: String(Number(c.cupoMaximo) || 15),
            diasSemana: c.fechaEspecifica || !c.diasSemana ? [] : c.diasSemana.split(",").map(d => d.trim()),
            fechaEspecifica: c.fechaEspecifica || "",
            descripcion,
            rutina,
            publicarDatetime: aviso,
            estado: c.estado || "Activo",
          })
        })
        .catch(err => { toast.error("No se pudo cargar la clase", { description: err.message }); navigate("/admin/clases") })
        .finally(() => setCargandoClase(false))
    }

    fetch("/api/vv1/profesores", { headers })
      .then(r => r.json())
      .then(r => { if (r.success) setProfesores(r.data) })
      .catch(err => toast.error("Error al cargar profesores", { description: err.message }))
      .finally(() => setLoadingProfesores(false))

    fetch("/api/vv1/tipos-clase", { headers })
      .then(r => r.json())
      .then(r => setTipos(r.data || []))
      .catch(err => console.error("Error al cargar los tipos de clase:", err))
  }, [navigate, esEdicion, id])

  const elegirHorarioDeLista = (h) => {
    setFormData(prev => ({ ...prev, horaInicio: h.horaInicio, horaFin: h.horaFin }))
    setTurnoDeLista(h.turno)
    setErrors(prev => { if (!prev.horario) return prev; const { horario: _, ...resto } = prev; return resto }) // eslint-disable-line no-unused-vars
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
    if (!formData.tipoPlan) e.tipoPlan = "Elegí el tipo de clase"
    if (!formData.horaInicio) e.horario = "Seleccioná hora de inicio"
    if (!formData.horaFin) e.horario = "Seleccioná hora de fin"
    if (formData.horaInicio && formData.horaFin && formData.horaInicio >= formData.horaFin)
      e.horario = "La hora de fin debe ser posterior al inicio"
    if (!formData.capacidadMaxima || parseInt(formData.capacidadMaxima) <= 0) e.capacidadMaxima = "Debe ser mayor a 0"
    if (parseInt(formData.capacidadMaxima) > 1000) e.capacidadMaxima = "Revisá el número: es demasiado alto"
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
    await crearClase()
  }

  const crearClase = async () => {
    setIsLoading(true)
    try {
      const turnoSeleccionado = turnoDeLista
        ? { nombre: turnoDeLista }
        : (TURNOS.find(t => formData.horaInicio >= t.horaInicio && formData.horaInicio < t.horaFin) || TURNOS[0])

      // Aviso activado: en la fecha elegida o, si no se eligió ninguna, apenas se guarda la clase.
      // "Ahora" va redondeado al minuto (segundos en 00): así, al volver a editar y guardar, la fecha es la misma y no se reenvía el aviso.
      const fechaPublicacion = publicarProgramado
        ? horaLocalComoTexto(formData.publicarDatetime ? new Date(formData.publicarDatetime) : new Date())
        : null

      const payload = {
        nombreClase: formData.nombre,
        tipoClase: "Grupal",
        cupoMaximo: parseInt(formData.capacidadMaxima),
        cupoDisponible: parseInt(formData.capacidadMaxima),
        estado: formData.estado,
        idGimnasio: 1,
        idProfesor: parseInt(formData.idProfesor),
        ...(esClaseUnica
          ? { fechaEspecifica: formData.fechaEspecifica }
          : { diasSemana: formData.diasSemana }
        ),
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        turno: turnoSeleccionado.nombre,
        tipoPlan: formData.tipoPlan,
        fechaPublicacion,
        rutina: {
          descripcion: formData.descripcion,
          ejercicios: formData.rutina,
        },
      }

      const response = await fetch(esEdicion ? `/api/vv1/clases/${id}` : "/api/vv1/clases", {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message || (esEdicion ? "Error al guardar la clase" : "Error al crear la clase"))
      toast.success(esEdicion ? "Cambios guardados" : "Clase creada exitosamente", { guardar: esEdicion })
      navigate("/admin/clases")
    } catch (error) {
      toast.error(esEdicion ? "No se guardaron los cambios" : "Error al crear la clase", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const tipoSeleccionado = tipos.find(t => t.codigo === formData.tipoPlan)
  // Se ofrecen los tipos activos; una clase que ya tenía un tipo desactivado lo conserva
  const opcionesTipo = tipos.filter(t => t.activo || t.codigo === formData.tipoPlan)
  const dur = duracionMinutos()

  // ── CELULAR: la clase se arma en 4 pasos (sin scroll largo) ──
  const PASOS = ["Coach", "WOD", "Horario", "Listo"]
  const [paso, setPaso] = useState(0)
  const [versionRutina, setVersionRutina] = useState(0) // el editor lee el contenido al abrirse: se reabre al agregar un bloque
  const turnoDe = (hora) => turnoDeLista || (TURNOS.find(t => hora >= t.horaInicio && hora < t.horaFin) || TURNOS[0]).nombre
  const profesorSel = profesores.find(p => String(p.idProfesor) === String(formData.idProfesor))
  const inicialesDe = (n = "") => n.trim().split(/\s+/).slice(0, 2).map(x => x[0] || "").join("").toUpperCase() || "?"
  const tipoPlan = tipoSeleccionado?.nombre || null

  // Cada paso se valida antes de avanzar: el error aparece donde está
  const validarPaso = (n) => {
    const e = {}
    if (n === 0) {
      if (!formData.nombre.trim()) e.nombre = "Poné un nombre para la clase"
      if (!formData.idProfesor) e.idProfesor = "Elegí el coach"
      if (!formData.tipoPlan) e.tipoPlan = "Elegí el tipo de clase"
    }
    if (n === 2) {
      if (!formData.horaInicio || !formData.horaFin) e.horario = "Elegí la hora de inicio y de fin"
      else if (formData.horaInicio >= formData.horaFin) e.horario = "La hora de fin debe ser posterior al inicio"
      const cupo = parseInt(formData.capacidadMaxima)
      if (!cupo || cupo <= 0) e.capacidadMaxima = "Debe ser mayor a 0"
      else if (cupo > 1000) e.capacidadMaxima = "Revisá el número: es demasiado alto"
      if (esClaseUnica ? !formData.fechaEspecifica : formData.diasSemana.length === 0)
        e.diasSemana = esClaseUnica ? "Elegí la fecha de la clase" : "Elegí al menos un día"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const continuar = () => { if (validarPaso(paso)) { setPaso(p => Math.min(p + 1, 3)); window.scrollTo({ top: 0, behavior: "smooth" }) } }
  const atras = () => { setErrors({}); setPaso(p => Math.max(p - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const irAPaso = (n) => { setErrors({}); setPaso(n); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const crearDesdePasos = async () => { if (validate()) await crearClase(); else toast.error("Revisá los datos de la clase") }

  // Bloques que se agregan a la rutina con un toque
  const BLOQUES = [
    { label: "Warm Up", html: "<p><strong>WARM UP:</strong> </p>" },
    { label: "Fuerza", html: "<p><strong>FUERZA:</strong> </p>" },
    { label: "AMRAP", html: "<p><strong>AMRAP</strong> (min): </p>" },
    { label: "For Time", html: "<p><strong>FOR TIME:</strong> </p>" },
  ]
  const agregarBloque = (html) => { set("rutina", (formData.rutina || "") + html); setVersionRutina(v => v + 1) }
  const bloquesRutina = (formData.rutina.match(/<p>|<li>|<h[23]>/g) || []).length

  const caja = "rounded-2xl border border-border bg-card p-4"
  const titulo = "flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground"
  const errorTxt = (m) => m && <p className="mt-2 text-xs text-red-700 dark:text-red-400">{m}</p>

  const field = "w-full bg-transparent border border-border text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none focus:border-foreground/40 transition-colors"
  const fieldError = "w-full bg-transparent border border-red-600/50 dark:border-red-500/50 text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none focus:border-red-600 dark:focus:border-red-400 transition-colors"

  if (cargandoClase) return <AdminFormSkeleton />

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <BotonVolver a="/admin/clases" texto="Volver" />
      <div className="flex items-start gap-4">
        <div>
          <TituloPagina descripcion={tipoSeleccionado ? `Tipo de clase: ${tipoSeleccionado.nombre}` : esEdicion ? "Modificá los datos de la clase" : "Completá los campos para registrar la clase"}>{esEdicion ? "Editar clase" : "Nueva Clase"}</TituloPagina>
        </div>
      </div>

      {/* ── CELULAR: 4 pasos ── */}
      <div className="space-y-4 lg:hidden">
        {/* Progreso */}
        <div className={caja}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Paso {paso + 1} de 4</p>
            {tipoSeleccionado && (
              <span className="truncate rounded-md border border-border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/65">{tipoSeleccionado.nombre}</span>
            )}
          </div>
          <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label={esEdicion ? "Pasos para editar la clase" : "Pasos para crear la clase"}>
            {PASOS.map((nombre, i) => (
              <li key={nombre} aria-current={i === paso ? "step" : undefined}>
                <span className={`block h-1.5 rounded-full ${i <= paso ? "bg-lime-400" : "bg-foreground/10"}`} />
                <span className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${i < paso ? "text-lime-700 dark:text-lime-400" : i === paso ? "text-foreground" : "text-foreground/40"}`}>
                  {i < paso ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>}
                  {nombre}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* PASO 1 · Nombre y coach */}
        {paso === 0 && (
          <>
            {!tipoDesdeUrl && (
              <div className={caja}>
                <label htmlFor="m-plan-clase" className={titulo}>Tipo de clase</label>
                <select id="m-plan-clase" value={formData.tipoPlan} onChange={e => set("tipoPlan", e.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-lime-500">
                  <option value="" disabled>Elegí el tipo de clase</option>
                  {opcionesTipo.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
                </select>
                {errorTxt(errors.tipoPlan)}
                <p className="mt-2 text-xs text-foreground/55">La clase solo les aparece, y solo se avisa, a los alumnos con una membresía vigente de este tipo (de cualquier plan).</p>
              </div>
            )}
            <div className={caja}>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="m-nombre-clase" className={titulo}><Dumbbell className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Nombre de la clase</label>
                <span className="text-[10px] font-bold text-foreground/50">Obligatorio</span>
              </div>
              <input id="m-nombre-clase" type="text" value={formData.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: WOD Competitivo"
                className={`mt-3 h-12 w-full rounded-xl border bg-background/60 px-3 text-base text-foreground outline-none focus:border-lime-500 ${errors.nombre ? "border-red-500/60" : "border-border"}`} />
              <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["WOD Competitivo", "Open Box", "Fuerza", "Funcional"].map(n => (
                  <button key={n} type="button" onClick={() => set("nombre", n)}
                    className="min-h-[36px] shrink-0 rounded-full border border-border bg-background/60 px-3 text-xs font-bold text-foreground/75 hover:border-lime-500">
                    {n}
                  </button>
                ))}
              </div>
              {errorTxt(errors.nombre)}
            </div>

            <div className={caja}>
              <div className="flex items-center justify-between gap-2">
                <p className={titulo}><Users className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Coach asignado</p>
                {profesorSel && <span className="truncate text-xs font-bold text-lime-700 dark:text-lime-400">{profesorSel.nombreProfesor}</span>}
              </div>
              {loadingProfesores ? (
                <Cargando filas={2} className="py-2" />
              ) : profesores.length === 0 ? (
                <p className="mt-3 text-sm text-red-700 dark:text-red-400">No hay coaches cargados.</p>
              ) : (
                <div role="radiogroup" aria-label="Coach" className="mt-3 grid grid-cols-3 gap-2">
                  {profesores.map(p => {
                    const activo = String(p.idProfesor) === String(formData.idProfesor)
                    return (
                      <button key={p.idProfesor} type="button" role="radio" aria-checked={activo} onClick={() => set("idProfesor", String(p.idProfesor))}
                        className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-1 text-center transition-colors ${
                          activo ? "border-lime-500 bg-lime-400/10 dark:border-lime-400" : "border-border bg-background/60"
                        }`}>
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black ${activo ? "bg-lime-400 text-black" : "bg-foreground/10 text-foreground/70"}`}>{inicialesDe(p.nombreProfesor)}</span>
                        <span className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground">{p.nombreProfesor}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {errorTxt(errors.idProfesor)}
            </div>
          </>
        )}

        {/* PASO 2 · Descripción y rutina */}
        {paso === 1 && (
          <>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <p className="min-w-0 truncate text-sm font-bold text-foreground">{formData.nombre} <span className="font-normal text-foreground/55">· Coach {profesorSel?.nombreProfesor}</span></p>
              <button type="button" onClick={() => irAPaso(0)} className="flex shrink-0 items-center gap-1 text-xs font-bold text-lime-700 dark:text-lime-400"><Pencil className="h-3.5 w-3.5" /> Editar</button>
            </div>
            <div className={caja}>
              <p className={titulo}>Descripción <span className="text-[10px] font-bold normal-case tracking-normal text-foreground/50">(opcional)</span></p>
              <div className="mt-3">
                <RichTextEditor value={formData.descripcion} onChange={v => set("descripcion", v)} placeholder="De qué se trata la clase, para los alumnos..." minHeight={80} />
              </div>
            </div>
            <div className={caja}>
              <p className={titulo}>Estructura de la rutina</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BLOQUES.map(b => (
                  <button key={b.label} type="button" onClick={() => agregarBloque(b.html)}
                    className="flex min-h-[34px] items-center gap-1 rounded-full border border-lime-500/40 bg-lime-400/10 px-3 text-xs font-bold text-lime-700 dark:text-lime-400">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {b.label}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <RichTextEditor key={versionRutina} value={formData.rutina} onChange={v => set("rutina", v)} placeholder={"Calentamiento: ...\n\nEjercicio principal: ...\n\nMetcon: ..."} minHeight={170} />
              </div>
              <p className="mt-2 text-xs text-foreground/50">Opcional: la rutina se puede cargar o cambiar más tarde.</p>
            </div>
          </>
        )}

        {/* PASO 3 · Cupo, horario y frecuencia */}
        {paso === 2 && (
          <>
            <div className={caja}>
              <p className={titulo}><Users className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Cupo máximo</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <button type="button" aria-label="Un lugar menos" onClick={() => set("capacidadMaxima", String(Math.max(1, (parseInt(formData.capacidadMaxima) || 0) - 1)))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60 text-foreground"><Minus className="h-5 w-5" /></button>
                <p className="text-center"><span className="text-4xl font-black tabular-nums text-foreground">{formData.capacidadMaxima || 0}</span> <span className="text-xs font-bold uppercase text-foreground/55">alumnos</span></p>
                <button type="button" aria-label="Un lugar más" onClick={() => set("capacidadMaxima", String((parseInt(formData.capacidadMaxima) || 0) + 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60 text-foreground"><Plus className="h-5 w-5" /></button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[10, 12, 15, 20].map(n => (
                  <button key={n} type="button" onClick={() => set("capacidadMaxima", String(n))} aria-pressed={String(n) === String(formData.capacidadMaxima)}
                    className={`h-10 rounded-lg border text-sm font-bold ${String(n) === String(formData.capacidadMaxima) ? "border-lime-500 bg-lime-400 text-black" : "border-border bg-background/60 text-foreground/75"}`}>{n}</button>
                ))}
              </div>
              <p className="mt-2 text-xs text-foreground/50">Máximo 20 por clase.</p>
              {errorTxt(errors.capacidadMaxima)}
            </div>

            <div className={caja}>
              <div className="flex items-center justify-between gap-2">
                <p className={titulo}><Clock className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Horario</p>
                {dur && <span className="text-xs font-bold text-lime-700 dark:text-lime-400">{dur} min</span>}
              </div>
              <div className="mt-3">
                <HorariosDeTurno tipoPlan={formData.tipoPlan} horaInicio={formData.horaInicio} horaFin={formData.horaFin} onElegir={elegirHorarioDeLista} />
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-foreground/55">O elegí la hora a mano</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-foreground/55">Inicio</p>
                  <TimeSelect value={formData.horaInicio} onChange={v => set("horaInicio", v)} hasError={!!errors.horario && !formData.horaInicio} />
                  {formData.horaInicio && <p className="mt-1 text-[11px] font-semibold text-lime-700 dark:text-lime-400">Turno {turnoDe(formData.horaInicio).toLowerCase()}</p>}
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-foreground/55">Fin</p>
                  <TimeSelect value={formData.horaFin} onChange={v => set("horaFin", v)} hasError={!!errors.horario && !formData.horaFin} />
                </div>
              </div>
              {errorTxt(errors.horario)}
            </div>

            <div className={caja}>
              <p className={titulo}><CalendarDays className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> ¿Cuándo se dicta?</p>
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-foreground/55">Elegí la fecha</p>
                <DateSelect value={formData.fechaEspecifica} onChange={v => set("fechaEspecifica", v)} />
              </div>
              {errorTxt(errors.diasSemana)}
            </div>
          </>
        )}

        {/* PASO 4 · Revisión final */}
        {paso === 3 && (
          <>
            <div className={caja}>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
                <span className="h-2 w-2 rounded-full bg-lime-400" aria-hidden="true" /> {esEdicion ? "Revisá los cambios" : "¡Todo listo para publicar!"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tipoPlan && <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/65">{tipoPlan}</span>}
                {dur && <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/65">{dur} min</span>}
                <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/65">{esClaseUnica ? "Sesión única" : "Recurrente"}</span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <p className="text-lg font-black uppercase leading-tight text-foreground">{formData.nombre}</p>
                <button type="button" onClick={() => irAPaso(0)} className="flex shrink-0 items-center gap-1 text-xs font-bold text-lime-700 dark:text-lime-400"><Pencil className="h-3.5 w-3.5" /> Editar</button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { label: "Coach", valor: profesorSel?.nombreProfesor || "—", paso: 0 },
                  { label: "Cupo máximo", valor: `${formData.capacidadMaxima} alumnos`, paso: 2 },
                  { label: "Horario", valor: formData.horaInicio && formData.horaFin ? `${formData.horaInicio} – ${formData.horaFin}` : "—", sub: esClaseUnica ? formData.fechaEspecifica?.split("-").reverse().join("/") : DIAS.filter(d => formData.diasSemana.includes(d.key)).map(d => d.label).join(" · "), paso: 2 },
                  { label: "Rutina", valor: formData.rutina ? `${bloquesRutina} ${bloquesRutina === 1 ? "bloque" : "bloques"}` : "Sin rutina", paso: 1 },
                ].map(d => (
                  <button key={d.label} type="button" onClick={() => irAPaso(d.paso)} className="rounded-xl bg-foreground/5 px-3 py-2.5 text-left">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-foreground/50">{d.label}</span>
                    <span className="mt-0.5 block truncate text-sm font-bold text-foreground">{d.valor}</span>
                    {d.sub && <span className="block truncate text-[11px] text-foreground/55">{d.sub}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Estado de la clase (solo al editar: una clase nueva nace activa) */}
            {esEdicion && (
              <div className={caja}>
                <div className="flex items-center justify-between gap-2">
                  <p className={titulo} id="m-estado-clase"><Power className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Estado</p>
                  <span className="text-[11px] font-bold text-foreground/55">{formData.estado === "Activo" ? "Se puede reservar" : "No se puede reservar"}</span>
                </div>
                <div role="radiogroup" aria-labelledby="m-estado-clase" className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/60 p-1">
                  {[{ v: "Activo", t: "Activa" }, { v: "Inactivo", t: "Inactiva" }].map(({ v, t }) => (
                    <button key={v} type="button" role="radio" aria-checked={formData.estado === v} onClick={() => set("estado", v)}
                      className={`min-h-[40px] rounded-lg text-xs font-black uppercase tracking-wide ${formData.estado === v ? (v === "Activo" ? "bg-lime-400 text-black" : "bg-foreground/80 text-background") : "text-foreground/60"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso a los alumnos: email + notificación en el celular, en la fecha y hora que se elija (o ya, al guardar) */}
            <div className={caja}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={titulo}><Mail className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Avisar a los alumnos</p>
                  <p className="mt-1 text-xs leading-snug text-foreground/55">Les llega un email y una notificación en el celular a los alumnos activos para que reserven. Si no elegís fecha y hora, se envía apenas guardes la clase.</p>
                </div>
                <button type="button" role="switch" aria-checked={publicarProgramado} aria-label="Avisar por email"
                  onClick={() => { setPublicarProgramado(!publicarProgramado); set("publicarDatetime", "") }}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${publicarProgramado ? "bg-lime-400" : "bg-foreground/15"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${publicarProgramado ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              {publicarProgramado && (
                <div className="mt-3">
                  <AvisoFechaHora value={formData.publicarDatetime} onChange={(v) => set("publicarDatetime", v)} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Navegación entre pasos */}
        <div className="grid grid-cols-[auto_1fr] gap-3 pt-1">
          {paso > 0 ? (
            <button type="button" onClick={atras} className="flex h-12 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-black uppercase tracking-wide text-foreground">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
          ) : <span />}
          {paso < 3 ? (
            <button type="button" onClick={continuar} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black shadow-lg shadow-lime-500/20 hover:bg-lime-300">
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={crearDesdePasos} disabled={isLoading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black shadow-lg shadow-lime-500/20 hover:bg-lime-300 disabled:opacity-50">
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {esEdicion ? "Guardando..." : "Creando..."}</>
                : <><Check className="h-4 w-4" strokeWidth={3} /> {esEdicion ? "Guardar cambios" : "Crear clase"}</>}
            </button>
          )}
        </div>
      </div>

      {/* ── COMPUTADORA: el formulario completo ── */}
      <div className="hidden lg:block">
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
                {errors.nombre && <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors.nombre}</p>}
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block">Avisar a los alumnos</label>
                    <p className="text-xs text-foreground/60 mt-0.5">Les llega un email y una notificación en el celular cuando la clase esté lista para reservar. Sin fecha, se envía apenas guardes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPublicarProgramado(!publicarProgramado); set("publicarDatetime", "") }}
                    className={`shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                      publicarProgramado
                        ? "border-lime-500/40 text-lime-700 dark:text-lime-400 bg-lime-400/10"
                        : "border-border text-foreground/60 hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {publicarProgramado ? <><Eye className="h-3 w-3" />Programado</> : <><EyeOff className="h-3 w-3" />Sin aviso</>}
                  </button>
                </div>

                {publicarProgramado && (
                  <div className="space-y-2">
                    <AvisoFechaHora value={formData.publicarDatetime} onChange={(v) => set("publicarDatetime", v)} />
                  </div>
                )}
              </div>
            </div>

            {/* ── DERECHA: configuración ── */}
            <div className="border border-border divide-y divide-border sticky top-6 self-start">

              {(esEdicion || !tipoDesdeUrl) && (
                <div className="p-4 space-y-3">
                  <div>
                    <label htmlFor="d-plan-clase" className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Tipo de clase</label>
                    <select id="d-plan-clase" value={formData.tipoPlan} onChange={e => set("tipoPlan", e.target.value)} style={{ colorScheme: "dark" }}
                      className="w-full bg-card border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors">
                      <option value="" disabled>Elegí el tipo de clase</option>
                      {opcionesTipo.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
                    </select>
                    {errors.tipoPlan && <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors.tipoPlan}</p>}
                    <p className="mt-1.5 text-[10px] text-foreground/50">Solo los alumnos con una membresía vigente de este tipo ven la clase y reciben el aviso.</p>
                  </div>
                  <div>
                    <label htmlFor="d-estado-clase" className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Estado</label>
                    <select id="d-estado-clase" value={formData.estado} onChange={e => set("estado", e.target.value)} style={{ colorScheme: "dark" }}
                      className="w-full bg-card border border-border text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors">
                      <option value="Activo">Activa</option>
                      <option value="Inactivo">Inactiva</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="p-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Coach *</label>
                <select
                  value={formData.idProfesor}
                  onChange={e => set("idProfesor", e.target.value)}
                  disabled={loadingProfesores}
                  style={{ colorScheme: "dark" }}
                  className={`w-full bg-card border ${errors.idProfesor ? "border-red-600/50 dark:border-red-500/50" : "border-border"} text-sm text-foreground px-3 py-2 outline-none focus:border-foreground/40 transition-colors`}
                >
                  <option value="">{loadingProfesores ? "Cargando..." : "Seleccionar..."}</option>
                  {profesores.map(p => <option key={p.idProfesor} value={p.idProfesor}>{p.nombreProfesor}</option>)}
                </select>
                {errors.idProfesor && <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors.idProfesor}</p>}
              </div>

              <div className="p-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-2">Cupo máximo *</label>
                <input
                  type="number" min="1"
                  value={formData.capacidadMaxima}
                  onChange={e => set("capacidadMaxima", e.target.value)}
                  className={errors.capacidadMaxima ? fieldError : field}
                />
                {errors.capacidadMaxima && <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors.capacidadMaxima}</p>}
              </div>

              <div className="p-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block mb-3">Horario *</label>
                <div className="mb-3">
                  <HorariosDeTurno tipoPlan={formData.tipoPlan} horaInicio={formData.horaInicio} horaFin={formData.horaFin} onElegir={elegirHorarioDeLista} compacto />
                </div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-foreground/50">O elegí la hora a mano</p>
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
                {errors.horario && <p className="mt-1.5 text-[10px] text-red-700 dark:text-red-400">{errors.horario}</p>}
                {dur && !errors.horario && (
                  <p className="mt-1.5 text-[10px] text-foreground/60">{dur} min de duración</p>
                )}
              </div>

              <div className="p-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 block">¿Cuándo se dicta?</label>
                <div className="mt-3">
                  <p className="text-[10px] text-foreground/50 mb-1.5">Elegí la fecha *</p>
                  <DateSelect value={formData.fechaEspecifica} onChange={v => set("fechaEspecifica", v)} />
                </div>
                {errors.diasSemana && <p className="mt-2 text-xs text-red-700 dark:text-red-400">{errors.diasSemana}</p>}
              </div>

              <div className="p-4 space-y-2">
                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-xs py-3 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear Clase"}
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
    </div>
  )
}
