import { CreditCard, TrendingDown, Calendar, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const creditosData = {
  disponibles: 12,
  usados: 8,
  total: 20,
  vencimiento: "15 de Abril, 2024",
}

const movimientos = [
  { id: "1", tipo: "uso", descripcion: "Reserva Funcional WOD", fecha: "10/03/2024", creditos: -1, asistio: true },
  { id: "2", tipo: "uso", descripcion: "Reserva Funcional", fecha: "08/03/2024", creditos: -1, asistio: true },
  { id: "3", tipo: "uso", descripcion: "Reserva Funcional WOD", fecha: "05/03/2024", creditos: -1, asistio: false },
  { id: "4", tipo: "uso", descripcion: "Reserva Open Box", fecha: "03/03/2024", creditos: -1, asistio: true },
  { id: "5", tipo: "uso", descripcion: "Reserva Funcional WOD", fecha: "01/03/2024", creditos: -1, asistio: true },
  { id: "6", tipo: "recarga", descripcion: "Renovacion membresia mensual", fecha: "01/03/2024", creditos: 20 },
  { id: "7", tipo: "uso", descripcion: "Reserva Funcional", fecha: "28/02/2024", creditos: -1, asistio: true },
  { id: "8", tipo: "uso", descripcion: "Reserva Funcional WOD", fecha: "26/02/2024", creditos: -1, asistio: true },
]

export default function CreditosPage() {
  const porcentajeUsado = (creditosData.usados / creditosData.total) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Créditos</h1>
        <p className="text-muted-foreground">Consulta el estado de tus créditos y movimientos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Créditos Disponibles</p>
                <p className="text-5xl font-bold text-primary">{creditosData.disponibles}</p>
              </div>
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso del mes</span>
                <span className="font-medium text-foreground">
                  {creditosData.usados} de {creditosData.total} usados
                </span>
              </div>
              <Progress value={porcentajeUsado} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Los créditos vencen el {creditosData.vencimiento}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{creditosData.total}</p>
                <p className="text-sm text-muted-foreground">Total del plan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{creditosData.usados}</p>
                <p className="text-sm text-muted-foreground">Usados este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border border-green-500/30">
        <CardContent className="p-4">
            <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Importante sobre los créditos</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Cada reserva de clase consume 1 crédito</li>
                <li>• Si reservas y no asistes, el crédito también se descuenta</li>
                <li>• Los créditos no utilizados no se acumulan para el siguiente mes</li>
                <li>• Si tu membresía está vencida o suspendida, no podrás usar tus créditos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descripción</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Estado</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Créditos</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="border-b border-border">
                    <td className="p-4 text-foreground">{mov.fecha}</td>
                    <td className="p-4">
                      <span className="text-foreground">{mov.descripcion}</span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {mov.tipo === "recarga" ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Recarga
                        </Badge>
                      ) : mov.asistio ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Asistió
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <XCircle className="mr-1 h-3 w-3" />
                          No asistió
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`font-semibold ${
                          mov.creditos > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {mov.creditos > 0 ? `+${mov.creditos}` : mov.creditos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
