import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  ChevronRight, 
  Flame,
  Trophy,
  Users,
  TrendingUp
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import apiClient from "@/api" 

const logros = [
  { nombre: "Primera Clase", icono: Trophy, completado: true },
  { nombre: "Racha 5 días", icono: Flame, completado: true },
  { nombre: "10 WODs RX", icono: Trophy, completado: false },
  { nombre: "Primer PR", icono: TrendingUp, completado: true },
]

export default function AlumnoDashboard() {
  // ESTADOS REALES DE LA BASE DE DATOS Y SESIÓN
  const [reservasReales, setReservasReales] = useState([])
  const [clasesHoy, setClasesHoy] = useState([])
  const [nombreUsuario, setNombreUsuario] = useState("ATLETA") 
  const [creditosReales, setCreditosReales] = useState(0)      
  const [loadingReservas, setLoadingReservas] = useState(true)
  const [loadingClases, setLoadingClases] = useState(true)

  // Datos estáticos temporales para las tarjetas de progreso
  const userStats = {
    creditosUsados: 8,
    racha: 5,
    totalClases: 47,
  }

  // EFECTO 1: LEER SESIÓN, TRAER CRÉDITOS Y RESERVAS DEL ALUMNO
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const sesion = JSON.parse(localStorage.getItem("usuario") || localStorage.getItem("user") || "{}")
        
        if (sesion.nombrecompleto || sesion.nombre) {
          setNombreUsuario(sesion.nombrecompleto || sesion.nombre)
        }

        const responseReservas = await apiClient.get("/reservas/mis-reservas")
        const listaReservas = responseReservas.data?.data || responseReservas.data || []
        setReservasReales(listaReservas)

        if (sesion.idUsuario) {
          const responseUser = await apiClient.get(`/usuarios/${sesion.idUsuario}`)
          const datosUsuario = responseUser.data?.data || responseUser.data
          if (datosUsuario) {
            setCreditosReales(datosUsuario.creditos || 0)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
      } finally {
        setLoadingReservas(false)
      }
    }

    fetchDashboardData()
  }, [])

  // EFECTO 2: TRAER LAS CLASES OFRECIDAS HOY EN EL BOX
  useEffect(() => {
    const fetchClasesHoy = async () => {
      try {
        setLoadingClases(true)
        const response = await apiClient.get("/clases/disponibles")
        const allClases = response.data?.data || response.data || []
        
        // Obtenemos el día de la semana real del cliente
        const numeroDiaJs = new Date().getDay()
        
        // Mapeo exacto para contrastar con los strings en mayúscula de tu MariaDB
        const mapaDiasBD = { 
          0: "DOMINGO", 
          1: "LUNES", 
          2: "MARTES", 
          3: "MIERCOLES", 
          4: "JUEVES", 
          5: "VIERNES", 
          6: "SABADO" 
        }
        
        const diaBuscado = mapaDiasBD[numeroDiaJs] // Ej: "LUNES"

        // Filtranos usando la columna real 'clase.dia' que viene de tu base de datos
        const clasesFiltradasPorDia = allClases.filter(clase => {
          // Evaluamos 'clase.dia' (la misma propiedad que usamos en ReservarClasePage)
          const diaClase = clase.dia ? clase.dia.toUpperCase().trim() : ""
          return diaClase === diaBuscado && clase.estado === 'Activo'
        })
        
        // Ordenamos las clases de hoy por hora de inicio para que salgan en orden de grilla
        const clasesOrdenadas = clasesFiltradasPorDia.sort((a, b) => {
          return (a.horaInicio || "").localeCompare(b.horaInicio || "")
        })

        setClasesHoy(clasesOrdenadas.slice(0, 3)) 
      } catch (error) {
        console.error("Error al cargar las clases de hoy:", error)
      } finally {
        setLoadingClases(false)
      }
    }

    fetchClasesHoy()
  }, [])

  const proximasReservadas = reservasReales.filter(r => r.estadoReserva === 'proxima')

  return (
    <div className="space-y-6">
      {/* SECCIÓN DEL BANNER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-black/95 to-primary/20 border border-border">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/logo.jpg')] bg-center bg-no-repeat bg-contain opacity-10" />
        </div>
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1">
                  <Flame className="w-3 h-3 mr-1" />
                  {userStats.racha} dias de racha
                </Badge>
                <HelpTooltip content="Tu racha son los dias consecutivos que has asistido al gimnasio." />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                  {`¡VAMOS, ${nombreUsuario.toUpperCase()}!`}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Cada entrenamiento es una oportunidad para ser mejor
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/alumno/reservar">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold">
                    <Calendar className="mr-2 h-5 w-5" />
                    RESERVAR CLASE
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 dark:bg-black/50 backdrop-blur border border-border rounded-xl p-4 text-center relative">
                <div className="absolute top-2 right-2">
                  <HelpTooltip content="Creditos disponibles para reservar clases." iconClassName="h-3 w-3" />
                </div>
                <p className="text-3xl font-black text-primary">{loadingReservas ? "..." : creditosReales}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Creditos</p>
              </div>
              <div className="bg-background/50 dark:bg-black/50 backdrop-blur border border-border rounded-xl p-4 text-center relative">
                <div className="absolute top-2 right-2">
                  <HelpTooltip content="Total de clases tomadas en Bravos." iconClassName="h-3 w-3" />
                </div>
                <p className="text-3xl font-black text-accent">{userStats.totalClases}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Clases</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCESO RÁPIDO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/alumno/reservar" className="group">
          <Card className="bg-card border-border h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Reservar</h3>
              <p className="text-sm text-muted-foreground mt-1">Agendar clase</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/alumno/reservas" className="group">
          <Card className="bg-card border-border h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-bold text-foreground">Mis Clases</h3>
              <p className="text-sm text-muted-foreground mt-1">{proximasReservadas.length} reservadas</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/alumno/creditos" className="group">
          <Card className="bg-card border-border h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Créditos</h3>
              <p className="text-sm text-muted-foreground mt-1">{loadingReservas ? "..." : creditosReales} disponibles</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/alumno/perfil" className="group">
          <Card className="bg-card border-border h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-bold text-foreground">Logros</h3>
              <p className="text-sm text-muted-foreground mt-1">{logros.filter(l => l.completado).length}/{logros.length}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* SECCIÓN DOBLE: CLASES DISPONIBLES VS MIS RESERVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LADO IZQUIERDO: CLASES DE HOY */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">CLASES DE HOY</h2>
              </div>
              <Link to="/alumno/reservar">
                <Button variant="ghost" size="sm" className="text-primary font-semibold">
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {loadingClases ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando grilla horaria...</p>
              ) : clasesHoy.length > 0 ? (
                clasesHoy.map((clase) => (
                  <div
                    key={clase.idHorario || clase.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-black text-foreground">
                          {clase.horaInicio ? clase.horaInicio.split(":")[0] : "00"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {clase.horaInicio ? `:${clase.horaInicio.split(":")[1]}` : ":00"}
                        </p>
                      </div>
                      <div className="border-l border-border pl-4">
                        <p className="font-bold text-foreground">{clase.nombreClase || clase.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {clase.nombreProfesor || "Staff Bravos"} · {clase.duracion || "60 min"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={(clase.cupoDisponible ?? clase.cupos ?? 0) <= 3 ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"}
                      >
                        {clase.cupoDisponible ?? clase.cupos ?? 0} cupos
                      </Badge>
                      <Link to="/alumno/reservar">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold">
                          Reservar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay más clases programadas para hoy.</p>
              )}
            </div>
          </div>
        </Card>

        {/* LADO DERECHO: MIS RESERVAS */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-bold text-foreground">MIS RESERVAS</h2>
              </div>
              <Link to="/alumno/reservas">
                <Button variant="ghost" size="sm" className="text-primary font-semibold">
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loadingReservas ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando tu agenda...</p>
            ) : proximasReservadas.length > 0 ? (
              <div className="space-y-3">
                {proximasReservadas.slice(0, 3).map((reserva) => (
                  <div
                    key={reserva.idReserva}
                    className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-black text-primary">
                          {reserva.horaInicio ? reserva.horaInicio.substring(0, 2) : "00"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{reserva.nombreClase || reserva.clase}</p>
                        <p className="text-sm text-muted-foreground">
                          {reserva.fechaReserva ? reserva.fechaReserva.substring(0, 10) : "Hoy"} · {reserva.horaInicio ? reserva.horaInicio.substring(0, 5) : "00:00"}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Confirmada
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tienes reservas próximas</p>
                <Link to="/alumno/reservar">
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    Reservar ahora
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">TUS LOGROS</h3>
              <div className="flex gap-3">
                {logros.map((logro, index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      logro.completado 
                        ? "bg-accent/20 text-accent" 
                        : "bg-muted/20 text-muted-foreground opacity-50"
                    }`}
                    title={logro.nombre}
                  >
                    <logro.icono className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* TARJETA DE PROGRESO MENSUAL */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">PROGRESO MENSUAL</h3>
                <p className="text-sm text-muted-foreground">
                  Has completado {userStats.creditosUsados} de {creditosReales + userStats.creditosUsados} clases este mes
                </p>
                <div className="mt-3 w-64 h-3 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{
                      width: `${(userStats.creditosUsados / (creditosReales + userStats.creditosUsados || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-primary">
                {Math.round((userStats.creditosUsados / (creditosReales + userStats.creditosUsados || 1)) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">completado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}