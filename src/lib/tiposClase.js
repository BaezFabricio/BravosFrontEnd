import { useCallback, useEffect, useState } from "react"
import apiClient from "@/api"

/*
 * Tipos de clase del box (CrossFit, Planificación Atleta y los que se creen en Planes > Tipos de clase).
 * Unen planes, clases y reservas: quien tiene créditos de un plan de un tipo puede reservar las clases de ese tipo.
 * `codigo` es lo que guardan planes, clases y horarios; `nombre` es lo que se muestra y se puede editar.
 * tipos === null mientras carga.
 */
export function useTiposClase() {
  const [tipos, setTipos] = useState(null)

  const pedir = useCallback(() => apiClient.get("/tipos-clase").then((r) => r.data?.data || []), [])

  // Para volver a leer la lista después de crear, renombrar o desactivar un tipo
  const recargar = useCallback(async () => {
    try { setTipos(await pedir()) } catch { setTipos((actual) => actual ?? []) }
  }, [pedir])

  useEffect(() => {
    let vigente = true
    pedir().then((lista) => { if (vigente) setTipos(lista) }).catch(() => { if (vigente) setTipos([]) })
    return () => { vigente = false }
  }, [pedir])

  return { tipos, recargar }
}

/** Nombre para mostrar de un tipo a partir de su código (si no se conoce, el mismo código). */
export function nombreDeTipo(tipos, codigo) {
  return tipos?.find((t) => t.codigo === codigo)?.nombre || codigo || ""
}
