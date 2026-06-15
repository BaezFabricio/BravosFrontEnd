import { useEffect, useState } from "react"
import { Clock, User, ChevronLeft, ChevronRight, AlertCircle, Check, Loader2 } from "lucide-react"
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

import apiClient from "@/api"

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const mapaDiasBD = { 0: "DOMINGO", 1: "LUNES", 2: "MARTES", 3: "MIERCOLES", 4: "JUEVES", 5: "VIERNES", 6: "SABADO" }

export default function ReservarClasePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [clasesOriginales, setClasesOriginales] = useState([]) 
  const [clasesFiltradas, setClasesFiltradas] = useState([]) 
  const [selectedClass, setSelectedClass] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  
  // 🟢 Créditos dinámicos en tiempo real
  const [creditosReales, setCreditosReales] = useState(0)
  const [loadingCreditos, setLoadingCreditos] = useState(true)

  const storedUser = JSON.parse(localStorage.getItem("usuario") || "{}")

  const formatDate = (date) => {
    return date.toLocaleDateString("es-AR", {
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

  // Sincroniza clases y pases calculados al iniciar la vista
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setPageLoading(true)
        setLoadingCreditos(true)

        // 1. Obtener listado de horarios/clases activas
        const responseClases = await apiClient.get('/clases/disponibles');
        const rawClases = responseClases.data?.data || responseClases.data || []
        setClasesOriginales(rawClases)

        // 2. Obtener los créditos reales calculados por el backend
        if (storedUser.idUsuario) {
          const responseUser = await apiClient.get(`/usuarios/${storedUser.idUsuario}`)
          const datosUsuario = responseUser.data?.data || responseUser.data
          setCreditosReales(datosUsuario?.creditos || 0)
        }
      } catch (error) {
        console.error("Error de red al inicializar la interfaz:", error)
      } finally {
        setPageLoading(false)
        setLoadingCreditos(false)
      }
    }
    fetchDatosIniciales()
  }, [])

  // Filtrado reactivo por fecha seleccionada en el slider
  useEffect(() => {
    const diaIndex = selectedDate.getDay()
    const nombreDiaBuscado = mapaDiasBD[diaIndex] 

    const filtradas = clasesOriginales.filter(clase => {
      const diaClase = clase.dia ? clase.dia.toUpperCase().trim() : "";
      const diaBuscado = nombreDiaBuscado ? nombreDiaBuscado.toUpperCase().trim() : "";
      return diaClase === diaBuscado && clase.estado === 'Activo';
    }).map(clase => ({
      id: clase.idHorario,
      nombre: clase.nombreClase,
      hora: clase.horaInicio ? clase.horaInicio.substring(0, 5) : '00:00',
      duracion: clase.horaFin ? `${calcularDuracion(clase.horaInicio, clase.horaFin)} min` : '60 min',
      coach: clase.nombreProfesor || "Staff Bravos",
      cuposDisponibles: clase.cupoDisponible ?? 0,
      cuposTotales: clase.cupoMaximo ?? 15,
      reservado: false 
    }))

    setClasesFiltradas(filtradas)
  }, [selectedDate, clasesOriginales])

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return 60
    const [h1, m1] = inicio.split(':').map(Number)
    const [h2, m2] = fin.split(':').map(Number)
    return (h2 * 60 + m2) - (h1 * 60 + m1)
  }

  // Envía la petición estructurada al backend e impacta la UI local
  const handleReservar = async () => {
    if (!selectedClass) return
    
    // 🛡️ Guardia reactiva en el cliente por seguridad
    if (creditosReales <= 0) {
      setErrorMessage("No tenés créditos disponibles para completar la acción.")
      setConfirmDialog(false)
      return
    }
    
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const fechaFormateada = selectedDate.toISOString().split('T')[0] 
      
      const response = await apiClient.post('/reservas', {
        idHorario: selectedClass.id,
        fechaReserva: fechaFormateada
      })

      if (response.data?.success) {
        setSuccessMessage(`¡Reserva confirmada para ${selectedClass.nombre} a las ${selectedClass.hora}!`)
        
        // Modificación en vivo del layout de cupos
        setClasesFiltradas(clasesFiltradas.map((c) =>
          c.id === selectedClass.id ? { ...c, cuposDisponibles: c.cuposDisponibles - 1 } : c
        ))

        // Descontar pase del estado local de forma inmediata
        const nuevoSaldo = creditosReales - 1;
        setCreditosReales(nuevoSaldo)

        // Guardar la persistencia en el almacenamiento local para sincronía entre páginas
        localStorage.setItem("usuario", JSON.stringify({ ...storedUser, creditos: nuevoSaldo }))
      }
    } catch (error) {
      console.error("Error devuelto por el servidor:", error)
      setErrorMessage(error.response?.data?.message || "Ocurrió un error inesperado al procesar la reserva.")
    } finally {
      setIsLoading(false)
      setConfirmDialog(false)
      setSelectedClass(null)
      setTimeout(() => { setSuccessMessage(null); setErrorMessage(null); }, 6000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reservar Clase</h1>
        <p className="text-muted-foreground">Selecciona una clase para reservar</p>
      </div>

      {/* TARJETA DINÁMICA DE CRÉDITOS */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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

      {errorMessage && (
        <Alert className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Error de Reserva</AlertTitle>
          <AlertDescription className="text-destructive/80">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* CALENDARIO SEMANAL */}
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

      {/* GRILLA DE CLASES */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Clases Disponible</h2>
        
        {pageLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clasesFiltradas.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
            No hay clases agendadas o activas para los días {mapaDiasBD[selectedDate.getDay()].toLowerCase()}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clasesFiltradas.map((clase) => (
              <Card
                key={clase.id}
                className={`bg-card border-border transition-all ${
                  clase.cuposDisponibles === 0 || creditosReales === 0 ? "opacity-60" : "hover:border-primary/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{clase.nombre}</h3>
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
                        className={clase.cuposDisponibles === 0 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}
                      >
                        {clase.cuposDisponibles}/{clase.cuposTotales} cupos
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    {clase.cuposDisponibles === 0 ? (
                      <Button variant="outline" className="w-full" disabled>
                        Sin cupos disponibles
                      </Button>
                    ) : creditosReales === 0 ? (
                      /* 🚫 ACCIÓN INHABILITADA POR FALTA DE CRÉDITOS REALES */
                      <Button variant="destructive" className="w-full opacity-70 cursor-not-allowed" disabled>
                        Sin créditos disponibles
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
        )}
      </div>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>¿Confirmas la reserva de esta clase?</DialogDescription>
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

          <Alert className="bg-green-500/10 border-green-500/20">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500/80">
              Se descontará 1 crédito de tu cuenta. Si cancelas tarde (menos de 2 horas antes de la clase), el crédito se perderá de igual forma.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleReservar} 
              disabled={isLoading || creditosReales === 0} 
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</>
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