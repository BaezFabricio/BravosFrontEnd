import { useCallback, useState } from "react"
import { ConfirmarAdmin } from "@/components/ModalAdmin"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAnchoPanel } from "@/lib/useEscritorio"

/*
 * Confirmación dentro de la app (en vez del cartel del navegador, que dice "bravosbox.com.ar dice").
 * Uso:
 *   const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
 *   if (!(await pedirConfirmacion("¿Seguimos?"))) return
 *   ...y poner {dialogoConfirmar} dentro del componente.
 */
export function useConfirmar() {
  const [pendiente, setPendiente] = useState(null) // { texto, resolver }
  const escritorio = useAnchoPanel()

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
  const partes = t.match(/^([^?]*\?)\s*([\s\S]*)$/)
  const titulo = partes ? partes[1] : "Confirmar"
  const detalle = partes ? partes[2] : t
  const peligro = /elimin|borr/i.test(titulo)
  // El diseño nuevo es solo del panel de administración en escritorio; en celular y en el resto de la app, el cartel de siempre
  const nuevo = escritorio && typeof document !== "undefined" && document.documentElement.classList.contains("bv-admin")
  const dialogoConfirmar = !nuevo ? (
    <Dialog open={!!pendiente} onOpenChange={(abierto) => { if (!abierto) responder(false) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight">Confirmar</DialogTitle>
          <DialogDescription className="whitespace-pre-line pt-1 text-sm text-foreground/80">{pendiente?.texto}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => responder(false)}>Cancelar</Button>
          <Button onClick={() => responder(true)} className="bg-lime-400 font-bold text-black hover:bg-lime-300">Aceptar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : (
    <ConfirmarAdmin abierto={!!pendiente} onCerrar={() => responder(false)} titulo={titulo} texto={detalle}
      peligro={peligro} textoAccion={peligro ? "Sí, eliminar" : "Aceptar"} onConfirmar={() => responder(true)} />
  )

  return [pedirConfirmacion, dialogoConfirmar]
}
