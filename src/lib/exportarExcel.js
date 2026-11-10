import * as XLSX from "xlsx"

/*
 * Exporta datos a un archivo de Excel (.xlsx) que se descarga en el navegador. Cada hoja tiene encabezados,
 * ancho de columnas ajustado y el texto tal cual se escribió (sin que Excel convierta DNI, teléfonos ni fechas).
 *   hojas: [{ nombre: "Usuarios", encabezados: ["Nombre", ...], filas: [[...], ...], anchos: [28, 12, ...] }]
 * Solo escribe archivos: no lee nada de afuera.
 */
export function descargarExcel(nombreArchivo, hojas) {
  const libro = XLSX.utils.book_new()
  for (const hoja of hojas) {
    const datos = [hoja.encabezados, ...hoja.filas].map((fila) => fila.map((v) => (v === null || v === undefined ? "" : v)))
    const ws = XLSX.utils.aoa_to_sheet(datos)
    if (hoja.anchos) ws["!cols"] = hoja.anchos.map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(libro, ws, hoja.nombre.slice(0, 31))
  }
  XLSX.writeFile(libro, nombreArchivo)
}

/** Fecha de hoy en formato aaaa-mm-dd, con la hora local (no UTC). */
export function fechaHoyArchivo() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
