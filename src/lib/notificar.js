/*
 * Avisos en pantalla (aparecen arriba en el medio). Además de mostrarse, los importantes quedan
 * registrados en el historial de la campanita.
 *
 * Por defecto se guarda solo lo que salió bien (éxito): son las acciones completadas. Los errores,
 * advertencias e informativos solo se muestran. Se puede decidir caso por caso con { guardar: true | false }:
 *   toast.success('Mensaje copiado', { guardar: false })   // se ve, pero no queda en la campanita
 *   toast.error('Pago rechazado', { guardar: true })       // un error importante que sí queda
 * Si el sistema ya crea su propia notificación (reservas, por ejemplo), conviene { guardar: false } para no repetirla.
 */
function dispatch(tipo, titulo, mensaje, guardar) {
  window.dispatchEvent(new CustomEvent('bravos:notif', {
    detail: { tipo, titulo, mensaje, guardar, id: Date.now() }
  }))
}

const decidir = (tipo, opts) => (typeof opts?.guardar === 'boolean' ? opts.guardar : tipo === 'exito')

export const toast = {
  success: (msg, opts) => dispatch('exito',       opts?.description ? msg : 'Éxito',     opts?.description || msg, decidir('exito', opts)),
  error:   (msg, opts) => dispatch('error',       opts?.description ? msg : 'Error',     opts?.description || msg, decidir('error', opts)),
  warning: (msg, opts) => dispatch('advertencia', opts?.description ? msg : 'Atención',  opts?.description || msg, decidir('advertencia', opts)),
  info:    (msg, opts) => dispatch('info',        opts?.description ? msg : 'Info',      opts?.description || msg, decidir('info', opts)),
}
