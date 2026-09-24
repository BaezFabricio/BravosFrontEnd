// La sesión vive en una cookie httpOnly que pone el servidor al iniciar sesión: el JavaScript de la página
// no puede leerla (y por lo tanto un XSS no puede robarla). El navegador solo tiene que enviarla.

// Todos los fetch hacia la API llevan la cookie (rutas relativas o el servidor local de desarrollo).
const fetchOriginal = window.fetch.bind(window)
window.fetch = (entrada, opciones = {}) => {
  const url = typeof entrada === "string" ? entrada : entrada?.url || ""
  const esApiPropia = url.startsWith("/") || url.startsWith("http://localhost:3001")
  return fetchOriginal(entrada, esApiPropia && !opciones.credentials ? { ...opciones, credentials: "include" } : opciones)
}

// Pide al servidor que borre la cookie de sesión (el navegador no puede borrarla por su cuenta).
export function cerrarSesionEnServidor() {
  return fetch("/api/vv1/auth/logout", { method: "POST" }).catch(() => {})
}

// Datos no sensibles de quien inició sesión, para decidir qué pantalla mostrar (el servidor igual valida todo).
export function haySesion() {
  try {
    return Boolean(localStorage.getItem("usuario"))
  } catch {
    return false
  }
}
