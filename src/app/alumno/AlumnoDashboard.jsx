import { useState, useEffect } from "react"
import apiClient from "@/api"
import { logrosConEstado, sincronizarLogros } from "@/lib/logros"
import { mensajeBienvenida } from "@/lib/mensajeBienvenida"
import { toast } from "@/lib/notificar"
import LogroCelebracion from "@/components/LogroCelebracion"
import NovedadesPortada from "@/components/NovedadesPortada"
import { useMiPlan } from "@/lib/miPlan"
import { useAnchoPanel } from "@/lib/useEscritorio"
import DashboardMovil from "./DashboardMovil"
import ResumenEscritorio from "./ResumenEscritorio"

export default function AlumnoDashboard() {
  // ESTADOS REALES DE LA BASE DE DATOS Y SESIÓN
  const [reservasReales, setReservasReales] = useState([])
  const [clasesHoy, setClasesHoy] = useState([])
  const [nombreUsuario, setNombreUsuario] = useState("ATLETA") 
  const [creditosReales, setCreditosReales] = useState(0)      
  const [loadingReservas, setLoadingReservas] = useState(true)
  const [loadingClases, setLoadingClases] = useState(true)
  const [membresia, setMembresia] = useState(null)
  const escritorio = useAnchoPanel() // desde 1024 px: diseño de escritorio; por debajo, el del celular
  const [errorDatos, setErrorDatos] = useState(false)
  const [errorClases, setErrorClases] = useState(false)
  const [intento, setIntento] = useState(0) // sube al tocar "Reintentar": vuelve a cargar los datos
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
  // Frase del saludo: depende de cuánto viene a entrenar
  const ultimaClase = todasCompletadas.reduce((max, r) => { const d = String(r.fechaReserva).slice(0, 10); return d > max ? d : max }, "") || null
  // Progreso mensual: siempre el mes actual (antes tomaba el mes de la primera clase de la lista)
  const mesRef      = hoyDate.getMonth()
  const anioRef     = hoyDate.getFullYear()
  const diasEnMes   = new Date(anioRef, mesRef + 1, 0).getDate()
  const nombreMes   = new Date(anioRef, mesRef, 1).toLocaleDateString("es-AR", { month: "long" })
  const mesActualTxt = `${anioRef}-${String(mesRef + 1).padStart(2, "0")}`

  // Se compara el texto "AAAA-MM" de la fecha: con new Date() la zona horaria puede correr el día al mes anterior
  const clasesCompletadasEsteMes = todasCompletadas.filter(r =>
    String(r.fechaReserva || "").slice(0, 7) === mesActualTxt
  ).length

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
      setErrorDatos(false)
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
        setErrorDatos(true)
        toast.error("No se pudieron cargar tus datos", { description: "Probá recargar la página.", guardar: false })
      } finally {
        setLoadingReservas(false)
      }
    }

    fetchDashboardData()
  }, [intento])

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
        setErrorClases(false)
        const response = await apiClient.get("/clases/para-mi")
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
        setErrorClases(true)
        toast.error("No se pudieron cargar las clases de hoy", { guardar: false })
      } finally {
        setLoadingClases(false)
      }
    }

    fetchClasesHoy()
  }, [intento])

  const proximasReservadas = reservasReales.filter(r => r.estadoReserva === 'proxima')
  const fraseBienvenida = mensajeBienvenida({ cargando: loadingReservas, totalClases: todasCompletadas.length, racha: userStats.racha, ultimaClase, agendadas: proximasReservadas.length })

  // Estado de la membresía y nombre de los planes vigentes (celular y escritorio)
  const estadoMembresia = (miPlan || membresia)
    ? (miPlan
        ? (!miPlan.vigente ? 'vencida' : miPlan.porVencer ? 'por_vencer' : 'activa')
        : (membresia === 'por_vencer' ? 'por_vencer' : (membresia === 'activa' || membresia === 'vigente') ? 'activa' : 'vencida'))
    : null
  const nombrePlanesMovil = miPlan?.vigente ? [...new Set(miPlan.planes.map((pl) => pl.nombrePlan))].join(' + ') : null

  const reintentar = () => {
    setLoadingReservas(true)
    setLoadingClases(true)
    setIntento((n) => n + 1)
  }

  if (escritorio) {
    return (
      <>
        <LogroCelebracion logros={logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />
        <ResumenEscritorio
          nombreUsuario={nombreUsuario}
          frase={fraseBienvenida}
          racha={userStats.racha}
          creditos={creditosReales}
          totalClases={userStats.totalClases}
          cargando={loadingReservas}
          errorDatos={errorDatos}
          onReintentar={reintentar}
          logros={logros}
          estadoMembresia={estadoMembresia}
          nombrePlanes={nombrePlanesMovil}
          miPlan={miPlan}
          proximasReservadas={proximasReservadas}
          clasesHoy={clasesHoy}
          cargandoClases={loadingClases}
          errorClases={errorClases}
          clasesSemanales={clasesSemanales}
          metaSemanal={metaSemanal}
          clasesMes={clasesCompletadasEsteMes}
          diasEnMes={diasEnMes}
          nombreMes={nombreMes}
          totalMarcas={statsMarcas.totalMarcas}
        />
      </>
    )
  }

  return (
    <>
      <LogroCelebracion logros={logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />

      {/* CELULAR: diseño propio (DashboardMovil.jsx) */}
      <div>
        <DashboardMovil
          nombreUsuario={nombreUsuario}
          frase={fraseBienvenida}
          racha={userStats.racha}
          creditos={creditosReales}
          cargando={loadingReservas}
          agendadas={proximasReservadas.length}
          estadoMembresia={estadoMembresia}
          nombrePlanes={nombrePlanesMovil}
          miPlan={miPlan}
          logros={logros}
          clasesHoy={clasesHoy}
          cargandoClases={loadingClases}
          proximasReservadas={proximasReservadas}
          clasesSemanales={clasesSemanales}
          metaSemanal={metaSemanal}
          clasesMes={clasesCompletadasEsteMes}
          diasEnMes={diasEnMes}
          nombreMes={nombreMes}
          totalMarcas={statsMarcas.totalMarcas}
        />
      </div>

      {/* Novedades al final de la página: las últimas tres y "Todas" lleva a la lista completa */}
      <div className="px-4 pb-6 pt-6">
        <NovedadesPortada compacta limite={3} />
      </div>
    </>
  )
}
