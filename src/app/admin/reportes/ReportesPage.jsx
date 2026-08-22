import { useEffect, useState } from "react"
import { Loader2, TrendingUp, Users, Calendar, PieChart as PieChartIcon } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiClient from "@/api"

// Colores bien distintos entre sí (no variaciones del mismo verde) para que las
// torta/barras se puedan distinguir de un vistazo, con el verde de marca como ancla.
const COLORES = ["#6f8a1f", "#3b82c4", "#d9a441", "#b5483d", "#8b5fbf", "#5c6b73"]

const ESTADO_LABELS = {
  proxima: "Próxima",
  cancelada: "Cancelada",
  asistio: "Asistió",
  ausente: "Ausente",
}

export default function ReportesPage() {
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get("/reportes/resumen")
        setDatos(response.data?.data || null)
      } catch (err) {
        console.error("Error al cargar reportes:", err)
        setError(err.response?.data?.message || "No se pudieron cargar los reportes.")
      } finally {
        setLoading(false)
      }
    }
    fetchReportes()
  }, [])

  const formatearMoneda = (valor) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(valor) || 0)

  const formatearMes = (mes) => {
    if (!mes) return mes
    const [anio, mesNum] = mes.split("-")
    const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${nombres[Number(mesNum) - 1]} ${anio}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !datos) {
    return (
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
        {error || "No hay datos disponibles."}
      </div>
    )
  }

  const ingresosData = datos.ingresosPorMes.map((row) => ({
    mes: formatearMes(row.mes),
    total: Number(row.total),
  }))

  const alumnosPorPlanData = datos.alumnosPorPlan.map((row) => ({
    name: row.plan,
    value: Number(row.cantidad),
  }))

  const ocupacionData = datos.ocupacionClases.map((row) => ({
    nombre: row.nombreClase,
    ocupados: Number(row.ocupados),
    libres: Number(row.cupoMaximo) - Number(row.ocupados),
  }))

  const reservasData = datos.reservasPorEstado.map((row) => ({
    name: ESTADO_LABELS[row.estado] || row.estado,
    value: Number(row.cantidad),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Métricas del gimnasio: ingresos, planes, ocupación y reservas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingreso Total</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatearMoneda(datos.ingresoTotal)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alumnos con Plan</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {alumnosPorPlanData.reduce((acc, p) => acc + p.value, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clases Activas</p>
              <p className="text-2xl font-bold text-foreground mt-1">{ocupacionData.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reservas Totales</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {reservasData.reduce((acc, r) => acc + r.value, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <PieChartIcon className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Ingresos por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {ingresosData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sin pagos confirmados registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={ingresosData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    formatter={(value) => formatearMoneda(value)}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }}
                  />
                  <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Alumnos por plan</CardTitle>
          </CardHeader>
          <CardContent>
            {alumnosPorPlanData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sin datos de planes todavía.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={alumnosPorPlanData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {alumnosPorPlanData.map((_, index) => (
                      <Cell key={index} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Ocupación de clases</CardTitle>
          </CardHeader>
          <CardContent>
            {ocupacionData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No hay clases activas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ocupacionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="nombre" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }} />
                  <Legend />
                  <Bar dataKey="ocupados" stackId="a" fill={COLORES[0]} name="Ocupados" />
                  <Bar dataKey="libres" stackId="a" fill={COLORES[1]} name="Libres" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Reservas por estado</CardTitle>
          </CardHeader>
          <CardContent>
            {reservasData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sin reservas registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={reservasData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {reservasData.map((_, index) => (
                      <Cell key={index} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
