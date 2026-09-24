import { useCallback, useEffect, useState } from "react"
import apiClient from "@/api"

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

// "2026-10-10" → "10 oct 2026" (sin pasar por Date para no correr el día por zona horaria)
export function fmtFechaPlan(ymd) {
  if (!ymd) return ""
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number)
  return `${d} ${MESES[m - 1]} ${y}`
}

export const fmtPrecio = (n) =>
  Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

/** Plan(es) vigentes del alumno + si está por vencer. `recargar` refresca sin parpadeo. */
export function useMiPlan() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(() => {
    return apiClient
      .get("/pagos/mi-plan")
      .then((r) => setData(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { recargar() }, [recargar])

  return { data, cargando, recargar }
}
