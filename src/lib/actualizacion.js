/*
 * Actualización de la app: cuando hay una versión nueva, el service worker la espera y aparece un aviso.
 * Tocar "Actualizar" activa la versión nueva y recarga la página. Así no se pierde lo que alguien esté escribiendo.
 */
let actualizarFn = null

/** Lo llama main.jsx con la función que devuelve registerSW. */
export function registrarActualizador(fn) {
  actualizarFn = fn
}

/** Activa la versión nueva y recarga. */
export function actualizarAhora() {
  actualizarFn?.(true)
}
