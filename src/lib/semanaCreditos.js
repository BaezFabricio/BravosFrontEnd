import { useEffect, useState } from "react"
import apiClient from "@/api"

/*
 * Créditos por semana del alumno. Si alguno de sus planes tiene "créditos por semana" (por ejemplo el de 3 días: 3),
 * devuelve { porSemana, usadas } (cuántas clases puede reservar por semana y cuántas lleva esta semana); si no, null.
 * Con ese tipo de plan cancelar NO devuelve el crédito y lo que no se usa en la semana se pierde.
 * Se vuelve a pedir cada vez que cambian las reservas (evento "bravos:reservas-cambiaron").
 */
export function useSemanaCreditos() {
  const [semana, setSemana] = useState(null)

  useEffect(() => {
    let vigente = true
    const pedir = () => apiClient.get("/reservas/mis-creditos-movimientos")
      .then((r) => { if (vigente) setSemana(r.data?.data?.abono?.semana ?? null) })
      .catch(() => {})
    pedir()
    window.addEventListener("bravos:reservas-cambiaron", pedir)
    return () => { vigente = false; window.removeEventListener("bravos:reservas-cambiaron", pedir) }
  }, [])

  return semana
}
