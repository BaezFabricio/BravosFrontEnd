/*
 * Constantes de las novedades del box (tipos, colores y tipografía de los títulos), compartidas por la portada y la administración.
 */

export const TIPOS_NOVEDAD = {
  aviso: { nombre: "Aviso", fondo: "bg-sky-500", etiqueta: "bg-sky-400 text-black" },
  evento: { nombre: "Evento", fondo: "bg-[#9be600]", etiqueta: "bg-[#9be600] text-black" },
  promo: { nombre: "Promo", fondo: "bg-amber-400", etiqueta: "bg-amber-400 text-black" },
  comunidad: { nombre: "Comunidad", fondo: "bg-fuchsia-500", etiqueta: "bg-fuchsia-400 text-black" },
}

export const tipoDe = (tipo) => TIPOS_NOVEDAD[tipo] || TIPOS_NOVEDAD.aviso

// Títulos con el mismo estilo de marca que el resto del sitio (Big Shoulders Stencil)
export const ESTILO_TITULO = { fontFamily: "'Big Shoulders Stencil Display', sans-serif", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.92 }
