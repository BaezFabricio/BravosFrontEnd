/*
 * Recuperación cuando la app abierta es de una versión anterior a la publicada.
 *
 * Las pantallas se cargan "a pedido" (cada una es un archivo con nombre propio). Después de publicar una versión nueva, una
 * pestaña o app instalada que sigue abierta con la versión vieja pide archivos que ya no existen y la pantalla se queda en negro.
 * Cuando pasa eso se limpia la copia guardada y se recarga la página (una sola vez cada 30 segundos, para no caer en un bucle).
 */
const CLAVE = "bravos-recuperacion-version"

// Errores típicos de un archivo de pantalla que no se pudo descargar (según el navegador)
export function esErrorDeArchivoViejo(error) {
  const texto = String(error?.message || error || "")
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError|Loading chunk .* failed/i.test(texto)
}

export async function recuperarDeVersionVieja() {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE) || 0)
    if (Date.now() - ultima < 30000) return false // ya se intentó hace un momento
    sessionStorage.setItem(CLAVE, String(Date.now()))
  } catch { /* sin almacenamiento: se intenta igual */ }
  try {
    if ("serviceWorker" in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registros.map((r) => r.unregister()))
    }
    if ("caches" in window) {
      for (const clave of await caches.keys()) await caches.delete(clave)
    }
  } catch { /* igual se recarga */ }
  window.location.reload()
  return true
}
