import { useEffect, useState } from "react"
import { Users, Calendar, AlertTriangle, TrendingUp, UserCheck, Clock, DollarSign, Dumbbell } from "lucide-react"
import apiClient from "@/api"

const AVATAR_COLORS = [
  { bg: "bg-lime-400/15",   text: "text-lime-700 dark:text-lime-400" },
  { bg: "bg-sky-400/15",    text: "text-sky-700 dark:text-sky-400" },
  { bg: "bg-violet-400/15", text: "text-violet-700 dark:text-violet-400" },
  { bg: "bg-orange-400/15", text: "text-orange-700 dark:text-orange-400" },
  { bg: "bg-pink-400/15",   text: "text-pink-700 dark:text-pink-400" },
  { bg: "bg-teal-400/15",   text: "text-teal-700 dark:text-teal-400" },
]

function getInitials(name = "") {
  const partes = name.trim().split(/\s+/)
  if (!partes[0]) return "?"
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase()
}

// Días sin pagar: 30 o más en rojo, de 15 a 29 en amarillo, menos de 15 en verde
function colorDias(dias) {
  if (dias >= 30) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
  if (dias >= 15) return "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/20"
  return "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20"
}

function getAvatarColor(name = "") {
  const suma = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[suma % AVATAR_COLORS.length]
}

export default function AdminDashboard() {
  const [tarjetas, setTarjetas] = useState({
    totalUsuarios: "...",
    usuariosActivos: "...",
    ingresosMes: "...",
    membresiasPorVencer: "..."
  })
  const [suspendedUsers, setSuspendedUsers] = useState([])
  const [clasesHoy, setClasesHoy] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [pestana, setPestana] = useState("sinPago")
  const permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
  // Solo oculta la pantalla: el permiso real lo controla el servidor en /dashboard/metrics
  const puedeVer = permisos.includes('dashboard:consulta')

  useEffect(() => {
    if (!puedeVer) return
    const fetchDashboardStats = async () => {
      try {
        const response = await apiClient.get("/dashboard/metrics")
        const resData = response.data?.data || response.data
        if (resData) {
          setTarjetas(resData.tarjetas)
          setSuspendedUsers(resData.suspendedUsers || [])
          setClasesHoy(resData.clasesDeHoy || [])
          setRecentActivity(resData.recentActivity || [])
        }
      } catch (error) {
        console.error("Error al sincronizar métricas del administrador:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardStats()
  }, [puedeVer])

  const ingresosFormateados = typeof tarjetas.ingresosMes === "number"
    ? `$${tarjetas.ingresosMes.toLocaleString("es-AR")}`
    : tarjetas.ingresosMes

  // Los textos de abajo salen de los datos reales (antes había porcentajes fijos, "+12%" y "+8%")
  const total = Number(tarjetas.totalUsuarios) || 0
  const activos = Number(tarjetas.usuariosActivos) || 0
  const porcentajeActivos = total > 0 ? Math.round((activos / total) * 100) : 0
  const statsLayout = [
    { title: "Total Usuarios",        value: tarjetas.totalUsuarios,        sub: "Alumnos registrados", type: "neutral",  icon: Users },
    { title: "Usuarios Activos",      value: tarjetas.usuariosActivos,      sub: total > 0 ? `${porcentajeActivos}% del total` : "Sin alumnos todavía", type: "positive", icon: UserCheck },
    { title: "Ingresos del Mes",      value: ingresosFormateados,           sub: "Pagos confirmados",type: "positive", icon: DollarSign },
    { title: "Membresías por Vencer", value: tarjetas.membresiasPorVencer,  sub: "En período de renovación", type: "warning",  icon: Clock },
  ]

  const statStyle = {
    neutral:  { border: "border-l-foreground/20", badgeBg: "bg-foreground/10",  icon: "text-foreground/50", sub: "text-foreground/40" },
    positive: { border: "border-l-lime-600 dark:border-l-lime-400",     badgeBg: "bg-lime-400/15",    icon: "text-lime-700 dark:text-lime-400",     sub: "text-lime-700 dark:text-lime-400" },
    warning:  { border: "border-l-yellow-600 dark:border-l-yellow-400", badgeBg: "bg-yellow-400/15",  icon: "text-yellow-700 dark:text-yellow-400", sub: "text-yellow-700 dark:text-yellow-400" },
  }

  const formatearActividad = (fechaOrden) => {
    if (!fechaOrden) return { fecha: '-', hora: null }
    const d = new Date(fechaOrden)
    if (isNaN(d.getTime())) return { fecha: '-', hora: null }
    const hoy = new Date()
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
    const esHoy  = d.toDateString() === hoy.toDateString()
    const esAyer = d.toDateString() === ayer.toDateString()
    const fecha = esHoy ? 'Hoy' : esAyer ? 'Ayer' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    const h = d.getHours(), m = d.getMinutes()
    const hora = (h === 0 && m === 0) ? null : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return { fecha, hora }
  }

  const actividadIcon = (action = '') => {
    if (action.toLowerCase().includes('pago')) return <DollarSign className="h-3.5 w-3.5 text-lime-700 dark:text-lime-400" />
    if (action.toLowerCase().includes('reserv')) return <Calendar className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
    return <TrendingUp className="h-3.5 w-3.5 text-foreground/30" />
  }

  // Contenido de las tres listas: en el celular van en pestañas y en la computadora, en tarjetas
  const listaActividad = (
    <>{loading ? (
      <p className="text-sm text-foreground/40 text-center py-8">Cargando...</p>
    ) : recentActivity.length === 0 ? (
      <p className="text-sm text-foreground/40 text-center py-8">Sin actividad reciente.</p>
    ) : (
      <div className="divide-y divide-border">
        {recentActivity.map((activity, index) => {
          const { fecha, hora } = formatearActividad(activity.fecha_orden)
          return (
            <div key={index} className="flex items-center gap-3 px-5 py-3 hover:bg-foreground/[0.02] transition-colors">
              <div className="shrink-0 w-7 h-7 rounded-full bg-lime-400/10 flex items-center justify-center">
                {actividadIcon(activity.action)}
              </div>
              <p className="flex-1 text-sm text-foreground/70 min-w-0 truncate">
                <span className="font-bold text-foreground">{activity.user}</span>{" "}
                {activity.action}
              </p>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-foreground/40">{fecha}</p>
                {hora && <p className="text-[11px] text-foreground/30">{hora} hs</p>}
              </div>
            </div>
          )
        })}
      </div>
    )}</>
  )

  const listaSinPago = (
      <>{loading ? (
        <p className="text-sm text-foreground/40 text-center py-8">Buscando...</p>
      ) : suspendedUsers.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-lime-700 dark:text-lime-400 font-semibold">¡Todo en orden!</p>
          <p className="text-xs text-foreground/40 mt-1">No hay usuarios suspendidos.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {suspendedUsers.map((user) => {
            const avatar = getAvatarColor(user.name)
            return (
              <div key={user.dni} className="flex items-center gap-3 px-5 py-3 hover:bg-foreground/[0.02] transition-colors">
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black ${avatar.bg} ${avatar.text}`}>
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-foreground/40 mt-0.5 truncate">{user.email || "sin correo"}</p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md shrink-0 ${colorDias(user.daysOverdue)}`}>
                  {user.daysOverdue <= 0 ? "Sin créditos" : `${user.daysOverdue} días`}
                </span>
              </div>
            )
          })}
        </div>
      )}</>
  )

  const listaClases = (
    <>{loading ? (
      <p className="text-sm text-foreground/40 text-center py-8">Sincronizando...</p>
    ) : clasesHoy.length === 0 ? (
      <div className="px-5 py-8 text-center">
        <Dumbbell className="h-8 w-8 text-foreground/15 mx-auto mb-2" />
        <p className="text-sm text-foreground/40">No hay clases programadas para hoy.</p>
      </div>
    ) : (
      <div className="divide-y divide-border">
        {clasesHoy.map((cls, index) => {
          const lleno = cls.spots && cls.spots.includes('/') && cls.spots.split('/')[0] === cls.spots.split('/')[1]
          return (
            <div key={index} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/[0.02] transition-colors gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-black text-foreground/50 w-12 shrink-0">{cls.time}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{cls.name}</p>
                  <p className="text-[11px] text-foreground/40 truncate">{cls.coach}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md shrink-0 ${lleno ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" : "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20"}`}>
                {cls.spots || "0/0"}
              </span>
            </div>
          )
        })}
      </div>
    )}</>
  )

  if (!puedeVer) return null

  const PESTANAS = [
    { id: "actividad", label: "Actividad reciente" },
    { id: "sinPago", label: "Sin pago", cantidad: suspendedUsers.length },
    { id: "clases", label: "Clases de hoy" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Resumen</h1>
        <p className="text-sm text-foreground/40 mt-1">Panel de administración - Bravos Gym</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* ── Columna izquierda: stats + actividad ── */}
        <div className="space-y-6">
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 gap-3">
            {statsLayout.map((stat) => {
              const s = statStyle[stat.type]
              return (
                <div key={stat.title} className={`rounded-xl border border-border border-l-2 ${s.border} bg-card px-5 py-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">{stat.title}</p>
                      <p className="text-4xl font-black text-foreground mt-2 leading-none">{stat.value}</p>
                      <p className={`text-[11px] font-semibold mt-2 ${s.sub}`}>{stat.sub}</p>
                    </div>
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${s.badgeBg}`}>
                      <stat.icon className={`h-4 w-4 ${s.icon}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CELULAR: las tres listas en pestañas */}
          <div className="lg:hidden">
            <div role="tablist" aria-label="Detalle del resumen" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">
              {PESTANAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={pestana === p.id}
                  onClick={() => setPestana(p.id)}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-1 text-center text-[10px] font-black uppercase leading-tight tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                    pestana === p.id ? "bg-foreground/10 text-foreground" : "text-foreground/55 hover:text-foreground"
                  }`}
                >
                  {p.label}
                  {!loading && p.cantidad > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] text-white">{p.cantidad}</span>
                  )}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="mt-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-black uppercase tracking-wide text-foreground">
                  {pestana === "sinPago" ? "Usuarios sin pago" : pestana === "clases" ? "Clases de hoy" : "Actividad reciente"}
                </p>
                {pestana === "sinPago" && !loading && suspendedUsers.length > 0 && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    {suspendedUsers.length} {suspendedUsers.length === 1 ? "usuario" : "usuarios"}
                  </span>
                )}
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {pestana === "sinPago" ? listaSinPago : pestana === "clases" ? listaClases : listaActividad}
              </div>
            </div>
          </div>

          {/* ACTIVIDAD RECIENTE (computadora) */}
          <div className="hidden rounded-xl border border-border bg-card lg:block">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-foreground/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actividad Reciente</p>
            </div>

            {listaActividad}
          </div>
        </div>

        {/* ── Columna derecha (computadora): sin pago + clases de hoy ── */}
        <div className="hidden space-y-6 lg:block">
          {/* SIN PAGO */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sin pago</p>
              </div>
              {!loading && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border border-yellow-400/20 rounded-md">
                  {suspendedUsers.length} {suspendedUsers.length === 1 ? 'usuario' : 'usuarios'}
                </span>
              )}
            </div>

            {listaSinPago}
          </div>

          {/* CLASES DE HOY */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-foreground/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clases de hoy</p>
            </div>

            {listaClases}
          </div>
        </div>
      </div>
    </div>
  )
}

