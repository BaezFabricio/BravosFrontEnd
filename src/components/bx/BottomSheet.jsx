import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

/*
 * Hoja inferior reutilizable del módulo Alumno en el celular (handoff móvil). Todas las confirmaciones y formularios del celular la usan.
 *  - Manija arriba, fondo oscuro; Esc y tocar afuera la cierran; el foco va al primer control de adentro.
 *  - role="dialog" (o "alertdialog" con `alerta`, para confirmar acciones destructivas).
 *  - Respeta la zona segura de abajo del teléfono y se adapta a cualquier alto de pantalla (el cuerpo hace scroll).
 */
export function BottomSheet({ abierto, onCerrar, titulo, descripcion, alerta = false, ocultarTitulo = false, pie, className, children }) {
  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bx-overlay fixed inset-0 z-[100] bg-black/60" />
        <DialogPrimitive.Content
          role={alerta ? "alertdialog" : "dialog"}
          className={cn(
            "bx hoja-movil fixed inset-x-0 bottom-0 z-[101] mx-auto flex max-h-[88dvh] max-w-xl flex-col rounded-t-3xl border border-b-0 border-bx-line bg-bx-card text-bx-ink shadow-[0_-1rem_2.5rem_rgba(0,0,0,.35)]",
            className
          )}
        >
          <span aria-hidden="true" className="mx-auto mt-3 h-[0.3125rem] w-10 shrink-0 rounded-[0.1875rem] bg-bx-btn-line" />
          <div className={cn("px-4 pt-3", ocultarTitulo && "sr-only")}>
            <DialogPrimitive.Title className="m-0 text-lg font-extrabold text-bx-ink">{titulo}</DialogPrimitive.Title>
            {descripcion
              ? <DialogPrimitive.Description className="mt-1 text-sm leading-normal text-bx-muted">{descripcion}</DialogPrimitive.Description>
              : <DialogPrimitive.Description className="sr-only">{titulo}</DialogPrimitive.Description>}
          </div>
          <div className="scroll-sin-barra min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          <div className={cn("flex shrink-0 flex-wrap items-center justify-end gap-2.5 px-4 pt-1", pie ? "pb-[max(1.5rem,env(safe-area-inset-bottom))]" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]")}>{pie}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
