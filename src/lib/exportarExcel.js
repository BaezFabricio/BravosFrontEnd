/*
 * Exporta datos a un archivo de Excel (.xlsx) que se descarga en el navegador, con formato:
 * título, subtítulo, encabezados destacados, filas con bordes y alternadas, formato de moneda donde corresponde,
 * filtros automáticos y encabezados fijos al desplazarse.
 *   nombreArchivo: "reporte.xlsx"
 *   opciones: { titulo, subtitulo, hojas: [{ nombre, encabezados, filas, anchos, formatos? }] }
 *   formatos: un formato de número de Excel por columna (null = sin formato), por ejemplo '"$" #,##0'
 * Solo escribe archivos: no lee nada de afuera.
 */
const MONEDA = '"$" #,##0'
const BORDE = { style: "thin", color: { argb: "FFD4D4D8" } }

// Colores para resaltar valores (por ejemplo, estados de una lista): fondo y texto
export const PALETA = {
  verde: { fill: "FFD9F99D", font: "FF3F6212" },
  ambar: { fill: "FFFEF3C7", font: "FF92400E" },
  rojo: { fill: "FFFEE2E2", font: "FF991B1B" },
  gris: { fill: "FFE4E4E7", font: "FF3F3F46" },
}

export async function descargarExcel(nombreArchivo, { titulo, subtitulo, hojas }) {
  // Se carga solo al exportar (así no pesa en la carga normal de la app)
  const mod = await import("exceljs")
  const ExcelJS = mod.default ?? mod
  const libro = new ExcelJS.Workbook()
  libro.creator = "Bravos Box"
  libro.created = new Date()

  for (const hoja of hojas) {
    const cols = hoja.encabezados.length
    const ws = libro.addWorksheet(hoja.nombre.slice(0, 31), { views: [{ state: "frozen", ySplit: 4 }] })
    ws.columns = hoja.anchos.map((width) => ({ width }))

    // Título y subtítulo
    ws.mergeCells(1, 1, 1, cols)
    const t = ws.getCell(1, 1)
    t.value = titulo
    t.font = { bold: true, size: 14, color: { argb: "FF3F6212" } }
    t.alignment = { vertical: "middle" }
    ws.getRow(1).height = 26
    ws.mergeCells(2, 1, 2, cols)
    const s = ws.getCell(2, 1)
    s.value = subtitulo
    s.font = { italic: true, size: 10, color: { argb: "FF71717A" } }

    // Encabezados (fila 4)
    hoja.encabezados.forEach((texto, j) => {
      const c = ws.getCell(4, j + 1)
      c.value = texto
      c.font = { bold: true, color: { argb: "FFFFFFFF" } }
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18181B" } }
      c.alignment = { vertical: "middle", horizontal: "left" }
      c.border = { bottom: { style: "medium", color: { argb: "FF84CC16" } } }
    })
    ws.getRow(4).height = 22

    // Filas
    hoja.filas.forEach((fila, i) => {
      fila.forEach((valor, j) => {
        const c = ws.getCell(5 + i, j + 1)
        c.value = valor === null || valor === undefined ? "" : valor
        c.border = { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE }
        c.alignment = { vertical: "middle" }
        if (i % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } }
        const formato = hoja.formatos?.[j]
        if (formato) c.numFmt = formato === "moneda" ? MONEDA : formato
        // Color según el valor (hoja.estilo devuelve una entrada de PALETA o nada)
        const resaltado = hoja.estilo?.(valor, j)
        if (resaltado) {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: resaltado.fill } }
          c.font = { bold: true, color: { argb: resaltado.font } }
        }
      })
    })

    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: cols } }
  }

  const buffer = await libro.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Fecha de hoy en formato aaaa-mm-dd, con la hora local (no UTC), para el nombre del archivo. */
export function fechaHoyArchivo() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Fecha de hoy en formato dd/mm/aaaa, para mostrar en el subtítulo. */
export function fechaHoyLegible() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}
