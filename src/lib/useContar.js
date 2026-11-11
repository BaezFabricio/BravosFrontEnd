import { useEffect, useRef, useState } from "react"

/*
 * Hace que un número entero "cuente" desde 0 (o desde su valor anterior) hasta el valor nuevo, con frenado suave.
 * Si el valor no es un entero (por ejemplo "…" mientras carga) lo devuelve tal cual. Respeta "reducir movimiento".
 */
export function useContar(valor, ms = 800) {
  const n = Number(valor)
  const entero = valor !== "" && valor !== null && Number.isInteger(n)
  const [actual, setActual] = useState(entero ? 0 : valor)
  const desde = useRef(0)

  useEffect(() => {
    if (!entero) return undefined
    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const inicio = desde.current
    const t0 = performance.now()
    let raf
    const paso = (t) => {
      const p = reducir ? 1 : Math.min(1, (t - t0) / ms)
      const suave = 1 - Math.pow(1 - p, 3)
      const v = Math.round(inicio + (n - inicio) * suave)
      desde.current = v
      setActual(v)
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [n, entero, ms])

  return entero ? actual : valor
}
