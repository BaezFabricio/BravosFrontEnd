import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  ChevronRight, 
  Flame,
  Trophy,
  Users,
  TrendingUp,
  Calculator
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import apiClient from "@/api" 
import { logrosConEstado, sincronizarLogros } from "@/lib/logros"
import LogroCelebracion from "@/components/LogroCelebracion"
import { useMiPlan, fmtFechaPlan } from "@/lib/miPlan"

export default function AlumnoDashboard() {
  // ESTADOS REALES DE LA BASE DE DATOS Y SESIÓN
  const [reservasReales, setReservasReales] = useState([])
  const [clasesHoy, setClasesHoy] = useState([])
  const [nombreUsuario, setNombreUsuario] = useState("ATLETA") 
  const [creditosReales, setCreditosReales] = useState(0)      
  const [loadingReservas, setLoadingReservas] = useState(true)
  const [loadingClases, setLoadingClases] = useState(true)
  const [membresia, setMembresia] = useState(null)
  const navigate = useNavigate()
  const { data: miPlan } = useMiPlan()
  const [marcasCargadas, setMarcasCargadas] = useState(false)
  const [logrosNuevos, setLogrosNuevos] = useState([])
  const [statsMarcas, setStatsMarcas] = useState({ totalMarcas: 0, superaciones: 0, ejerciciosDistintos: 0, maxPeso: 0 })

  const hoyDate = new Date()

  // Buscar el mes con más actividad: si hay completadas, usar su mes; si no, usar el mes actual
  const todasCompletadas = reservasReales.filter(r => r.estadoReserva?.toLowerCase() === "completada")

  // Racha: días consecutivos con clase completada, contando hasta hoy (o ayer si hoy aún no asistió)
  const calcularRacha = () => {
    const dias = new Set(todasCompletadas.map(r => String(r.fechaReserva).slice(0, 10)))
    const aStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const cursor = new Date()
    cursor.setHours(12, 0, 0, 0)
    if (!dias.has(aStr(cursor))) cursor.setDate(cursor.getDate() - 1)
    let racha = 0
    while (dias.has(aStr(cursor))) {
      racha++
      cursor.setDate(cursor.getDate() - 1)
    }
    return racha
  }

  // Estadísticas reales, derivadas del historial de reservas completadas
  const userStats = {
    racha: calcularRacha(),
    totalClases: todasCompletadas.length,
    ...statsMarcas,
  }
  const logros = logrosConEstado(userStats)
  const mesReferencia = todasCompletadas.length > 0
    ? new Date(todasCompletadas[0].fechaReserva)
    : hoyDate
  const mesRef      = mesReferencia.getUTCMonth()
  const anioRef     = mesReferencia.getUTCFullYear()
  const diasEnMes   = new Date(anioRef, mesRef + 1, 0).getDate()
  const nombreMes   = new Date(anioRef, mesRef, 1).toLocaleDateString("es-AR", { month: "long" })

  const clasesCompletadasEsteMes = todasCompletadas.filter(r => {
    const f = new Date(r.fechaReserva)
    return f.getUTCFullYear() === anioRef && f.getUTCMonth() === mesRef
  }).length

  // Progreso semanal: lunes a viernes de la semana actual
  const lunesActual = (() => {
    const d = new Date(hoyDate)
    const dia = d.getDay() === 0 ? 7 : d.getDay()
    d.setDate(d.getDate() - (dia - 1))
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const viernesActual = new Date(lunesActual)
  viernesActual.setDate(lunesActual.getDate() + 4)
  viernesActual.setHours(23, 59, 59, 999)

  const clasesSemanales = todasCompletadas.filter(r => {
    const f = new Date(r.fechaReserva)
    return f >= lunesActual && f <= viernesActual
  }).length
  const metaSemanal = 5

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
            setMembresia(datosUsuario.membresia || null)
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

  // Estadísticas de marcas personales (para los logros del módulo de marcas)
  useEffect(() => {
    apiClient.get("/marcas/resumen")
      .then((r) => setStatsMarcas(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setMarcasCargadas(true))
  }, [])

  // Registrar logros cumplidos: los recién desbloqueados disparan la celebración y la notificación
  const codigosCumplidos = logros.filter(l => l.completado).map(l => l.codigo).join(",")
  useEffect(() => {
    if (loadingReservas || !marcasCargadas || !codigosCumplidos) return
    sincronizarLogros(codigosCumplidos.split(",")).then((nuevos) => {
      if (nuevos.length) setLogrosNuevos((prev) => [...prev, ...nuevos])
    })
  }, [loadingReservas, marcasCargadas, codigosCumplidos])

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
        const hoyStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`
        const clasesFiltradasPorDia = allClases.filter(clase => {
          if (clase.estado !== 'Activo') return false
          if (clase.fechaEspecifica) return clase.fechaEspecifica.split('T')[0] === hoyStr
          const diaClase = clase.dia ? clase.dia.toUpperCase().trim() : ""
          return diaClase === diaBuscado
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
      <LogroCelebracion logros={logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />
      {/* SECCIÓN DEL BANNER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-sidebar border border-sidebar-border">
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-lime-400/20 text-lime-700 dark:text-lime-400 border border-lime-400/30 font-bold px-3 py-1">
                  <Flame className="w-3 h-3 mr-1" />
                  {userStats.racha === 0 ? "Sin racha" : `${userStats.racha} ${userStats.racha === 1 ? "dia" : "dias"} de racha`}
                </Badge>
                <HelpTooltip content="Tu racha son los dias consecutivos que has asistido al gimnasio." className="text-sidebar-foreground/40 hover:text-sidebar-foreground" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-sidebar-foreground tracking-tight">
                  {`¡VAMOS, ${nombreUsuario.toUpperCase()}!`}
                </h1>
                <p className="text-lg text-sidebar-foreground/60 mt-1">
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
              <div className="pt-1">
                <p className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Tus logros</p>
                <div className="flex gap-3">
                  {logros.map((logro) => (
                    <div key={logro.codigo} className="group relative">
                      <button
                        type="button"
                        aria-label={logro.nombre}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${
                          logro.completado
                            ? "bg-lime-400/20 text-lime-700 dark:text-lime-400"
                            : "bg-sidebar-accent text-sidebar-foreground/30"
                        }`}
                      >
                        <logro.icono className="h-4 w-4" />
                      </button>
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-0 mb-2 z-20 w-52 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-left shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                      >
                        <p className="text-xs font-black uppercase tracking-wide text-sidebar-foreground">{logro.nombre}</p>
                        <p className="mt-0.5 text-xs text-sidebar-foreground/60">{logro.descripcion}</p>
                        <p className={`mt-1.5 text-[10px] font-black uppercase tracking-widest ${logro.completado ? "text-lime-700 dark:text-lime-400" : "text-sidebar-foreground/40"}`}>
                          {logro.completado ? "✓ Desbloqueado" : "Bloqueado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sidebar-accent border border-sidebar-border rounded-xl p-4 text-center relative">
                  <div className="absolute top-2 right-2">
                    <HelpTooltip content="Creditos disponibles para reservar clases." iconClassName="h-3 w-3" className="text-sidebar-foreground/40 hover:text-sidebar-foreground" />
                  </div>
                  <p className="text-3xl font-black text-lime-700 dark:text-lime-400">{loadingReservas ? "..." : creditosReales}</p>
                  <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">Creditos</p>
                </div>
                <div className="bg-sidebar-accent border border-sidebar-border rounded-xl p-4 text-center relative">
                  <div className="absolute top-2 right-2">
                    <HelpTooltip content="Total de clases tomadas en Bravos." iconClassName="h-3 w-3" className="text-sidebar-foreground/40 hover:text-sidebar-foreground" />
                  </div>
                  <p className="text-3xl font-black text-lime-700 dark:text-lime-400">{userStats.totalClases}</p>
                  <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">Clases</p>
                </div>
              </div>
              {(miPlan || membresia) && (() => {
                // El estado sale del plan real (créditos vigentes); si todavía no cargó, del dato general del usuario.
                const estado = miPlan
                  ? (!miPlan.vigente ? 'vencida' : miPlan.porVencer ? 'por_vencer' : 'activa')
                  : (membresia === 'por_vencer' ? 'por_vencer' : (membresia === 'activa' || membresia === 'vigente') ? 'activa' : 'vencida')
                const meta = {
                  activa:     { label: 'Activa',     cls: 'bg-lime-400/10 border-lime-400/30 text-lime-700 dark:text-lime-400', dot: 'bg-lime-500 dark:bg-lime-400' },
                  por_vencer: { label: 'Por vencer', cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
                  vencida:    { label: 'Vencida',    cls: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
                }[estado]
                const nombrePlanes = miPlan?.vigente ? [...new Set(miPlan.planes.map((pl) => pl.nombrePlan))].join(' + ') : null
                return (
                  <div className="rounded-xl p-4 border border-sidebar-border bg-sidebar-accent space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/50">Mi membresía</p>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border rounded-full px-2.5 py-0.5 ${meta.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    <div>
                      {nombrePlanes ? (
                        <>
                          <p className="text-base font-black uppercase tracking-tight text-sidebar-foreground truncate">{nombrePlanes}</p>
                          <p className="text-[11px] text-sidebar-foreground/50">Vence el {fmtFechaPlan(miPlan.proximoVencimiento)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-black uppercase tracking-tight text-sidebar-foreground">Sin membresía vigente</p>
                          <p className="text-[11px] text-sidebar-foreground/50">
                            {miPlan?.ultimoPlan ? `Tu última membresía fue ${miPlan.ultimoPlan.nombrePlan}` : 'Contratá una membresía para reservar clases'}
                          </p>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate('/alumno/plan')}
                      className="w-full bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wide"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {estado !== 'activa' ? 'Renovar membresía' : 'Renovar / contratar membresía'}
                    </Button>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCESO RÁPIDO (en el celular llevan título para separarlos del resto) */}
      <section className="space-y-3">
      <div className="lg:hidden flex items-center gap-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Accesos rápidos</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
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

        <Link to="/alumno/calculadora-rm" className="group">
          <Card className="bg-card border-border h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calculator className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Calculadora RM</h3>
              <p className="text-sm text-muted-foreground mt-1">Calculá tu 1RM</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/alumno/marcas" className="group">
          <Card className="bg-card border-border h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-bold text-foreground">Mis Marcas</h3>
              <p className="text-sm text-muted-foreground mt-1">{statsMarcas.totalMarcas} {statsMarcas.totalMarcas === 1 ? "registrada" : "registradas"}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      </section>

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
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-foreground/5 border border-border hover:border-primary/30 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center min-w-[44px]">
                        <p className="text-xl font-black text-foreground leading-none">
                          {clase.horaInicio ? clase.horaInicio.split(":")[0] : "00"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {clase.horaInicio ? `:${clase.horaInicio.split(":")[1]}` : ":00"}
                        </p>
                      </div>
                      <div className="border-l border-border pl-3 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{clase.nombreClase || clase.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {clase.nombreProfesor || "Staff Bravos"} · {clase.duracion || "60 min"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`hidden sm:inline-flex ${(clase.cupoDisponible ?? clase.cupos ?? 0) <= 3 ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"}`}
                      >
                        {clase.cupoDisponible ?? clase.cupos ?? 0}
                      </Badge>
                      <Link to="/alumno/reservar">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold text-xs px-3">
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

          </div>
        </Card>
      </div>

      {/* TARJETA DE PROGRESO */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              {/* Semanal */}
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">PROGRESO SEMANAL</h3>
                  <p className="text-2xl sm:text-3xl font-black text-primary shrink-0">
                    {clasesSemanales}/{metaSemanal}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Clases completadas esta semana
                </p>
                <div className="mt-2 w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: `${Math.min((clasesSemanales / metaSemanal) * 100, 100)}%` }}
                  />
                </div>
              </div>
              {/* Mensual */}
              <div className="border-t border-border pt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">PROGRESO MENSUAL</h3>
                  <p className="text-2xl sm:text-3xl font-black text-primary shrink-0">
                    {Math.round((clasesCompletadasEsteMes / diasEnMes) * 100)}%
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {clasesCompletadasEsteMes} clases en {nombreMes}
                </p>
                <div className="mt-2 w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: `${Math.min((clasesCompletadasEsteMes / diasEnMes) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}