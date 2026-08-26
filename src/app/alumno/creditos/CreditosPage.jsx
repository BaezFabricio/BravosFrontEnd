import { useEffect, useState } from "react"
import { CreditCard, TrendingDown, Calendar, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

//  Conexión directa a tu cliente de Axios configurado
import apiClient from "@/api"
import { GymLoader } from "@/components/GymLoader"

export default function CreditosPage() {
  //  ESTADOS DINÁMICOS PARA CONECTAR EL BACKEND
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCreditosYMovimientos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        //  URL limpia, sin errores de tipeo y apuntando al endpoint correcto de reservas
        const response = await apiClient.get("/reservas/mis-creditos-movimientos")
        setDatos(response.data?.data || response.data)
      } catch (err) {
        console.error("Error al sincronizar la cuenta de créditos:", err)
        setError("No pudimos recuperar tu historial de movimientos en este momento.")
      } finally {
        setLoading(false)
      }
    }

    fetchCreditosYMovimientos()
  }, [])

  //  Formateador de fechas nativo para no romper la estética (ej: 15 de Junio, 2026)
  const formatearFechaLarga = (fechaString) => {
    if (!fechaString) return "Sin fecha"
    const fecha = new Date(fechaString)
    return fecha.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  // Formateador corto para la tabla de movimientos (ej: 15/06/2026)
  const formatearFechaCorta = (fechaString) => {
    if (!fechaString) return "N/A"
    const fecha = new Date(fechaString)
    return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  // 1. Estado de carga visual general (Spinner integrado)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GymLoader text="Cargando tus créditos..." />
      </div>
    )
  }

  // 2. Estado de error controlado en pantalla
  if (error) {
    return (
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error de Sincronización</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!datos) return null

  const { abono, movimientos } = datos

  const sinAbono = !abono || abono.nombrePlan === 'Sin plan activo'
  const totalCreditos = abono?.totalCreditos || 0
  const disponibles = abono?.creditosCisponibles || 0
  const usadosMes = abono?.creditosUtilizados || 0
  
  // Evitamos división por cero si el plan no tiene créditos cargados
  const porcentajeUsado = totalCreditos > 0 ? (usadosMes / totalCreditos) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Créditos</h1>
        <p className="text-muted-foreground">Consulta el estado de tus créditos y movimientos</p>
      </div>

      {sinAbono && (
        <Alert className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Sin membresía vigente</AlertTitle>
          <AlertDescription>No tenés un abono activo en este momento. Contactá al gimnasio para renovar tu plan.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TARJETA PRINCIPAL CON LA BARRA DE PROGRESO */}
        <Card className="bg-card border-border md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Créditos Disponibles</p>
                {/* 🚀 Imprime la columna real de la DB: creditosCisponibles */}
                <p className="text-5xl font-black text-primary mt-1">{disponibles}</p>
              </div>
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Progreso del mes ({abono.nombrePlan})</span>
                <span className="font-bold text-foreground">
                  {usadosMes} de {totalCreditos} usados
                </span>
              </div>
              {/* Progreso enlazado a la matemática real */}
              <Progress value={porcentajeUsado} className="h-3" />
              {abono.fechaVencimiento && (
                <p className="text-xs text-muted-foreground">
                  Los créditos vencen el {formatearFechaLarga(abono.fechaVencimiento)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CONTADORES RESUMIDOS DE LA DB */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{totalCreditos}</p>
                <p className="text-sm text-muted-foreground">Total del plan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{usadosMes}</p>
                <p className="text-sm text-muted-foreground">Usados este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN INFORMATIVA */}
      <Card className="bg-card border-border border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Importante sobre los créditos</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Cada reserva de clase consume 1 crédito de tu abono.</li>
                <li>• Si reservas y no asistes, el crédito también se descuenta de tu saldo.</li>
                <li>• Los créditos no utilizados no se acumulan para el siguiente mes de renovación.</li>
                <li>• Si tu membresía está vencida o suspendida, el sistema bloqueará tus reservas.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRILLA HISTÓRICA DE MOVIMIENTOS RECONSTRUIDA DESDE UNION */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50 uppercase tracking-wider text-muted-foreground">
                  <th className="text-left p-4 font-semibold">Fecha</th>
                  <th className="text-left p-4 font-semibold">Descripción</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell">Estado</th>
                  <th className="text-right p-4 font-semibold">Créditos</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground font-medium">
                        No registrás movimientos ni transacciones históricas en tu cuenta.
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((mov, index) => {
                      // Evaluamos los formatos para los colores de la columna de créditos
                      const esRecarga = mov.creditos.startsWith("+");
                      const esCancelacionConDevolucion = mov.creditos === "+1";
                      const esInformativoCero = mov.creditos === "0";

                      return (
                        <tr key={index} className="border-b border-border hover:bg-foreground/5 transition-colors">
                          
                          <td className="p-4 text-muted-foreground font-medium">
                            {formatearFechaCorta(mov.fecha)}
                          </td>
                          <td className="p-4 font-bold text-foreground">
                            {mov.descripcion}
                          </td>

                          <td className="p-4 hidden sm:table-cell">
                            {mov.estado === 'Histórico' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">
                                Recarga
                              </Badge>
                            ) : mov.estado === 'Cancelada (Devuelto)' ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-medium">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Devuelto
                              </Badge>
                            ) : mov.estado === 'Cancelada (Fuera de término)' ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 font-medium">
                                <XCircle className="mr-1 h-3 w-3" />
                                Fuera de término
                              </Badge>
                            ) : mov.estado === 'No asistió' ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 font-medium">
                                <XCircle className="mr-1 h-3 w-3" />
                                No asistió
                              </Badge>
                            ) : mov.estado === 'Próxima' ? (
                              <Badge variant="outline" className="bg-zinc-500/10 text-muted-foreground border-zinc-500/20 font-medium">
                                Próxima
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-medium">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                {mov.estado}
                              </Badge>
                            )}
                          </td>

                          {/* 💸 Columna 4: Créditos (Mapeo de color dinámico) */}
                          <td className={`p-4 text-right font-black text-sm ${
                            esRecarga || esCancelacionConDevolucion
                              ? "text-green-500" 
                              : esInformativoCero 
                              ? "text-red-400" 
                              : "text-muted-foreground"
                          }`}>
                            {mov.creditos}
                          </td>
                        </tr>
                      );
                    })
                  )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}