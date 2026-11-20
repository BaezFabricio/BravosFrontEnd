import { Toaster } from "sileo"
import "sileo/styles.css"

/*
 * Avisos del sistema (Sileo), arriba en el medio. Siempre la burbuja oscura de Sileo (con el estado en verde, rojo, amarillo o azul
 * y el detalle que se despliega debajo), que se ve bien tanto sobre pantallas claras como oscuras.
 * El nombre del tema en Sileo está al revés: "light" es la burbuja oscura con texto claro.
 */
export default function AvisosSileo() {
  return <Toaster position="top-center" theme="light" offset={{ top: "max(12px, env(safe-area-inset-top))" }} />
}
