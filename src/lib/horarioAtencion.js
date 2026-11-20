/*
 * Horarios de atención del box. Se guardan como texto, igual que siempre, en tres claves
 * (lunes a viernes, sábado y domingo), por ejemplo:
 *   "Lun-Vie: 6:00 - 22:00"
 *   "Lun-Vie: 6:00 - 12:00 y 16:00 - 22:00"
 *   "Domingo: Cerrado"
 * Este archivo lee ese texto, lo escribe y dice si el box está abierto en un momento dado.
 */
export const ETIQUETAS_HORARIO = ['Lun-Vie', 'Sábado', 'Domingo']
export const NOMBRES_HORARIO = ['Lunes a viernes', 'Sábado', 'Domingo']
export const MAX_RANGOS = 2

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
// Qué texto (0 = lun-vie, 1 = sábado, 2 = domingo) manda cada día de la semana (0 = domingo)
const GRUPO_DEL_DIA = [2, 0, 0, 0, 0, 0, 1]

export const minutosAHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const horaAMinutos = (h) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(h || '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
// "6:00", sin el cero de adelante: así se ve en la web
const comoSeVe = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

// "Lun-Vie: 6:00 - 22:00" → { etiqueta, valor, cerrado, rangos: [{ desde, hasta }], rango }
export function leerHorario(texto) {
  if (!texto) return null
  const i = texto.indexOf(':')
  const conEtiqueta = i > 0 && !/^\s*\d/.test(texto)
  const etiqueta = conEtiqueta ? texto.slice(0, i).trim() : ''
  const valor = (conEtiqueta ? texto.slice(i + 1) : texto).trim()
  if (/cerrado/i.test(valor)) return { etiqueta, valor, cerrado: true, rangos: [], rango: null }
  const rangos = []
  const patron = /(\d{1,2})(?::(\d{2}))?\s*(?:a|-|–|hasta)\s*(\d{1,2})(?::(\d{2}))?/gi
  for (const m of valor.matchAll(patron)) {
    const desde = Number(m[1]) * 60 + Number(m[2] || 0)
    const hasta = Number(m[3]) * 60 + Number(m[4] || 0)
    if (hasta > desde) rangos.push({ desde, hasta })
  }
  return { etiqueta, valor, rangos, rango: rangos[0] || null }
}

// Texto que se guarda: sin rangos = cerrado
export function escribirHorario(etiqueta, rangos) {
  if (!rangos || rangos.length === 0) return `${etiqueta}: Cerrado`
  return `${etiqueta}: ${rangos.map((r) => `${comoSeVe(r.desde)} - ${comoSeVe(r.hasta)}`).join(' y ')}`
}

// Los tres textos → lo que muestra el editor, un grupo por texto
export function grupos(textos) {
  return ETIQUETAS_HORARIO.map((etiqueta, i) => {
    const h = leerHorario(textos[i])
    return { etiqueta, abierto: !!h && !h.cerrado && h.rangos.length > 0, rangos: h && !h.cerrado ? h.rangos : [] }
  })
}

// true / false si se puede saber con los horarios cargados; null si no
export function estaAbiertoAhora(semana, sabado, domingo, ahora = new Date()) {
  return estadoAhora([semana, sabado, domingo], ahora).abierto
}

/*
 * Estado del box en este momento: { abierto, detalle }
 *  - abierto: true / false, o null si los textos no se entienden
 *  - detalle: "Cierra a las 22:00", "Abre hoy a las 16:00", "Abre mañana a las 6:00", "Abre el lunes a las 6:00"
 */
export function estadoAhora(textos, ahora = new Date()) {
  const dia = ahora.getDay()
  const minutos = ahora.getHours() * 60 + ahora.getMinutes()
  const hoy = leerHorario(textos[GRUPO_DEL_DIA[dia]])
  if (!hoy) return { abierto: null, detalle: '' }
  if (!hoy.cerrado && hoy.rangos.length === 0) return { abierto: null, detalle: '' }

  const abiertoEn = hoy.rangos.find((r) => minutos >= r.desde && minutos < r.hasta)
  if (abiertoEn) return { abierto: true, detalle: `Cierra a las ${comoSeVe(abiertoEn.hasta)}` }

  // Cerrado: el próximo horario de hoy, o el primero de los días que siguen
  const siguienteHoy = hoy.rangos.find((r) => r.desde > minutos)
  if (siguienteHoy) return { abierto: false, detalle: `Abre hoy a las ${comoSeVe(siguienteHoy.desde)}` }
  for (let paso = 1; paso <= 7; paso++) {
    const d = (dia + paso) % 7
    const h = leerHorario(textos[GRUPO_DEL_DIA[d]])
    if (h && !h.cerrado && h.rangos.length) {
      const cuando = paso === 1 ? 'mañana' : `el ${DIAS[d]}`
      return { abierto: false, detalle: `Abre ${cuando} a las ${comoSeVe(h.rangos[0].desde)}` }
    }
  }
  return { abierto: false, detalle: '' }
}

// Errores de un grupo (para avisar antes de guardar)
export function errorDeRangos(rangos) {
  for (const r of rangos) {
    if (r.desde == null || r.hasta == null) return 'Completá la hora de apertura y la de cierre.'
    if (r.hasta <= r.desde) return 'El cierre tiene que ser después de la apertura.'
  }
  if (rangos.length === 2 && rangos[1].desde < rangos[0].hasta) return 'El segundo horario tiene que empezar después de que termine el primero.'
  return ''
}
