import { useEffect, useState } from "react"
import apiClient from "@/api"

/*
 * Créditos disponibles del alumno (de su abono vigente). Devuelve un número, o null mientras carga o si no se pudo saber.
 */
export function useCreditosDisponibles() {
  const [creditos, setCreditos] = useState(null)

  useEffect(() => {
    let vigente = true
    const sesion = JSON.parse(localStorage.getItem("usuario") || "{}")
    if (!sesion.idUsuario) return undefined
    apiClient.get(`/usuarios/${sesion.idUsuario}/abonos`)
      .then((r) => {
        if (!vigente) return
        const abonos = r.data?.data || r.data || []
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const activo = abonos.find((a) => {
          if (a.estado !== "ACTIVO") return false
          if (!a.vencimiento) return true
          const venc = new Date(a.vencimiento); venc.setHours(0, 0, 0, 0)
          return venc >= hoy
        })
        setCreditos(activo?.disponibles ?? 0)
      })
      .catch(() => {})
    return () => { vigente = false }
  }, [])

  return creditos
}
