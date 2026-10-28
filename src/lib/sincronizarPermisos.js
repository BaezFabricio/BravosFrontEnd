import { useEffect, useState } from "react"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { getPermisos } from "@/lib/paneles"

/*
 * Mantiene al día los permisos y el perfil de la persona que tiene la app abierta.
 *
 * El servidor ya aplica los permisos al instante en cada pedido, pero el menú y los paneles se armaban con una copia guardada
 * al iniciar sesión, y por eso un cambio de perfil recién se veía al volver a entrar. Ahora se vuelve a pedir al servidor:
 *   - al abrir o recargar la app,
 *   - al volver a ella (cambiar de pestaña, desbloquear el celular, volver de otra app),
 *   - cada 30 segundos mientras está a la vista,
 *   - y apenas el servidor le niega una acción (por ejemplo, intentó algo que ya no puede).
 * Si algo cambió, se avisa a toda la app (evento) y el menú, los paneles y las rutas se actualizan sin recargar.
 */
export const EVENTO_PERMISOS = "bravos:permisos-cambiaron"
const CADA_MS = 30 * 1000
const MINIMO_ENTRE_PEDIDOS_MS = 4 * 1000

let enCurso = null
let ultimoPedido = 0

const mismoConjunto = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|")
const leer = (clave, defecto) => { try { return JSON.parse(localStorage.getItem(clave) || defecto) } catch { return JSON.parse(defecto) } }

export function sincronizarPermisos() {
  if (!haySesion()) return Promise.resolve()
  if (enCurso) return enCurso
  if (Date.now() - ultimoPedido < MINIMO_ENTRE_PEDIDOS_MS) return Promise.resolve()
  ultimoPedido = Date.now()

  enCurso = apiClient.get("/auth/me")
    .then((res) => {
      const datos = res.data?.data
      if (!datos?.usuario || !Array.isArray(datos.permisos)) return
      const guardado = leer("usuario", "{}")
      const cambio =
        !mismoConjunto(datos.permisos, getPermisos()) ||
        datos.usuario.idPerfil !== guardado.idPerfil ||
        datos.usuario.estado !== guardado.estado
      if (!cambio) return
      localStorage.setItem("permisos", JSON.stringify(datos.permisos))
      // Se conserva todo lo demás que se guardó al iniciar sesión (idProfesor, idAlumno…): solo se actualiza lo que cambia con el perfil
      localStorage.setItem("usuario", JSON.stringify({ ...guardado, idPerfil: datos.usuario.idPerfil, perfil: datos.usuario.perfil, estado: datos.usuario.estado }))
      window.dispatchEvent(new CustomEvent(EVENTO_PERMISOS))
    })
    .catch(() => { /* sin conexión o sesión vencida (de eso se ocupa el interceptor de api.js): se reintenta en la próxima vuelta */ })
    .finally(() => { enCurso = null })
  return enCurso
}

/** Arranca la sincronización (se llama una vez desde App). Devuelve la función que la detiene. */
export function iniciarSincronizacionDePermisos() {
  const alVolver = () => { if (!document.hidden) sincronizarPermisos() }
  const alDenegar = () => { ultimoPedido = 0; sincronizarPermisos() } // el servidor negó una acción: puede ser porque cambiaron los permisos
  const reloj = setInterval(alVolver, CADA_MS)
  document.addEventListener("visibilitychange", alVolver)
  window.addEventListener("focus", alVolver)
  window.addEventListener("online", alVolver)
  window.addEventListener("bravos:acceso-denegado", alDenegar)
  sincronizarPermisos()
  return () => {
    clearInterval(reloj)
    document.removeEventListener("visibilitychange", alVolver)
    window.removeEventListener("focus", alVolver)
    window.removeEventListener("online", alVolver)
    window.removeEventListener("bravos:acceso-denegado", alDenegar)
  }
}

/** Los permisos actuales; el componente se vuelve a dibujar solo cuando cambian. */
export function usePermisosVivos() {
  const [permisos, setPermisos] = useState(getPermisos)
  useEffect(() => {
    const actualizar = () => setPermisos(getPermisos())
    window.addEventListener(EVENTO_PERMISOS, actualizar)
    return () => window.removeEventListener(EVENTO_PERMISOS, actualizar)
  }, [])
  return permisos
}
