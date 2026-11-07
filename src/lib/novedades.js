/*
 * Constantes de las novedades del box (tipos, colores y tipografías), compartidas por la portada y la administración.
 * El administrador elige entre estas opciones fijas; el servidor solo acepta estas claves.
 */

export const TIPOS_NOVEDAD = {
  aviso: { nombre: "Aviso", colorPorDefecto: "celeste" },
  evento: { nombre: "Evento", colorPorDefecto: "lima" },
  promo: { nombre: "Promo", colorPorDefecto: "amarillo" },
  comunidad: { nombre: "Comunidad", colorPorDefecto: "rosa" },
  novedad: { nombre: "Novedad", colorPorDefecto: "naranja" },
  noticia: { nombre: "Noticia", colorPorDefecto: "blanco" },
}

// Paleta: el texto que va sobre cada color se elige para que se lea bien
export const COLORES_NOVEDAD = {
  lima: { nombre: "Lima", hex: "#9be600", texto: "#0b0c09" },
  celeste: { nombre: "Celeste", hex: "#38bdf8", texto: "#0b0c09" },
  amarillo: { nombre: "Amarillo", hex: "#fbbf24", texto: "#0b0c09" },
  naranja: { nombre: "Naranja", hex: "#fb923c", texto: "#0b0c09" },
  rojo: { nombre: "Rojo", hex: "#ef4444", texto: "#ffffff" },
  rosa: { nombre: "Rosa", hex: "#e879f9", texto: "#0b0c09" },
  violeta: { nombre: "Violeta", hex: "#8b5cf6", texto: "#ffffff" },
  blanco: { nombre: "Blanco", hex: "#f5f5f4", texto: "#0b0c09" },
}

const HEX = /^#[0-9a-f]{6}$/i

/** Texto negro o blanco, el que se lea mejor sobre el color de fondo. */
export function textoSobre(hex) {
  const n = parseInt(hex.slice(1), 16)
  const canal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const luz = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255)
  return luz > 0.4 ? "#0b0c09" : "#ffffff"
}

export const tipoDe = (tipo) => TIPOS_NOVEDAD[tipo] || TIPOS_NOVEDAD.aviso

/** Color de la novedad: el que eligió en la rueda, o el del tipo si no eligió ninguno. */
export function colorDe(novedad) {
  if (HEX.test(novedad?.colorFondo || "")) {
    const hex = novedad.colorFondo.toLowerCase()
    return { hex, texto: textoSobre(hex) }
  }
  return COLORES_NOVEDAD[tipoDe(novedad?.tipo).colorPorDefecto]
}

/** Estilo CSS del título: una sola tipografía para todas las novedades. */
export function estiloTitulo() {
  return { fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "none", lineHeight: 0.95 }
}
