import { useCallback, useState } from "react"
import { ConfirmarAdmin } from "@/components/ModalAdmin"

/*
 * Confirmación dentro de la app (en vez del cartel del navegador, que dice "bravosbox.com.ar dice").
 * Uso:
 *   const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
 *   if (!(await pedirConfirmacion("¿Seguimos?"))) return
 *   ...y poner {dialogoConfirmar} dentro del componente.
 */
export function useConfirmar() {
  const [pendiente, setPendiente] = useState(null) // { texto, resolver }

  const pedirConfirmacion = useCallback(
    (texto) => new Promise((resolver) => setPendiente({ texto, resolver })),
    []
  )

  const responder = (ok) => {
    pendiente?.resolver(ok)
    setPendiente(null)
  }

  // El texto "¿Eliminar X? Detalle." se separa en título y detalle; si trae "eliminar" o "borrar" el botón es rojo ("Sí, eliminar")
  const t = pendiente?.texto || ""
  const partes = t.match(/^([^?]*?)s*([sS]*)$/)
  const titulo = partes ? partes[1] : "Confirmar"
  const detalle = partes ? partes[2] : t
  const peligro = /elimin|borr/i.test(titulo)
  const dialogoConfirmar = (
    <ConfirmarAdmin abierto={!!pendiente} onCerrar={() => responder(false)} titulo={titulo} texto={detalle}
      peligro={peligro} textoAccion={peligro ? "Sí, eliminar" : "Aceptar"} onConfirmar={() => responder(true)} />
  )

  return [pedirConfirmacion, dialogoConfirmar]
}
