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
  const permisos = JSON.parse(localStorage.getItem('permisos') || '[]');

  if (!permisos.includes('dashboard:consulta')) {
    return null;
  }

  useEffect(() => {
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
  }, [])

  const ingresosFormateados = typeof tarjetas.ingresosMes === "number"
    ? `$${tarjetas.ingresosMes.toLocaleString("es-AR")}`
    : tarjetas.ingresosMes

  const statsLayout = [
    { title: "Total Usuarios",        value: tarjetas.totalUsuarios,        sub: "+12%",            type: "neutral",  icon: Users },
    { title: "Usuarios Activos",      value: tarjetas.usuariosActivos,      sub: "+8%",             type: "positive", icon: UserCheck },
    { title: "Ingresos del Mes",      value: ingresosFormateados,           sub: "Pagos confirmados",type: "positive", icon: DollarSign },
    { title: "Membresías por Vencer", value: tarjetas.membresiasPorVencer,  sub: "Próximos 7 días",  type: "warning",  icon: Clock },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Resumen</h1>
        <p className="text-sm text-foreground/40 mt-1">Panel de administracion - Bravos Gym</p>
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

          {/* ACTIVIDAD RECIENTE */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-foreground/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actividad Reciente</p>
            </div>

            {loading ? (
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
            )}
          </div>
        </div>

        {/* ── Columna derecha: sin pago + clases de hoy ── */}
        <div className="space-y-6">
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

            {loading ? (
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
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 rounded-md shrink-0">
                        {user.daysOverdue <= 0 ? "Sin créditos" : `${user.daysOverdue} días`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* CLASES DE HOY */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-foreground/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clases de hoy</p>
            </div>

            {loading ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

