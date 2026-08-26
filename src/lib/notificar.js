const TIPOS = {
  success: 'exito',
  error: 'error',
  warning: 'advertencia',
  info: 'info',
}

function dispatch(tipo, titulo, mensaje) {
  window.dispatchEvent(new CustomEvent('bravos:notif', {
    detail: { tipo, titulo, mensaje, id: Date.now() }
  }))
}

export const toast = {
  success: (msg, opts) => dispatch('exito',      opts?.description ? msg : 'Éxito',      opts?.description || msg),
  error:   (msg, opts) => dispatch('error',      opts?.description ? msg : 'Error',      opts?.description || msg),
  warning: (msg, opts) => dispatch('advertencia', opts?.description ? msg : 'Atención',  opts?.description || msg),
  info:    (msg, opts) => dispatch('info',        opts?.description ? msg : 'Info',       opts?.description || msg),
}
