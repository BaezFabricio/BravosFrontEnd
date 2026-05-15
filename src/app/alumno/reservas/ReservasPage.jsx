import { useState } from "react"
import { Calendar, Clock, User, X, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
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

const reservasProximas = [
  { id: "1", clase: "Funcional WOD", fecha: "Hoy, 10 Mar", hora: "18:00", coach: "Pablo Ruiz", estado: "proxima" },
  { id: "2", clase: "Funcional", fecha: "Manana, 11 Mar", hora: "09:30", coach: "Maria Gomez", estado: "proxima" },
  { id: "3", clase: "Open Box", fecha: "Miercoles, 12 Mar", hora: "11:00", coach: "Diego Torres", estado: "proxima" },
]

const historialReservas = [
  { id: "4", clase: "Funcional WOD", fecha: "08 Mar 2024", hora: "08:00", coach: "Pablo Ruiz", estado: "completada" },
  { id: "5", clase: "Funcional", fecha: "06 Mar 2024", hora: "09:30", coach: "Maria Gomez", estado: "completada" },
  { id: "6", clase: "Funcional WOD", fecha: "05 Mar 2024", hora: "18:00", coach: "Pablo Ruiz", estado: "inasistencia" },
  { id: "7", clase: "Open Box", fecha: "03 Mar 2024", hora: "11:00", coach: "Diego Torres", estado: "completada" },
  { id: "8", clase: "Funcional WOD", fecha: "01 Mar 2024", hora: "08:00", coach: "Pablo Ruiz", estado: "cancelada" },
  { id: "9", clase: "Funcional", fecha: "28 Feb 2024", hora: "09:30", coach: "Maria Gomez", estado: "completada" },
]

const estadoConfig = {
  proxima: { label: "Próxima", className: "bg-primary/10 text-primary border-primary/20", icon: Calendar },
  completada: { label: "Completada", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", className: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: X },
  inasistencia: { label: "No asistió", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
}

export default function ReservasPage() {
  const [proximas, setProximas] = useState(reservasProximas)
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    reserva: null,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleCancelar = async () => {
    if (!cancelDialog.reserva) return
    
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setProximas(proximas.filter((r) => r.id !== cancelDialog.reserva?.id))
    setIsLoading(false)
    setCancelDialog({ open: false, reserva: null })
  }

  const ReservaCard = ({ reserva, showCancelButton = false }) => {
    const config = estadoConfig[reserva.estado]
    const Icon = config.icon

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">{reserva.clase}</h3>
                <Badge variant="outline" className={config.className}>
                  <Icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{reserva.fecha}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{reserva.hora}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{reserva.coach}</span>
                </div>
              </div>
            </div>
            {showCancelButton && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => setCancelDialog({ open: true, reserva })}
              >
                <X className="mr-1 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
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
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proximas" className="mt-6">
          {proximas.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No tienes reservas próximas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Reserva una clase para comenzar a entrenar
                </p>
                <Button className="bg-primary hover:bg-primary/90">
                  Reservar Clase
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-500/80">
                  Recuerda: Si cancelas con menos de 2 horas de anticipación, el crédito no será devuelto.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proximas.map((reserva) => (
                  <ReservaCard key={reserva.id} reserva={reserva} showCancelButton />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="historial" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historialReservas.map((reserva) => (
              <ReservaCard key={reserva.id} reserva={reserva} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cancelar esta reserva?
            </DialogDescription>
          </DialogHeader>
          
          {cancelDialog.reserva && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-semibold text-foreground">{cancelDialog.reserva.clase}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {cancelDialog.reserva.fecha} a las {cancelDialog.reserva.hora}
              </p>
              <p className="text-sm text-muted-foreground">Coach: {cancelDialog.reserva.coach}</p>
            </div>
          )}

          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-500/80">
              Si cancelas con más de 2 horas de anticipación, tu crédito será devuelto automáticamente.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, reserva: null })}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
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
