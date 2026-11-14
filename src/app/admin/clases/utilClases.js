// Una clase única "ya pasó" si su fecha es anterior a hoy, o si es hoy pero su hora de fin ya transcurrió.
// Las que ya pasaron se mueven al Historial. Se usa en la lista de Clases, en el Historial y en la barra de pestañas.
export function yaTermino(clase, ahora = new Date()) {
  if (!clase?.fechaEspecifica) return false
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`
  const fecha = clase.fechaEspecifica.split("T")[0]
  if (fecha < hoy) return true
  if (fecha === hoy && clase.horaFin) {
    const [h, m] = clase.horaFin.split(":").map(Number)
    const fin = new Date(ahora)
    fin.setHours(h, m, 0, 0)
    return ahora > fin
  }
  return false
}

// "2026-11-12" o "2026-11-12T03:00:00.000Z" → fecha local al mediodía (evita corrimientos de zona horaria)
export function fechaDeClase(f) {
  const [y, m, d] = String(f).split("T")[0].split("-").map(Number)
  return new Date(y, m - 1, d, 12)
}
