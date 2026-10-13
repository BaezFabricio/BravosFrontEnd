// Cómo se lee la descripción de un plan. La usan la pantalla de membresías del alumno y el
// editor de planes del admin (con su vista previa), así las dos muestran exactamente lo mismo.
//
// plan.descripcion: la primera línea es la descripción corta; cada línea siguiente es una
// condición que ve el alumno ("Incluye"). Si no hay condiciones, se muestran solo datos ciertos.
// No se inventan beneficios: lo que se publica en una oferta obliga al gimnasio (Ley 24.240, art. 8).

export const MAX_CONDICIONES = 6

export function partesDescripcion(descripcion = "") {
  const lineas = String(descripcion || "").split("\n").map((l) => l.trim())
  return { corta: lineas[0] || "", condiciones: lineas.slice(1).filter(Boolean) }
}

export function armarDescripcion(corta, condiciones) {
  const limpias = condiciones.map((c) => c.trim()).filter(Boolean)
  // Sin descripción corta pero con condiciones, la primera línea queda vacía (así no se confunden)
  const texto = [corta.trim(), ...limpias].join("\n")
  return texto.trim() ? texto : ""
}

export function featuresDelPlan(plan) {
  const creditos = Number(plan.cantidadCreditos) || 0
  const { condiciones } = partesDescripcion(plan.descripcion)
  const base = creditos > 0 ? [{ text: `${creditos} créditos para reservar clases`, ok: true }] : []
  if (condiciones.length) return [...base, ...condiciones.slice(0, MAX_CONDICIONES).map((text) => ({ text, ok: true }))]
  return [...base, { text: "Reservás tus clases desde la app", ok: true }, { text: "Vence el próximo día 10", ok: true }]
}
