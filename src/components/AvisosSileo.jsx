import { useEffect, useState } from "react"
import { Toaster } from "sileo"
import "sileo/styles.css"

/*
 * Avisos del sistema (Sileo), arriba en el medio. La burbuja toma el color contrario al de la pantalla para que siempre se destaque:
 * clara sobre pantallas oscuras y oscura sobre pantallas claras. Sigue el tema del sistema (alumno/profesor: clase "dark";
 * administrador: data-bv-tema="oscuro"), también si se cambia estando abierta la app.
 */
const esOscuro = () => {
  const h = document.documentElement
  return h.classList.contains("dark") || h.getAttribute("data-bv-tema") === "oscuro"
}

export default function AvisosSileo() {
  const [oscuro, setOscuro] = useState(esOscuro)
  useEffect(() => {
    const ver = () => setOscuro(esOscuro())
    const obs = new MutationObserver(ver)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-bv-tema"] })
    return () => obs.disconnect()
  }, [])
  return <Toaster position="top-center" theme={oscuro ? "dark" : "light"} offset={{ top: "max(12px, env(safe-area-inset-top))" }} />
}
