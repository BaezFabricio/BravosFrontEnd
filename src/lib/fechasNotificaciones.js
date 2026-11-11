// Fechas de las notificaciones (las usan la campanita y su panel)

export function parsearFecha(raw) {
  if (!raw) return new Date()
  // MySQL manda "2026-08-25T03:00:00.000Z" o "2026-08-25 03:00:00" sin Z
  // Si no tiene Z ni offset lo tratamos como UTC agregando Z
  const s = String(raw).replace(' ', 'T')
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z')
}

// Encabezado del grupo: "Hoy", "Ayer" o el día ("martes 6 de octubre"). Se usa el día en hora local.
export function etiquetaDia(raw) {
  const fecha = parsearFecha(raw)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (fecha.toDateString() === hoy.toDateString()) return 'Hoy'
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
  const texto = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', ...(fecha.getFullYear() !== hoy.getFullYear() ? { year: 'numeric' } : {}) })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatearFechaNotif(raw) {
  const fecha = parsearFecha(raw)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  if (fecha.toDateString() === hoy.toDateString()) return `Hoy ${hora}`
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer ${hora}`
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + hora
}

// "Hace 1 h" (la hora exacta va en el title)
export function haceTiempo(raw) {
  const min = Math.floor((Date.now() - parsearFecha(raw).getTime()) / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Hace 1 día' : `Hace ${d} días`
}
