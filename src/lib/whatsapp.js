/*
 * Enlaces de WhatsApp (wa.me) para números argentinos.
 * El teléfono se guarda como lo escribió la persona ("3704 01-1885", "0370 15 4011885", "+54 9 370 4011885"…):
 * acá se lo lleva al formato internacional de WhatsApp para celulares: 549 + característica + número (10 dígitos en total).
 * Si no se puede interpretar con seguridad, devuelve null y no se muestra el botón (mejor eso que abrir un chat equivocado).
 */
export function numeroWhatsApp(telefono) {
  let d = String(telefono ?? "").replace(/\D/g, "")
  if (!d) return null
  if (d.startsWith("54")) d = d.slice(2)
  if (d.startsWith("9") && d.length === 11) d = d.slice(1) // 54 9 + 10 dígitos
  d = d.replace(/^0+/, "") // 0 de la característica
  if (d.length !== 10) {
    // Con el 15 del celular de por medio: característica (2 a 4 dígitos) + 15 + abonado
    for (const area of [2, 3, 4]) {
      if (d.length === 12 && d.slice(area, area + 2) === "15") { d = d.slice(0, area) + d.slice(area + 2); break }
    }
  }
  return d.length === 10 ? `549${d}` : null
}

/** https://wa.me/<número>?text=<mensaje>; sin número válido devuelve null. */
export function enlaceWhatsApp(telefono, mensaje = "") {
  const numero = numeroWhatsApp(telefono)
  if (!numero) return null
  return `https://wa.me/${numero}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`
}
