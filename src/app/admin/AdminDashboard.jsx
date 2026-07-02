import { useEffect, useState } from "react"
import { Users, Calendar, AlertTriangle, TrendingUp, UserCheck, UserX, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  // Helper para formatear marcas de tiempo simples en la actividad
  const formatearTiempo = (fechaOrden) => {
    if (!fechaOrden) return "Reciente"
    // Cortamos la fecha ISO para mostrar solo hora/minuto de forma limpia
    return fechaOrden.includes("T") ? fechaOrden.substring(11, 16) : fechaOrden.substring(11, 16)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al panel de administración de Bravos Gym</p>
      </div>

      {/* METRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLayout.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.changeType === "positive" ? "text-green-500" : stat.changeType === "negative" ? "text-red-500" : "text-yellow-500"}`}>
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABLA DE SUSPENDIDOS REALES */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Suspendidos por Falta de Pago
            </CardTitle>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              {suspendedUsers.length} usuarios
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Buscando morosos...</p>
              ) : suspendedUsers.length > 0 ? (
                suspendedUsers.map((user) => (
                  <div key={user.dni} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">DNI: {user.dni}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {user.daysOverdue <= 0 ? "Sin créditos" : `${user.daysOverdue} días vencido`}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{user.email || "sin-email@bravos.com"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">¡Caja al día! No hay usuarios suspendidos.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TABLA DE CLASES DE HOY REALES */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Clases de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sincronizando grilla...</p>
              ) : clasesHoy.length > 0 ? (
                clasesHoy.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{cls.time}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{cls.name}</p>
                        <p className="text-sm text-muted-foreground">{cls.coach}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        cls.spots && cls.spots.includes('/') && cls.spots.split('/')[0] === cls.spots.split('/')[1] 
                          ? "destructive" 
                          : "outline"
                      } 
                      className={
                        cls.spots && cls.spots.includes('/') && cls.spots.split('/')[0] === cls.spots.split('/')[1] 
                          ? "" 
                          : "border-primary/50 text-primary"
                      }
                    >
                      {cls.spots || "0/0"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay entrenamientos planificados para hoy.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVIDAD RECIENTE TOTALMENTE REAL */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando bitácora de movimientos...</p>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${activity.type === "reservation" ? "bg-green-500" : "bg-emerald-500"}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatearTiempo(activity.fecha_orden)} Hs</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin actividad registrada en las últimas horas.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}