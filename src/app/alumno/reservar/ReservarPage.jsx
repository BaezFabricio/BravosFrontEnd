import { useState } from "react"
import { Calendar, Clock, User, ChevronLeft, ChevronRight, AlertCircle, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  AlertTitle,
} from "@/components/ui/alert"

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const generarClases = () => [
  { id: "1", nombre: "Funcional WOD", hora: "07:00", duracion: "60 min", coach: "Pablo Ruiz", cuposDisponibles: 5, cuposTotales: 15, reservado: false },
  { id: "2", nombre: "Funcional WOD", hora: "08:00", duracion: "60 min", coach: "Pablo Ruiz", cuposDisponibles: 3, cuposTotales: 15, reservado: false },
  { id: "3", nombre: "Funcional", hora: "09:30", duracion: "45 min", coach: "Maria Gomez", cuposDisponibles: 8, cuposTotales: 12, reservado: false },
  { id: "4", nombre: "Open Box", hora: "11:00", duracion: "90 min", coach: "Diego Torres", cuposDisponibles: 10, cuposTotales: 10, reservado: false },
  { id: "5", nombre: "Funcional WOD", hora: "17:00", duracion: "60 min", coach: "Pablo Ruiz", cuposDisponibles: 2, cuposTotales: 15, reservado: false },
  { id: "6", nombre: "Funcional WOD", hora: "18:00", duracion: "60 min", coach: "Pablo Ruiz", cuposDisponibles: 0, cuposTotales: 15, reservado: true },
  { id: "7", nombre: "Funcional", hora: "19:30", duracion: "45 min", coach: "Maria Gomez", cuposDisponibles: 6, cuposTotales: 12, reservado: false },
  { id: "8", nombre: "Funcional WOD", hora: "20:00", duracion: "60 min", coach: "Diego Torres", cuposDisponibles: 0, cuposTotales: 15, reservado: false },
]

export default function ReservarClasePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [clases, setClases] = useState(generarClases())
  const [selectedClass, setSelectedClass] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  
  const creditosDisponibles = 12

  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
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

  const handleReservar = async () => {
    if (!selectedClass) return
    
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setClases(clases.map((c) =>
      c.id === selectedClass.id
        ? { ...c, reservado: true, cuposDisponibles: c.cuposDisponibles - 1 }
        : c
    ))
    
    setIsLoading(false)
    setConfirmDialog(false)
    setSuccessMessage(`¡Reserva confirmada para ${selectedClass.nombre} a las ${selectedClass.hora}!`)
    setSelectedClass(null)
    
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reservar Clase</h1>
        <p className="text-muted-foreground">Selecciona una clase para reservar</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{creditosDisponibles}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Créditos Disponibles</p>
                <p className="text-sm text-muted-foreground">Cada reserva consume 1 crédito</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <Alert className="bg-green-500/10 border-green-500/20">
          <Check className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">Reserva Exitosa</AlertTitle>
          <AlertDescription className="text-green-500/80">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold capitalize">
            {formatDate(selectedDate)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setDate(newDate.getDate() - 7)
                setSelectedDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setDate(newDate.getDate() + 7)
                setSelectedDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {weekDates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString()
              const isToday = date.toDateString() === new Date().toDateString()
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  <p className="text-xs font-medium">{diasSemana[index]}</p>
                  <p className="text-lg font-bold">{date.getDate()}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Clases Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clases.map((clase) => (
            <Card
              key={clase.id}
              className={`bg-card border-border transition-all ${
                clase.reservado
                  ? "border-primary/50 bg-primary/5"
                  : clase.cuposDisponibles === 0
                  ? "opacity-60"
                  : "hover:border-primary/30"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{clase.nombre}</h3>
                      {clase.reservado && (
                        <Badge className="bg-primary text-primary-foreground">Reservado</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{clase.hora} - {clase.duracion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{clase.coach}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        clase.cuposDisponibles === 0
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : clase.cuposDisponibles <= 3
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-green-500/10 text-green-500 border-green-500/20"
                      }
                    >
                      {clase.cuposDisponibles}/{clase.cuposTotales} cupos
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  {clase.reservado ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Ya reservado
                    </Button>
                  ) : clase.cuposDisponibles === 0 ? (
                    <Button variant="outline" className="w-full" disabled>
                      Sin cupos disponibles
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => {
                        setSelectedClass(clase)
                        setConfirmDialog(true)
                      }}
                    >
                      Reservar Clase
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              ¿Confirmas la reserva de esta clase?
            </DialogDescription>
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
              Se descontará 1 crédito de tu cuenta. Si no asistes, el crédito también será descontado.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReservar} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reservando...
                </>
              ) : (
                "Confirmar Reserva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
