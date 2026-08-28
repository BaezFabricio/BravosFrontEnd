import { useEffect, useState } from "react"
import { Calendar as CalendarIcon, ClipboardCheck, Clock, Users, CheckCircle2, XCircle, Dumbbell, ChevronRight, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/api"
import { toast } from '@/lib/notificar'
import { GymLoader } from "@/components/GymLoader"

function getInitials(name = "") {
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

export default function ProfesorDashboard() {
  const [fecha, setFecha] = useState(new Date())
  const [actividades, setActividades] = useState([])
  const [actividad, setActividad] = useState("")
  const [horarios, setHorarios] = useState([])
  const [horarioSeleccionado, setHorarioSeleccionado] = useState("")
  const [alumnos, setAlumnos] = useState([])
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)

  const actividadObj = actividades.find(a => String(a.idClase) === actividad)
  const presentes = alumnos.filter(a => a.asistencia === "presente").length
  const ausentes = alumnos.filter(a => a.asistencia === "ausente").length
  const pendientes = alumnos.filter(a => a.asistencia !== "presente" && a.asistencia !== "ausente").length
  const pct = alumnos.length > 0 ? Math.round((presentes / alumnos.length) * 100) : 0

  useEffect(() => {
    apiClient.get("/profesores/mis-clases")
      .then(res => setActividades(res.data?.data || []))
      .catch(err => console.error("Error al cargar clases:", err))
  }, [])

  useEffect(() => {
    setHorarioSeleccionado("")
    setHorarios([])
    setCheckedIn(false)
    setAlumnos([])
    if (!actividad) return
    apiClient.get(`/profesores/clases/${actividad}/horarios`)
      .then(res => setHorarios(res.data?.data || []))
      .catch(err => console.error("Error al cargar horarios:", err))
  }, [actividad])

  async function marcarAsistencia(idReserva, estado) {
    try {
      await apiClient.put(`/profesores/asistencias/${idReserva}`, { estado })
      setAlumnos(prev => prev.map(a => a.idReserva === idReserva ? { ...a, asistencia: estado } : a))
      toast.success(estado === "presente" ? "Asistencia confirmada" : "Inasistencia registrada")
    } catch {
      toast.error("No se pudo guardar la asistencia")
    }
  }

  async function handleCheckIn() {
    if (!actividad) { toast.error("Seleccioná una actividad"); return }
    if (!horarioSeleccionado) { toast.error("Seleccioná un horario"); return }
    setLoading(true)
    const fechaISO = fecha.toISOString().split("T")[0]
    try {
      const response = await apiClient.get(
        `/profesores/clases/${actividad}/alumnos?fecha=${fechaISO}&idHorario=${horarioSeleccionado}`
      )
      const data = response.data.data || response.data
      setAlumnos(Array.isArray(data) ? data : [])
      setCheckedIn(true)
    } catch {
      toast.error("Error al cargar los alumnos")
    } finally {
      setLoading(false)
    }
  }

  const horarioObj = horarios.find(h => String(h.idHorario) === horarioSeleccionado)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Registro de Asistencia
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Tomá lista de tus alumnos marcando presentes y ausentes
          </p>
        </div>
        {checkedIn && alumnos.length > 0 && (
          <div className="sm:text-right ml-10 sm:ml-0">
            <p className="text-3xl font-black text-primary">{pct}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">asistencia</p>
          </div>
        )}
      </div>

      {/* PANEL DE FILTROS */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-secondary px-6 py-3 flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">Configurar Clase</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* FECHA */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" /> Fecha
              </label>
              <input
                type="date"
                value={fecha ? fecha.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const val = e.target.value
                  if (!val) return
                  setFecha(new Date(val + "T00:00:00"))
                  setCheckedIn(false)
                  setAlumnos([])
                }}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* ACTIVIDAD */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5" /> Actividad
              </label>
              <Select onValueChange={v => { setActividad(v); setCheckedIn(false); setAlumnos([]) }}>
                <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Seleccionar clase..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {actividades.map(a => (
                    <SelectItem key={a.idClase} value={String(a.idClase)}>
                      {a.categoria || a.nombreClase}
                      {a.dias ? ` · ${a.dias}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* HORARIO */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Horario
              </label>
              <Select
                value={horarioSeleccionado}
                onValueChange={v => { setHorarioSeleccionado(v); setCheckedIn(false); setAlumnos([]) }}
                disabled={!actividad || horarios.length === 0}
              >
                <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                  <SelectValue placeholder={actividad ? "Seleccionar..." : "Elegí una actividad"} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {horarios.map(h => (
                    <SelectItem key={h.idHorario} value={String(h.idHorario)}>
                      {h.dia} · {h.horaInicio?.slice(0, 5)} – {h.horaFin?.slice(0, 5)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleCheckIn}
              disabled={loading || !actividad || !horarioSeleccionado}
              className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading
                ? <span className="animate-pulse">Cargando...</span>
                : <><ClipboardCheck className="h-4 w-4" /> Tomar Lista <ChevronRight className="h-4 w-4" /></>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ESTADO: sin check-in */}
      {!checkedIn && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary/50" />
          </div>
          <p className="font-semibold text-foreground">Ninguna lista abierta</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Seleccioná la fecha, actividad y horario, luego presioná <span className="text-primary font-semibold">Tomar Lista</span> para ver los alumnos reservados.
          </p>
        </div>
      )}

      {/* LISTA DE ALUMNOS */}
      {checkedIn && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Header de la lista */}
          <div className="border-b border-border bg-secondary px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-black uppercase tracking-wide text-foreground text-sm">
                {actividadObj?.categoria || actividadObj?.nombreClase || "Clase"}
              </p>
              {horarioObj && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {horarioObj.dia} · {horarioObj.horaInicio?.slice(0,5)} – {horarioObj.horaFin?.slice(0,5)} · {fecha.toLocaleDateString("es-AR")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-lime-400" />
                <span className="font-bold text-foreground">{presentes}</span>
                <span className="text-muted-foreground text-xs">pres.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-bold text-foreground">{ausentes}</span>
                <span className="text-muted-foreground text-xs">aus.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="font-bold text-foreground">{pendientes}</span>
                <span className="text-muted-foreground text-xs">pend.</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          {alumnos.length > 0 && (
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progreso de lista</span>
                <span className="font-semibold text-foreground">{presentes + ausentes} / {alumnos.length} registrados</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${alumnos.length > 0 ? ((presentes + ausentes) / alumnos.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Sin alumnos */}
          {alumnos.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-semibold text-muted-foreground">Sin reservas para esta clase</p>
              <p className="text-xs text-muted-foreground">Nadie reservó esta clase en la fecha seleccionada.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alumnos.map((a, i) => {
                const isPresente = a.asistencia === "presente"
                const isAusente = a.asistencia === "ausente"
                return (
                  <div
                    key={a.idReserva}
                    className={`flex items-center justify-between px-4 sm:px-6 py-3 transition-colors gap-3 ${
                      isPresente ? "bg-lime-400/5" : isAusente ? "bg-red-500/5" : "hover:bg-secondary/50"
                    }`}
                  >
                    {/* Avatar + nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isPresente
                          ? "bg-lime-400/20 text-lime-400"
                          : isAusente
                          ? "bg-red-500/20 text-red-400"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {getInitials(a.nombrecompleto)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{a.nombrecompleto}</p>
                        <p className="text-xs text-muted-foreground">#{i + 1}</p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPresente || isAusente ? (
                        <>
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${
                            isPresente
                              ? "bg-lime-400 text-black"
                              : "bg-red-500 text-foreground"
                          }`}>
                            {isPresente
                              ? <><CheckCircle2 className="h-3 w-3" /> <span className="hidden sm:inline">Presente</span> ✓</>
                              : <><XCircle className="h-3 w-3" /> <span className="hidden sm:inline">Ausente</span> ✓</>
                            }
                          </span>
                          <button
                            onClick={() => setAlumnos(prev => prev.map(al => al.idReserva === a.idReserva ? { ...al, asistencia: null } : al))}
                            className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                          >
                            Cambiar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => marcarAsistencia(a.idReserva, "presente")}
                            className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold border border-border text-muted-foreground hover:border-lime-400 hover:text-lime-400 hover:bg-lime-400/5 transition-all"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Presente</span>
                          </button>
                          <button
                            onClick={() => marcarAsistencia(a.idReserva, "ausente")}
                            className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold border border-border text-muted-foreground hover:border-red-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ausente</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer resumen */}
          {alumnos.length > 0 && (
            <div className="border-t border-border bg-secondary/50 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{alumnos.length} alumnos en esta clase</span>
              </div>
              <span className="text-xs font-bold text-primary">{pct}% de asistencia</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
