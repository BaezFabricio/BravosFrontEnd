// La sesión vive en una cookie httpOnly que pone el servidor al iniciar sesión: el JavaScript de la página
// no puede leerla (y por lo tanto un XSS no puede robarla). El navegador solo tiene que enviarla.

// Todos los fetch hacia la API llevan la cookie (rutas relativas o el servidor local de desarrollo).
const fetchOriginal = window.fetch.bind(window)
window.fetch = (entrada, opciones = {}) => {
  const url = typeof entrada === "string" ? entrada : entrada?.url || ""
  const esApiPropia = url.startsWith("/") || url.startsWith("http://localhost:3001")
  const opcionesFinales = esApiPropia && !opciones.credentials ? { ...opciones, credentials: "include" } : opciones
  // Túnel de ngrok (solo para pruebas): su pantalla de aviso tapa los pedidos de datos; este encabezado la saltea
  if (url.startsWith("/") && /ngrok/i.test(location.hostname)) {
    const encabezados = new Headers(opcionesFinales.headers || (typeof entrada !== "string" ? entrada.headers : undefined))
    encabezados.set("ngrok-skip-browser-warning", "1")
    return fetchOriginal(entrada, { ...opcionesFinales, headers: encabezados })
  }
  return fetchOriginal(entrada, opcionesFinales)
}

// Pide al servidor que borre la cookie de sesión (el navegador no puede borrarla por su cuenta).
// Antes, este dispositivo deja de recibir las notificaciones push de la cuenta (se hace con la
// sesión todavía abierta, porque el servidor solo borra dispositivos del usuario del token).
export async function cerrarSesionEnServidor() {
  try {
    const { desactivarPushAlCerrarSesion } = await import("./push")
    await desactivarPushAlCerrarSesion()
  } catch { /* nunca impide cerrar la sesión */ }
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
