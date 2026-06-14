import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  ChevronRight, 
  Flame,
  Dumbbell,
  Timer,
  Trophy,
  Users,
  TrendingUp,
  Play,
  Zap
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpTooltip } from "@/components/ui/help-tooltip"
// 🟢 Importación corregida apuntando a tu cliente centralizado de Axios
import apiClient from "@/api" 

const todayWOD = {
  nombre: "FRAN",
  tipo: "FOR TIME",
  descripcion: "21-15-9",
  ejercicios: [
    { nombre: "Thrusters", peso: "43/30 kg" },
    { nombre: "Pull-ups", peso: "" },
  ],
  tiempoCap: "10 min",
  nivel: "RX",
}

const logros = [
  { nombre: "Primera Clase", icono: Trophy, completado: true },
  { nombre: "Racha 5 días", icono: Flame, completado: true },
  { nombre: "10 WODs RX", icono: Dumbbell, completado: false },
  { nombre: "Primer PR", icono: TrendingUp, completado: true },
]

export default function AlumnoDashboard() {
  const [wodExpanded, setWodExpanded] = useState(false)
  
  // 🟢 ESTADOS REALES DE LA BASE DE DATOS
  const [reservasReales, setReservasReales] = useState([])
  const [clasesHoy, setClasesHoy] = useState([])
  const [nombreUsuario, setNombreUsuario] = useState("FABRICIO") 
  const [loadingReservas, setLoadingReservas] = useState(true)
  const [loadingClases, setLoadingClases] = useState(true)

  // Datos estáticos temporales (para las tarjetas que delegamos para más adelante)
  const userStats = {
    creditos: 12,
    creditosUsados: 8,
    racha: 5,
    totalClases: 47,
  }

  // 🟢 EFECTO 1: TRAER LAS RESERVAS DEL ALUMNO
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get("/reservas/mis-reservas")
        const listaReservas = response.data?.data || response.data || []
        setReservasReales(listaReservas)
        setNombreUsuario("FABRICIO LUIS BAEZ")
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
      } finally {
        setLoadingReservas(false)
      }
    }

    fetchDashboardData()
  }, [])

  // 🟢 EFECTO 2: TRAER LAS CLASES OFRECIDAS HOY EN EL BOX
 useEffect(() => {
    const fetchClasesHoy = async () => {
      try {
        const response = await apiClient.get("/clases/disponibles")
        const allClases = response.data?.data || response.data || []
        
        
        const numeroDiaJs = new Date().getDay()
        
        // Mapeamos al formato en español que usás en tu base de datos
        const mapeoDias = [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado"
        ]
        const diaActualTexto = mapeoDias[numeroDiaJs] // Ej: "Domingo"

        // 2. Filtramos para quedarnos únicamente con las clases que incluyan el día de hoy
        const clasesFiltradasPorDia = allClases.filter(clase => {
          if (!clase.diasSemana) return false
          
          // Limpiamos espacios y acentos para evitar fallos de coincidencia
          const diasNormalizados = clase.diasSemana
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          const hoyNormalizado = diaActualTexto
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")

          return diasNormalizados.includes(hoyNormalizado)
        })
        
        // 3. Pasamos al estado solo las clases del día real
        setClasesHoy(clasesFiltradasPorDia.slice(0, 3)) 
      } catch (error) {
        console.error("Error al cargar las clases de hoy:", error)
      } finally {
        setLoadingClases(false)
      }
    }

    fetchClasesHoy()
  }, [])

  // Filtramos las reservas con estado 'proxima' para los contadores y lista derecha
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
                <HelpTooltip content="Tu racha son los dias consecutivos que has asistido al gimnasio. Manten tu racha para desbloquear logros especiales!" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                  {/* 🟢 SALUDO PERSONALIZADO CON NOMBRE REAL */}
                  {`¡VAMOS, ${nombreUsuario.toUpperCase()}!`}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Cada WOD es una oportunidad para ser mejor
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/alumno/reservar">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold">
                    <Calendar className="mr-2 h-5 w-5" />
                    RESERVAR CLASE
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  <Play className="mr-2 h-5 w-5" />
                  VER WOD DE HOY
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/50 backdrop-blur border border-border rounded-xl p-4 text-center relative">
                <div className="absolute top-2 right-2">
                  <HelpTooltip content="Creditos disponibles para reservar clases. Cada clase consume 1 credito." iconClassName="h-3 w-3" />
                </div>
                <p className="text-3xl font-black text-primary">{userStats.creditos}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Creditos</p>
              </div>
              <div className="bg-black/50 backdrop-blur border border-border rounded-xl p-4 text-center relative">
                <div className="absolute top-2 right-2">
                  <HelpTooltip content="Total de clases que has tomado desde que te registraste en Bravos." iconClassName="h-3 w-3" />
                </div>
                <p className="text-3xl font-black text-accent">{userStats.totalClases}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Clases</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN WOD DEL DÍA */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-transparent p-1">
          <div className="bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-foreground tracking-tight">WOD DEL DIA</h2>
                    <HelpTooltip content="El WOD (Workout of the Day) es el entrenamiento programado para hoy. Incluye los ejercicios, repeticiones y tiempo limite." />
                  </div>
                  <p className="text-sm text-muted-foreground">Workout of the Day</p>
                </div>
              </div>
              <Badge className="bg-accent/20 text-accent border-accent/30 font-bold">
                {todayWOD.nivel}
              </Badge>
            </div>

            <div 
              className="bg-black/30 rounded-xl p-6 border border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setWodExpanded(!wodExpanded)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">{todayWOD.tipo}</span>
                  <h3 className="text-3xl font-black text-foreground mt-1">{`"${todayWOD.nombre}"`}</h3>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm font-medium">CAP: {todayWOD.tiempoCap}</span>
                </div>
              </div>

              <p className="text-4xl font-black text-primary mb-4">{todayWOD.descripcion}</p>

              <div className="space-y-2">
                {todayWOD.ejercicios.map((ejercicio, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-accent" />
                    <span className="text-foreground font-medium">{ejercicio.nombre}</span>
                    {ejercicio.peso && (
                      <span className="text-muted-foreground text-sm">({ejercicio.peso})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

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
              {/* 🟢 CONTADOR DE RESERVAS ACTIVAS REALES */}
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
              <p className="text-sm text-muted-foreground mt-1">{userStats.creditos} disponibles</p>
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
        
        {/* LADO IZQUIERDO: CLASES DE HOY (OFERTA DEL BOX) */}
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
                        className={(clase.cuposDisponibles || clase.cupos) <= 3 ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"}
                      >
                        {clase.cuposDisponibles ?? clase.cupos} cupos
                      </Badge>
                      <Link to="/alumno/reservar">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold">
                          <Zap className="h-3 w-3 mr-1" />
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

        {/* LADO DERECHO: MIS RESERVAS (AGENDA REAL DEL ALUMNO DESDE LA BD) */}
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
                          {reserva.fechaReserva ? reserva.fechaReserva.substring(0, 10) : "Hoy"} · {reserva.horaInicio ? reserva.horaInicio.substring(0, 5) : "00:00"} · {reserva.nombreProfesor || "Staff Bravos"}
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

      {/* TARJETA DE PROGRESO MENSUAL ESTÁTICA (IGNORADA TEMPORALMENTE) */}
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
                  Has completado {userStats.creditosUsados} de {userStats.creditos + userStats.creditosUsados} clases este mes
                </p>
                <div className="mt-3 w-64 h-3 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{
                      width: `${(userStats.creditosUsados / (userStats.creditos + userStats.creditosUsados)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-primary">{Math.round((userStats.creditosUsados / (userStats.creditos + userStats.creditosUsados)) * 100)}%</p>
              <p className="text-sm text-muted-foreground">completado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}