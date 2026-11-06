import { useCallback, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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

  const dialogoConfirmar = (
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
  )

  return [pedirConfirmacion, dialogoConfirmar]
}
