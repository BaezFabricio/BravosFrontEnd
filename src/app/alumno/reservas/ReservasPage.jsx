import { useEffect, useState } from "react"
import { Calendar, Clock, User, X, Loader2, CheckCircle2, XCircle, AlertTriangle, Dumbbell, ChevronDown, ChevronUp } from "lucide-react"
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

const estadoConfig = {
  proxima: { label: "Próxima", className: "bg-primary/10 text-primary border-primary/20", icon: Calendar },
  completada: { label: "Completada", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", className: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: X },
  inasistencia: { label: "No asistió", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
}

export default function ReservasPage() {
  const [proximas, setProximas] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState({ open: false, idReserva: null, claseNombre: "", fechaStr: "" })
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
        coach: r.nombreProfesor || "Staff Bravos"
      }))
      
      // El backend ya calcula el estado real (completada/inasistencia/cancelada/proxima)
      setProximas(listaMapeada.filter(r => r.estado === 'proxima'))
      setHistorial(listaMapeada.filter(r => r.estado !== 'proxima'))
    } catch (error) {
      console.error("No se pudo recuperar el historial de reservas:", error)
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
    } catch (error) {
      console.error("Error al cancelar la reserva:", error)
    } finally {
      setIsLoadingCancel(false)
      setCancelDialog({ open: false, idReserva: null, claseNombre: "", fechaStr: "" })
    }
  }

  const formatFechaFront = (fechaStr) => {
    if (!fechaStr) return ""
    const [anio, mes, dia] = fechaStr.split('-')
    const date = new Date(anio, mes - 1, dia)
    return date.toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const ReservaCard = ({ reserva, showCancelButton = false }) => {
    const config = estadoConfig[reserva.estado] || estadoConfig.cancelada
    const Icon = config.icon
    const [rutinaOpen, setRutinaOpen] = useState(false)
    const [rutina, setRutina] = useState(null)
    const [loadingRutina, setLoadingRutina] = useState(false)

    const toggleRutina = async () => {
      if (!rutinaOpen && rutina === null && reserva.idClase) {
        setLoadingRutina(true)
        try {
          const res = await apiClient.get(`/profesores/clases/${reserva.idClase}/rutina`)
          setRutina(res.data?.data || false)
        } catch {
          setRutina(false)
        } finally {
          setLoadingRutina(false)
        }
      }
      setRutinaOpen(prev => !prev)
    }

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">{reserva.clase}</h3>
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
            </div>
            {showCancelButton && (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-foreground font-bold px-4 py-2 text-sm border-none shadow-sm transition-colors shrink-0 self-start"
                onClick={() => setCancelDialog({
                  open: true,
                  idReserva: reserva.idReserva,
                  claseNombre: reserva.clase,
                  fechaStr: `${formatFechaFront(reserva.fecha)} a las ${reserva.hora}`
                })}
              >
                <X className="mr-1.5 h-4 w-4 stroke-[3]" />
                Cancelar
              </Button>
            )}
          </div>

          {/* Rutina de la clase — solo en próximas */}
          {showCancelButton && reserva.idClase && (
            <div className="border-t border-border pt-3">
              <button
                onClick={toggleRutina}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {loadingRutina
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Dumbbell className="h-4 w-4" />
                }
                Ver rutina de la clase
                {rutinaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {rutinaOpen && (
                <div className="mt-3 space-y-2">
                  {rutina === false && (
                    <p className="text-sm text-muted-foreground">Esta clase todavía no tiene una rutina asignada.</p>
                  )}
                  {rutina && (
                    <div className="rounded-lg bg-secondary/40 p-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {rutina.categoria && <Badge variant="default" className="text-xs">{rutina.categoria}</Badge>}
                        {rutina.nivel && <Badge variant="outline" className="text-xs">{rutina.nivel}</Badge>}
                      </div>
                      {rutina.descripcion && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rutina.descripcion}</p>
                      )}
                      {rutina.ejercicios?.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {rutina.ejercicios.map((ej, idx) => (
                            <div key={ej.idEjercicio} className="rounded bg-background/60 px-3 py-2 space-y-2">
                              <span className="text-sm">{idx + 1}. {ej.nombre}</span>
                              <VideoPlayer url={ej.videoUrl} label="Ver video" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Reservas</h1>
        <p className="text-muted-foreground">Gestiona tus reservas de clases</p>
      </div>

      <Tabs defaultValue="proximas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="proximas">Próximas ({proximas.length})</TabsTrigger>
          <TabsTrigger value="historial">Historial ({historial.length})</TabsTrigger>
        </TabsList>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="proximas" className="mt-6">
              {proximas.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No tienes reservas próximas</h3>
                    <p className="text-sm text-muted-foreground mb-4">Reserva una clase para comenzar a entrenar</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <AlertTriangle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500/80">
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

          <Alert className="bg-green-500/10 border-green-500/20">
            <AlertTriangle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500/80">
              Si cancelas con más de 2 horas de anticipación, tu crédito será devuelto automáticamente.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, idReserva: null, claseNombre: "", fechaStr: "" })}>Volver</Button>
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