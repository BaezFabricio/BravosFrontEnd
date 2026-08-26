import { useEffect, useState } from "react"
import { Users, Calendar, AlertTriangle, TrendingUp, UserCheck, UserX, Clock } from "lucide-react"
import apiClient from "@/api"

export default function AdminDashboard() {
  const [tarjetas, setTarjetas] = useState({
    totalUsuarios: "...",
    usuariosActivos: "...",
    suspendidos: "...",
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

  const statsLayout = [
    { title: "Total Usuarios", value: tarjetas.totalUsuarios, change: "+12%", changeType: "positive", icon: Users },
    { title: "Usuarios Activos", value: tarjetas.usuariosActivos, change: "+8%", changeType: "positive", icon: UserCheck },
    { title: "Suspendidos", value: tarjetas.suspendidos, change: "Revisar caja", changeType: "negative", icon: UserX },
    { title: "Membresías por Vencer", value: tarjetas.membresiasPorVencer, change: "Próximos 7 días", changeType: "warning", icon: Clock },
  ]

  const formatearActividad = (fechaOrden) => {
    if (!fechaOrden) return { fecha: '—', hora: null }
    const d = new Date(fechaOrden)
    if (isNaN(d.getTime())) return { fecha: '—', hora: null }
    const fecha = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    const h = d.getHours(), m = d.getMinutes()
    const hora = (h === 0 && m === 0) ? null : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return { fecha, hora }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground/40 mt-1">Bienvenido al panel de administración de Bravos Gym</p>
      </div>

      {/* METRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLayout.map((stat) => (
          <div key={stat.title} className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-black text-foreground mt-1">{stat.value}</p>
                <p className={`text-xs mt-1 ${stat.changeType === "positive" ? "text-lime-400" : stat.changeType === "negative" ? "text-red-400" : "text-yellow-400"}`}>
                  {stat.change}
                </p>
              </div>
              <div className="w-12 h-12 bg-foreground/5 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-foreground/40" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABLA DE SUSPENDIDOS REALES */}
        <div className="border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suspendidos por Falta de Pago</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              {suspendedUsers.length} usuarios
            </span>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-foreground/40 text-center py-4">Buscando morosos...</p>
              ) : suspendedUsers.length > 0 ? (
                suspendedUsers.map((user) => (
                  <div key={user.dni} className="flex items-center justify-between p-3 border border-border">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-foreground/40">DNI: {user.dni}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 block mb-1">
                        {user.daysOverdue <= 0 ? "Sin créditos" : `${user.daysOverdue} días vencido`}
                      </span>
                      <p className="text-xs text-foreground/40">{user.email || "sin-email@bravos.com"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground/40 text-center py-4">¡Caja al día! No hay usuarios suspendidos.</p>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE CLASES DE HOY REALES */}
        <div className="border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-foreground/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clases de Hoy</p>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-foreground/40 text-center py-4">Sincronizando grilla...</p>
              ) : clasesHoy.length > 0 ? (
                clasesHoy.map((cls, index) => {
                  const lleno = cls.spots && cls.spots.includes('/') && cls.spots.split('/')[0] === cls.spots.split('/')[1]
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-foreground/5 flex items-center justify-center">
                          <span className="text-xs font-black text-foreground/60">{cls.time}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{cls.name}</p>
                          <p className="text-xs text-foreground/40">{cls.coach}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${lleno ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-lime-400/10 text-lime-400 border-lime-400/20"}`}>
                        {cls.spots || "0/0"}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-foreground/40 text-center py-4">No hay entrenamientos planificados para hoy.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-5 py-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-foreground/40" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actividad Reciente</p>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-foreground/40 text-center py-4">Cargando bitácora de movimientos...</p>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-lime-400" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground/70">
                      <span className="font-semibold text-foreground">{activity.user}</span> {activity.action}
                    </p>
                  </div>
                  {(() => { const { fecha, hora } = formatearActividad(activity.fecha_orden); return (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{fecha}</p>
                      {hora && <p className="text-xs text-muted-foreground">{hora} hs</p>}
                    </div>
                  )})()}
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/40 text-center py-4">Sin actividad registrada en las últimas horas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
