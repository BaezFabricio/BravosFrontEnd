import { useEffect } from "react"

// Las pantallas de escritorio se diseñan sobre un lienzo de 1920 px. En una ventana más angosta (por ejemplo 1536 px:
// pantalla de 1920 con la escala de Windows al 125 %) se achican con "zoom" igual que verlas al 80 %.
// Debajo de 1024 px no hay zoom: se ve la versión responsive (celular y tableta).
export const LIENZO = 1920
export const calcularZoom = (ancho = window.innerWidth) => (ancho >= 1024 ? Math.min(1, ancho / LIENZO) : 1)

function aplicarZoom(elemento, anfitrion) {
  const z = calcularZoom()
  // Los menús y ventanas se montan en el anfitrión con el zoom inverso: así Radix calcula bien la posición, y el contenido
  // recupera el zoom con la regla de index.css (usa --bv-zoom)
  if (anfitrion) anfitrion.style.zoom = String(1 / z)
  document.documentElement.style.setProperty("--bv-zoom", String(z))
  elemento.style.zoom = String(z)
  elemento.style.minHeight = `calc(100vh / ${z})`
  elemento.dataset.zoom = String(z)
  // Las alturas en vh se multiplican por el zoom: --bv-vh es "100vh" ya compensado
  document.documentElement.style.setProperty("--bv-vh", `${100 / z}vh`)
}

function quitarZoom(elemento, anfitrion) {
  if (anfitrion) anfitrion.style.zoom = ""
  document.documentElement.style.removeProperty("--bv-zoom")
  elemento.style.zoom = ""
  elemento.style.minHeight = ""
  delete elemento.dataset.zoom
  document.documentElement.style.removeProperty("--bv-vh")
}

export function useZoomLienzo(raiz, anfitrion) {
  useEffect(() => {
    if (!raiz) return undefined
    const ajustar = () => aplicarZoom(raiz, anfitrion)
    ajustar()
    window.addEventListener("resize", ajustar)
    return () => { window.removeEventListener("resize", ajustar); quitarZoom(raiz, anfitrion) }
  }, [raiz, anfitrion])
}
