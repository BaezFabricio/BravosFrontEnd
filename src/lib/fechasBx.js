// Fechas legibles del módulo Alumno ("11 nov 2026", "Hoy, miércoles · 21:00"). Sin formato ISO y sin segundos.
// Las fechas llegan como texto "AAAA-MM-DD" y se leen a las 12:00 para que la zona horaria (UTC-3) no corra el día.

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

const dosDigitos = (n) => String(n).padStart(2, "0")

// "2026-11-11" (hora local) a partir de una fecha
export const aTexto = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`

export const hoyTexto = () => aTexto(new Date())

// "2026-11-11T03:00:00.000Z" o "2026-11-11" → "2026-11-11"
export const soloFecha = (f) => String(f || "").slice(0, 10)

// Date a las 12:00 de un texto "AAAA-MM-DD"
export const fechaDeTexto = (f) => new Date(`${soloFecha(f)}T12:00:00`)

// "11 nov 2026"
export function fechaCorta(f) {
  const d = fechaDeTexto(f)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`
}

// "NOV" y "11" para el cuadradito de fecha
export function mesAbreviado(f) {
  const d = fechaDeTexto(f)
  return Number.isNaN(d.getTime()) ? "" : MESES_CORTOS[d.getMonth()].toUpperCase()
}
export function diaDelMes(f) {
  const d = fechaDeTexto(f)
  return Number.isNaN(d.getTime()) ? "" : String(d.getDate())
}

// "21:00:00" → "21:00"
export const horaCorta = (h) => String(h || "").slice(0, 5)

// "60 min" a partir de hora de inicio y fin
export function duracion(inicio, fin) {
  const aMin = (h) => { const [hh, mm] = String(h || "").split(":"); return Number(hh) * 60 + Number(mm || 0) }
  const m = aMin(fin) - aMin(inicio)
  return Number.isFinite(m) && m > 0 ? `${m} min` : null
}

// "Hoy, miércoles · 21:00", "Mañana, jueves · 21:00" o "Viernes 13 nov · 21:00"
export function etiquetaClase(f, hora) {
  const d = fechaDeTexto(f)
  if (Number.isNaN(d.getTime())) return horaCorta(hora)
  const txt = soloFecha(f)
  const manana = new Date(); manana.setDate(manana.getDate() + 1)
  const dia = DIAS[d.getDay()]
  const h = horaCorta(hora)
  if (txt === hoyTexto()) return `Hoy, ${dia} · ${h}`
  if (txt === aTexto(manana)) return `Mañana, ${dia} · ${h}`
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]} · ${h}`
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]

// "Hoy, miércoles 11 nov", "Mañana, jueves 12 nov" o "Viernes 13 nov" (sin la hora)
export function etiquetaFecha(f) {
  const d = fechaDeTexto(f)
  if (Number.isNaN(d.getTime())) return ""
  const txt = soloFecha(f)
  const manana = new Date(); manana.setDate(manana.getDate() + 1)
  const dia = DIAS[d.getDay()]
  const resto = `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`
  if (txt === hoyTexto()) return `Hoy, ${dia} ${resto}`
  if (txt === aTexto(manana)) return `Mañana, ${dia} ${resto}`
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${resto}`
}

// "NOVIEMBRE 2026" para agrupar el historial
export function mesYAnio(f) {
  const d = fechaDeTexto(f)
  return Number.isNaN(d.getTime()) ? "" : `${MESES[d.getMonth()].toUpperCase()} ${d.getFullYear()}`
}

// "MIÉ" para el cuadradito de fecha
export function diaSemanaCorto(f) {
  const d = fechaDeTexto(f)
  return Number.isNaN(d.getTime()) ? "" : DIAS_CORTOS[d.getDay()]
}

// Hasta qué hora se puede cancelar recuperando el crédito (2 horas antes) y si ya pasó
export function limiteCancelacion(f, hora) {
  const [h, m] = String(hora || "00:00").split(":").map(Number)
  const inicio = fechaDeTexto(f)
  inicio.setHours(h, m || 0, 0, 0)
  const limite = new Date(inicio.getTime() - 2 * 3600000)
  return {
    hora: `${String(limite.getHours()).padStart(2, "0")}:${String(limite.getMinutes()).padStart(2, "0")}`,
    pasado: Date.now() > limite.getTime(),
  }
}
