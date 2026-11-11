import { TituloPagina } from "@/components/TituloPagina"
import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import apiClient from "@/api"
import { GymLoader } from "@/components/GymLoader"
import RenovarMembresia from "@/components/RenovarMembresia"
import { useAnchoPanel } from "@/lib/useEscritorio"
import CreditosMovil from "./CreditosMovil"
import CreditosEscritorio from "./CreditosEscritorio"

export default function CreditosPage() {
  const escritorio = useAnchoPanel() // desde 1024 px: diseño de escritorio; por debajo, el del celular
  const [datos, setDatos]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const cargar = (silencioso = false) => {
    if (!silencioso) { setLoading(true); setError(null) }
    apiClient.get("/reservas/mis-creditos-movimientos")
      .then(r => setDatos(r.data?.data || r.data))
      .catch(() => { if (!silencioso) setError("No pudimos cargar tu información de créditos.") })
      .finally(() => { if (!silencioso) setLoading(false) })
  }

  useEffect(() => { cargar() }, [])

  // Quien paga puede escanear el QR desde otro dispositivo (el celular) mientras
  // esta pantalla sigue abierta en la compu: nunca se oculta ni pierde el foco,
  // así que hace falta preguntar sola cada tanto en vez de esperar un evento.
  useEffect(() => {
    const interval = setInterval(() => cargar(true), 8000)
    const alVolver = () => { if (document.visibilityState === "visible") cargar(true) }
    document.addEventListener("visibilitychange", alVolver)
    window.addEventListener("focus", alVolver)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", alVolver)
      window.removeEventListener("focus", alVolver)
    }
  }, [])

  if (escritorio) return <CreditosEscritorio datos={datos} cargando={loading} error={error} onReintentar={() => cargar()} />

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><GymLoader text="Cargando créditos..." /></div>
  if (error)   return <div className="border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-700 dark:text-red-400">{error}</div>
  if (!datos)  return null

  const { abono, movimientos } = datos
  const sinAbono = !abono || abono.nombrePlan === "Sin plan activo"

  return (
    <div className="space-y-5">

      <TituloPagina descripcion={"Estado de tu cuenta y movimientos"}>Mis Créditos</TituloPagina>

      {sinAbono && (
        <>
          <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Sin membresía vigente</p>
              <p className="text-xs text-foreground/50 mt-0.5">Renová tu plan para volver a reservar clases.</p>
            </div>
          </div>
          <RenovarMembresia onRenovado={cargar} />
        </>
      )}

      {/* CELULAR: diseño propio (CreditosMovil.jsx) */}
      {!sinAbono && <CreditosMovil abono={abono} movimientos={movimientos} />}

    </div>
  )
}
