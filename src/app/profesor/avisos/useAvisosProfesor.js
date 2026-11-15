import { useCallback, useEffect, useState } from "react"
import apiClient from "@/api"

// Avisos de la bandeja del profesor (solo los suyos: el servidor filtra por el usuario del token)
export function useAvisosProfesor() {
  const [avisos, setAvisos] = useState([])
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(() => {
    return apiClient.get("/notificaciones?tipos=profesor")
      .then((r) => setAvisos(r.data?.data?.notificaciones || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    recargar()
    const t = setInterval(recargar, 30000) // igual que la campanita del alumno
    return () => clearInterval(t)
  }, [recargar])

  const noLeidas = avisos.filter((a) => !a.leida).length

  const marcarLeido = useCallback((id) => {
    setAvisos((lista) => lista.map((a) => (a.idNotificacion === id ? { ...a, leida: 1 } : a)))
    apiClient.patch(`/notificaciones/${id}/leer`).catch(() => {})
  }, [])

  const marcarTodos = useCallback(() => {
    setAvisos((lista) => lista.map((a) => ({ ...a, leida: 1 })))
    apiClient.patch("/notificaciones/leer-todas?tipos=profesor").catch(() => {})
  }, [])

  return { avisos, noLeidas, cargando, marcarLeido, marcarTodos }
}
