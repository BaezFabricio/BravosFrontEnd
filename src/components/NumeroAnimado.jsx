import { useEffect, useRef, useState } from "react"

/*
 * Un número que "cuenta" desde su valor anterior hasta el nuevo (como los indicadores del panel).
 * Acepta un número o un texto como "$94.050" o "73%"; cualquier otro texto se muestra tal cual.
 * Solo anima en escritorio y si la persona no pidió reducir el movimiento.
 */
const reducirMovimiento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

function analizar(valor) {
  if (typeof valor === "number" && Number.isFinite(valor)) return { pre: "", n: valor, suf: "" }
  const m = String(valor ?? "").match(/^(\$?)(\d[\d.]*)(%?)$/)
  return m ? { pre: m[1], n: parseInt(m[2].replace(/\./g, ""), 10), suf: m[3] } : null
}

export default function NumeroAnimado({ valor, duracion = 800 }) {
  const info = analizar(valor)
  const n = info ? info.n : null
  const animar = n !== null && window.innerWidth >= 1024 && !reducirMovimiento()
  const [actual, setActual] = useState(0)
  const desde = useRef(0)

  useEffect(() => {
    if (!animar) return undefined
    const inicio = performance.now()
    const origen = desde.current
    let cuadro = 0
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / duracion)
      const valorActual = Math.round(origen + (n - origen) * (1 - Math.pow(1 - p, 3)))
      desde.current = valorActual
      setActual(valorActual)
      if (p < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [animar, n, duracion])

  if (!info) return valor
  const mostrar = animar ? actual : info.n
  return `${info.pre}${mostrar.toLocaleString("es-AR")}${info.suf}`
}
