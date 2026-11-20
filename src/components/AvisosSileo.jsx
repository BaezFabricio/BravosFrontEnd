import { Toaster } from "sileo"
import "sileo/styles.css"

/*
 * Avisos del sistema con Sileo, arriba en el medio. Es la configuración oscura que recomienda su documentación
 * (https://sileo.aaryan.design/docs/styling): burbuja #171717, título y detalle en blanco y esquinas redondeadas.
 * El estado (éxito, error, atención, info) lo marca el icono de color. El "!" al final de cada clase hace que gane
 * sobre los estilos por defecto de Sileo.
 */
export default function AvisosSileo() {
  return (
    <Toaster
      position="top-center"
      offset={{ top: "max(12px, env(safe-area-inset-top))" }}
      options={{
        fill: "#171717",
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
