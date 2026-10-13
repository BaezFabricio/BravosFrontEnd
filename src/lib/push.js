import apiClient from "@/api"

/*
 * Notificaciones push en este dispositivo. Las envía el servidor; acá solo se pide permiso,
 * se suscribe el dispositivo y se avisa al servidor. Funcionan con la versión de producción
 * (en desarrollo no hay service worker) y, en iPhone, solo con la app instalada.
 */

export const soportaPush = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
const estaInstalada = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true

async function registroSW() {
  if (!("serviceWorker" in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) || null
}

/**
 * Estado de las notificaciones en este dispositivo:
 * - "no-soportado": el navegador no las permite
 * - "instalar-ios": iPhone/iPad sin la app instalada (hay que agregarla a la pantalla de inicio)
 * - "sin-app": no hay service worker (por ejemplo, en desarrollo)
 * - "bloqueadas": la persona las bloqueó en el navegador
 * - "activas" / "inactivas"
 */
export async function estadoPush() {
  if (esIOS() && !estaInstalada()) return "instalar-ios"
  if (!soportaPush()) return "no-soportado"
  const reg = await registroSW()
  if (!reg) return "sin-app"
  if (Notification.permission === "denied") return "bloqueadas"
  const sub = await reg.pushManager.getSubscription()
  return sub && Notification.permission === "granted" ? "activas" : "inactivas"
}

// La clave VAPID llega en base64url; el navegador la necesita en bytes
function claveEnBytes(base64) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/** Pide permiso (tiene que llamarse desde un toque de la persona) y suscribe este dispositivo. */
export async function activarPush() {
  const reg = await registroSW()
  if (!reg) throw new Error("Las notificaciones funcionan con la app instalada.")
  const permiso = await Notification.requestPermission()
  if (permiso !== "granted") throw new Error("No se dio permiso para mostrar notificaciones.")

  const { data } = await apiClient.get("/push/clave-publica")
  const clave = data?.data?.clave
  if (!clave) throw new Error("El servidor no tiene configuradas las notificaciones.")

  let sub = await reg.pushManager.getSubscription()
  // Si la suscripción era de otra clave (por ejemplo, el servidor cambió las claves), se rehace
  if (sub && sub.options?.applicationServerKey) {
    const actual = new Uint8Array(sub.options.applicationServerKey)
    const nueva = claveEnBytes(clave)
    if (actual.length !== nueva.length || actual.some((b, i) => b !== nueva[i])) {
      await sub.unsubscribe()
      sub = null
    }
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveEnBytes(clave) })
  await apiClient.post("/push/suscripcion", sub.toJSON())
}

/**
 * Al abrir la app: si este dispositivo ya tiene los avisos activados en el navegador, se lo
 * reconfirma al servidor (por si el servidor no llegó a guardarlo, o se borró). No pide permiso
 * ni crea nada nuevo: si no hay suscripción, no hace nada.
 */
export async function sincronizarPush() {
  if (!soportaPush() || Notification.permission !== "granted") return
  const reg = await registroSW()
  const sub = reg ? await reg.pushManager.getSubscription() : null
  if (sub) await apiClient.post("/push/suscripcion", sub.toJSON())
}

/** Desactiva las notificaciones en este dispositivo (en el servidor y en el navegador). */
export async function desactivarPush() {
  const reg = await registroSW()
  const sub = reg ? await reg.pushManager.getSubscription() : null
  if (!sub) return
  try {
    await apiClient.delete("/push/suscripcion", { data: { endpoint: sub.endpoint } })
  } finally {
    await sub.unsubscribe()
  }
}

/**
 * Al cerrar sesión: el dispositivo deja de recibir las notificaciones de esa cuenta (si otra
 * persona usa el celular, no le llegan avisos ajenos). Nunca demora el cierre más de 3 segundos.
 */
export async function desactivarPushAlCerrarSesion() {
  if (!soportaPush()) return
  await Promise.race([desactivarPush().catch(() => {}), new Promise((r) => setTimeout(r, 3000))])
}
