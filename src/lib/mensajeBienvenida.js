/*
 * Frase de bienvenida del panel del alumno: cambia según cuánto entrena.
 * - Sin clases todavía: invitación a reservar la primera.
 * - Con racha: se la celebra y se la cuida.
 * - Entrena seguido: motivación (una frase distinta cada día).
 * - Hace unos días que no viene / hace mucho: mensaje para volver, sin reproches.
 * Las frases no usan género ("te damos la bienvenida", no "bienvenido").
 */

const MOTIVACION = [
  "Cada entrenamiento es una oportunidad para ser mejor.",
  "La constancia le gana al talento. Hoy sumás una más.",
  "Lo difícil es empezar; vos ya lo estás haciendo.",
  "Un día a la vez, una repetición a la vez.",
  "Entrenar hoy es agradecerle a tu yo del futuro.",
  "No hace falta ser perfecto: alcanza con aparecer.",
  "El box es mejor con vos adentro.",
]

const VOLVER_POCO = [
  "Hace unos días que no te vemos. Hoy es un buen día para volver.",
  "Te extrañamos en el box. Una clase y ya estás de nuevo en ritmo.",
  "Retomar es más fácil de lo que parece: empezá con una clase.",
]

const VOLVER_MUCHO = [
  "Cuánto tiempo. Acá seguís teniendo tu lugar: volvé cuando quieras, a tu ritmo.",
  "Volver es lo más difícil, y ya diste el primer paso entrando acá. Te esperamos.",
  "Sin presión: una clase suave para retomar y el resto viene solo.",
]

const diasEntre = (aStr, bDate) => {
  const a = new Date(`${aStr}T12:00:00`)
  const b = new Date(bDate); b.setHours(12, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}

// Mismo mensaje todo el día para la misma persona, distinto de un día al otro
const delDia = (lista, hoy) => lista[Math.floor(hoy.getTime() / 86400000) % lista.length]

/**
 * @param {object} d
 * @param {boolean} d.cargando  mientras llegan las reservas se muestra un saludo neutro (sin saltos de texto)
 * @param {number} d.totalClases  clases completadas
 * @param {number} d.racha  días seguidos asistiendo
 * @param {string|null} d.ultimaClase  fecha (YYYY-MM-DD) de la última clase completada
 * @param {number} d.agendadas  clases reservadas por venir
 */
export function mensajeBienvenida({ cargando, totalClases, racha, ultimaClase, agendadas }, hoy = new Date()) {
  const base = "Te damos la bienvenida a Bravos Box."
  if (cargando) return base
  if (!totalClases) return `${base} Reservá tu primera clase y empezá cuando quieras.`

  const dias = ultimaClase ? diasEntre(ultimaClase, hoy) : 0
  if (dias > 14) return delDia(VOLVER_MUCHO, hoy)
  if (dias > 5) return delDia(VOLVER_POCO, hoy)
  if (racha >= 3) return `¡${racha} días seguidos! No cortes la racha.`
  if (agendadas > 0) return `Tenés ${agendadas === 1 ? "una clase reservada" : `${agendadas} clases reservadas`}: ¡te esperamos! ${delDia(MOTIVACION, hoy)}`
  return delDia(MOTIVACION, hoy)
}
