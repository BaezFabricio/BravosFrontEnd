import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/*
 * Última pantalla PÚBLICA que visitó la persona (landing, registro, páginas legales…).
 * La usa el botón "Volver" del login: después de cerrar sesión (o de que venza), "atrás" en el
 * historial es un panel que ya no se puede abrir, así que hay que volver a un lugar accesible.
 * Se guarda solo la ruta, sin parámetros (el enlace de recuperar contraseña lleva un token).
 */
const CLAVE = "ultimaRutaPublica"
const PRIVADAS = ["/admin", "/alumno", "/profesor", "/perfil", "/seleccionar-panel", "/login"]

const esPrivada = (ruta) => PRIVADAS.some((p) => ruta === p || ruta.startsWith(`${p}/`))

/** Componente sin interfaz: va dentro del router y anota cada pantalla pública que se abre. */
export function RecordarRutaPublica() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (esPrivada(pathname)) return
    try { sessionStorage.setItem(CLAVE, pathname) } catch { /* sin almacenamiento: se usa el inicio */ }
  }, [pathname])
  return null
}

export function ultimaRutaPublica() {
  try { return sessionStorage.getItem(CLAVE) || "/inicio" } catch { return "/inicio" }
}
