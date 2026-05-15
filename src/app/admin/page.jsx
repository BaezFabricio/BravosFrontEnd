import { Users, CreditCard, Calendar, AlertTriangle, TrendingUp, UserCheck, UserX, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const stats = [
  {
    title: "Total Usuarios",
    value: "248",
    change: "+12%",
    changeType: "positive",
    icon: Users,
  },
  {
    title: "Usuarios Activos",
    value: "186",
    change: "+8%",
    changeType: "positive",
    icon: UserCheck,
  },
  {
    title: "Suspendidos",
    value: "15",
    change: "-3",
    changeType: "negative",
    icon: UserX,
  },
  {
    title: "Membresías por Vencer",
    value: "23",
    change: "Esta semana",
    changeType: "warning",
    icon: Clock,
  },
]

const recentActivity = [
  { user: "Maria Garcia", action: "Reservo clase de Funcional", time: "Hace 5 min", type: "reservation" },
  { user: "Juan Pérez", action: "Se registró en el sistema", time: "Hace 15 min", type: "register" },
  { user: "Carlos López", action: "Fue suspendido por falta de pago", time: "Hace 1 hora", type: "suspended" },
  { user: "Ana Martínez", action: "Renovó su membresía", time: "Hace 2 horas", type: "payment" },
  { user: "Pedro Sánchez", action: "Canceló reserva", time: "Hace 3 horas", type: "cancel" },
]

const suspendedUsers = [
  { name: "Carlos López", dni: "32456789", daysOverdue: 5, email: "carlos@email.com" },
  { name: "Laura Fernández", dni: "28765432", daysOverdue: 8, email: "laura@email.com" },
  { name: "Roberto Díaz", dni: "35678901", daysOverdue: 3, email: "roberto@email.com" },
]

const upcomingClasses = [
  { name: "Funcional WOD", time: "08:00", coach: "Pablo Ruiz", spots: "12/15" },
  { name: "Funcional", time: "09:30", coach: "Maria Gomez", spots: "8/12" },
  { name: "Open Box", time: "11:00", coach: "Diego Torres", spots: "5/10" },
  { name: "Funcional WOD", time: "18:00", coach: "Pablo Ruiz", spots: "15/15" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al panel de administración de Bravos Gym</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p
                    className={`text-sm mt-1 ${
                      stat.changeType === "positive"
                        ? "text-green-500"
                        : stat.changeType === "negative"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}
                  >
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
              {suspendedUsers.map((user) => (
                <div
                  key={user.dni}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">DNI: {user.dni}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      {user.daysOverdue} días de demora
                    </Badge>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Clases de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingClasses.map((cls, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                >
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
                    variant={cls.spots === "15/15" ? "destructive" : "outline"}
                    className={cls.spots === "15/15" ? "" : "border-primary/50 text-primary"}
                  >
                    {cls.spots}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "reservation"
                      ? "bg-green-500"
                      : activity.type === "register"
                      ? "bg-blue-500"
                      : activity.type === "suspended"
                      ? "bg-red-500"
                      : activity.type === "payment"
                      ? "bg-primary"
                      : "bg-yellow-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
