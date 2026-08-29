import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Clock, Zap, RotateCcw, AlertCircle } from "lucide-react"
import apiClient from "@/api"
import { GymLoader } from "@/components/GymLoader"

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function formatFechaCorta(fechaString) {
  if (!fechaString) return "N/A"
  const f = new Date(fechaString)
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`
}

function formatFechaLarga(fechaString) {
  if (!fechaString) return "Sin fecha"
  const f = new Date(fechaString)
  return f.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

function MovimientoRow({ mov, index }) {
  const esRecarga = mov.creditos.startsWith("+")
  const esCero    = mov.creditos === "0"
  const esNeg     = mov.creditos.startsWith("-")

  const estadoMeta = (() => {
    const e = mov.estado
    if (e === "Histórico")                      return { label: "Recarga",        color: "text-lime-400",       bg: "bg-lime-400/10 border-lime-400/20", Icon: Zap }
    if (e === "Cancelada (Devuelto)")            return { label: "Devuelto",        color: "text-emerald-400",    bg: "bg-emerald-400/10 border-emerald-400/20", Icon: RotateCcw }
    if (e === "Cancelada (Fuera de término)")    return { label: "Sin devolución",  color: "text-orange-400",     bg: "bg-orange-400/10 border-orange-400/20", Icon: XCircle }
    if (e === "No asistió")                      return { label: "No asistió",      color: "text-red-400",        bg: "bg-red-400/10 border-red-400/20", Icon: XCircle }
    if (e === "Próxima")                         return { label: "Próxima",         color: "text-foreground/40",  bg: "bg-foreground/5 border-border", Icon: Clock }
    if (e === "Completada")                      return { label: "Completada",      color: "text-sky-400",        bg: "bg-sky-400/10 border-sky-400/20", Icon: CheckCircle2 }
    return { label: e, color: "text-foreground/60", bg: "bg-foreground/5 border-border", Icon: CheckCircle2 }
  })()

  const creditoColor = esRecarga ? "text-lime-400" : esNeg || esCero ? "text-red-400" : "text-foreground/50"

  return (
    <div
      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors"
    >
      {/* Ícono de estado */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${estadoMeta.bg}`}>
        <estadoMeta.Icon className={`h-3.5 w-3.5 ${estadoMeta.color}`} />
      </div>

      {/* Descripción + fecha */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{mov.descripcion}</p>
        <p className="text-[11px] text-foreground/40 mt-0.5">{formatFechaCorta(mov.fecha)}</p>
      </div>

      {/* Badge estado */}
      <span className={`hidden sm:inline-flex shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-full ${estadoMeta.bg} ${estadoMeta.color}`}>
        {estadoMeta.label}
      </span>

      {/* Créditos */}
      <span className={`shrink-0 text-base font-black tabular-nums ${creditoColor}`}>
        {mov.creditos}
      </span>
    </div>
  )
}

export default function CreditosPage() {
  const [datos, setDatos]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    apiClient.get("/reservas/mis-creditos-movimientos")
      .then(r => setDatos(r.data?.data || r.data))
      .catch(() => setError("No pudimos cargar tu información de créditos."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><GymLoader text="Cargando créditos..." /></div>
  if (error)   return <div className="border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400">{error}</div>
  if (!datos)  return null

  const { abono, movimientos } = datos
  const sinAbono       = !abono || abono.nombrePlan === "Sin plan activo"
  const total          = abono?.totalCreditos || 0
  const disponibles    = abono?.creditosCisponibles || 0
  const usados         = abono?.creditosUtilizados || 0
  const porcentaje     = total > 0 ? Math.round((disponibles / total) * 100) : 0

  // Dots de créditos (máx 20 puntos visuales)
  const escala     = total > 20 ? total / 20 : 1
  const totalDots  = Math.round(total / escala)
  const activeDots = Math.round(disponibles / escala)

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Mis Créditos</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Estado de tu cuenta y movimientos</p>
      </div>

      {/* Alerta sin abono */}
      {sinAbono && (
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">Sin membresía vigente</p>
            <p className="text-xs text-foreground/50 mt-0.5">Contactá al gimnasio para renovar tu plan y volver a reservar.</p>
          </div>
        </div>
      )}

      {/* Hero: número grande + barra de puntos */}
      <div className="border border-border bg-card p-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Disponibles</p>
            <p className="text-7xl font-black text-lime-400 leading-none tabular-nums">{disponibles}</p>
            <p className="text-sm text-foreground/40 mt-2">de {total} créditos · {abono?.nombrePlan || "—"}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-black text-foreground/10 leading-none">{porcentaje}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mt-1">restante</p>
          </div>
        </div>

        {/* Barra de puntos */}
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-sm transition-colors ${
                i < activeDots ? "bg-lime-400" : "bg-foreground/10"
              }`}
            />
          ))}
        </div>

        {/* Vencimiento */}
        {abono?.fechaVencimiento && (
          <p className="mt-4 text-[11px] text-foreground/35 border-t border-border pt-3">
            Vencimiento: <span className="text-foreground/50 font-semibold">{formatFechaLarga(abono.fechaVencimiento)}</span>
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border bg-card px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total del plan</p>
          <p className="text-3xl font-black text-foreground mt-1 tabular-nums">{total}</p>
        </div>
        <div className="border border-border bg-card px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Usados</p>
          <p className="text-3xl font-black text-foreground mt-1 tabular-nums">{usados}</p>
        </div>
      </div>

      {/* Reglas */}
      <div className="border border-border bg-card px-5 py-4 space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Cómo funcionan</p>
        {[
          "Cada reserva consume 1 crédito.",
          "Si no asistís, el crédito se descuenta igual.",
          "Cancelar con +2hs de anticipación devuelve el crédito.",
          "Los créditos no se acumulan al renovar.",
        ].map((t, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-lime-400/60 shrink-0" />
            <p className="text-xs text-foreground/50">{t}</p>
          </div>
        ))}
      </div>

      {/* Historial */}
      <div className="border border-border bg-card">
        <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Historial de movimientos</p>
          <span className="text-[10px] font-bold text-foreground/30">{movimientos.length} registros</span>
        </div>
        {movimientos.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-foreground/30">
            Todavía no tenés movimientos registrados.
          </div>
        ) : (
          movimientos.map((mov, i) => <MovimientoRow key={i} mov={mov} index={i} />)
        )}
      </div>

    </div>
  )
}
