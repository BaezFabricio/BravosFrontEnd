import { useEffect, useState } from "react"
import { Toaster } from "sileo"
import "sileo/styles.css"

/*
 * Avisos del sistema con Sileo, arriba en el medio. Es la configuración oscura que recomienda su documentación
 * (https://sileo.aaryan.design/docs/styling): burbuja oscura, título y detalle en blanco y esquinas redondeadas.
 * El estado (éxito, error, atención, info) lo marca el icono de color. El "!" al final de cada clase hace que gane
 * sobre los estilos por defecto de Sileo.
 *
 * En modo oscuro la burbuja se confundía con el fondo: ahí se usa un gris más claro y, en index.css, un filo verde fino.
 * Sigue el tema del sistema (alumno/profesor: clase "dark"; administrador: data-bv-tema="oscuro"), también si se cambia
 * con la app abierta.
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
  return (
    <Toaster
      position="top-center"
      offset={{ top: "max(12px, env(safe-area-inset-top))" }}
      options={{
        fill: oscuro ? "#2e3029" : "#171717",
        roundness: 16,
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/10!",
          button: "bg-white/10! hover:bg-white/15!",
        },
      }}
    />
  )
}
