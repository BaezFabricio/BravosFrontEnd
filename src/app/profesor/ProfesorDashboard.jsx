import { useState, useMemo } from "react"
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  CheckCircle2,
  Check,
  X,
  Users,
  ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// 🟢 VARIABLES LOCALES AUTOCONTENIDAS (Evitan el error de importación en Vite)
const PROFESOR_ID_ACTUAL = 1;

const actividadesAsignadas = [
  {
    nombre: "Funcional",
    horarios: ["06:00 - 07:00", "08:00 - 09:00", "17:00 - 18:00", "19:00 - 20:00"]
  },
  {
    nombre: "WOD Intensivo",
    horarios: ["07:00 - 08:00", "18:00 - 19:00"]
  },
  {
    nombre: "Open Box",
    horarios: ["09:00 - 10:30", "21:00 - 22:30"]
  }
];

const mockAlumnos = [
  {
    id: 1,
    nombreCompleto: "Fabricio Luis Baez",
    dni: "42.123.456",
    plan: "Pase Libre",
    asistencia: null,
    profesorId: 1,
    actividad: "WOD Intensivo",
    horario: "18:00 - 19:00",
    fecha: "2026-06-08"
  },
  {
    id: 2,
    nombreCompleto: "Ricardo Gaston Plazas",
    dni: "38.987.654",
    plan: "3 Veces por Semana",
    asistencia: null,
    profesorId: 1,
    actividad: "WOD Intensivo",
    horario: "18:00 - 19:00",
    fecha: "2026-06-08"
  },
  {
    id: 3,
    nombreCompleto: "Lucas Alarcón",
    dni: "40.321.654",
    plan: "Pase Libre",
    asistencia: null,
    profesorId: 1,
    actividad: "WOD Intensivo",
    horario: "18:00 - 19:00",
    fecha: "2026-06-08"
  }
];

function formatFecha(date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function toISO(date) {
  return date.toISOString().split("T")[0]
}

export default function ProfesorDashboard() {
  const [fecha, setFecha] = useState(new Date(2026, 5, 8)) // Lunes 8 Jun 2026
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [actividad, setActividad] = useState("")
  const [horario, setHorario] = useState("")

  const [checkedIn, setCheckedIn] = useState(false)
  const [claseConfirmada, setClaseConfirmada] = useState(null)
  const [alumnos, setAlumnos] = useState([])

  const horariosDisponibles = useMemo(() => {
    const act = actividadesAsignadas.find((a) => a.nombre === actividad)
    return act ? act.horarios : []
  }, [actividad])

  const puedeCheckIn = actividad !== "" && horario !== ""

  function handleActividadChange(value) {
    setActividad(value)
    setHorario("") 
    setCheckedIn(false)
  }

  function handleCheckIn() {
    if (!puedeCheckIn) return

    const fechaISO = toISO(fecha)
    const inscriptos = mockAlumnos.filter(
      (a) =>
        a.profesorId === PROFESOR_ID_ACTUAL &&
        a.actividad === actividad &&
        a.horario === horario &&
        a.fecha === fechaISO,
    )

    setAlumnos(inscriptos.map((a) => ({ ...a, asistencia: null })))
    setClaseConfirmada({ fecha: formatFecha(fecha), actividad, horario })
    setCheckedIn(true)
  }

  function marcarAsistencia(id, estado) {
    setAlumnos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, asistencia: estado } : a)),
    )
  }

  const totalPresentes = alumnos.filter((a) => a.asistencia === "presente").length
  const totalAusentes = alumnos.filter((a) => a.asistencia === "ausente").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          Registro de Asistencia
        </h1>
        <p className="text-muted-foreground">
          Seleccioná fecha, actividad y horario, luego hacé Check-In para tomar lista.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Fecha
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-secondary border-border font-normal capitalize"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatFecha(fecha)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(d) => {
                      if (d) {
                        setFecha(d)
                        setCheckedIn(false)
                      }
                      setCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Actividad
              </label>
              <Select value={actividad} onValueChange={handleActividadChange}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <Dumbbell className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Seleccionar actividad" />
                </SelectTrigger>
                <SelectContent>
                  {actividadesAsignadas.map((a) => (
                    <SelectItem key={a.nombre} value={a.nombre}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Horario
              </label>
              <Select value={horario} onValueChange={setHorario} disabled={!actividad}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={actividad ? "Seleccionar horario" : "Elegí una actividad"} />
                </SelectTrigger>
                <SelectContent>
                  {horariosDisponibles.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCheckIn}
              disabled={!puedeCheckIn}
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold lg:w-auto w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Check-In
            </Button>
          </div>
        </CardContent>
      </Card>

      {checkedIn && claseConfirmada && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Alumnos inscriptos ({alumnos.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {claseConfirmada.actividad} · {claseConfirmada.horario} · {claseConfirmada.fecha}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {totalPresentes} presentes
                </Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  {totalAusentes} ausentes
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Alumno</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">DNI</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No hay alumnos inscriptos en esta clase para la fecha seleccionada.
                      </td>
                    </tr>
                  ) : (
                    alumnos.map((a) => (
                      <tr key={a.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{a.nombreCompleto}</p>
                          <p className="text-sm text-muted-foreground sm:hidden">{a.dni}</p>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-foreground">{a.dni}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="border-border">
                            {a.plan}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {a.asistencia === "presente" && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Presente
                            </Badge>
                          )}
                          {a.asistencia === "ausente" && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                              Ausente
                            </Badge>
                          )}
                          {a.asistencia === null && (
                            <span className="text-sm text-muted-foreground">Sin marcar</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={a.asistencia === "presente" ? "default" : "outline"}
                              onClick={() => marcarAsistencia(a.id, "presente")}
                              className={a.asistencia === "presente" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border"}
                            >
                              <Check className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Presente</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={a.asistencia === "ausente" ? "default" : "outline"}
                              onClick={() => marcarAsistencia(a.id, "ausente")}
                              className={a.asistencia === "ausente" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border-border"}
                            >
                              <X className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Ausente</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!checkedIn && (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Seleccioná fecha, actividad y horario, luego presioná{" "}
              <span className="font-semibold text-foreground">Check-In</span> para ver los alumnos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}