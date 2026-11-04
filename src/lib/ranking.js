// Cómo se muestra el valor de una marca según el tipo de ejercicio
export function formatearValor(tipo, v) {
  if (tipo === "peso") return `${v} kg`
  if (tipo === "repeticiones") return `${v} reps`
  const seg = Math.round(Number(v))
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`
}
