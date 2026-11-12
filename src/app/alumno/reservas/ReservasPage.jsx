import { useSemanaCreditos } from "@/lib/semanaCreditos"
import { useCreditosDisponibles } from "@/lib/creditosAlumno"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
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

import { toast } from "@/lib/notificar"
import { useAnchoPanel } from "@/lib/useEscritorio"
import ReservasMovilNuevo from "./ReservasMovilNuevo"
import ReservasEscritorio from "./ReservasEscritorio"

const formatFechaFront = (fechaStr) => {
  if (!fechaStr) return ""
  const [anio, mes, dia] = fechaStr.split('-')
  const date = new Date(anio, mes - 1, dia)
  return date.toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReservasPage() {
  const semana = useSemanaCreditos() // plan con créditos por semana (o null): cancelar no devuelve el crédito
  const escritorio = useAnchoPanel() // desde 1024 px: diseño de escritorio; por debajo, el del celular
  const creditos = useCreditosDisponibles()
  const [errorCarga, setErrorCarga] = useState(false)
  const [proximas, setProximas] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState({ open: false, idReserva: null, claseNombre: "", fechaStr: "", fecha: "", hora: "" })
  // Mismo criterio que el servidor: con 2 horas o más de anticipación se devuelve el crédito
  const devuelveCredito = semana ? false : cancelDialog.fecha
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
      setErrorCarga(false)
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
      setErrorCarga(true)
      toast.error("No se pudieron cargar tus reservas", { description: "Probá recargar la página.", guardar: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarReservas()
  }, [])

  // 2. 🟢 CANCELACIÓN: Envía el PATCH de anulación al backend
  const handleCancelar = async () => {
    if (!cancelDialog.idReserva) return
    
    setIsLoadingCancel(true)
    try {
      const response = await apiClient.patch(`/reservas/${cancelDialog.idReserva}/cancelar`)
      if (response.data?.success) {
        toast.success(escritorio
          ? (devuelveCredito ? "Cancelaste la reserva. Te devolvimos 1 crédito." : "Cancelaste la reserva. El crédito no se devolvió.")
          : "Reserva cancelada", { guardar: false })
        await cargarReservas()
      }
    } catch (err) {
      toast.error("No se pudo cancelar la reserva", { description: err.response?.data?.message || "Revisá tu conexión e intentá de nuevo." })
    } finally {
      setIsLoadingCancel(false)
      setCancelDialog({ open: false, idReserva: null, claseNombre: "", fechaStr: "", fecha: "", hora: "" })
    }
  }


  // Celular: cancela la reserva confirmada en la hoja (sin pasar por el diálogo de escritorio)
  const cancelarDirecto = async (r) => {
    if (!r?.idReserva) return
    setIsLoadingCancel(true)
    try {
      await apiClient.patch(`/reservas/${r.idReserva}/cancelar`)
      const fechaCorta = r.fecha
      const devuelve = !semana && (new Date(`${fechaCorta}T${r.hora || "00:00"}:00`) - new Date()) / 3600000 >= 2
      if (semana) toast.warning("Reserva cancelada", { description: "En tu plan el crédito no se devuelve al cancelar.", guardar: false })
      else if (devuelve) toast.success("Reserva cancelada", { description: "Tu crédito fue devuelto.", guardar: false })
      else toast.warning("Reserva cancelada", { description: "El crédito no fue devuelto porque faltaban menos de 2 horas.", guardar: false })
      await cargarReservas()
      window.dispatchEvent(new CustomEvent("bravos:reservas-cambiaron"))
    } catch (err) {
      toast.error("No se pudo cancelar la reserva", { description: err.response?.data?.message || "Revisá tu conexión e intentá de nuevo." })
    } finally {
      setIsLoadingCancel(false)
    }
  }

  const cerrarCancelar = () => setCancelDialog({ open: false, idReserva: null, claseNombre: "", fechaStr: "", fecha: "", hora: "" })

  if (escritorio) {
    return (
      <ReservasEscritorio
        proximas={proximas}
        historial={historial}
        cargando={loading}
        errorCarga={errorCarga}
        onReintentar={cargarReservas}
        semana={semana}
        creditos={creditos}
        onCancelar={abrirCancelar}
        cancelDialog={cancelDialog}
        cerrarCancelar={cerrarCancelar}
        devuelveCredito={devuelveCredito}
        handleCancelar={handleCancelar}
        cancelando={isLoadingCancel}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* CELULAR: diseño propio (ReservasMovil.jsx) */}
      <div>
        <ReservasMovilNuevo proximas={proximas} historial={historial} cargando={loading} errorCarga={errorCarga} onReintentar={cargarReservas} onCancelar={abrirCancelar} onConfirmarCancelar={(r) => cancelarDirecto(r)} semana={semana} />
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
                {semana ? <>En tu plan, cancelar <strong>no</strong> devuelve el crédito: cuenta para los de esta semana.</> : <>Faltan menos de 2 horas para la clase: el crédito <strong>no</strong> se devuelve.</>}
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