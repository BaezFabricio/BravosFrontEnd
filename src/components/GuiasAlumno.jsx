import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import apiClient from "@/api"
import GuiaBravo from "@/components/GuiaBravo"
import { GUIAS_ALUMNO, GUIA_POR_RUTA } from "@/lib/guiaAlumno"

/*
 * Decide qué guía de Bravo mostrar en el panel del alumno (solo celular):
 *  1. La primera vez que entra: la bienvenida (menú, campanita, Milo y avisos).
 *  2. Después, la primera vez que entra a cada submódulo: la mini-guía de ese submódulo (se recuerda por separado).
 *  3. Cuando pide "Ver la guía de bienvenida" en Mi configuración (evento "bravos:abrir-guia"): se muestra la
 *     bienvenida y, además, cada submódulo vuelve a explicarse una vez, solo cuando entra a él.
 * Qué guías vio cada persona se guarda en su cuenta; el servidor solo acepta las claves de su lista.
 *
 * Mientras decide o muestra una guía, window.__bravosGuia vale "pendiente"/"activa": la invitación a activar
 * los avisos (InvitacionAvisos) espera para no mostrar dos cosas a la vez.
 */

const BIENVENIDA = { guia: "alumno-bienvenida", pasos: GUIAS_ALUMNO["alumno-bienvenida"], navegar: false }
const DE_SUBMODULOS = Object.keys(GUIAS_ALUMNO).filter((k) => k !== "alumno-bienvenida")

function pidioRepetir() {
  try {
    const pedida = sessionStorage.getItem("bravos-guia-repetir") === "bienvenida"
    sessionStorage.removeItem("bravos-guia-repetir")
    return pedida
  } catch { return false }
}

/*
 * Memoria de esta sesión (vive fuera del componente): cada pantalla del panel arma de nuevo el layout, y con él este
 * componente. Sin esto, al cambiar de pantalla se volvía a preguntar al servidor y, si el aviso de "ya la vio" todavía
 * no se había guardado, la guía volvía a salir. Se reinicia si cambia la persona que inició sesión.
 */
const memoria = { usuario: null, vistas: new Set(), repetidas: [] }
function sincronizarMemoria() {
  let id = null
  try { id = JSON.parse(localStorage.getItem("usuario") || "null")?.idUsuario ?? null } catch { /* sin sesión guardada */ }
  if (memoria.usuario !== id) { memoria.usuario = id; memoria.vistas = new Set(); memoria.repetidas = [] }
}

export default function GuiasAlumno({ lista }) {
  const { pathname } = useLocation()
  sincronizarMemoria()
  const [vistas, setVistas] = useState(null) // null = todavía no se consultó
  const [repite] = useState(pidioRepetir) // pedida desde otra pantalla antes de que este componente existiera
  const [manual, setManual] = useState(repite ? BIENVENIDA : null) // la bienvenida pedida a mano
  const [repetidas, setRepetidas] = useState(() => {
    if (repite) memoria.repetidas = DE_SUBMODULOS
    return memoria.repetidas // guías de submódulos que vuelven a mostrarse (una vez cada una)
  })
  const esCelular = typeof window !== "undefined" && !window.matchMedia?.("(min-width: 1024px)").matches

  useEffect(() => {
    if (!lista || !esCelular) return undefined
    let vigente = true
    apiClient.get("/guias/mias")
      .then(({ data }) => { if (vigente) setVistas(data?.data?.vistas || []) })
      .catch(() => { /* sin saber qué guías vio, mejor no mostrar ninguna que repetirlas */ })
    return () => { vigente = false }
  }, [lista, esCelular])

  useEffect(() => {
    if (!lista || !esCelular) return undefined
    const abrir = (e) => {
      if (e.detail !== "bienvenida") return
      setManual(BIENVENIDA)
      memoria.repetidas = DE_SUBMODULOS
      setRepetidas(DE_SUBMODULOS)
    }
    window.addEventListener("bravos:abrir-guia", abrir)
    return () => window.removeEventListener("bravos:abrir-guia", abrir)
  }, [lista, esCelular])

  // Qué guía toca: la bienvenida primero; después la del submódulo en el que está
  const automatica = useMemo(() => {
    if (!esCelular || vistas === null) return null
    const vistoYa = (g) => vistas.includes(g) || memoria.vistas.has(g)
    if (!vistoYa("alumno-bienvenida")) return BIENVENIDA
    const g = GUIA_POR_RUTA[pathname.replace(/\/+$/, "") || "/"]
    return g && (!vistoYa(g) || repetidas.includes(g)) ? { guia: g, pasos: GUIAS_ALUMNO[g], navegar: false } : null
  }, [esCelular, vistas, repetidas, pathname])

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
    memoria.vistas.add(guia)
    memoria.repetidas = memoria.repetidas.filter((k) => k !== guia) // cada submódulo se vuelve a explicar una sola vez
    setVistas((v) => (v && !v.includes(guia) ? [...v, guia] : v))
    setRepetidas(memoria.repetidas)
    setManual(null) // si había otra guía pendiente (p. ej. la del submódulo en que está), se muestra sola
  }, [])

  if (!actual) return null
  return <GuiaBravo key={actual.guia} guia={actual.guia} pasos={actual.pasos} navegar={actual.navegar} onFin={alTerminar} />
}
