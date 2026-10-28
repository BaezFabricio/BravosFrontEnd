import { TituloPagina } from "@/components/TituloPagina"
import { Cargando } from '@/components/Cargando'
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import { useEffect, useState } from "react"
import { Calendar, Clock, User, X, Loader2, CheckCircle2, XCircle, AlertTriangle, Dumbbell, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

import apiClient from "@/api"
import VideoPlayer from "@/components/VideoPlayer"
import ReservasMovil from "./ReservasMovil"

const estadoConfig = {
  proxima: { label: "Próxima", className: "bg-lime-400/15 text-lime-700 dark:text-lime-400 border-lime-500/40", icon: Calendar },
  completada: { label: "Completada", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", className: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: X },
  inasistencia: { label: "No asistió", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
}

const formatFechaFront = (fechaStr) => {
  if (!fechaStr) return ""
  const [anio, mes, dia] = fechaStr.split('-')
  const date = new Date(anio, mes - 1, dia)
  return date.toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReservasPage() {
  const [proximas, setProximas] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState({ open: false, idReserva: null, claseNombre: "", fechaStr: "", fecha: "", hora: "" })
  // Mismo criterio que el servidor: con 2 horas o más de anticipación se devuelve el crédito
  const devuelveCredito = cancelDialog.fecha
    ? (new Date(`${cancelDialog.fecha}T${cancelDialog.hora || "00:00"}:00`) - new Date()) / 3600000 >= 2
    : true
  const abrirCancelar = (reserva) => setCancelDialog({
    open: true,
    idReserva: reserva.idReserva,
    claseNombre: reserva.clase,
    fechaStr: `${formatFechaFront(reserva.fecha)} a las ${reserva.hora}`,
    fecha: reserva.fecha,
    hora: reserva.hora,
  })
  const [isLoadingCancel, setIsLoadingCancel] = useState(false)

  // 1. 🟢 FETCH: Trae el listado completo de reservas del alumno
  const cargarReservas = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/reservas/mis-reservas')
      
      // Como usás successResponse en el backend, la lista real viaja en response.data.data
      const listaOriginal = response.data?.data || [];
      
      // 🔄 MAPEO: Traducimos lo que viene de la base de datos al formato que espera tu UI
      const listaMapeada = listaOriginal.map(r => ({
        idReserva: r.idReserva,
        idClase: r.idClase,
        clase: r.nombreClase,
        estado: r.estadoReserva || 'proxima',
        fecha: r.fechaReserva ? r.fechaReserva.substring(0, 10) : "",
        hora: r.horaInicio ? r.horaInicio.substring(0, 5) : "00:00",
        horaFin: r.horaFin ? r.horaFin.substring(0, 5) : null,
        tipo: r.tipoClase || null,
        coach: r.nombreProfesor || "Staff Bravos"
      }))
      
      // El backend ya calcula el estado real (completada/inasistencia/cancelada/proxima)
      setProximas(listaMapeada.filter(r => r.estado === 'proxima'))
      setHistorial(listaMapeada.filter(r => r.estado !== 'proxima'))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarReservas()
  }, [])

  // 2. 🟢 CANCELACIÓN: Envía el PATCH de anulación al backend
  const handleCancelar = async () => {
    if (!cancelDialog.idReserva) return
    
    setIsLoadingCancel(true)
    try {
      const response = await apiClient.patch(`/reservas/${cancelDialog.idReserva}/cancelar`)
      if (response.data?.success) {
        await cargarReservas()
      }
    } catch {
    } finally {
      setIsLoadingCancel(false)
      setCancelDialog({ open: false, idReserva: null, claseNombre: "", fechaStr: "", fecha: "", hora: "" })
    }
  }


  const ReservaCard = ({ reserva, showCancelButton = false }) => {
    const config = estadoConfig[reserva.estado] || estadoConfig.cancelada
    const Icon = config.icon
    const [rutinaDialog, setRutinaDialog] = useState(false)
    const [rutina, setRutina] = useState(null)
    const [loadingRutina, setLoadingRutina] = useState(false)

    const abrirRutina = async () => {
      setRutinaDialog(true)
      if (rutina === null && reserva.idReserva) {
        setLoadingRutina(true)
        try {
          // Solo responde si la reserva es del alumno de la sesión
          const res = await apiClient.get(`/reservas/${reserva.idReserva}/rutina`)
          setRutina(res.data?.data || false)
        } catch {
          setRutina(false)
        } finally {
          setLoadingRutina(false)
        }
      }
    }

    return (
      <>
        <Card
          className="cursor-pointer rounded-2xl border-border bg-card transition-colors hover:border-lime-500/60"
          onClick={abrirRutina}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg font-black text-foreground">{reserva.clase}</h3>
                  <Badge variant="outline" className={config.className}>
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatFechaFront(reserva.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{reserva.hora} hs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Coach: {reserva.coach}</span>
                  </div>
                </div>
                <div className="mt-3 flex min-h-[44px] items-center gap-2 rounded-xl border border-lime-400/40 bg-lime-400/10 px-3 py-2.5">
                  <Dumbbell className="h-4 w-4 text-lime-700 dark:text-lime-400 shrink-0" />
                  <span className="text-sm font-bold text-lime-700 dark:text-lime-400">Ver rutina del día</span>
                  <ChevronRight className="h-4 w-4 text-lime-700 dark:text-lime-400 ml-auto" />
                </div>
              </div>
              {showCancelButton && (
                <Button
                  variant="outline"
                  className="min-h-[44px] shrink-0 self-start rounded-xl border-red-500/40 px-4 text-sm font-bold text-red-700 hover:bg-red-500/10 dark:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    abrirCancelar(reserva)
                  }}
                >
                  <X className="mr-1.5 h-4 w-4 stroke-[3]" />
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={rutinaDialog} onOpenChange={setRutinaDialog}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-lime-700 dark:text-lime-400" />
                Rutina — {reserva.clase}
              </DialogTitle>
              <DialogDescription>
                {formatFechaFront(reserva.fecha)} · {reserva.hora} hs · Coach: {reserva.coach}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {loadingRutina && (
                <Cargando filas={3} className="py-4" />
              )}
              {!loadingRutina && rutina === false && (
                <p className="text-sm text-muted-foreground text-center py-6">Esta clase todavía no tiene una rutina asignada.</p>
              )}
              {!loadingRutina && rutina && (() => {
                // descripcion puede ser JSON {desc, rutina} (rich text) o plain text (viejo)
                let desc = rutina.descripcion || ""
                let contenidoRutina = rutina.contenido || ""
                try {
                  const p = JSON.parse(rutina.descripcion || "")
                  if (p && typeof p.rutina !== "undefined") {
                    desc = p.desc || ""
                    contenidoRutina = p.rutina || ""
                  }
                } catch {
                  // plain text o HTML sin JSON — se muestra tal cual
                }
                const ejerciciosTxt = !contenidoRutina && Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0
                  ? rutina.ejercicios.map(e => e.nombre).join("\n")
                  : ""
                return (
                  <div className="space-y-4">
                    {desc && (
                      <div
                        className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-black prose-strong:text-foreground"
                        dangerouslySetInnerHTML={{ __html: sanitizarHtml(desc) }}
                      />
                    )}
                    {contenidoRutina && (
                      <div
                        className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-black prose-strong:text-foreground bg-muted/40 rounded-lg p-4 border border-border"
                        dangerouslySetInnerHTML={{ __html: sanitizarHtml(contenidoRutina) }}
                      />
                    )}
                    {ejerciciosTxt && (
                      <pre className="text-sm text-foreground/70 whitespace-pre-wrap font-sans bg-muted/40 rounded-lg p-4 border border-border leading-relaxed">
                        {ejerciciosTxt}
                      </pre>
                    )}
                  </div>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* CELULAR: diseño propio (ReservasMovil.jsx) */}
      <div className="lg:hidden">
        <ReservasMovil proximas={proximas} historial={historial} cargando={loading} onCancelar={abrirCancelar} />
      </div>

      {/* ESCRITORIO */}
      <div className="hidden space-y-6 lg:block">
      <TituloPagina descripcion={"Gestiona tus reservas de clases"}>Mis Reservas</TituloPagina>

      <Tabs defaultValue="proximas" className="w-full">
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
          <TabsTrigger value="proximas" className="min-h-[44px] rounded-lg font-bold data-[state=active]:bg-foreground/10">Próximas ({proximas.length})</TabsTrigger>
          <TabsTrigger value="historial" className="min-h-[44px] rounded-lg font-bold data-[state=active]:bg-foreground/10">Historial ({historial.length})</TabsTrigger>
        </TabsList>
        
        {loading ? (
          <Cargando filas={3} className="py-4" />
        ) : (
          <>
            <TabsContent value="proximas" className="mt-6">
              {proximas.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-border bg-card">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No tienes reservas próximas</h3>
                    <p className="text-sm text-muted-foreground mb-4">Reserva una clase para comenzar a entrenar</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <AlertTriangle className="h-4 w-4 text-green-700 dark:text-green-500" />
                    <AlertDescription className="text-green-700/80 dark:text-green-500/80">
                      Recuerda: Si cancelas con menos de 2 horas de anticipación, el crédito no será devuelto.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proximas.map((reserva) => (
                      <ReservaCard key={reserva.idReserva} reserva={reserva} showCancelButton />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="historial" className="mt-6">
              {historial.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No registras reservas anteriores.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historial.map((reserva) => (
                    <ReservaCard key={reserva.idReserva} reserva={reserva} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
      </div>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>¿Estás seguro de cancelar esta reserva?</DialogDescription>
          </DialogHeader>
          
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <h4 className="font-semibold text-foreground">{cancelDialog.claseNombre}</h4>
            <p className="text-sm text-muted-foreground mt-1">{cancelDialog.fechaStr} hs</p>
          </div>

          {devuelveCredito ? (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500" />
              <AlertDescription className="text-green-700/80 dark:text-green-500/80">
                Faltan 2 horas o más: tu crédito se devuelve automáticamente.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-500" />
              <AlertDescription className="text-red-700/80 dark:text-red-500/80">
                Faltan menos de 2 horas para la clase: el crédito <strong>no</strong> se devuelve.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, idReserva: null, claseNombre: "", fechaStr: "", fecha: "", hora: "" })}>Volver</Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={isLoadingCancel}>
              {isLoadingCancel ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...</>
              ) : (
                "Cancelar Reserva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}