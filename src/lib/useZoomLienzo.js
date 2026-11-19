import { useEffect } from "react"

// Las pantallas de escritorio se diseñan sobre un lienzo de LIENZO px de ancho y se escalan con "zoom" para llenar la ventana,
// manteniendo las proporciones: en una ventana de 1920 px se ven al 107 %, en una de 1536 px al 85 %, en una de 1280 px al 71 %.
// Para ver todo más grande, bajá LIENZO; para verlo más chico, subilo. ZOOM_MAXIMO evita que en pantallas enormes se agrande de más.
// Debajo de 1024 px no hay zoom: se ve la versión responsive (celular y tableta).
export const LIENZO = 1800
const ZOOM_MAXIMO = 1.5
export const calcularZoom = (ancho = window.innerWidth) => (ancho >= 1024 ? Math.min(ZOOM_MAXIMO, ancho / LIENZO) : 1)

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
