import { useEffect, useMemo, useState } from "react"
import { Clock, User, ChevronLeft, ChevronRight, Loader2, AlertCircle, ChevronDown, Lock, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from '@/lib/notificar'
import apiClient from "@/api"

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const mapaDiasBD = { 0: "DOMINGO", 1: "LUNES", 2: "MARTES", 3: "MIERCOLES", 4: "JUEVES", 5: "VIERNES", 6: "SABADO" }

const TURNOS = [
  { id: "manana", label: "Mañana",  desde: "05:00", hasta: "12:00" },
  { id: "tarde",  label: "Tarde",   desde: "12:00", hasta: "17:00" },
  { id: "noche",  label: "Noche",   desde: "17:00", hasta: "23:59" },
]

function horaEnTurno(hora, turnoId) {
  const t = TURNOS.find(t => t.id === turnoId)
  if (!t) return true
  return hora >= t.desde && hora < t.hasta
}

function rutinaPublicada(publicarEn) {
  if (!publicarEn) return true
  return new Date() >= new Date(publicarEn)
}

function formatearFechaPublicacion(publicarEn) {
  return new Date(publicarEn).toLocaleString("es-AR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  })
}

function calcularDuracion(inicio, fin) {
  if (!inicio || !fin) return 60
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

// Devuelve la diferencia en horas entre ahora y la clase (positivo = clase en el futuro)
function horasHastaClase(fechaDate, horaInicio) {
  if (!horaInicio) return Infinity
  const [h, m] = horaInicio.split(':').map(Number)
  const claseDatetime = new Date(fechaDate)
  claseDatetime.setHours(h, m, 0, 0)
  return (claseDatetime - new Date()) / 3600000
}

function puedeReservar(fechaDate, horaInicio) {
  return horasHastaClase(fechaDate, horaInicio) >= 2
}

function puedeCancelar(fechaDate, horaInicio) {
  return horasHastaClase(fechaDate, horaInicio) >= 2
}

export default function ReservarClasePage() {
  const [selectedDate, setSelectedDate]       = useState(new Date())
  const [clasesOriginales, setClasesOriginales] = useState([])
  const [planes, setPlanes]                   = useState([])
  const [selectedClass, setSelectedClass]     = useState(null)
  const [confirmDialog, setConfirmDialog]     = useState(false)
  const [cancelDialog, setCancelDialog]       = useState({ open: false, clase: null })
  const [isLoading, setIsLoading]             = useState(false)
  const [pageLoading, setPageLoading]         = useState(true)
  const [creditosReales, setCreditosReales]   = useState(0)
  const [loadingCreditos, setLoadingCreditos] = useState(true)
  const [rutinaExpandida, setRutinaExpandida] = useState({})
  const [turnoFiltro, setTurnoFiltro]         = useState(null)
  const [idPlanAlumno, setIdPlanAlumno]       = useState(null)
  // mapa: `${idHorario}-${fechaISO}` → idReserva (solo reservas "proxima")
  const [reservasMap, setReservasMap]         = useState({})

  const storedUser = JSON.parse(localStorage.getItem("usuario") || "{}")

  const formatDate = (date) =>
    date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  const toLocalDateStr = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getDatesOfWeek = () => {
    const dates = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getDatesOfWeek()

  const cargarReservas = async () => {
    try {
      const res = await apiClient.get('/reservas/mis-reservas')
      const lista = res.data?.data || res.data || []
      const mapa = {}
      lista.forEach(r => {
        if (r.estadoReserva === 'proxima') {
          const fecha = r.fechaReserva?.split('T')[0]
          mapa[`${r.idHorario}-${fecha}`] = r.idReserva
        }
      })
      setReservasMap(mapa)
    } catch {}
  }

  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setPageLoading(true)
        setLoadingCreditos(true)

        const [responseClases, responsePlanes] = await Promise.all([
          apiClient.get('/clases/disponibles'),
          apiClient.get('/planes'),
        ])
        setClasesOriginales(responseClases.data?.data || responseClases.data || [])
        setPlanes(responsePlanes.data?.data || [])

        if (storedUser.idUsuario) {
          const responseAbonos = await apiClient.get(`/usuarios/${storedUser.idUsuario}/abonos`)
          const abonos = responseAbonos.data?.data || responseAbonos.data || []
          const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
          const abonoActivo = abonos.find(a => {
            if (a.estado !== 'ACTIVO') return false
            if (!a.vencimiento) return true
            const venc = new Date(a.vencimiento); venc.setHours(0, 0, 0, 0)
            return venc >= hoy
          })
          setCreditosReales(abonoActivo?.disponibles ?? 0)
          if (abonoActivo?.idPlan) setIdPlanAlumno(abonoActivo.idPlan)
        }

        await cargarReservas()
      } catch (error) {
        console.error("Error al inicializar la interfaz:", error)
      } finally {
        setPageLoading(false)
        setLoadingCreditos(false)
      }
    }
    fetchDatosIniciales()
  }, [])

  const clasesFiltradas = useMemo(() => {
    const diaIndex = selectedDate.getDay()
    const nombreDiaBuscado = mapaDiasBD[diaIndex]
    const fechaStr = toLocalDateStr(selectedDate)

    return clasesOriginales
      .filter(clase => {
        if (clase.estado !== 'Activo') return false
        if (clase.fechaEspecifica) {
          // Clase única: solo aparece el día exacto de su fecha
          const fechaUnica = clase.fechaEspecifica.split('T')[0]
          if (fechaUnica !== fechaStr) return false
        } else {
          // Clase recurrente: filtra por día de semana
          const diaClase = clase.dia ? clase.dia.toUpperCase().trim() : ""
          if (diaClase !== nombreDiaBuscado) return false
        }
        const hora = clase.horaInicio ? clase.horaInicio.substring(0, 5) : "00:00"
        if (turnoFiltro && !horaEnTurno(hora, turnoFiltro)) return false
        if (idPlanAlumno && clase.idPlan && clase.idPlan !== idPlanAlumno) return false
        return true
      })
      .map(clase => {
        const horaInicio = clase.horaInicio ? clase.horaInicio.substring(0, 5) : '00:00'
        const key = `${clase.idHorario}-${fechaStr}`
        const idReserva = reservasMap[key] ?? null
        return {
          id: clase.idHorario,
          idClase: clase.idClase,
          idPlan: clase.idPlan ?? null,
          nombre: clase.nombreClase,
          hora: horaInicio,
          horaFin: clase.horaFin ? clase.horaFin.substring(0, 5) : null,
          duracion: clase.horaFin ? `${calcularDuracion(clase.horaInicio, clase.horaFin)} min` : '60 min',
          coach: clase.nombreProfesor || "Staff Bravos",
          cuposDisponibles: clase.cupoDisponible ?? 0,
          cuposTotales: clase.cupoMaximo ?? 15,
          descripcion: clase.descripcion || clase.rutina?.descripcion || '',
          rutina: clase.rutina?.ejercicios || clase.rutina || '',
          publicarEn: clase.rutina?.publicarEn || clase.publicarEn || null,
          reservado: idReserva !== null,
          idReserva,
        }
      })
  }, [selectedDate, clasesOriginales, turnoFiltro, idPlanAlumno, reservasMap])

  const clasesAgrupadas = useMemo(() => {
    const grupos = {}
    planes.forEach(plan => { grupos[plan.idPlan] = { plan, clases: [] } })
    grupos['sin-plan'] = { plan: { nombre: 'Clases Generales', idPlan: null }, clases: [] }

    clasesFiltradas.forEach(clase => {
      const key = clase.idPlan ?? 'sin-plan'
      if (grupos[key]) grupos[key].clases.push(clase)
      else grupos['sin-plan'].clases.push(clase)
    })

    return Object.entries(grupos)
      .filter(([, g]) => g.clases.length > 0)
      .map(([key, g]) => ({ key, ...g }))
  }, [planes, clasesFiltradas])

  const handleReservar = async () => {
    if (!selectedClass) return
    if (creditosReales <= 0) {
      toast.error("Sin créditos disponibles", { description: "No tenés créditos disponibles para completar la acción." })
      setConfirmDialog(false)
      return
    }
    setIsLoading(true)
    try {
      const fechaFormateada = toLocalDateStr(selectedDate)
      const response = await apiClient.post('/reservas', {
        idHorario: selectedClass.id,
        fechaReserva: fechaFormateada
      })
      if (response.data?.success) {
        const idReservaNueva = response.data?.data?.idReserva
        toast.success("¡Reserva confirmada!", { description: `${selectedClass.nombre} a las ${selectedClass.hora}` })
        setCreditosReales(prev => prev - 1)
        // Actualización optimista inmediata
        const key = `${selectedClass.id}-${fechaFormateada}`
        setReservasMap(prev => ({ ...prev, [key]: idReservaNueva }))
        await cargarReservas()
      }
    } catch (error) {
      toast.error("Error de Reserva", { description: error.response?.data?.message || "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
      setConfirmDialog(false)
      setSelectedClass(null)
    }
  }

  const handleCancelar = async () => {
    const { clase } = cancelDialog
    if (!clase?.idReserva) return
    setIsLoading(true)
    try {
      await apiClient.patch(`/reservas/${clase.idReserva}/cancelar`)
      const devuelveCredito = puedeCancelar(selectedDate, clase.hora)
      if (devuelveCredito) {
        toast.success("Reserva cancelada", { description: "Tu crédito fue devuelto." })
        setCreditosReales(prev => prev + 1)
      } else {
        toast.warning("Reserva cancelada", { description: "El crédito no fue devuelto porque cancelaste con menos de 2 horas de anticipación." })
      }
      await cargarReservas()
    } catch (error) {
      toast.error("Error al cancelar", { description: error.response?.data?.message || "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
      setCancelDialog({ open: false, clase: null })
    }
  }

  const toggleRutina = (id) => setRutinaExpandida(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reservar Clase</h1>
        <p className="text-muted-foreground">Seleccioná una clase para reservar</p>
      </div>

      {/* CRÉDITOS */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {loadingCreditos ? "..." : creditosReales}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">Créditos Disponibles</p>
              <p className="text-sm text-muted-foreground">Cada reserva consume 1 crédito</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CALENDARIO SEMANAL */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold capitalize leading-tight">
            {formatDate(selectedDate)}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d)
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d)
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString()
              const isToday = date.toDateString() === new Date().toDateString()
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-1.5 sm:p-3 rounded-lg text-center transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground"
                    : isToday ? "bg-primary/20 text-primary"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  <p className="text-[9px] sm:text-xs font-medium">{diasSemana[index]}</p>
                  <p className="text-sm sm:text-lg font-bold">{date.getDate()}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* FILTRO DE TURNOS */}
      <div className="flex gap-2">
        {TURNOS.map(t => (
          <button
            key={t.id}
            onClick={() => setTurnoFiltro(turnoFiltro === t.id ? null : t.id)}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest border transition-colors ${
              turnoFiltro === t.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {t.label}
            <span className="block text-[9px] font-normal opacity-60 mt-0.5 normal-case">
              {t.desde.slice(0, 5)} – {t.hasta === "23:59" ? "22:00" : t.hasta.slice(0, 5)}
            </span>
          </button>
        ))}
      </div>

      {/* CLASES POR PLAN */}
      <div className="space-y-6">
        {pageLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clasesAgrupadas.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
            No hay clases{turnoFiltro ? ` de ${TURNOS.find(t => t.id === turnoFiltro)?.label.toLowerCase()}` : ""} para los {mapaDiasBD[selectedDate.getDay()].toLowerCase()}.
          </p>
        ) : (
          clasesAgrupadas.map(({ key, plan, clases: clasesDelPlan }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                  {plan.nombre}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clasesDelPlan.map((clase) => {
                  const publicada = rutinaPublicada(clase.publicarEn)
                  const tieneContenido = clase.descripcion || clase.rutina
                  const expandida = rutinaExpandida[clase.id]
                  const sinCupos = clase.cuposDisponibles === 0
                  const sinCreditos = creditosReales === 0
                  const puedeRes = puedeReservar(selectedDate, clase.hora)
                  const puedeCan = puedeCancelar(selectedDate, clase.hora)

                  return (
                    <Card
                      key={clase.id}
                      className={`bg-card border-border transition-all ${
                        clase.reservado
                          ? "border-green-500/30 bg-green-500/5"
                          : sinCupos || sinCreditos || !puedeRes
                          ? "opacity-60"
                          : "hover:border-primary/30"
                      }`}
                    >
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{clase.nombre}</h3>
                              {clase.reservado && (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-green-500/15 text-green-400 border border-green-500/25">
                                  <CheckCircle2 className="h-3 w-3" /> Reservado
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{clase.hora} · {clase.duracion}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{clase.coach}</span>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={sinCupos
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-green-500/10 text-green-500 border-green-500/20"
                            }
                          >
                            {clase.cuposDisponibles}/{clase.cuposTotales} cupos
                          </Badge>
                        </div>

                        {tieneContenido && (
                          <div className="border-t border-border pt-3">
                            {publicada ? (
                              <div>
                                {clase.descripcion && (
                                  <div
                                    className="text-xs text-muted-foreground mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground"
                                    dangerouslySetInnerHTML={{ __html: clase.descripcion }}
                                  />
                                )}
                                {clase.rutina && (
                                  <>
                                    <button
                                      onClick={() => toggleRutina(clase.id)}
                                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandida ? "rotate-180" : ""}`} />
                                      {expandida ? "Ocultar rutina" : "Ver rutina"}
                                    </button>
                                    {expandida && (
                                      <div
                                        className="mt-2 text-xs text-foreground/70 bg-foreground/5 rounded-lg p-3 border border-border [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground"
                                        dangerouslySetInnerHTML={{ __html: typeof clase.rutina === "string" ? clase.rutina : JSON.stringify(clase.rutina) }}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Lock className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Rutina disponible el{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatearFechaPublicacion(clase.publicarEn)}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ACCIONES */}
                        <div className="space-y-2">
                          {clase.reservado ? (
                            // Ya reservó esta clase
                            puedeCan ? (
                              <Button
                                variant="outline"
                                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                onClick={() => setCancelDialog({ open: true, clase })}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar reserva
                              </Button>
                            ) : (
                              <Button variant="outline" className="w-full opacity-50 cursor-not-allowed border-green-500/20 text-green-400" disabled>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Reservado · Ya no podés cancelar
                              </Button>
                            )
                          ) : sinCupos ? (
                            <Button variant="outline" className="w-full" disabled>Sin cupos disponibles</Button>
                          ) : sinCreditos ? (
                            <Button variant="destructive" className="w-full opacity-70 cursor-not-allowed" disabled>
                              Sin créditos disponibles
                            </Button>
                          ) : !puedeRes ? (
                            <Button variant="outline" className="w-full opacity-60 cursor-not-allowed" disabled>
                              <Clock className="mr-2 h-4 w-4" />
                              Solo se puede reservar con 2h de anticipación
                            </Button>
                          ) : (
                            <Button
                              className="w-full bg-primary hover:bg-primary/90"
                              onClick={() => { setSelectedClass(clase); setConfirmDialog(true) }}
                            >
                              Reservar Clase
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DIÁLOGO CONFIRMAR RESERVA */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>¿Confirmás la reserva de esta clase?</DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-semibold text-foreground">{selectedClass.nombre}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(selectedDate)} a las {selectedClass.hora}
              </p>
              <p className="text-sm text-muted-foreground">Coach: {selectedClass.coach}</p>
            </div>
          )}
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-500/80">
              Se descontará 1 crédito. Si cancelás con menos de 2 horas de anticipación, el crédito no se devuelve.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleReservar}
              disabled={isLoading || creditosReales === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</>
                : "Confirmar Reserva"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CANCELAR RESERVA */}
      <Dialog open={cancelDialog.open} onOpenChange={open => !open && setCancelDialog({ open: false, clase: null })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar Reserva</DialogTitle>
            <DialogDescription>¿Seguro que querés cancelar esta reserva?</DialogDescription>
          </DialogHeader>
          {cancelDialog.clase && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-semibold text-foreground">{cancelDialog.clase.nombre}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(selectedDate)} a las {cancelDialog.clase.hora}
              </p>
            </div>
          )}
          {cancelDialog.clase && puedeCancelar(selectedDate, cancelDialog.clase.hora) ? (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500/80">
                Cancelás con más de 2 horas de anticipación. Tu crédito será devuelto.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500/80">
                Faltan menos de 2 horas para la clase. El crédito <strong>no</strong> será devuelto.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, clase: null })}>Volver</Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...</>
                : "Confirmar cancelación"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
