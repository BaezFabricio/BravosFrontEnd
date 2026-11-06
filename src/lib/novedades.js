/*
 * Constantes de las novedades del box (tipos, colores y tipografías), compartidas por la portada y la administración.
 * El administrador elige entre estas opciones fijas; el servidor solo acepta estas claves.
 */

export const TIPOS_NOVEDAD = {
  aviso: { nombre: "Aviso", colorPorDefecto: "celeste" },
  evento: { nombre: "Evento", colorPorDefecto: "lima" },
  promo: { nombre: "Promo", colorPorDefecto: "amarillo" },
  comunidad: { nombre: "Comunidad", colorPorDefecto: "rosa" },
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

// Tipografías de los títulos (las fuentes ya están cargadas en el sitio)
export const FUENTES_NOVEDAD = {
  stencil: { nombre: "Stencil", familia: "'Big Shoulders Stencil Display', sans-serif", peso: 900, mayusculas: true },
  condensada: { nombre: "Condensada", familia: "'Barlow Condensed', sans-serif", peso: 800, mayusculas: true },
  moderna: { nombre: "Moderna", familia: "'Archivo', sans-serif", peso: 800, mayusculas: false },
  mono: { nombre: "Mono", familia: "'JetBrains Mono', monospace", peso: 600, mayusculas: false },
}

export const tipoDe = (tipo) => TIPOS_NOVEDAD[tipo] || TIPOS_NOVEDAD.aviso

/** Color de la novedad: el que eligió, o el del tipo si no eligió ninguno. */
export function colorDe(novedad) {
  const clave = COLORES_NOVEDAD[novedad?.colorFondo] ? novedad.colorFondo : tipoDe(novedad?.tipo).colorPorDefecto
  return COLORES_NOVEDAD[clave]
}

/** Estilo CSS del título según la tipografía elegida. */
export function estiloTitulo(novedad) {
  const f = FUENTES_NOVEDAD[novedad?.fuenteTitulo] || FUENTES_NOVEDAD.stencil
  return { fontFamily: f.familia, fontWeight: f.peso, textTransform: f.mayusculas ? "uppercase" : "none", lineHeight: 0.95 }
}

export const ESTILO_TITULO = estiloTitulo({})
