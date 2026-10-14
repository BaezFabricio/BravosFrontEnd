import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import apiClient from "@/api"
import GuiaBravo from "@/components/GuiaBravo"
import { GUIAS_ALUMNO, GUIA_POR_RUTA, PASOS_COMPLETOS_ALUMNO } from "@/lib/guiaAlumno"

/*
 * Decide qué guía de Bravo mostrar en el panel del alumno (solo celular):
 *  1. La primera vez que entra: la bienvenida (menú, campanita, Milo y avisos).
 *  2. Después, la primera vez que entra a cada módulo: la mini-guía de ese módulo (se recuerda por separado).
 *  3. Cuando la pide desde Mi configuración: el recorrido completo (evento "bravos:abrir-guia").
 * Qué guías vio cada persona se guarda en su cuenta; el servidor solo acepta las claves de su lista.
 *
 * Mientras decide o muestra una guía, window.__bravosGuia vale "pendiente"/"activa": la invitación a activar
 * los avisos (InvitacionAvisos) espera para no mostrar dos cosas a la vez.
 */

const COMPLETA = { guia: "alumno", pasos: PASOS_COMPLETOS_ALUMNO, navegar: true }

function pidioRepetir() {
  try {
    if (sessionStorage.getItem("bravos-guia-repetir") !== "alumno") return false
    sessionStorage.removeItem("bravos-guia-repetir")
    return true
  } catch { return false }
}

export default function GuiasAlumno({ lista }) {
  const { pathname } = useLocation()
  const [vistas, setVistas] = useState(null) // null = todavía no se consultó
  const [manual, setManual] = useState(() => (pidioRepetir() ? COMPLETA : null)) // recorrido completo pedido a mano
  const esCelular = typeof window !== "undefined" && !window.matchMedia?.("(min-width: 1024px)").matches

  useEffect(() => {
    if (!lista || !esCelular) return undefined
    let vigente = true
    apiClient.get("/guias/mias")
      .then(({ data }) => { if (vigente) setVistas(data?.data?.vistas || []) })
      .catch(() => { if (vigente) setVistas([]) })
    return () => { vigente = false }
  }, [lista, esCelular])

  useEffect(() => {
    if (!lista || !esCelular) return undefined
    const abrir = (e) => { if (e.detail === "alumno") setManual(COMPLETA) }
    window.addEventListener("bravos:abrir-guia", abrir)
    return () => window.removeEventListener("bravos:abrir-guia", abrir)
  }, [lista, esCelular])

  // Qué guía toca: la bienvenida primero; después la del módulo en el que está
  const automatica = useMemo(() => {
    if (!esCelular || vistas === null) return null
    if (!vistas.includes("alumno-bienvenida")) {
      return { guia: "alumno-bienvenida", pasos: GUIAS_ALUMNO["alumno-bienvenida"], navegar: false }
    }
    const g = GUIA_POR_RUTA[pathname.replace(/\/+$/, "") || "/"]
    return g && !vistas.includes(g) ? { guia: g, pasos: GUIAS_ALUMNO[g], navegar: false } : null
  }, [esCelular, vistas, pathname])

  const actual = lista && esCelular ? (manual || automatica) : null

  // La invitación a los avisos espera mientras no se sabe si hay guía (máx. 6 s para no trabarla) o mientras hay una abierta
  const estado = !esCelular || !lista ? "libre" : actual ? "activa" : vistas === null ? "pendiente" : "libre"
  useEffect(() => {
    window.__bravosGuia = estado
    if (estado !== "pendiente") return undefined
    const t = setTimeout(() => { if (window.__bravosGuia === "pendiente") window.__bravosGuia = "libre" }, 6000)
    return () => clearTimeout(t)
  }, [estado])
  useEffect(() => () => { window.__bravosGuia = "libre" }, [])

  const alTerminar = useCallback((guia) => {
    setVistas((v) => (v && !v.includes(guia) ? [...v, guia] : v))
    setManual(null) // si había otra guía pendiente (p. ej. bienvenida → la del módulo), se muestra sola
  }, [])

  if (!actual) return null
  return <GuiaBravo key={actual.guia} guia={actual.guia} pasos={actual.pasos} navegar={actual.navegar} onFin={alTerminar} />
}
